import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../components/layout/Layout.jsx";
import { Button } from "../../components/shared/Button.jsx";
import { Input } from "../../components/shared/Input.jsx";
import { Select } from "../../components/shared/Select.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getTeamById, updateTeam, uploadTeamLogo } from "../../services/teams.js";
import { publicUploadUrl } from "../../utils/uploads.js";
import { FORMATION_GROUPS, FOUNDED_YEAR_RANGE } from "../../utils/constants.js";
import { SectionHeader } from "../../components/shared/SectionHeader.jsx";
import { WorkstationPage } from "../../components/layout/WorkstationPage.jsx";

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

export default function EditTeamPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    city: "",
    formation: "",
    foundedYear: "",
    budget: "",
    description: "",
    league: "",
  });
  const [errors, setErrors] = useState({});
  const [logoUrl, setLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  const loadTeam = useCallback(async () => {
    if (!teamId || !MONGO_ID_RE.test(teamId)) {
      showError("Invalid team");
      navigate("/teams");
      return;
    }
    setIsLoading(true);
    try {
      const res = await getTeamById(teamId);
      const team = res.data ?? res.team ?? null;
      if (!team) {
        showError("Team not found");
        navigate("/teams");
        return;
      }
      const ownerRef = team.ownerId ?? team.owner?._id ?? team.owner;
      if (!user || String(ownerRef) !== String(user.id)) {
        showError("You can only edit teams you own");
        navigate(`/teams/${teamId}`);
        return;
      }
      setLogoUrl(team.logoUrl || "");
      setFormData({
        name: team.name || "",
        country: team.country || "",
        city: team.city || "",
        formation: team.formation || "",
        foundedYear: team.foundedYear != null ? String(team.foundedYear) : "",
        budget: team.budget != null ? String(team.budget) : "",
        description: team.description || "",
        league: team.league || "",
      });
    } catch (err) {
      showError(err.message || "Failed to load team");
      navigate("/teams");
    } finally {
      setIsLoading(false);
    }
  }, [teamId, user, navigate, showError]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Team name is required";
    else if (formData.name.trim().length < 2)
      newErrors.name = "Team name must be at least 2 characters";
    if (!formData.country.trim()) newErrors.country = "Country is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.formation) newErrors.formation = "Formation is required";
    if (formData.budget && (!Number.isFinite(Number(formData.budget)) || Number(formData.budget) < 0)) {
      newErrors.budget = "Budget must be a non-negative number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      await updateTeam(teamId, formData);
      showSuccess("Team updated");
      navigate(`/teams/${teamId}`);
    } catch (err) {
      showError(err.message || "Failed to update team");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Choose a JPEG, PNG, or WebP image");
      return;
    }
    setIsUploadingLogo(true);
    try {
      const res = await uploadTeamLogo(teamId, file);
      const t = res.data ?? res.team;
      if (t?.logoUrl) setLogoUrl(t.logoUrl);
      showSuccess("Logo updated");
    } catch (err) {
      showError(err.message || "Logo upload failed");
    } finally {
      setIsUploadingLogo(false);
      e.target.value = "";
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - FOUNDED_YEAR_RANGE.MIN + 1 },
    (_, i) => currentYear - i,
  );

  if (isLoading) {
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
      <div className="max-w-2xl space-y-5">
        <SectionHeader
          eyebrow="Club management"
          title="Edit team"
          description="Update identity, formation, and competition context for this club."
          actions={
            <Button variant="secondary" onClick={() => navigate(`/teams/${teamId}`)}>
              Cancel
            </Button>
          }
        />

        <form
          onSubmit={handleSubmit}
          className="bg-app-elevated rounded-xl border border-app-border p-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-app-border">
            <div className="h-20 w-20 rounded-lg border border-app-border bg-app-elevated-light overflow-hidden flex items-center justify-center shrink-0">
              {logoUrl ? (
                <img
                  src={publicUploadUrl(logoUrl)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-app-text-muted text-center px-1">
                  No logo
                </span>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-app-text">Team crest</p>
              <p className="text-xs text-app-text-secondary">
                PNG, JPEG, or WebP — max 2MB. Shown on the team page.
              </p>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={isUploadingLogo}
                onClick={() => logoInputRef.current?.click()}
              >
                Upload logo
              </Button>
            </div>
          </div>

          <Input
            label="Team Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              error={errors.country}
            />
            <Input
              label="City"
              name="city"
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
              options={years.map((y) => ({
                value: String(y),
                label: String(y),
              }))}
              value={formData.foundedYear}
              onChange={handleChange}
            />
            <Input
              label="League"
              name="league"
              value={formData.league}
              onChange={handleChange}
            />
          </div>
          <Input
            label="Budget"
            name="budget"
            type="number"
            min="0"
            value={formData.budget}
            onChange={handleChange}
            error={errors.budget}
          />
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Save changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/teams/${teamId}`)}
            >
              Back to team
            </Button>
          </div>
        </form>
      </div>
      </WorkstationPage>
    </Layout>
  );
}
