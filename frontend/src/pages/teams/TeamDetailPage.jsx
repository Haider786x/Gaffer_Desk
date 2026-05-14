import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../components/layout/Layout";
import { Button } from "../../components/shared/Button";
import { Modal } from "../../components/shared/Modal";
import { Card } from "../../components/shared/Card.jsx";
import { Badge } from "../../components/shared/Badge.jsx";
import { DataTable } from "../../components/shared/DataTable.jsx";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useTeamContext } from "../../context/TeamContext.jsx";
import { TeamAiChatSection } from "../../components/features/TeamAiChatSection.jsx";
import { deleteTeam, getTeamById } from "../../services/teams";
import { publicUploadUrl } from "../../utils/uploads.js";
import { entityId } from "../../utils/ids.js";
import { layoutPlayersOnPitch, selectStartingXI } from "../../utils/formationPitch.js";

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const { setPrimaryTeamId } = useTeamContext();
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteTeam, setShowDeleteTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  const fetchTeam = useCallback(async () => {
    if (!teamId || !MONGO_ID_RE.test(teamId)) {
      setIsLoading(false);
      showError("Invalid team link");
      navigate("/teams");
      return;
    }
    setIsLoading(true);
    try {
      const response = await getTeamById(teamId);
      const loadedTeam = response.data ?? response.team ?? null;
      setTeam(loadedTeam);
      if (loadedTeam) {
        setPrimaryTeamId(loadedTeam._id);
      }
    } catch (err) {
      showError(err.message || "Failed to load team");
      navigate("/teams");
    } finally {
      setIsLoading(false);
    }
  }, [teamId, showError, navigate]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const ownerRef = team?.ownerId ?? team?.owner?._id ?? team?.owner;
  const isOwner =
    team && user && ownerRef != null && String(ownerRef) === String(user.id);

  const startingXI = useMemo(() => {
    return selectStartingXI(team?.players || [], team?.formation);
  }, [team?.players, team?.formation]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!team) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-app-text-secondary mb-4">Team not found</p>
          <Button onClick={() => navigate("/teams")}>Back to Teams</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4 min-w-0">
          <div className="app-panel p-4 sm:p-5 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(560px_240px_at_80%_-5%,rgba(113,113,122,0.2),transparent_62%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                {team.logoUrl ? (
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg border border-app-border bg-app-elevated-light shrink-0 overflow-hidden">
                    <img
                      src={publicUploadUrl(team.logoUrl)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                    Club headquarters
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-app-text mt-1">
                    {team.name}
                  </h1>
                  <p className="text-app-text-secondary mt-2">
                    {team.city}, {team.country}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="subtle">{team.formation}</Badge>
                    {team.league ? <Badge tone="success">{team.league}</Badge> : null}
                    <Badge tone="subtle">
                      Squad {team.players?.length || 0}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="secondary" onClick={() => navigate("/teams")}>
                  Back
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/teams/${teamId}/season-stats`)}
                >
                  Club season stats
                </Button>
                {isOwner && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/teams/${teamId}/edit`)}
                    >
                      Edit Team
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteTeam(true)}
                    >
                      Delete Team
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <InfoCard label="Formation" value={team.formation} />
            <InfoCard
              label="Squad Size"
              value={`${team.players?.length || 0} players`}
            />
            {team.league && <InfoCard label="League" value={team.league} />}
            {team.foundedYear && (
              <InfoCard label="Founded" value={team.foundedYear} />
            )}
          </div>

          <Card title="Tactical pitch" subtitle="Formation map and current squad structure.">
            <FormationPitch
              players={startingXI}
              formation={team?.formation}
            />
          </Card>

          {team.description && (
            <Card title="Club narrative">
              <p className="text-app-text-secondary">{team.description}</p>
            </Card>
          )}

          <div>
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <h2 className="text-xl font-semibold text-app-text">Scouting table</h2>
              {isOwner && (
                <div className="flex flex-wrap gap-2">
                  {team.players?.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      title="Opens player season stats + AI import (individual career)"
                      onClick={() =>
                        navigate(
                          `/teams/${teamId}/players/${entityId(team.players[0])}/stats?import=1`,
                        )
                      }
                    >
                      Player stats (screenshot)
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/teams/${teamId}/players`)}
                  >
                    + Add Player
                  </Button>
                </div>
              )}
            </div>

            {team.players && team.players.length > 0 ? (
              <DataTable
                dense
                headers={[
                  { label: "Player" },
                  { label: "Pos" },
                  { label: "Age" },
                  { label: "OVR" },
                  { label: "Trend" },
                  { label: "Market value" },
                  { label: "Status" },
                  { label: "Actions" },
                ]}
                rows={team.players.map((player) => {
                  const diff =
                    Number(player.potentialRating || 0) - Number(player.overallRating || 0);
                  const trend = diff > 0 ? "up" : diff === 0 ? "flat" : "down";
                  const trendText = trend === "up" ? "↑" : trend === "flat" ? "→" : "↓";
                  const trendTone =
                    trend === "up"
                      ? "text-emerald-300"
                      : trend === "flat"
                        ? "text-zinc-300"
                        : "text-red-300";
                  const status = String(player.status || "Active");
                  const statusDotClass =
                    status === "Active"
                      ? "bg-emerald-500"
                      : status === "Injured"
                        ? "bg-red-500"
                        : status === "Bench"
                          ? "bg-amber-500"
                          : "bg-sky-500";

                  return (
                    <tr
                      key={entityId(player)}
                      className="border-b border-app-border hover:bg-app-elevated-light/70 transition-colors"
                    >
                      <td className="px-3 py-2 text-sm text-app-text font-medium">
                        {player.name}
                      </td>
                      <td className="px-3 py-2 text-sm text-app-text-secondary">
                        {player.position}
                      </td>
                      <td className="px-3 py-2 text-sm text-app-text-secondary">
                        {player.age}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-app-text">
                        {player.overallRating}
                      </td>
                      <td className={`px-3 py-2 text-sm font-semibold ${trendTone}`}>
                        {trendText}
                      </td>
                      <td className="px-3 py-2 text-sm text-app-text-secondary">
                        {formatMarketValue(player.marketValue)}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span className="inline-flex items-center gap-2 text-app-text-secondary">
                          <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm">
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
                          {isOwner && (
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
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              />
            ) : (
              <div className="app-panel p-8 text-center app-gridlines">
                <p className="text-app-text-secondary mb-4">
                  No players yet in this tactical unit.
                </p>
                {isOwner && (
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/teams/${teamId}/players`)}
                  >
                    Add Your First Player
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-3 xl:sticky xl:top-4 self-start">
          <Card title="Tactical alerts" subtitle="Live operations notes">
            <ul className="space-y-2 text-xs text-app-text-secondary">
              {buildTacticalAlerts(team.players || []).map((alert) => (
                <li
                  key={alert}
                  className="rounded-md border border-app-border bg-app-elevated-light/30 px-3 py-2"
                >
                  {alert}
                </li>
              ))}
            </ul>
          </Card>
          <TeamAiChatSection
            teamId={teamId}
            playerCount={team.players?.length ?? 0}
            isOwner={isOwner}
          />
        </aside>

        <Modal
          isOpen={showDeleteTeam}
          onClose={() => setShowDeleteTeam(false)}
          title="Delete this team?"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowDeleteTeam(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                isLoading={isDeletingTeam}
                onClick={async () => {
                  setIsDeletingTeam(true);
                  try {
                    await deleteTeam(teamId);
                    showSuccess("Team deleted");
                    setShowDeleteTeam(false);
                    navigate("/teams");
                  } catch (err) {
                    showError(err.message || "Could not delete team");
                  } finally {
                    setIsDeletingTeam(false);
                  }
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-app-text-secondary">
            This removes the team from your account. You will not be able to manage
            this roster from Gaffer Desk afterward.
          </p>
        </Modal>
      </div>
    </Layout>
  );
}

const InfoCard = ({ label, value }) => (
  <Card padded={false} className="bg-app-elevated-light/30">
    <div className="px-3.5 py-3.5">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-1">{label}</p>
      <p className="text-lg font-semibold tracking-tight tabular-nums text-app-text">{value}</p>
    </div>
  </Card>
);

function FormationPitch({ players, formation }) {
  const assigned = layoutPlayersOnPitch(players, formation);

  return (
    <div className="rounded-lg border border-emerald-900/40 bg-[linear-gradient(180deg,#0c1a14,#0a1712)] p-3">
      <div className="relative rounded-md border border-emerald-900/40 p-3 min-h-[340px] app-gridlines overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-emerald-100/10 -translate-x-1/2" />
          <div className="absolute left-1/2 top-1/2 h-24 w-24 border border-emerald-100/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        {assigned.map(({ player, x, y }) => {
          const label = player?.name ? String(player.name).split(" ").slice(-1)[0] : "—";
          return (
            <div
              key={entityId(player) || `${player?.name}-${x}-${y}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 min-w-14 rounded-md border border-emerald-800/60 bg-emerald-950/45 px-2 py-1 text-center"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-300">
                {player?.position || "POS"}
              </div>
              <div className="text-[10px] text-emerald-100 truncate max-w-16">
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatMarketValue(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function buildTacticalAlerts(players) {
  const list = Array.isArray(players) ? players : [];
  const statusCounts = list.reduce(
    (acc, p) => {
      const status = String(p?.status || "Active");
      if (status === "Injured") acc.injured += 1;
      else if (status === "Bench") acc.bench += 1;
      else if (status === "Loaned") acc.loaned += 1;
      else acc.active += 1;
      return acc;
    },
    { active: 0, injured: 0, bench: 0, loaned: 0 },
  );
  const total = list.length || 1;
  const activeRatio = Math.round((statusCounts.active / total) * 100);
  return [
    `${statusCounts.injured} injured players currently reduce selection depth.`,
    `${statusCounts.bench} players marked as bench and ${statusCounts.loaned} on loan.`,
    `${activeRatio}% of squad is match-ready (Active status).`,
  ];
}
