import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/layout/Layout.jsx";
import { Button } from "../../components/shared/Button.jsx";
import { Card } from "../../components/shared/Card.jsx";
import { SectionHeader } from "../../components/shared/SectionHeader.jsx";
import { Avatar } from "../../components/shared/Avatar.jsx";
import { Badge } from "../../components/shared/Badge.jsx";
import { WorkstationPage } from "../../components/layout/WorkstationPage.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getUserTeams } from "../../services/users.js";
import { listTeamSeasonStats } from "../../services/teamSeasonStats.js";
import { analyzeSquad } from "../../services/ai.js";
import { entityId } from "../../utils/ids.js";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: showError } = useToast();
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    teamCount: 0,
    squadMembers: 0,
    avgTeamRating: 0,
    totalBudget: 0,
  });
  const [recentForm, setRecentForm] = useState([]);
  const [intelligenceNotes, setIntelligenceNotes] = useState([]);
  /** Lines from Gemini squad briefing — only after explicit user action */
  const [aiBriefingLines, setAiBriefingLines] = useState(null);
  const [aiBriefLoading, setAiBriefLoading] = useState(false);
  const briefAbortRef = useRef(null);
  const [tacticalKpis, setTacticalKpis] = useState([
    { title: "Chemistry", value: "0%", meta: "No squad data yet" },
    { title: "Morale", value: "Low", meta: "Create a team to unlock signals" },
    { title: "Injuries", value: "0", meta: "No active injuries tracked" },
    { title: "Youth ceiling", value: "—", meta: "No potential data available" },
  ]);

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getUserTeams(1, 50);
      const list = response.data || [];
      setTeams(list.slice(0, 5));

      const teamCount =
        response.pagination?.total ?? response.pagination?.count ?? list.length;

      let squadMembers = 0;
      let ratingSum = 0;
      let ratingTeams = 0;
      let totalBudget = 0;

      list.forEach((team) => {
        squadMembers += team.players?.length || 0;
        if (typeof team.avgOverallRating === "number") {
          ratingSum += team.avgOverallRating;
          ratingTeams += 1;
        }
        if (typeof team.budget === "number") totalBudget += team.budget;
      });

      setMetrics({
        teamCount,
        squadMembers,
        avgTeamRating:
          ratingTeams > 0 ? Math.round(ratingSum / ratingTeams) : 0,
        totalBudget,
      });

      const allPlayers = list.flatMap((team) => team.players || []);
      const statusCounts = allPlayers.reduce(
        (acc, player) => {
          const status = String(player?.status || "Active");
          if (status === "Injured") acc.injured += 1;
          else if (status === "Bench") acc.bench += 1;
          else if (status === "Loaned") acc.loaned += 1;
          else acc.active += 1;
          const potential = Number(player?.potentialRating);
          if (Number.isFinite(potential)) acc.maxPotential = Math.max(acc.maxPotential, potential);
          return acc;
        },
        { active: 0, injured: 0, bench: 0, loaned: 0, maxPotential: 0 },
      );
      const tracked = allPlayers.length || 1;
      const chemistry = Math.round((statusCounts.active / tracked) * 100);
      const morale = statusCounts.injured > 2 ? "Concern" : chemistry >= 70 ? "High" : "Stable";
      setTacticalKpis([
        { title: "Chemistry", value: `${chemistry}%`, meta: `${statusCounts.active}/${allPlayers.length || 0} active` },
        { title: "Morale", value: morale, meta: `${statusCounts.bench} on bench rotation` },
        { title: "Injuries", value: String(statusCounts.injured), meta: `${statusCounts.loaned} currently loaned` },
        {
          title: "Youth ceiling",
          value: statusCounts.maxPotential > 0 ? String(statusCounts.maxPotential) : "—",
          meta: `${allPlayers.length || 0} players analyzed`,
        },
      ]);

      const featuredTeam = list[0];
      if (featuredTeam?._id) {
        try {
          const seasonRes = await listTeamSeasonStats(featuredTeam._id, 1, 1);
          const season = seasonRes?.data?.[0];
          setRecentForm(buildRecentForm(season));
        } catch {
          setRecentForm([]);
        }

        setIntelligenceNotes(buildFallbackInsights(list, statusCounts));

        const cached = loadAiBriefingCache(featuredTeam._id);
        setAiBriefingLines(cached);
      } else {
        setRecentForm([]);
        setIntelligenceNotes(buildFallbackInsights(list, statusCounts));
        setAiBriefingLines(null);
      }
    } catch (err) {
      showError(err.message || "Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    return () => {
      briefAbortRef.current?.abort();
    };
  }, []);

  const featuredTeam = teams[0] ?? null;

  const runAiBriefing = useCallback(async () => {
    const id = featuredTeam?._id;
    if (!id || aiBriefLoading) return;
    briefAbortRef.current?.abort();
    const ac = new AbortController();
    briefAbortRef.current = ac;
    setAiBriefLoading(true);
    try {
      const res = await analyzeSquad(id, { signal: ac.signal });
      let lines = extractInsights(res);
      if (
        lines.length === 0 &&
        typeof res?.analysis === "string" &&
        res.analysis.trim()
      ) {
        lines = [res.analysis.trim().slice(0, 1200)];
      }
      if (lines.length === 0) {
        lines = ["Briefing completed but returned no usable text."];
      }
      setAiBriefingLines(lines);
      saveAiBriefingCache(id, lines);
    } catch (err) {
      if (err?.message === "Request cancelled") return;
      showError(err.message || "AI briefing failed");
    } finally {
      setAiBriefLoading(false);
    }
  }, [featuredTeam, aiBriefLoading, showError]);

  const briefingDisplay =
    Array.isArray(aiBriefingLines) && aiBriefingLines.length > 0
      ? aiBriefingLines
      : intelligenceNotes;

  return (
    <Layout>
      <WorkstationPage>
        <SectionHeader
          eyebrow="Operations HQ"
          title={`Welcome back, ${user?.username || "manager"}!`}
          description="Football intelligence command surface for squad control, performance trends, and tactical decision support."
          actions={
            <div className="flex flex-wrap gap-2 justify-end">
              {featuredTeam?._id ? (
                <Button
                  variant="secondary"
                  isLoading={aiBriefLoading}
                  disabled={aiBriefLoading}
                  onClick={() => void runAiBriefing()}
                >
                  Generate AI briefing
                </Button>
              ) : null}
              <Button variant="primary" onClick={() => navigate("/teams")}>
                View all teams
              </Button>
            </div>
          }
        />

        <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
          <div className="app-panel p-4 sm:p-5 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(620px_260px_at_70%_-10%,rgba(113,113,122,0.2),transparent_60%)]" />
            <div className="relative">
              <p className="app-panel-title">Club command center</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-app-text">
                    {featuredTeam?.name || "No active club selected"}
                  </h2>
                  <p className="text-sm text-app-text-secondary mt-1">
                    {featuredTeam
                      ? `${featuredTeam.city}, ${featuredTeam.country} · ${featuredTeam.formation}`
                      : "Create or open a team to unlock tactical and scouting panels."}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge tone="success">
                      {aiBriefingLines?.length > 0
                        ? "AI briefing loaded"
                        : "Heuristic squad snapshot"}
                    </Badge>
                    <Badge tone="subtle">
                      Tracked squads: {metrics.squadMembers}
                    </Badge>
                  </div>
                </div>
                {featuredTeam ? (
                  <Avatar
                    size="lg"
                    rounded="lg"
                    initials={featuredTeam.name}
                    src={featuredTeam.logoUrl}
                    className="border border-app-border bg-app-elevated-light"
                  />
                ) : null}
              </div>
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <MetricBlock label="Teams" value={metrics.teamCount} />
                <MetricBlock label="Squad size" value={metrics.squadMembers} />
                <MetricBlock label="Avg OVR" value={metrics.avgTeamRating || "—"} />
                <MetricBlock label="Budget" value={metrics.totalBudget || 0} />
              </div>
            </div>
          </div>

          <div className="app-panel p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="app-panel-title">Recent form signal</p>
              <Badge tone="warning">{featuredTeam ? featuredTeam.formation : "No active team"}</Badge>
            </div>
            <div className="mt-4 app-panel-muted p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-app-text-muted">
                Last five
              </p>
              <div className="mt-2 flex gap-2">
                {recentForm.length > 0 ? recentForm.map((r, idx) => (
                  <span
                    key={`${r}-${idx}`}
                    className={`h-8 w-8 rounded-md border text-xs font-semibold flex items-center justify-center ${
                      r === "W"
                        ? "bg-emerald-900/30 border-emerald-700/60 text-emerald-200"
                        : r === "D"
                          ? "bg-amber-900/30 border-amber-700/60 text-amber-200"
                          : "bg-red-900/30 border-red-700/60 text-red-200"
                    }`}
                  >
                    {r}
                  </span>
                )) : (
                  <span className="text-xs text-app-text-secondary">
                    No season data yet.
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {briefingDisplay.map((n, idx) => (
                <div
                  key={`${idx}-${n}`}
                  className="rounded-lg border border-app-border bg-app-elevated-light/30 px-3 py-2 text-xs text-app-text-secondary leading-relaxed"
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tacticalKpis.map((kpi) => (
            <TacticalKpi
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              meta={kpi.meta}
            />
          ))}
        </div>

        <Card
          title="Your active teams"
          subtitle="Direct access to club workspaces, scouting layers, and tactical panels."
          padded={false}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
            </div>
          ) : teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4 sm:p-5">
              {teams.map((team) => (
                <TeamCard
                  key={entityId(team)}
                  team={team}
                  onViewDetails={() => navigate(`/teams/${entityId(team)}`)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-app-text-secondary mb-4">
                You haven&apos;t created any teams yet.
              </p>
              <Button variant="primary" onClick={() => navigate("/teams")}>
                Create your first team
              </Button>
            </div>
          )}
        </Card>
      </WorkstationPage>
    </Layout>
  );
}

const TeamCard = ({ team, onViewDetails }) => (
  <button
    onClick={onViewDetails}
  className="bg-app-elevated-light/35 rounded-xl border border-app-border hover:border-zinc-500/80 hover:bg-app-elevated-light/80 transition-all text-left p-4"
  >
    <div className="flex items-start justify-between mb-3 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar
          size="sm"
          rounded="lg"
          initials={team.name}
          className="bg-app-elevated border-app-border/70"
          src={team.logoUrl}
        />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-app-text truncate">
            {team.name}
          </h3>
          <p className="text-xs text-app-text-secondary truncate">
            {team.city}, {team.country}
          </p>
        </div>
      </div>
      <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] tracking-[0.12em] uppercase font-semibold bg-app-elevated text-app-text-secondary border border-app-border">
        {team.formation}
      </span>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-app-text-muted">Squad size</span>
        <span className="text-app-text font-medium">
          {team.players?.length || 0}
        </span>
      </div>
      {team.league && (
        <div className="flex justify-between text-sm">
          <span className="text-app-text-muted">League</span>
          <span className="text-app-text font-medium">{team.league}</span>
        </div>
      )}
    </div>
  </button>
);

const MetricBlock = ({ label, value }) => (
  <div className="rounded-lg border border-app-border bg-app-elevated-light/35 px-3 py-2">
    <p className="text-[10px] uppercase tracking-[0.14em] text-app-text-muted">{label}</p>
    <p className="text-lg font-semibold tracking-tight mt-1 text-app-text">{value}</p>
  </div>
);

const TacticalKpi = ({ title, value, meta }) => (
  <div className="app-panel-muted p-3">
    <p className="text-[10px] uppercase tracking-[0.14em] text-app-text-muted">{title}</p>
    <p className="text-xl font-semibold tracking-tight text-app-text mt-1">{value}</p>
    <p className="text-[11px] text-app-text-secondary mt-1">{meta}</p>
  </div>
);

function buildRecentForm(season) {
  const wins = Math.max(0, Number(season?.wins) || 0);
  const draws = Math.max(0, Number(season?.draws) || 0);
  const losses = Math.max(0, Number(season?.losses) || 0);
  const form = [];
  for (let i = 0; i < wins && form.length < 5; i += 1) form.push("W");
  for (let i = 0; i < draws && form.length < 5; i += 1) form.push("D");
  for (let i = 0; i < losses && form.length < 5; i += 1) form.push("L");
  return form;
}

function extractInsights(payload) {
  const candidates = [];
  if (Array.isArray(payload?.insights)) candidates.push(...payload.insights);
  if (Array.isArray(payload?.recommendations)) candidates.push(...payload.recommendations);
  if (typeof payload?.analysis === "string") candidates.push(payload.analysis);
  if (typeof payload?.summary === "string") candidates.push(payload.summary);
  return candidates
    .flatMap((item) =>
      String(item || "")
        .split(/\n|(?<=[.!?])\s+/)
        .map((part) => part.trim()),
    )
    .filter(Boolean)
    .slice(0, 3);
}

function buildFallbackInsights(teams, statusCounts) {
  return [
    `${teams.length} active team${teams.length === 1 ? "" : "s"} synchronized from backend.`,
    `${statusCounts.injured} injured and ${statusCounts.loaned} loaned players across all squads.`,
    `Highest tracked potential currently peaks at ${statusCounts.maxPotential || "N/A"}.`,
  ];
}

const AI_BRIEF_CACHE_PREFIX = "gafferdesk_ai_brief_";
const AI_BRIEF_TTL_MS = 45 * 60 * 1000;

function loadAiBriefingCache(teamId) {
  try {
    const raw = sessionStorage.getItem(`${AI_BRIEF_CACHE_PREFIX}${teamId}`);
    if (!raw) return null;
    const { ts, lines } = JSON.parse(raw);
    if (!Array.isArray(lines) || Date.now() - Number(ts) > AI_BRIEF_TTL_MS) {
      return null;
    }
    return lines;
  } catch {
    return null;
  }
}

function saveAiBriefingCache(teamId, lines) {
  try {
    sessionStorage.setItem(
      `${AI_BRIEF_CACHE_PREFIX}${teamId}`,
      JSON.stringify({ ts: Date.now(), lines }),
    );
  } catch {
    /* ignore quota */
  }
}
