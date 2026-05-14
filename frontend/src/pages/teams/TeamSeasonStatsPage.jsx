import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../../components/layout/Layout.jsx";
import { Button } from "../../components/shared/Button.jsx";
import { Input } from "../../components/shared/Input.jsx";
import { Modal } from "../../components/shared/Modal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getTeamById } from "../../services/teams.js";
import {
  addTeamSeasonStat,
  deleteTeamSeasonStat,
  getTeamSeasonSummary,
  listTeamSeasonStats,
  updateTeamSeasonStat,
} from "../../services/teamSeasonStats.js";
import { decodeCareerStatsFromScreenshot } from "../../services/ai.js";
import { entityId } from "../../utils/ids.js";
import { Card } from "../../components/shared/Card.jsx";
import { Badge } from "../../components/shared/Badge.jsx";
import { SectionHeader } from "../../components/shared/SectionHeader.jsx";
import { LineChart } from "../../components/shared/charts/LineChart.jsx";
import { DataTable } from "../../components/shared/DataTable.jsx";
import { WorkstationPage } from "../../components/layout/WorkstationPage.jsx";

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

function defaultSeasonLabel() {
  const y = new Date().getFullYear();
  return `${y}/${String(y + 1).slice(-2)}`;
}

function emptyTeamForm() {
  return {
    season: defaultSeasonLabel(),
    matchesPlayed: "0",
    wins: "0",
    draws: "0",
    losses: "0",
    goalsFor: "0",
    goalsAgainst: "0",
    cleanSheets: "0",
    points: "0",
    seasonBudget: "0",
    seasonSpending: "0",
    seasonProfit: "0",
    recentForm: "",
    league: "",
  };
}

