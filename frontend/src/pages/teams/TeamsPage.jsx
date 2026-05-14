import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/layout/Layout";
import { Button } from "../../components/shared/Button";
import { Input } from "../../components/shared/Input";
import { Modal } from "../../components/shared/Modal";
import { Select } from "../../components/shared/Select";
import { useToast } from "../../context/ToastContext";
import { createTeam } from "../../services/teams";
import { getUserTeams } from "../../services/users.js";
import { FORMATION_GROUPS, FOUNDED_YEAR_RANGE } from "../../utils/constants";
import { entityId } from "../../utils/ids.js";
import { Card } from "../../components/shared/Card.jsx";
import { SectionHeader } from "../../components/shared/SectionHeader.jsx";
import { Avatar } from "../../components/shared/Avatar.jsx";
import { Badge } from "../../components/shared/Badge.jsx";
import { WorkstationPage } from "../../components/layout/WorkstationPage.jsx";

export default function TeamsPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const [formData, setFormData] = useState({
    name: "",
    country: "",
    city: "",
    formation: "",
    foundedYear: "",
    description: "",
    league: "",
  });

  const [errors, setErrors] = useState({});

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getUserTeams(page, 12);
      setTeams(response.data || []);
      const p = response.pagination;
      setTotalPages(p?.pages ?? p?.totalPages ?? 1);
    } catch (err) {
      showError(err.message || "Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  }, [page, showError]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Team name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Team name must be at least 2 characters";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.formation) {
      newErrors.formation = "Formation is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const response = await createTeam(formData);
      if (response.data || response.team) {
        showSuccess("Team created successfully!");
        setShowModal(false);
        setFormData({
          name: "",
          country: "",
          city: "",
          formation: "",
          foundedYear: "",
          description: "",
          league: "",
        });
        setPage(1);
        fetchTeams();
      }
    } catch (err) {
      showError(err.message || "Failed to create team");
    } finally {
      setIsCreating(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - FOUNDED_YEAR_RANGE.MIN + 1 },
    (_, i) => currentYear - i,
  );
  const countries = useMemo(
    () =>
      Array.from(new Set(teams.map((team) => team.country).filter(Boolean))).sort(
        (a, b) => String(a).localeCompare(String(b)),
      ),
    [teams],
  );
  const leagues = useMemo(
    () =>
      Array.from(new Set(teams.map((team) => team.league).filter(Boolean))).sort(
        (a, b) => String(a).localeCompare(String(b)),
      ),
    [teams],
  );
  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = teams.filter((team) => {
      const matchesQuery =
        !q ||
        String(team.name || "").toLowerCase().includes(q) ||
        String(team.country || "").toLowerCase().includes(q) ||
        String(team.league || "").toLowerCase().includes(q);
      const matchesCountry =
        countryFilter === "all" || String(team.country || "") === countryFilter;
      const matchesLeague =
        leagueFilter === "all" || String(team.league || "") === leagueFilter;
      return matchesQuery && matchesCountry && matchesLeague;
    });
    return list.sort((a, b) => {
      if (sortBy === "ovrDesc") {
        return (Number(b.avgOverallRating) || 0) - (Number(a.avgOverallRating) || 0);
      }
      if (sortBy === "budgetDesc") {
        return (Number(b.budget) || 0) - (Number(a.budget) || 0);
      }
      if (sortBy === "squadDesc") {
        return (
          (Number(b.playerCount) || b.players?.length || 0) -
          (Number(a.playerCount) || a.players?.length || 0)
        );
      }
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [teams, search, countryFilter, leagueFilter, sortBy]);

  return (
    <Layout>
      <WorkstationPage>
        {/* Header */}
        <SectionHeader
          eyebrow="Teams"
          title="Your teams"
          description="Create and manage club rosters, logos and season stats."
          actions={
            <Button variant="primary" onClick={() => setShowModal(true)}>
              + Create Team
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <Input
              label="Search teams"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, country, or league"
            />
          </div>
          <div className="md:col-span-2">
            <Select
              label="Country"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              options={[
                { label: "All", value: "all" },
                ...countries.map((country) => ({ label: country, value: country })),
              ]}
            />
          </div>
          <div className="md:col-span-2">
            <Select
              label="League"
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              options={[
                { label: "All", value: "all" },
                ...leagues.map((league) => ({ label: league, value: league })),
              ]}
            />
          </div>
          <div className="md:col-span-3">
            <Select
              label="Sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { label: "Name A–Z", value: "name" },
                { label: "OVR ↓", value: "ovrDesc" },
                { label: "Budget ↓", value: "budgetDesc" },
                { label: "Squad size ↓", value: "squadDesc" },
              ]}
            />
          </div>
        </div>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredTeams.map((team) => (
              <button
                key={entityId(team)}
                type="button"
                onClick={() => navigate(`/teams/${entityId(team)}`)}
                className="bg-app-elevated-light/30 rounded-xl border border-app-border p-4 hover:border-zinc-500/80 hover:bg-app-elevated-light/80 transition-all text-left shadow-sm shadow-black/20"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      size="md"
                      rounded="lg"
                      initials={team.name}
                      src={team.logoUrl}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold tracking-tight text-app-text truncate">
                        {team.name}
                      </h3>
                      <p className="text-xs text-app-text-secondary truncate">
                        {team.city}, {team.country}
                      </p>
                    </div>
                  </div>
                  <Badge tone="subtle">{team.formation}</Badge>
                </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-app-text-muted">Avg OVR</span>
                      <span className="text-app-text font-medium tabular-nums">
                        {team.avgOverallRating ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-app-text-muted">Tactic</span>
                      <span className="text-app-text font-medium">
                      {team.formation}
                    </span>
                  </div>
                    <div className="flex justify-between">
                      <span className="text-app-text-muted">Squad</span>
                      <span className="text-app-text font-medium">
                        {team.playerCount || 0} players
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-app-text-muted">Budget</span>
                      <span className="text-app-text font-medium tabular-nums">
                        {formatBudget(team.budget)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-app-text-muted">Health</span>
                      <span className="text-app-text font-medium">
                        {teamHealthLabel(team)}
                      </span>
                    </div>
                    {team.league && (
                      <div className="flex justify-between">
                        <span className="text-app-text-muted">League</span>
                      <span className="text-app-text font-medium">
                        {team.league}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Card title="No teams found" padded={false}>
            <div className="p-8 text-center app-gridlines">
              <p className="text-sm text-app-text-secondary mb-4">
                No teams matched your filters.
              </p>
              <Button variant="primary" onClick={() => setShowModal(true)}>
                Create team
              </Button>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
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

      {/* Create Team Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Team"
        size="lg"
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
              Create Team
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Team Name"
            name="name"
            placeholder="Manchester United"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Country"
              name="country"
              placeholder="England"
              value={formData.country}
              onChange={handleChange}
              error={errors.country}
            />

            <Input
              label="City"
              name="city"
              placeholder="Manchester"
              value={formData.city}
              onChange={handleChange}
              error={errors.city}
            />
          </div>

          <Select
            label="Formation"
            name="formation"
            options={FORMATION_GROUPS}
            grouped={true}
            value={formData.formation}
            onChange={handleChange}
            error={errors.formation}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Founded Year"
              name="foundedYear"
              options={years.map((year) => ({
                value: year.toString(),
                label: year.toString(),
              }))}
              value={formData.foundedYear}
              onChange={handleChange}
            />

            <Input
              label="League"
              name="league"
              placeholder="Premier League"
              value={formData.league}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Description"
            name="description"
            placeholder="Tell us about your team..."
            value={formData.description}
            onChange={handleChange}
          />
        </form>
      </Modal>
    </Layout>
  );
}

function formatBudget(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function teamHealthLabel(team) {
  const players = Array.isArray(team?.players) ? team.players : [];
  if (!players.length) return "No roster";
  const unavailable = players.filter((p) => ["Injured", "Loaned"].includes(String(p?.status))).length;
  const ratio = (players.length - unavailable) / players.length;
  if (ratio >= 0.85) return "Excellent";
  if (ratio >= 0.65) return "Stable";
  return "Risk";
}
