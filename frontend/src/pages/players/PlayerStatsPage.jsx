import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../../components/layout/Layout.jsx";
import { Button } from "../../components/shared/Button.jsx";
import { Input } from "../../components/shared/Input.jsx";
import { Select } from "../../components/shared/Select.jsx";
import { Modal } from "../../components/shared/Modal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getPlayerById, getPlayerMarketValue, updatePlayer } from "../../services/players.js";
import { getTeamById } from "../../services/teams.js";
import {
  addStats,
  deleteStats,
  getPlayerGrowth,
  getPlayerStats,
  updateStats,
} from "../../services/stats.js";
import { entityId } from "../../utils/ids.js";
import { decodeCareerStatsFromScreenshot } from "../../services/ai.js";
import { Card } from "../../components/shared/Card.jsx";
import { Badge } from "../../components/shared/Badge.jsx";
import { SectionHeader } from "../../components/shared/SectionHeader.jsx";
import { LineChart } from "../../components/shared/charts/LineChart.jsx";
import { BarChart } from "../../components/shared/charts/BarChart.jsx";
import { DataTable } from "../../components/shared/DataTable.jsx";
import { WorkstationPage } from "../../components/layout/WorkstationPage.jsx";

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

function defaultSeasonLabel() {
  const y = new Date().getFullYear();
  return `${y}/${String(y + 1).slice(-2)}`;
}

function emptyStatForm(season = "") {
  return {
    season: season || defaultSeasonLabel(),
    matchesPlayed: "0",
    goals: "0",
    assists: "0",
    manOfTheMatchAwards: "0",
    cleanSheets: "0",
    seasonOverallRating: "",
  };
}

function statRowToForm(row) {
  return {
    season: row.season ?? "",
    matchesPlayed: String(row.matchesPlayed ?? 0),
    goals: String(row.goals ?? 0),
    assists: String(row.assists ?? 0),
    manOfTheMatchAwards: String(row.manOfTheMatchAwards ?? 0),
    cleanSheets: String(row.cleanSheets ?? 0),
    seasonOverallRating:
      row.seasonOverallRating != null ? String(row.seasonOverallRating) : "",
  };
}

function readImageFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      const m = s.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) {
        reject(new Error("Could not read image"));
        return;
      }
      resolve({
        mimeType: m[1].toLowerCase(),
        base64: m[2],
        preview: s,
      });
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export default function PlayerStatsPage() {
  const { teamId, playerId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [player, setPlayer] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [growthPayload, setGrowthPayload] = useState(null);
  const [statsRows, setStatsRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [marketValue, setMarketValue] = useState({
    marketValue: 0,
    tier: "",
    breakdown: null,
  });

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(() => emptyStatForm());
  const [isSavingAdd, setIsSavingAdd] = useState(false);

  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState(() => emptyStatForm(""));
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deleteRow, setDeleteRow] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importPayload, setImportPayload] = useState(null);
  const [importSeasonHint, setImportSeasonHint] = useState("");
  const [decodedImport, setDecodedImport] = useState([]);
  const [decodedAttributes, setDecodedAttributes] = useState(null);
  const [importPickIdx, setImportPickIdx] = useState(0);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isApplyingAttributes, setIsApplyingAttributes] = useState(false);
  const importFileRef = useRef(null);
  const importPasteRef = useRef(null);

  const loadCore = useCallback(async () => {
    if (
      !teamId ||
      !playerId ||
      !MONGO_ID_RE.test(teamId) ||
      !MONGO_ID_RE.test(playerId)
    ) {
      showError("Invalid link");
      navigate("/teams");
      return null;
    }

    const pres = await getPlayerById(playerId);
    const p = pres.data ?? pres.player ?? null;
    if (!p) {
      showError("Player not found");
      navigate(`/teams/${teamId}/players`);
      return null;
    }
    if (entityId(p.team) !== teamId) {
      showError("Player is not on this team");
      navigate(`/teams/${teamId}/players`);
      return null;
    }

    const tres = await getTeamById(teamId);
    const team = tres.data ?? tres.team ?? null;
    const ownerRef = team?.ownerId ?? team?.owner?._id ?? team?.owner;
    const owner =
      !!team &&
      !!user &&
      ownerRef != null &&
      String(ownerRef) === String(user.id);

    return {
      player: p,
      isOwner: owner,
      teamName: team?.name ?? "",
    };
  }, [teamId, playerId, user, navigate, showError]);

  const refreshStats = useCallback(async () => {
    const res = await getPlayerStats(playerId, page, 10);
    setStatsRows(res.data || []);
    setTotalPages(res.pagination?.pages ?? res.pagination?.totalPages ?? 1);
  }, [playerId, page]);

  const refreshGrowth = useCallback(async () => {
    const res = await getPlayerGrowth(playerId);
    setGrowthPayload(res.data ?? null);
  }, [playerId]);

  const refreshMarketValue = useCallback(async () => {
    const res = await getPlayerMarketValue(playerId);
    const data = res?.data ?? {};
    setMarketValue({
      marketValue: Number(data.marketValue) || 0,
      tier: data.tier || "",
      breakdown: data.breakdown || null,
    });
  }, [playerId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const core = await loadCore();
        if (cancelled || !core) return;
        setPlayer(core.player);
        setIsOwner(core.isOwner);
        setTeamName(core.teamName);
      } catch (err) {
        if (!cancelled) showError(err.message || "Failed to load");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCore, showError]);

  useEffect(() => {
    if (!player || !playerId) return;
    let cancelled = false;
    getPlayerGrowth(playerId)
      .then((res) => {
        if (!cancelled) setGrowthPayload(res.data ?? null);
      })
      .catch((err) => {
        if (!cancelled) showError(err.message || "Failed to load growth");
      });
    return () => {
      cancelled = true;
    };
  }, [player, playerId, showError]);

  useEffect(() => {
    if (!player || !playerId) return;
    let cancelled = false;
    getPlayerStats(playerId, page, 10)
      .then((res) => {
        if (!cancelled) {
          setStatsRows(res.data || []);
          setTotalPages(
            res.pagination?.pages ?? res.pagination?.totalPages ?? 1,
          );
        }
      })
      .catch((err) => {
        if (!cancelled) showError(err.message || "Failed to load stats");
      });
    return () => {
      cancelled = true;
    };
  }, [player, playerId, page, showError]);

  useEffect(() => {
    if (!player || !playerId) return;
    let cancelled = false;
    getPlayerMarketValue(playerId)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data ?? {};
        setMarketValue({
          marketValue: Number(data.marketValue) || Number(player.marketValue) || 0,
          tier: data.tier || "",
          breakdown: data.breakdown || null,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setMarketValue({
          marketValue: Number(player.marketValue) || 0,
          tier: "",
          breakdown: null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [player, playerId]);

  useEffect(() => {
    if (!showImport) return;
    const id = requestAnimationFrame(() => {
      importPasteRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [showImport]);

  const openImportModal = useCallback(() => {
    setShowImport(true);
    setImportPreview(null);
    setImportPayload(null);
    setDecodedImport([]);
    setDecodedAttributes(null);
    setImportPickIdx(0);
    setImportSeasonHint("");
    if (importFileRef.current) importFileRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!player || !isOwner) return;
    if (searchParams.get("import") !== "1") return;
    openImportModal();
    setSearchParams({}, { replace: true });
  }, [player, isOwner, searchParams, openImportModal, setSearchParams]);

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Please choose an image (PNG, JPEG, WebP, or GIF)");
      return;
    }
    try {
      const data = await readImageFileAsBase64(file);
      setImportPreview(data.preview);
      setImportPayload({ mimeType: data.mimeType, base64: data.base64 });
      setDecodedImport([]);
      setDecodedAttributes(null);
    } catch (err) {
      showError(err.message || "Could not read image");
    }
  };

  const handleImportPaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items?.length) return;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.kind === "file" && item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        try {
          const data = await readImageFileAsBase64(file);
          setImportPreview(data.preview);
          setImportPayload({ mimeType: data.mimeType, base64: data.base64 });
          setDecodedImport([]);
          setDecodedAttributes(null);
        } catch (err) {
          showError(err.message || "Could not read pasted image");
        }
        return;
      }
    }
  };

  const runDecodeScreenshot = async () => {
    if (!importPayload?.base64) {
      showError("Paste a screenshot (Ctrl+V) or choose an image file first");
      return;
    }
    const hint = importSeasonHint.trim();
    setIsDecoding(true);
    try {
      const res = await decodeCareerStatsFromScreenshot({
        imageBase64: importPayload.base64,
        mimeType: importPayload.mimeType,
        defaultSeason: /^\d{4}\/\d{2}$/.test(hint) ? hint : undefined,
        scope: "player",
      });
      const list = Array.isArray(res.seasons) ? res.seasons : [];
      setDecodedImport(list);
      setDecodedAttributes(res.attributes || null);
      setImportPickIdx(0);
      if (list.length === 0 && !res.attributes) {
        showError(res.message || "No season rows or attributes found — try another crop");
      } else {
        showSuccess(`Decoded ${list.length} season row(s)${res.attributes ? " and player attributes" : ""}`);
      }
    } catch (err) {
      showError(err.message || "Decode failed");
    } finally {
      setIsDecoding(false);
    }
  };

  const applyDecodedToAddForm = () => {
    const row = decodedImport[importPickIdx];
    if (!row) {
      showError("Decode first, then pick a row");
      return;
    }
    setAddForm(statRowToForm(row));
    setShowImport(false);
    setShowAdd(true);
    showSuccess("Review the numbers, then save");
  };

  const applyAttributesToPlayer = async () => {
    if (!decodedAttributes || !player) return;
    setIsApplyingAttributes(true);
    try {
      const merged = {
        name: player.name,
        age: player.age,
        position: player.position,
        nationality: player.nationality,
        dateOfBirth: player.dateOfBirth,
        overallRating: decodedAttributes.overallRating || player.overallRating,
        potentialRating: decodedAttributes.potentialRating || player.potentialRating,
        pace: decodedAttributes.pace || player.pace,
        shooting: decodedAttributes.shooting || player.shooting,
        passing: decodedAttributes.passing || player.passing,
        dribbling: decodedAttributes.dribbling || player.dribbling,
        defense: decodedAttributes.defense || player.defense,
        physical: decodedAttributes.physical || player.physical,
      };
      
      const res = await updatePlayer(playerId, merged);
      setPlayer(res.data || res.player || merged);
      showSuccess("Player attributes updated from screenshot!");
      setDecodedAttributes(null);
      await refreshMarketValue();
    } catch (err) {
      showError(err.message || "Failed to update attributes");
    } finally {
      setIsApplyingAttributes(false);
    }
  };

  const growth = growthPayload?.growth;
  const seasons = growthPayload?.seasonalProgression ?? [];
  const seasonOptions = useMemo(() => {
    const unique = Array.from(
      new Set(statsRows.map((row) => String(row?.season || "")).filter(Boolean)),
    );
    return [
      { label: "All seasons", value: "all" },
      ...unique.map((season) => ({ label: season, value: season })),
    ];
  }, [statsRows]);
  const visibleRows =
    seasonFilter === "all"
      ? statsRows
      : statsRows.filter((row) => String(row?.season || "") === seasonFilter);

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitAdd = async () => {
    if (!/^\d{4}\/\d{2}$/.test((addForm.season || "").trim())) {
      showError("Season must look like 2025/26");
      return;
    }
    setIsSavingAdd(true);
    try {
      await addStats(playerId, addForm);
      showSuccess("Season stats added");
      setShowAdd(false);
      setAddForm(emptyStatForm());
      await Promise.all([refreshStats(), refreshGrowth(), refreshMarketValue()]);
    } catch (err) {
      showError(err.message || "Could not add stats");
    } finally {
      setIsSavingAdd(false);
    }
  };

  const submitEdit = async () => {
    if (!editRow) return;
    const id = entityId(editRow);
    setIsSavingEdit(true);
    try {
      await updateStats(id, {
        matchesPlayed: editForm.matchesPlayed,
        goals: editForm.goals,
        assists: editForm.assists,
        manOfTheMatchAwards: editForm.manOfTheMatchAwards,
        cleanSheets: editForm.cleanSheets,
        seasonOverallRating: editForm.seasonOverallRating,
      });
      showSuccess("Stats updated");
      setEditRow(null);
      await Promise.all([refreshStats(), refreshGrowth(), refreshMarketValue()]);
    } catch (err) {
      showError(err.message || "Could not update stats");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    const id = entityId(deleteRow);
    setIsDeleting(true);
    try {
      await deleteStats(id);
      showSuccess("Stats removed");
      setDeleteRow(null);
      await Promise.all([refreshStats(), refreshGrowth(), refreshMarketValue()]);
    } catch (err) {
      showError(err.message || "Could not delete stats");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !player) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <WorkstationPage>
        <SectionHeader
          eyebrow={teamName || "Team"}
          title={`Player · ${player.name}`}
          description={
            <>
              <span className="block mt-1">
                Individual season stats (goals, assists, MOTM…) —{" "}
                {player.position} · OVR {player.overallRating}
              </span>
              {growthPayload != null && (
                <span className="block mt-2 text-app-text-muted">
                  Live card: OVR {growthPayload.overallRating ?? "—"} · POT{" "}
                  {growthPayload.potentialRating ?? "—"}
                  {growthPayload.potentialRating != null &&
                    growthPayload.overallRating != null && (
                      <>
                        {" "}
                        · Growth room{" "}
                        {Math.max(
                          0,
                          growthPayload.potentialRating -
                            growthPayload.overallRating,
                        )}
                      </>
                    )}
                </span>
              )}
              <span className="block mt-2 text-app-text-muted">
                Club / league table rows belong on the team’s{" "}
                <button
                  type="button"
                  className="text-app-text-secondary underline-offset-2 hover:underline"
                  onClick={() => navigate(`/teams/${teamId}/season-stats`)}
                >
                  Club season stats
                </button>{" "}
                page, not here.
              </span>
            </>
          }
          actions={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/teams/${teamId}/players`)}
              >
                Back to squad
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  navigate(`/teams/${teamId}/players/${playerId}/edit`)
                }
              >
                Edit player
              </Button>
              {isOwner && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowAdd(true)}
                  >
                    Add season
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={openImportModal}
                  >
                    From screenshot
                  </Button>
                </>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <div className="lg:sticky lg:top-4 lg:h-fit">
            <Card className="p-0" padded={false}>
              <div className="px-4 py-3 space-y-4">
                <div className="rounded-md border border-white/5 bg-zinc-900 h-36 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl">👤</div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mt-2">
                      {player.position}
                    </p>
                  </div>
                </div>
                <div className="border-b border-white/5 pb-3">
                  <p className="text-sm font-semibold tracking-tight text-zinc-100">
                    {player.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mt-1">
                    {player.nationality} · Age {player.age}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                    Overall rating
                  </p>
                  <p
                    className={`text-5xl font-semibold tracking-tight tabular-nums mt-1 ${
                      Number(player.overallRating) >= 85 ? "text-yellow-500" : "text-zinc-100"
                    }`}
                  >
                    {player.overallRating ?? "—"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                    Potential {player.potentialRating ?? "—"}
                  </p>
                </div>
                <div className="rounded-md border border-white/5 bg-zinc-900 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                    Contract
                  </p>
                  <p className="text-sm text-zinc-100 mt-1 tabular-nums">
                    Expires{" "}
                    {player.contractExpiry
                      ? new Date(player.contractExpiry).toLocaleDateString()
                      : "—"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                    Current form {player.currentForm ?? "—"}/99
                  </p>
                </div>
                <div className="rounded-md border border-white/5 bg-zinc-900 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                    Market value
                  </p>
                  <p className="text-sm text-zinc-100 mt-1 tabular-nums">
                    {formatMoney(marketValue.marketValue)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Tier {marketValue.tier || "N/A"}
                  </p>
                  {marketValue.breakdown?.formModifier != null && (
                    <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                      Form x{Number(marketValue.breakdown.formModifier).toFixed(2)} ·
                      Contract x{Number(marketValue.breakdown.contractMultiplier || 1).toFixed(2)}
                    </p>
                  )}
                </div>
                <AttributeRadar player={player} />
              </div>
            </Card>
          </div>

          <div className="space-y-4 min-w-0">
        {growth && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <StatChip label="Seasons" value={growth.seasonCount ?? 0} />
            <StatChip label="Matches" value={growth.totalMatches ?? 0} />
            <StatChip label="Goals" value={growth.totalGoals ?? 0} />
            <StatChip label="Assists" value={growth.totalAssists ?? 0} />
            <StatChip label="MOTM" value={growth.totalMotm ?? 0} />
            <StatChip label="Clean sheets" value={growth.totalCleanSheets ?? 0} />
          </div>
        )}

        {(growth?.averageGoalsPerMatch > 0 || growth?.averageAssistsPerMatch > 0) && (
          <div className="app-panel-muted p-4 text-sm text-app-text-secondary">
            Averages:{" "}
            <span className="text-app-text font-medium">
              {(growth.averageGoalsPerMatch ?? 0).toFixed(2)} G/M
            </span>
            {" · "}
            <span className="text-app-text font-medium">
              {(growth.averageAssistsPerMatch ?? 0).toFixed(2)} A/M
            </span>
          </div>
        )}

        {seasons.length > 0 && (
          <GrowthSeasonBars seasons={seasons} />
        )}

        {seasons.length > 0 && (
          <div className="p-4">
            <h2 className="text-sm font-semibold text-app-text mb-3">
              Season progression
            </h2>
            <DataTable
              headers={[
                { label: "Season" },
                { label: "MP" },
                { label: "G" },
                { label: "A" },
                { label: "MOTM" },
                { label: "CS" },
                { label: "OVR" },
              ]}
              rows={seasons.map((row) => (
                <tr key={row.season} className="border-b border-app-border">
                  <td className="px-4 py-3 text-sm font-medium text-app-text">
                    {row.season}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.matchesPlayed}</td>
                  <td className="px-4 py-3 text-sm">{row.goals}</td>
                  <td className="px-4 py-3 text-sm">{row.assists}</td>
                  <td className="px-4 py-3 text-sm">
                    {row.manOfTheMatchAwards}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.cleanSheets}</td>
                  <td className="px-4 py-3 text-sm text-app-text-secondary">
                    {row.seasonOverallRating != null
                      ? row.seasonOverallRating
                      : "—"}
                  </td>
                </tr>
              ))}
            />
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-app-text mb-3">Recorded seasons</h2>
          <div className="mb-3 max-w-xs">
            <Select
              label="Season filter"
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              options={seasonOptions}
            />
          </div>
          {visibleRows.length === 0 ? (
            <div className="app-panel p-8 text-center text-app-text-secondary app-gridlines">
              No season rows yet.
              {isOwner && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
                    Add first season
                  </Button>
                  <Button variant="secondary" size="sm" onClick={openImportModal}>
                    From screenshot
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <DataTable
              headers={[
                { label: "Season" },
                { label: "MP" },
                { label: "G" },
                { label: "A" },
                { label: "MOTM" },
                { label: "CS" },
                { label: "OVR" },
                ...(isOwner ? [{ label: "Actions" }] : []),
              ]}
              rows={visibleRows.map((row) => (
                <tr
                  key={entityId(row) || row.season}
                  className="border-b border-app-border hover:bg-app-elevated-light"
                >
                  <td className="px-4 py-3 text-sm font-medium text-app-text">
                    {row.season}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.matchesPlayed}</td>
                  <td className="px-4 py-3 text-sm">{row.goals}</td>
                  <td className="px-4 py-3 text-sm">{row.assists}</td>
                  <td className="px-4 py-3 text-sm">
                    {row.manOfTheMatchAwards}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.cleanSheets}</td>
                  <td className="px-4 py-3 text-sm text-app-text-secondary">
                    {row.seasonOverallRating != null
                      ? row.seasonOverallRating
                      : "—"}
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditRow(row);
                            setEditForm(statRowToForm(row));
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteRow(row)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-app-text-secondary">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
          </div>
        </div>
      </WorkstationPage>

      <Modal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="Import player career screenshot"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowImport(false)}>
              Close
            </Button>
            <Button
              variant="secondary"
              isLoading={isDecoding}
              disabled={!importPayload}
              onClick={runDecodeScreenshot}
            >
              Decode with AI
            </Button>
            <Button
              variant="primary"
              disabled={decodedImport.length === 0}
              onClick={applyDecodedToAddForm}
            >
              Use for “Add season”
            </Button>
            {decodedAttributes && (
              <Button
                variant="primary"
                isLoading={isApplyingAttributes}
                onClick={applyAttributesToPlayer}
              >
                Apply Attributes (OVR {decodedAttributes.overallRating})
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4 text-sm text-app-text-secondary">
          <p>
            Paste a capture of your FC / FIFA-style career stats screen here (click
            the box, then <strong>Ctrl+V</strong>), or use{" "}
            <button
              type="button"
              className="text-app-text underline font-medium"
              onClick={() => importFileRef.current?.click()}
            >
              choose file
            </button>
            . The Gaffer Desk AI service sends the image to Gemini and fills season
            totals — always verify before saving.
          </p>
          <input
            ref={importFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleImportFile}
          />
          <Input
            label="Default season if the screen has no season label (YYYY/YY)"
            name="importSeasonHint"
            placeholder="2025/26"
            value={importSeasonHint}
            onChange={(e) => setImportSeasonHint(e.target.value)}
          />
          <div
            ref={importPasteRef}
            tabIndex={0}
            role="textbox"
            aria-label="Paste screenshot here"
            onPaste={handleImportPaste}
            className="rounded-xl border-2 border-dashed border-app-border bg-app-elevated-light/30 p-4 min-h-[190px] outline-none focus:ring-2 focus:ring-app-text flex flex-col items-center justify-center gap-2 text-center cursor-text relative overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(360px_140px_at_50%_0%,rgba(113,113,122,0.22),transparent_62%)]" />
            {importPreview ? (
              <img
                src={importPreview}
                alt="Screenshot preview"
                className="max-h-52 max-w-full rounded-md border border-app-border object-contain relative z-10"
              />
            ) : (
              <span className="relative z-10">Click here, then paste your screenshot</span>
            )}
          </div>
          <div className="rounded-lg border border-app-border bg-app-elevated-light/20 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-app-text-muted">
              AI extraction status
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-app-elevated overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDecoding ? "w-2/3 bg-sky-400/80 animate-pulse" : decodedImport.length > 0 ? "w-full bg-emerald-400/80" : "w-1/5 bg-zinc-500/80"
                }`}
              />
            </div>
            <p className="mt-2 text-xs text-app-text-secondary">
              {isDecoding
                ? "Scanning screenshot and detecting season rows..."
                : decodedImport.length > 0
                  ? `Detected ${decodedImport.length} season row(s).`
                  : "Awaiting screenshot input."}
            </p>
          </div>
          {decodedImport.length > 0 && (
            <div className="space-y-2">
              <label className="block text-app-text font-medium text-sm">
                Pick row to import
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-app-elevated border border-app-border text-app-text"
                value={importPickIdx}
                onChange={(e) => setImportPickIdx(Number(e.target.value))}
              >
                {decodedImport.map((row, idx) => (
                  <option key={`${row.season}-${idx}`} value={idx}>
                    {row.season} — MP {row.matchesPlayed} · G {row.goals} · A{" "}
                    {row.assists} · MOTM {row.manOfTheMatchAwards} · CS{" "}
                    {row.cleanSheets}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add season stats"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button variant="primary" isLoading={isSavingAdd} onClick={submitAdd}>
              Save
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Season (YYYY/YY)"
            name="season"
            placeholder="2025/26"
            value={addForm.season}
            onChange={handleAddChange}
          />
          <Input
            label="Matches played"
            name="matchesPlayed"
            type="number"
            min="0"
            value={addForm.matchesPlayed}
            onChange={handleAddChange}
          />
          <Input
            label="Goals"
            name="goals"
            type="number"
            min="0"
            value={addForm.goals}
            onChange={handleAddChange}
          />
          <Input
            label="Assists"
            name="assists"
            type="number"
            min="0"
            value={addForm.assists}
            onChange={handleAddChange}
          />
          <Input
            label="Man of the match"
            name="manOfTheMatchAwards"
            type="number"
            min="0"
            value={addForm.manOfTheMatchAwards}
            onChange={handleAddChange}
          />
          <Input
            label="Clean sheets"
            name="cleanSheets"
            type="number"
            min="0"
            value={addForm.cleanSheets}
            onChange={handleAddChange}
          />
          <Input
            label="Season OVR snapshot (optional, for growth chart)"
            name="seasonOverallRating"
            type="number"
            min="0"
            max="99"
            placeholder="e.g. 87"
            value={addForm.seasonOverallRating}
            onChange={handleAddChange}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!editRow}
        onClose={() => setEditRow(null)}
        title={`Edit ${editForm.season || "season"}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button variant="primary" isLoading={isSavingEdit} onClick={submitEdit}>
              Save
            </Button>
          </>
        }
      >
        <p className="text-sm text-app-text-secondary mb-4">
          Season label cannot be changed. Delete and re-add if the label was wrong.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Season" name="season" value={editForm.season} disabled />
          <Input
            label="Matches played"
            name="matchesPlayed"
            type="number"
            min="0"
            value={editForm.matchesPlayed}
            onChange={handleEditChange}
          />
          <Input
            label="Goals"
            name="goals"
            type="number"
            min="0"
            value={editForm.goals}
            onChange={handleEditChange}
          />
          <Input
            label="Assists"
            name="assists"
            type="number"
            min="0"
            value={editForm.assists}
            onChange={handleEditChange}
          />
          <Input
            label="Man of the match"
            name="manOfTheMatchAwards"
            type="number"
            min="0"
            value={editForm.manOfTheMatchAwards}
            onChange={handleEditChange}
          />
          <Input
            label="Clean sheets"
            name="cleanSheets"
            type="number"
            min="0"
            value={editForm.cleanSheets}
            onChange={handleEditChange}
          />
          <Input
            label="Season OVR snapshot (optional)"
            name="seasonOverallRating"
            type="number"
            min="0"
            max="99"
            value={editForm.seasonOverallRating}
            onChange={handleEditChange}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        title="Delete season stats?"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteRow(null)}>
              Cancel
            </Button>
            <Button variant="destructive" isLoading={isDeleting} onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-app-text-secondary">
          Remove stats for season <strong>{deleteRow?.season}</strong>. This cannot be
          undone.
        </p>
      </Modal>
    </Layout>
  );
}

function GrowthSeasonBars({ seasons }) {
  if (!Array.isArray(seasons) || seasons.length === 0) return null;

  const hasOvr = seasons.some((s) => s.seasonOverallRating != null);

  const formatDelta = (cur, prev) => {
    if (prev == null || Number.isNaN(prev) || cur == null || Number.isNaN(cur))
      return null;
    const d = cur - prev;
    const sign = d > 0 ? "+" : "";
    return `${sign}${d}`;
  };

  const goalsTooltip = (cur, prev, idx) => {
    const season = cur?.season ?? `S${idx + 1}`;
    const curVal = Number(cur?.goals) || 0;
    const prevVal = prev ? Number(prev.goals) : null;
    const delta = formatDelta(curVal, prevVal);
    return (
      <div className="space-y-0.5">
        <div className="text-xs font-semibold text-app-text">{season}</div>
        <div className="text-xs text-app-text-muted">
          Goals: {curVal}
          {delta != null && (
            <span
              className={`ml-2 font-medium ${
                Number(delta) >= 0 ? "text-emerald-200" : "text-red-300"
              }`}
            >
              ({delta})
            </span>
          )}
        </div>
      </div>
    );
  };

  const assistsTooltip = (cur, prev, idx) => {
    const season = cur?.season ?? `S${idx + 1}`;
    const curVal = Number(cur?.assists) || 0;
    const prevVal = prev ? Number(prev.assists) : null;
    const delta = formatDelta(curVal, prevVal);
    return (
      <div className="space-y-0.5">
        <div className="text-xs font-semibold text-app-text">{season}</div>
        <div className="text-xs text-app-text-muted">
          Assists: {curVal}
          {delta != null && (
            <span
              className={`ml-2 font-medium ${
                Number(delta) >= 0 ? "text-sky-200" : "text-red-300"
              }`}
            >
              ({delta})
            </span>
          )}
        </div>
      </div>
    );
  };

  const ovrTooltip = (cur, prev, idx) => {
    const season = cur?.season ?? `S${idx + 1}`;
    const curVal =
      cur?.seasonOverallRating != null ? Number(cur.seasonOverallRating) : null;
    const prevVal = prev?.seasonOverallRating != null
      ? Number(prev.seasonOverallRating)
      : null;
    const delta = formatDelta(curVal, prevVal);
    return (
      <div className="space-y-0.5">
        <div className="text-xs font-semibold text-app-text">{season}</div>
        <div className="text-xs text-app-text-muted">
          Season OVR: {curVal != null && !Number.isNaN(curVal) ? curVal : "—"}
          {delta != null && (
            <span
              className={`ml-2 font-medium ${
                Number(delta) >= 0 ? "text-amber-200" : "text-red-300"
              }`}
            >
              ({delta})
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card
      title="Growth — per season"
      subtitle="Hover the points/bars to see season-by-season changes. Add an optional Season OVR snapshot to connect stats to card rating."
      className="p-0"
      padded={false}
    >
      <div className="px-4 sm:px-5 py-4 space-y-6">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge tone="success">Goals + assists</Badge>
          {hasOvr && <Badge tone="subtle">OVR snapshot included</Badge>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-app-elevated-light/40 border border-app-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-app-text-muted">
                Goals
              </h3>
              <span className="text-[11px] text-app-text-muted">Per season</span>
            </div>
            <LineChart
              width={520}
              height={190}
              data={seasons}
              xKey="season"
              yKey="goals"
              color="#10b981"
              tooltipFormatter={goalsTooltip}
            />
          </div>

          <div className="bg-app-elevated-light/40 border border-app-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-app-text-muted">
                Assists
              </h3>
              <span className="text-[11px] text-app-text-muted">Per season</span>
            </div>
            <LineChart
              width={520}
              height={190}
              data={seasons}
              xKey="season"
              yKey="assists"
              color="#38bdf8"
              tooltipFormatter={assistsTooltip}
            />
          </div>
        </div>

        {hasOvr && (
          <div className="bg-app-elevated-light/40 border border-app-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-app-text-muted">
                Season OVR snapshot
              </h3>
              <span className="text-[11px] text-app-text-muted">
                Optional (enter in “Add/Edit season”)
              </span>
            </div>
            <BarChart
              width={620}
              height={190}
              data={seasons}
              xKey="season"
              yKey="seasonOverallRating"
              color="#f59e0b"
              tooltipFormatter={ovrTooltip}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

function AttributeRadar({ player }) {
  const keys = [
    ["pace", "PAC"],
    ["shooting", "SHO"],
    ["passing", "PAS"],
    ["dribbling", "DRI"],
    ["defense", "DEF"],
    ["physical", "PHY"],
  ];
  const values = keys.map(([k]) => Number(player?.[k] ?? 50));
  const center = 50;
  const radius = 42;
  const points = values
    .map((v, i) => {
      const angle = (-Math.PI / 2) + (i * (Math.PI * 2)) / values.length;
      const r = (Math.max(0, Math.min(99, v)) / 99) * radius;
      const x = center + Math.cos(angle) * r;
      const y = center + Math.sin(angle) * r;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-md border border-white/5 bg-zinc-900 p-3">
      <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">
        Attribute radar
      </p>
      <div className="flex items-start gap-3">
        <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0">
          <polygon points="50,8 86,29 86,71 50,92 14,71 14,29" fill="none" stroke="#3f3f46" />
          <polygon points={points} fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="1" />
        </svg>
        <div className="space-y-1.5 text-xs tabular-nums w-full">
          {keys.map(([k, label]) => {
            const v = Number(player?.[k] ?? 50);
            return (
              <div key={k} className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500/80" style={{ width: `${Math.max(0, Math.min(100, v))}%` }} />
                  </div>
                  <span className="font-semibold tracking-tight text-zinc-100 w-7 text-right">
                    {v}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function StatChip({ label, value }) {
  return (
    <div className="bg-app-elevated-light/35 rounded-lg border border-app-border p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-app-text-muted font-medium mb-1">
        {label}
      </p>
      <p className="text-lg font-semibold tracking-tight text-app-text">{value}</p>
    </div>
  );
}