function rowToForm(row) {
  return {
    season: row.season ?? "",
    matchesPlayed: String(row.matchesPlayed ?? 0),
    wins: String(row.wins ?? 0),
    draws: String(row.draws ?? 0),
    losses: String(row.losses ?? 0),
    goalsFor: String(row.goalsFor ?? 0),
    goalsAgainst: String(row.goalsAgainst ?? 0),
    cleanSheets: String(row.cleanSheets ?? 0),
    points: String(row.points ?? 0),
    seasonBudget: String(row.seasonBudget ?? 0),
    seasonSpending: String(row.seasonSpending ?? 0),
    seasonProfit: String(row.seasonProfit ?? 0),
    recentForm: row.recentForm || "",
    league: row.league || "",
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

export default function TeamSeasonStatsPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [teamName, setTeamName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(() => emptyTeamForm());
  const [isSavingAdd, setIsSavingAdd] = useState(false);

  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState(() => emptyTeamForm());
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deleteRow, setDeleteRow] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importPayload, setImportPayload] = useState(null);
  const [importSeasonHint, setImportSeasonHint] = useState("");
  const [decodedImport, setDecodedImport] = useState([]);
  const [importPickIdx, setImportPickIdx] = useState(0);
  const [isDecoding, setIsDecoding] = useState(false);
  const importFileRef = useRef(null);
  const importPasteRef = useRef(null);

  const loadCore = useCallback(async () => {
    if (!teamId || !MONGO_ID_RE.test(teamId)) {
      showError("Invalid team link");
      navigate("/teams");
      return null;
    }
    const tres = await getTeamById(teamId);
    const team = tres.data ?? tres.team ?? null;
    if (!team) {
      showError("Team not found");
      navigate("/teams");
      return null;
    }
    const ownerRef = team?.ownerId ?? team?.owner?._id ?? team?.owner;
    const owner =
      !!user &&
      ownerRef != null &&
      String(ownerRef) === String(user.id);
    return { teamName: team.name ?? "", isOwner: owner };
  }, [teamId, user, navigate, showError]);

  const refreshList = useCallback(async () => {
    const res = await listTeamSeasonStats(teamId, page, 10);
    setRows(res.data || []);
    setTotalPages(res.pagination?.pages ?? res.pagination?.totalPages ?? 1);
  }, [teamId, page]);

  const refreshSummary = useCallback(async () => {
    const res = await getTeamSeasonSummary(teamId);
    setSummary(res.data ?? null);
  }, [teamId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const core = await loadCore();
        if (cancelled || !core) return;
        setTeamName(core.teamName);
        setIsOwner(core.isOwner);
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
    if (!teamId || isLoading) return;
    let c = false;
    getTeamSeasonSummary(teamId)
      .then((r) => {
        if (!c) setSummary(r.data ?? null);
      })
      .catch((e) => {
        if (!c) showError(e.message || "Failed to load summary");
      });
    return () => {
      c = true;
    };
  }, [teamId, isLoading, showError]);

  useEffect(() => {
    if (!teamId || isLoading) return;
    let c = false;
    listTeamSeasonStats(teamId, page, 10)
      .then((r) => {
        if (!c) {
          setRows(r.data || []);
          setTotalPages(r.pagination?.pages ?? r.pagination?.totalPages ?? 1);
        }
      })
      .catch((e) => {
        if (!c) showError(e.message || "Failed to load seasons");
      });
    return () => {
      c = true;
    };
  }, [teamId, page, isLoading, showError]);

  const openImportModal = useCallback(() => {
    setShowImport(true);
    setImportPreview(null);
    setImportPayload(null);
    setDecodedImport([]);
    setImportPickIdx(0);
    setImportSeasonHint("");
    if (importFileRef.current) importFileRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!teamName || !isOwner) return;
    if (searchParams.get("import") !== "1") return;
    openImportModal();
    setSearchParams({}, { replace: true });
  }, [teamName, isOwner, searchParams, openImportModal, setSearchParams]);

  useEffect(() => {
    if (!showImport) return;
    const id = requestAnimationFrame(() => importPasteRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [showImport]);

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Please choose an image file");
      return;
    }
    try {
      const data = await readImageFileAsBase64(file);
      setImportPreview(data.preview);
      setImportPayload({ mimeType: data.mimeType, base64: data.base64 });
      setDecodedImport([]);
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
        } catch (err) {
          showError(err.message || "Could not read pasted image");
        }
        return;
      }
    }
  };

  const runDecodeScreenshot = async () => {
    if (!importPayload?.base64) {
      showError("Paste a screenshot or choose a file first");
      return;
    }
    const hint = importSeasonHint.trim();
    setIsDecoding(true);
    try {
      const res = await decodeCareerStatsFromScreenshot({
        imageBase64: importPayload.base64,
        mimeType: importPayload.mimeType,
        defaultSeason: /^\d{4}\/\d{2}$/.test(hint) ? hint : undefined,
        scope: "team",
      });
      const list = Array.isArray(res.seasons) ? res.seasons : [];
      setDecodedImport(list);
      setImportPickIdx(0);
      if (list.length === 0) {
        showError(res.message || "No rows found — use a club / league screen");
      } else {
        showSuccess(`Decoded ${list.length} row(s)`);
      }
    } catch (err) {
      showError(err.message || "Decode failed");
    } finally {
      setIsDecoding(false);
    }
  };

  const applyDecodedToAdd = () => {
    const row = decodedImport[importPickIdx];
    if (!row || row.season == null) {
      showError("Decode first, then pick a row");
      return;
    }
    setAddForm(rowToForm(row));
    setShowImport(false);
    setShowAdd(true);
    showSuccess("Review numbers, then save");
  };

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
      await addTeamSeasonStat(teamId, addForm);
      showSuccess("Season saved");
      setShowAdd(false);
      setAddForm(emptyTeamForm());
      await Promise.all([refreshSummary(), refreshList()]);
    } catch (err) {
      showError(err.message || "Could not save");
    } finally {
      setIsSavingAdd(false);
    }
  };

  const submitEdit = async () => {
    if (!editRow) return;
    const id = entityId(editRow);
    setIsSavingEdit(true);
    try {
      await updateTeamSeasonStat(teamId, id, editForm);
      showSuccess("Updated");
      setEditRow(null);
      await Promise.all([refreshSummary(), refreshList()]);
    } catch (err) {
      showError(err.message || "Update failed");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    const id = entityId(deleteRow);
    setIsDeleting(true);
    try {
      await deleteTeamSeasonStat(teamId, id);
      showSuccess("Removed");
      setDeleteRow(null);
      await Promise.all([refreshSummary(), refreshList()]);
    } catch (err) {
      showError(err.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const t = summary?.totals;

  const bestSeason = (() => {
    const valid = (rows || [])
      .map((r) => ({ season: r.season, points: Number(r.points) || 0 }))
      .filter((r) => r.season);
    if (valid.length === 0) return null;
    valid.sort((a, b) => b.points - a.points);
    return valid[0];
  })();

  const pointsTooltip = (cur, prev, idx) => {
    const season = cur?.season ?? `S${idx + 1}`;
    const curVal = Number(cur?.points) || 0;
    const prevVal = prev ? Number(prev.points) : null;
    const delta =
      prevVal == null || Number.isNaN(prevVal) ? null : curVal - prevVal;
    const sign = delta != null ? (delta > 0 ? "+" : "") : "";
    return (
      <div className="space-y-0.5">
        <div className="text-xs font-semibold text-app-text">{season}</div>
        <div className="text-xs text-app-text-muted">
          Points: {curVal}
          {delta != null && (
            <span
              className={`ml-2 font-medium ${
                delta >= 0 ? "text-emerald-200" : "text-red-300"
              }`}
            >
              ({sign}
              {delta})
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <WorkstationPage>
        <SectionHeader
          eyebrow="Club"
          title="Season record"
          description="League / club totals (W–D–L, GF/GA, points). Open a player to see their goals, assists, MOTM and more."
          actions={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/teams/${teamId}`)}
              >
                Back to team
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

        {t && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-sm">
            <StatChip label="MP" value={t.matchesPlayed ?? 0} />
            <StatChip label="W" value={t.wins ?? 0} />
            <StatChip label="D" value={t.draws ?? 0} />
            <StatChip label="L" value={t.losses ?? 0} />
            <StatChip label="GF" value={t.goalsFor ?? 0} />
            <StatChip label="GA" value={t.goalsAgainst ?? 0} />
            <StatChip label="CS" value={t.cleanSheets ?? 0} />
            <StatChip label="Pts" value={t.points ?? 0} />
            <StatChip label="Budget" value={t.seasonBudget ?? 0} money />
            <StatChip label="Spend" value={t.seasonSpending ?? 0} money />
            <StatChip label="Profit" value={t.seasonProfit ?? 0} money signed />
          </div>
        )}

        {rows.length > 0 && (
          <Card
            title="Points over time"
            subtitle={
              bestSeason?.season
                ? `Top season: ${bestSeason.season} (${bestSeason.points} pts)`
                : undefined
            }
            actions={
              bestSeason?.season ? (
                <Badge tone="success">
                  Best: {bestSeason.season}
                </Badge>
              ) : null
            }
          >
            <div className="bg-app-elevated-light/40 border border-app-border rounded-lg p-3">
              <LineChart
                width={640}
                height={190}
                data={rows}
                xKey="season"
                yKey="points"
                color="#34d399"
                tooltipFormatter={pointsTooltip}
              />
            </div>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-semibold text-app-text mb-3">
            Recorded seasons
          </h2>
          {rows.length === 0 ? (
            <div className="app-panel p-8 text-center text-app-text-secondary app-gridlines">
              No club season rows yet.
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
                { label: "W" },
                { label: "D" },
                { label: "L" },
                { label: "GF" },
                { label: "GA" },
                { label: "CS" },
                { label: "Pts" },
                { label: "Budget" },
                { label: "Spend" },
                { label: "Profit" },
                ...(isOwner ? [{ label: "Actions" }] : []),
              ]}
              rows={rows.map((row) => (
                <tr
                  key={entityId(row) || row.season}
                  className="border-b border-app-border hover:bg-app-elevated-light/70"
                >
                  <td className="px-3 py-3 text-sm font-medium text-app-text">
                    {row.season}
                  </td>
                  <td className="px-3 py-3 text-sm">{row.matchesPlayed}</td>
                  <td className="px-3 py-3 text-sm">{row.wins}</td>
                  <td className="px-3 py-3 text-sm">{row.draws}</td>
                  <td className="px-3 py-3 text-sm">{row.losses}</td>
                  <td className="px-3 py-3 text-sm">{row.goalsFor}</td>
                  <td className="px-3 py-3 text-sm">{row.goalsAgainst}</td>
                  <td className="px-3 py-3 text-sm">{row.cleanSheets}</td>
                  <td className="px-3 py-3 text-sm">{row.points}</td>
                  <td className="px-3 py-3 text-sm tabular-nums">
                    {formatMoney(row.seasonBudget)}
                  </td>
                  <td className="px-3 py-3 text-sm tabular-nums">
                    {formatMoney(row.seasonSpending)}
                  </td>
                  <td className="px-3 py-3 text-sm tabular-nums">
                    <span
                      className={
                        Number(row.seasonProfit) >= 0 ? "text-emerald-500" : "text-red-500"
                      }
                    >
                      {formatMoney(row.seasonProfit, true)}
                    </span>
                  </td>
                  {isOwner && (
                    <td className="px-3 py-3 text-sm">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditRow(row);
                            setEditForm(rowToForm(row));
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
      </WorkstationPage>

      <Modal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="Import club / league screenshot"
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
              onClick={applyDecodedToAdd}
            >
              Use for “Add season”
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-app-text-secondary">
          <p>
            Paste a <strong className="text-app-text">club or league table</strong>{" "}
            capture (standings, team record). For a single player’s screen, use{" "}
            <strong className="text-app-text">Squad → Stats → From screenshot</strong>.
          </p>
          <input
            ref={importFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleImportFile}
          />
          <Input
            label="Default season if missing on screen (YYYY/YY)"
            name="importSeasonHint"
            placeholder="2025/26"
            value={importSeasonHint}
            onChange={(e) => setImportSeasonHint(e.target.value)}
          />
          <div
            ref={importPasteRef}
            tabIndex={0}
            role="textbox"
            aria-label="Paste screenshot"
            onPaste={handleImportPaste}
            className="rounded-xl border-2 border-dashed border-app-border bg-app-elevated-light/30 p-4 min-h-[190px] outline-none focus:ring-2 focus:ring-app-text flex flex-col items-center justify-center gap-2 text-center cursor-text relative overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(360px_140px_at_50%_0%,rgba(113,113,122,0.22),transparent_62%)]" />
            {importPreview ? (
              <img
                src={importPreview}
                alt=""
                className="max-h-48 max-w-full rounded-md border border-app-border object-contain relative z-10"
              />
            ) : (
              <span className="relative z-10">Click here, then Ctrl+V to paste</span>
            )}
          </div>
          <p className="text-xs">
            Or{" "}
            <button
              type="button"
              className="text-app-text underline"
              onClick={() => importFileRef.current?.click()}
            >
              choose image file
            </button>
          </p>
          {decodedImport.length > 0 && (
            <select
              className="w-full px-3 py-2 rounded-lg bg-app-elevated border border-app-border text-app-text text-sm"
              value={importPickIdx}
              onChange={(e) => setImportPickIdx(Number(e.target.value))}
            >
              {decodedImport.map((row, idx) => (
                <option key={`${row.season}-${idx}`} value={idx}>
                  {row.season} — MP {row.matchesPlayed} W{row.wins} GF{row.goalsFor} {row.recentForm ? `(Form: ${row.recentForm})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add club season"
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
        <TeamStatFields form={addForm} onChange={handleAddChange} />
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
        <p className="text-sm text-app-text-secondary mb-3">
          Season label is fixed. Delete and re-add if the year label was wrong.
        </p>
        <TeamStatFields form={editForm} onChange={handleEditChange} seasonDisabled />
      </Modal>

      <Modal
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        title="Delete this season row?"
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
        <p className="text-app-text-secondary">Remove {deleteRow?.season}?</p>
      </Modal>
    </Layout>
  );
}

function StatChip({ label, value, money = false, signed = false }) {
  const renderValue = () => {
    if (money) return formatMoney(value, signed);
    if (typeof value === "string") return value;
    return value ?? 0;
  };
  return (
    <div className="bg-app-elevated-light/35 rounded-lg border border-app-border p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-app-text-muted font-medium mb-1">
        {label}
      </p>
      <p className="text-lg font-semibold tracking-tight tabular-nums text-app-text">
        {renderValue()}
      </p>
    </div>
  );
}

function formatMoney(value, withSign = false) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const f = new Intl.NumberFormat("en", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(abs);
  if (!withSign) return f;
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${f}`;
}

function TeamStatFields({ form, onChange, seasonDisabled }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input
        label="Season (YYYY/YY)"
        name="season"
        value={form.season}
        onChange={onChange}
        disabled={seasonDisabled}
      />
      <Input label="MP" name="matchesPlayed" type="number" min="0" value={form.matchesPlayed} onChange={onChange} />
      <Input label="W" name="wins" type="number" min="0" value={form.wins} onChange={onChange} />
      <Input label="D" name="draws" type="number" min="0" value={form.draws} onChange={onChange} />
      <Input label="L" name="losses" type="number" min="0" value={form.losses} onChange={onChange} />
      <Input label="GF" name="goalsFor" type="number" min="0" value={form.goalsFor} onChange={onChange} />
      <Input label="GA" name="goalsAgainst" type="number" min="0" value={form.goalsAgainst} onChange={onChange} />
      <Input label="CS" name="cleanSheets" type="number" min="0" value={form.cleanSheets} onChange={onChange} />
      <Input label="Pts" name="points" type="number" min="0" value={form.points} onChange={onChange} />
      <Input
        label="Budget (EUR)"
        name="seasonBudget"
        type="number"
        min="0"
        value={form.seasonBudget}
        onChange={onChange}
      />
      <Input
        label="Spending (EUR)"
        name="seasonSpending"
        type="number"
        min="0"
        value={form.seasonSpending}
        onChange={onChange}
      />
      <Input
        label="Profit (EUR)"
        name="seasonProfit"
        type="number"
        value={form.seasonProfit}
        onChange={onChange}
      />
      <Input label="League Name" name="league" value={form.league} onChange={onChange} />
      <Input label="Recent Form (e.g. W-D-L)" name="recentForm" value={form.recentForm} onChange={onChange} />
    </div>
  );
}
