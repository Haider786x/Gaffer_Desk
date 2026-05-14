import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../components/layout/Layout.jsx";
import { Button } from "../../components/shared/Button.jsx";
import { Input } from "../../components/shared/Input.jsx";
import { Select } from "../../components/shared/Select.jsx";
import { Modal } from "../../components/shared/Modal.jsx";
import { Card } from "../../components/shared/Card.jsx";
import { SectionHeader } from "../../components/shared/SectionHeader.jsx";
import { Badge } from "../../components/shared/Badge.jsx";
import { DataTable } from "../../components/shared/DataTable.jsx";
import { WorkstationPage } from "../../components/layout/WorkstationPage.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { createPlayer, getPlayersByTeam } from "../../services/players.js";
import { getTeamById } from "../../services/teams.js";
import { searchRealPlayers } from "../../services/realPlayers.js";
import { decodeSquadFromScreenshot } from "../../services/ai.js";
import {
  POSITION_GROUPS,
  PLAYER_STATUS,
  PREFERRED_FEET,
} from "../../utils/constants";
import { calculateAge } from "../../utils/formatters";
import {
  validateAge,
  validateRating,
  validateDateOfBirth,
} from "../../utils/validators";
import { entityId } from "../../utils/ids.js";
import { publicUploadUrl } from "../../utils/uploads.js";
import {
  formatMarketValue,
  getGrowthPotentialMeta,
  getMarketValueTier,
  getMarketValueTierClasses,
} from "../../utils/marketValue.js";

function readImageFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result || "");
      const m = s.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) {
        reject(new Error("Could not read image"));
        return;
      }
      resolve({ mimeType: m[1].toLowerCase(), base64: m[2], preview: s });
    };
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export default function PlayersPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [isTeamOwner, setIsTeamOwner] = useState(false);

  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    position: "",
    nationality: "",
    dateOfBirth: "",
    overallRating: "",
    potentialRating: "",
    preferredFoot: "",
    pace: "",
    shooting: "",
    passing: "",
    dribbling: "",
    defense: "",
    physical: "",
    jerseyNumber: "",
    status: "Active",
  });

  const [errors, setErrors] = useState({});
  const [playerSource, setPlayerSource] = useState("custom"); // "custom" | "real"
  const [realQuery, setRealQuery] = useState("");
  const [realResults, setRealResults] = useState([]);
  const [realSearchError, setRealSearchError] = useState("");
  const [isSearchingReal, setIsSearchingReal] = useState(false);
  const realSearchTimerRef = useRef(null);
  const [selectedRealId, setSelectedRealId] = useState(null);
  const [sortBy, setSortBy] = useState("marketValueDesc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showImporter, setShowImporter] = useState(false);
  const [importPreview, setImportPreview] = useState("");
  const [importPayload, setImportPayload] = useState(null);
  const [importedRows, setImportedRows] = useState([]);
  const [isDecodingImport, setIsDecodingImport] = useState(false);
  const [isImportingPlayers, setIsImportingPlayers] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const importerFileRef = useRef(null);
  const importerPasteRef = useRef(null);

  const fetchPlayers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPlayersByTeam(
        teamId,
        page,
        10,
        statusFilter === "all" ? null : statusFilter,
      );
      setPlayers(response.data || []);
      setTotalPages(response.pagination?.pages ?? response.pagination?.totalPages ?? 1);
    } catch (err) {
      showError(err.message || "Failed to load players");
    } finally {
      setIsLoading(false);
    }
  }, [teamId, page, showError, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!teamId) return;
      try {
        const r = await getTeamById(teamId);
        const team = r.data ?? r.team ?? null;
        const ownerRef = team?.ownerId ?? team?.owner?._id ?? team?.owner;
        if (
          !cancelled &&
          user &&
          ownerRef != null &&
          String(ownerRef) === String(user.id)
        ) {
          setIsTeamOwner(true);
        } else if (!cancelled) setIsTeamOwner(false);
      } catch {
        if (!cancelled) setIsTeamOwner(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId, user]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const sortedPlayers = useMemo(() => {
    const list = [...players];
    if (sortBy === "marketValueAsc") {
      list.sort((a, b) => (Number(a.marketValue) || 0) - (Number(b.marketValue) || 0));
      return list;
    }
    if (sortBy === "marketValueDesc") {
      list.sort((a, b) => (Number(b.marketValue) || 0) - (Number(a.marketValue) || 0));
      return list;
    }
    if (sortBy === "potentialDesc") {
      list.sort((a, b) => (Number(b.potentialRating) || 0) - (Number(a.potentialRating) || 0));
      return list;
    }
    if (sortBy === "ovrDesc") {
      list.sort((a, b) => (Number(b.overallRating) || 0) - (Number(a.overallRating) || 0));
      return list;
    }
    if (sortBy === "ageAsc") {
      list.sort((a, b) => (Number(a.age) || 0) - (Number(b.age) || 0));
      return list;
    }
    list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    return list;
  }, [players, sortBy]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Auto-calculate age from dateOfBirth
    if (name === "dateOfBirth" && value) {
      const age = calculateAge(value);
      setFormData((prev) => ({ ...prev, age: age.toString() }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Player name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Player name must be at least 2 characters";
    }

    if (!formData.age) {
      newErrors.age = "Age is required";
    } else if (!validateAge(formData.age)) {
      newErrors.age = "Player must be between 16 and 45 years old";
    }

    if (!formData.position) {
      newErrors.position = "Position is required";
    }

    if (!formData.nationality.trim()) {
      newErrors.nationality = "Nationality is required";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else if (!validateDateOfBirth(formData.dateOfBirth)) {
      newErrors.dateOfBirth = "Invalid date of birth (must be 16-45 years old)";
    }

    if (!formData.overallRating) {
      newErrors.overallRating = "Overall rating is required";
    } else if (!validateRating(formData.overallRating)) {
      newErrors.overallRating = "Rating must be between 0 and 99";
    }

    if (!formData.potentialRating) {
      newErrors.potentialRating = "Potential rating is required";
    } else if (!validateRating(formData.potentialRating)) {
      newErrors.potentialRating = "Rating must be between 0 and 99";
    } else if (
      parseInt(formData.potentialRating) < parseInt(formData.overallRating)
    ) {
      newErrors.potentialRating = "Potential must be >= Overall rating";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const response = await createPlayer(teamId, formData);
      if (response.data || response.player) {
        showSuccess("Player added successfully!");
        setShowModal(false);
        setFormData({
          name: "",
          age: "",
          position: "",
          nationality: "",
          dateOfBirth: "",
          overallRating: "",
          potentialRating: "",
          preferredFoot: "",
          pace: "",
          shooting: "",
          passing: "",
          dribbling: "",
          defense: "",
          physical: "",
          jerseyNumber: "",
          status: "Active",
        });
        setPage(1);
        fetchPlayers();
      }
    } catch (err) {
      showError(err.message || "Failed to add player");
    } finally {
      setIsCreating(false);
    }
  };

  const openAddPlayerModal = () => {
    setPlayerSource("custom");
    setRealQuery("");
    setRealResults([]);
    setRealSearchError("");
    setIsSearchingReal(false);
    setSelectedRealId(null);
    if (realSearchTimerRef.current) {
      clearTimeout(realSearchTimerRef.current);
      realSearchTimerRef.current = null;
    }
    setErrors({});
    setFormData({
      name: "",
      age: "",
      position: "",
      nationality: "",
      dateOfBirth: "",
      overallRating: "",
      potentialRating: "",
      preferredFoot: "",
      pace: "",
      shooting: "",
      passing: "",
      dribbling: "",
      defense: "",
      physical: "",
      jerseyNumber: "",
      status: "Active",
    });
    setShowModal(true);
  };

  const applyRealPlayerToForm = (p) => {
    if (!p) return;
    setSelectedRealId(p.realId ?? null);
    setPlayerSource("real");
    setErrors({});
    setFormData({
      name: p.name ?? "",
      age: p.age != null ? String(p.age) : "",
      position: p.position ?? "",
      nationality: p.nationality ?? "",
      dateOfBirth: p.dateOfBirth ?? "",
      overallRating:
        p.overallRating != null ? String(p.overallRating) : "",
      potentialRating:
        p.potentialRating != null ? String(p.potentialRating) : "",
      preferredFoot: p.preferredFoot ?? "",
      pace: p.pace != null ? String(p.pace) : "",
      shooting: p.shooting != null ? String(p.shooting) : "",
      passing: p.passing != null ? String(p.passing) : "",
      dribbling: p.dribbling != null ? String(p.dribbling) : "",
      defense: p.defense != null ? String(p.defense) : "",
      physical: p.physical != null ? String(p.physical) : "",
      jerseyNumber: "",
      status: "Active",
    });
  };

  useEffect(() => {
    if (!showModal || playerSource !== "real") return;

    const q = String(realQuery ?? "").trim();
    if (!q) {
      setRealResults([]);
      setRealSearchError("");
      return;
    }

    let cancelled = false;
    setIsSearchingReal(true);
    setRealSearchError("");
    if (realSearchTimerRef.current) {
      clearTimeout(realSearchTimerRef.current);
      realSearchTimerRef.current = null;
    }

    realSearchTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchRealPlayers(q, 10);
        if (cancelled) return;
        setRealResults(res.data || []);
      } catch (err) {
        if (cancelled) return;
        setRealResults([]);
        setRealSearchError(err.message || "Real player search failed");
      } finally {
        if (!cancelled) setIsSearchingReal(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      if (realSearchTimerRef.current) {
        clearTimeout(realSearchTimerRef.current);
        realSearchTimerRef.current = null;
      }
    };
  }, [realQuery, playerSource, showModal, showError]);

  useEffect(() => {
    if (!showImporter) return;
    const id = requestAnimationFrame(() => importerPasteRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [showImporter]);

  const normalizeImportedPlayers = useCallback((payload) => {
    const source =
      payload?.players ||
      payload?.data?.players ||
      payload?.data ||
      payload?.squad ||
      [];
    if (!Array.isArray(source)) return [];

    const allowedPositions = new Set([
      "GK",
      "RB",
      "LB",
      "CB",
      "RWB",
      "LWB",
      "DM",
      "CM",
      "CAM",
      "RW",
      "LW",
      "CF",
      "ST",
    ]);

    const mapPosition = (raw) => {
      const p = String(raw || "").trim().toUpperCase();
      if (p === "CDM") return "DM";
      if (p === "LM") return "LW";
      if (p === "RM") return "RW";
      if (allowedPositions.has(p)) return p;
      return "ST";
    };

    return source
      .map((r, idx) => {
        const overallRating = Number(r.overallRating ?? r.overall ?? r.ovr ?? 70);
        const potentialRating = Number(
          r.potentialRating ?? r.potential ?? Math.min(99, overallRating + 2),
        );
        const age = Number(r.age ?? 23);
        const now = new Date();
        const dateOfBirth = new Date(
          now.getFullYear() - (Number.isFinite(age) ? age : 23),
          0,
          1,
        )
          .toISOString()
          .slice(0, 10);
        return {
          rowId: `${idx}-${String(r.name || "player")}`,
          name: String(r.name || "").trim() || `Imported Player ${idx + 1}`,
          position: mapPosition(r.position),
          nationality: String(r.nationality || r.nation || "Unknown").trim() || "Unknown",
          age: Math.max(16, Math.min(45, Number.isFinite(age) ? age : 23)),
          dateOfBirth,
          overallRating: Math.max(0, Math.min(99, Number.isFinite(overallRating) ? overallRating : 70)),
          potentialRating: Math.max(
            0,
            Math.min(99, Number.isFinite(potentialRating) ? potentialRating : Math.min(99, overallRating + 2)),
          ),
          preferredFoot: String(r.preferredFoot || r.foot || "Right"),
          pace: Number(r.pace ?? r.pac ?? 50),
          shooting: Number(r.shooting ?? r.sho ?? 50),
          passing: Number(r.passing ?? r.pas ?? 50),
          dribbling: Number(r.dribbling ?? r.dri ?? 50),
          defense: Number(r.defense ?? r.def ?? 50),
          physical: Number(r.physical ?? r.phy ?? 50),
          status: "Active",
        };
      })
      .filter((r) => !!r.name);
  }, []);

  const openImporter = () => {
    setShowImporter(true);
    setImportPreview("");
    setImportPayload(null);
    setImportedRows([]);
    setIsDecodingImport(false);
    setIsImportingPlayers(false);
    setImportProgress({ done: 0, total: 0 });
    if (importerFileRef.current) importerFileRef.current.value = "";
  };

  const onImporterFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Please choose an image file");
      return;
    }
    try {
      const parsed = await readImageFileAsBase64(file);
      setImportPreview(parsed.preview);
      setImportPayload({ mimeType: parsed.mimeType, base64: parsed.base64 });
      setImportedRows([]);
    } catch (err) {
      showError(err.message || "Could not read image");
    }
  };

  const onImporterPaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items?.length) return;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.kind === "file" && item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        try {
          const parsed = await readImageFileAsBase64(file);
          setImportPreview(parsed.preview);
          setImportPayload({ mimeType: parsed.mimeType, base64: parsed.base64 });
          setImportedRows([]);
        } catch (err) {
          showError(err.message || "Could not read pasted image");
        }
        return;
      }
    }
  };

  const runImporterDecode = async () => {
    if (!importPayload?.base64) {
      showError("Paste or upload an image first");
      return;
    }
    setIsDecodingImport(true);
    try {
      const res = await decodeSquadFromScreenshot({
        imageBase64: importPayload.base64,
        mimeType: importPayload.mimeType,
      });
      const normalized = normalizeImportedPlayers(res);
      setImportedRows(normalized);
      if (normalized.length === 0) {
        showError("No players detected. Try a clearer lineup image.");
      } else {
        showSuccess(`Detected ${normalized.length} player(s). Review and confirm import.`);
      }
    } catch (err) {
      showError(err.message || "Squad scan failed");
    } finally {
      setIsDecodingImport(false);
    }
  };

  const updateImportedRow = (rowId, field, value) => {
    setImportedRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r)),
    );
  };

  const confirmImporter = async () => {
    if (!Array.isArray(importedRows) || importedRows.length === 0) {
      showError("No extracted players to import");
      return;
    }
    setIsImportingPlayers(true);
    setImportProgress({ done: 0, total: importedRows.length });
    let done = 0;
    let failed = 0;
    for (const row of importedRows) {
      try {
        await createPlayer(teamId, row);
        done += 1;
      } catch {
        failed += 1;
      } finally {
        setImportProgress({ done: done + failed, total: importedRows.length });
      }
    }
    setIsImportingPlayers(false);
    setShowImporter(false);
    if (done > 0) {
      showSuccess(
        failed > 0
          ? `Imported ${done} players (${failed} failed)`
          : `Imported ${done} players successfully`,
      );
      setPage(1);
      fetchPlayers();
    } else {
      showError("Import failed for all extracted players");
    }
  };

  return (
    <Layout>
      <WorkstationPage>
        {/* Header */}
        <SectionHeader
          eyebrow="Squad"
          title="Squad players"
          description="Manage your team's player roster and track goals, assists and growth over time."
          actions={
            <>
              <div className="min-w-[180px]">
                <Select
                  label="Sort players"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { label: "OVR ↓", value: "ovrDesc" },
                    { label: "Age ↑", value: "ageAsc" },
                    { label: "Market value ↓", value: "marketValueDesc" },
                    { label: "Market value ↑", value: "marketValueAsc" },
                    { label: "Potential ↓", value: "potentialDesc" },
                    { label: "Name A-Z", value: "nameAsc" },
                  ]}
                />
              </div>
              <div className="min-w-[170px]">
                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  options={[
                    { label: "All statuses", value: "all" },
                    ...PLAYER_STATUS.map((status) => ({ label: status, value: status })),
                  ]}
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => navigate(`/teams/${teamId}`)}
              >
                Back
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate(`/teams/${teamId}/season-stats`)}
              >
                Club season stats
              </Button>
              {isTeamOwner && players.length > 0 && (
                <Button
                  variant="secondary"
                  title="AI import for one player’s career stats (first row on this page)"
                  onClick={() =>
                    navigate(
                      `/teams/${teamId}/players/${entityId(players[0])}/stats?import=1`,
                    )
                  }
                >
                  Player screenshot
                </Button>
              )}
              {isTeamOwner && (
                <Button variant="secondary" onClick={openImporter}>
                  AI Squad Importer
                </Button>
              )}
              <Button variant="primary" onClick={openAddPlayerModal}>
                + Add Player
              </Button>
            </>
          }
        />

        {/* Players Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
          </div>
        ) : players.length > 0 ? (
          <Card
            title="Scouting table"
            subtitle="Live roster intelligence with growth potential and market context."
          >
            <DataTable
              headers={[
                { label: "Photo" },
                { label: "Name" },
                { label: "Position" },
                { label: "Age" },
                { label: "Nationality" },
                { label: "Overall" },
                { label: "Potential" },
                { label: "Growth" },
                { label: "Market value" },
                { label: "Status" },
                { label: "Actions" },
              ]}
              rows={sortedPlayers.map((player) => {
                const tier = getMarketValueTier(player.marketValue || 0);
                const growthMeta = getGrowthPotentialMeta(
                  player.overallRating,
                  player.potentialRating,
                );
                return (
                  <tr
                    key={entityId(player)}
                    className="border-b border-app-border hover:bg-app-elevated-light/70 transition-colors"
                  >
                    <td className="px-4 py-3 w-14">
                      {player.photoUrl ? (
                        <img
                          src={publicUploadUrl(player.photoUrl)}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover border border-app-border"
                        />
                      ) : (
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-app-border bg-app-elevated-light text-xs font-medium text-app-text-muted"
                          aria-hidden
                        >
                          {String(player.name || "?")
                            .trim()
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-app-text">
                      {player.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-app-text-secondary">
                      {player.position}
                    </td>
                    <td className="px-4 py-3 text-sm text-app-text-secondary">
                      {player.age}
                    </td>
                    <td className="px-4 py-3 text-sm text-app-text-secondary">
                      {player.nationality}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-app-text">
                      {player.overallRating}
                    </td>
                    <td className="px-4 py-3 text-sm text-app-text-secondary">
                      {player.potentialRating}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${growthMeta.className}`}
                    >
                      {growthMeta.label}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-app-text">
                          {formatMarketValue(player.marketValue)}
                        </span>
                        <span
                          className={`inline-flex w-fit px-2 py-0.5 rounded-full text-[11px] font-medium ${getMarketValueTierClasses(tier)}`}
                        >
                          {tier}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge tone={player.status === "Active" ? "success" : "subtle"}>
                        {player.status || "Active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/teams/${teamId}/players/${entityId(player)}/stats`,
                            )
                          }
                        >
                          Stats
                        </Button>
                        {isTeamOwner ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/teams/${teamId}/players/${entityId(player)}/edit`,
                              )
                            }
                          >
                            Edit
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            />
          </Card>
        ) : (
          <div className="app-panel p-12 text-center app-gridlines">
            <p className="text-app-text-secondary mb-4">
              No players added yet. Start with a custom profile or import real database players.
            </p>
            <div className="flex items-center justify-center gap-2">
              {isTeamOwner && (
                <Button variant="secondary" onClick={openImporter}>
                  AI Squad Importer
                </Button>
              )}
              <Button variant="primary" onClick={openAddPlayerModal}>
                Add Your First Player
              </Button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
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
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </WorkstationPage>

      {/* Add Player Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Player"
        size="2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={isCreating}
              onClick={handleSubmit}
            >
              Add Player
            </Button>
          </>
        }
      >
        <form className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Player source (Custom vs Real) */}
          <div className="space-y-3 border-b border-app-border pb-4">
            <h3 className="text-sm font-semibold text-app-text">
              Player source
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={playerSource === "custom" ? "primary" : "secondary"}
                size="sm"
                type="button"
                onClick={() => setPlayerSource("custom")}
              >
                Custom player
              </Button>
              <Button
                variant={playerSource === "real" ? "primary" : "secondary"}
                size="sm"
                type="button"
                onClick={() => setPlayerSource("real")}
              >
                Real database player
              </Button>
            </div>

            {playerSource === "real" && (
              <div className="space-y-3">
                <Input
                  label="Search real players (EAFC26 CSV)"
                  name="realQuery"
                  placeholder="e.g. Salah, Mbappé, Rodri"
                  value={realQuery}
                  onChange={(e) => setRealQuery(e.target.value)}
                  helpText="Pick one result to autofill the form. You can still edit before saving."
                />

                {isSearchingReal ? (
                  <div className="text-xs text-app-text-muted">
                    Searching…
                  </div>
                ) : realResults.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-app-border bg-app-elevated-light/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    {realResults.map((p) => {
                      const isSelected = selectedRealId != null && p.realId === selectedRealId;
                      return (
                        <button
                          key={p.realId}
                          type="button"
                          onClick={() => applyRealPlayerToForm(p)}
                          className={`w-full text-left px-3 py-2 border-b border-app-border/40 last:border-b-0 transition-colors ${
                            isSelected ? "bg-app-elevated-light" : "hover:bg-app-elevated-light/60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-app-text truncate">
                                {p.name}
                              </div>
                              <div className="text-xs text-app-text-secondary truncate">
                                {p.nationality} · {p.position} · Age {p.age}
                              </div>
                            </div>
                            <div className="shrink-0">
                              <Badge tone="subtle">{p.overallRating} OVR</Badge>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : realSearchError ? (
                  <div className="text-xs text-red-400 font-medium bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                    {realSearchError}
                  </div>
                ) : (
                  <div className="text-xs text-app-text-muted">
                    Type a name to search.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-app-text">
              Basic Information
            </h3>

            <Input
              label="Full Name"
              name="name"
              placeholder="Cristiano Ronaldo"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                error={errors.dateOfBirth}
              />

              <Input
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                error={errors.age}
                disabled
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Position"
                name="position"
                options={POSITION_GROUPS}
                grouped={true}
                value={formData.position}
                onChange={handleChange}
                error={errors.position}
              />

              <Input
                label="Nationality"
                name="nationality"
                placeholder="Portugal"
                value={formData.nationality}
                onChange={handleChange}
                error={errors.nationality}
              />
            </div>
          </div>

          {/* Ratings */}
          <div className="space-y-4 border-t border-app-border pt-4">
            <h3 className="text-sm font-semibold text-app-text">Ratings</h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Overall Rating"
                name="overallRating"
                type="number"
                min="0"
                max="99"
                placeholder="85"
                value={formData.overallRating}
                onChange={handleChange}
                error={errors.overallRating}
              />

              <Input
                label="Potential Rating"
                name="potentialRating"
                type="number"
                min="0"
                max="99"
                placeholder="90"
                value={formData.potentialRating}
                onChange={handleChange}
                error={errors.potentialRating}
              />
            </div>
          </div>

          {/* Attributes */}
          <div className="space-y-4 border-t border-app-border pt-4">
            <h3 className="text-sm font-semibold text-app-text">Attributes</h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Pace"
                name="pace"
                type="number"
                min="0"
                max="99"
                placeholder="92"
                value={formData.pace}
                onChange={handleChange}
              />

              <Input
                label="Shooting"
                name="shooting"
                type="number"
                min="0"
                max="99"
                placeholder="93"
                value={formData.shooting}
                onChange={handleChange}
              />

              <Input
                label="Passing"
                name="passing"
                type="number"
                min="0"
                max="99"
                placeholder="82"
                value={formData.passing}
                onChange={handleChange}
              />

              <Input
                label="Dribbling"
                name="dribbling"
                type="number"
                min="0"
                max="99"
                placeholder="87"
                value={formData.dribbling}
                onChange={handleChange}
              />

              <Input
                label="Defense"
                name="defense"
                type="number"
                min="0"
                max="99"
                placeholder="35"
                value={formData.defense}
                onChange={handleChange}
              />

              <Input
                label="Physical"
                name="physical"
                type="number"
                min="0"
                max="99"
                placeholder="78"
                value={formData.physical}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4 border-t border-app-border pt-4">
            <h3 className="text-sm font-semibold text-app-text">Additional</h3>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Preferred Foot"
                name="preferredFoot"
                options={PREFERRED_FEET}
                value={formData.preferredFoot}
                onChange={handleChange}
              />

              <Input
                label="Jersey Number"
                name="jerseyNumber"
                type="number"
                min="1"
                max="99"
                placeholder="7"
                value={formData.jerseyNumber}
                onChange={handleChange}
              />
            </div>

            <Select
              label="Status"
              name="status"
              options={PLAYER_STATUS}
              value={formData.status}
              onChange={handleChange}
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showImporter}
        onClose={() => setShowImporter(false)}
        title="AI Squad Importer"
        size="2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowImporter(false)}>
              Close
            </Button>
            <Button
              variant="secondary"
              isLoading={isDecodingImport}
              disabled={!importPayload || isImportingPlayers}
              onClick={runImporterDecode}
            >
              Scan lineup
            </Button>
            <Button
              variant="primary"
              isLoading={isImportingPlayers}
              disabled={importedRows.length === 0 || isDecodingImport}
              onClick={confirmImporter}
            >
              Confirm & Import
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Upload or paste a Starting XI + Bench screenshot. The scanner extracts players and
            positions, then you can edit before import.
          </p>
          <input
            ref={importerFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={onImporterFileChange}
          />
          <div
            ref={importerPasteRef}
            tabIndex={0}
            role="textbox"
            aria-label="Paste lineup screenshot"
            onPaste={onImporterPaste}
            className="rounded-lg border border-white/10 bg-zinc-900 p-4 min-h-[170px] outline-none focus:ring-2 focus:ring-zinc-300 flex flex-col items-center justify-center gap-2 text-center cursor-text"
          >
            {importPreview ? (
              <img
                src={importPreview}
                alt="Lineup preview"
                className="max-h-52 max-w-full rounded border border-white/10 object-contain"
              />
            ) : (
              <>
                <span className="text-xs text-zinc-300">
                  Click here and press Ctrl+V to paste screenshot
                </span>
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 underline"
                  onClick={() => importerFileRef.current?.click()}
                >
                  or choose image file
                </button>
              </>
            )}
          </div>

          <div className="rounded-md border border-white/10 bg-zinc-900 px-3 py-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              Scanning status
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isDecodingImport
                    ? "w-2/3 bg-amber-500 animate-pulse"
                    : importedRows.length > 0
                      ? "w-full bg-emerald-500"
                      : "w-1/5 bg-zinc-600"
                }`}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-400 tabular-nums">
              {isImportingPlayers
                ? `Importing ${importProgress.done}/${importProgress.total}`
                : isDecodingImport
                  ? "Running OCR and squad extraction..."
                  : importedRows.length > 0
                    ? `${importedRows.length} players extracted`
                    : "Awaiting image input"}
            </p>
          </div>

          {importedRows.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-zinc-900 overflow-hidden">
              <div className="grid grid-cols-[1.6fr_90px_90px_90px] bg-zinc-900 border-b border-white/10">
                <div className="h-9 px-3 flex items-center text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                  Player
                </div>
                <div className="h-9 px-2 flex items-center justify-center text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                  Pos
                </div>
                <div className="h-9 px-2 flex items-center justify-center text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                  OVR
                </div>
                <div className="h-9 px-2 flex items-center justify-center text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                  Age
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/10">
                {importedRows.map((row) => (
                  <div
                    key={row.rowId}
                    className="grid grid-cols-[1.6fr_90px_90px_90px] items-center px-2 py-2 gap-2"
                  >
                    <Input
                      name={`name-${row.rowId}`}
                      value={row.name}
                      onChange={(e) => updateImportedRow(row.rowId, "name", e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Select
                      name={`position-${row.rowId}`}
                      options={POSITION_GROUPS}
                      grouped
                      value={row.position}
                      onChange={(e) =>
                        updateImportedRow(row.rowId, "position", e.target.value)
                      }
                      className="h-8 text-xs"
                      containerClassName="gap-0"
                    />
                    <Input
                      name={`ovr-${row.rowId}`}
                      type="number"
                      min="0"
                      max="99"
                      value={row.overallRating}
                      onChange={(e) =>
                        updateImportedRow(row.rowId, "overallRating", e.target.value)
                      }
                      className="h-8 text-xs tabular-nums"
                    />
                    <Input
                      name={`age-${row.rowId}`}
                      type="number"
                      min="16"
                      max="45"
                      value={row.age}
                      onChange={(e) => updateImportedRow(row.rowId, "age", e.target.value)}
                      className="h-8 text-xs tabular-nums"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
}
