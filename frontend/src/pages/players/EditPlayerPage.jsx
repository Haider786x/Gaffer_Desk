import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../components/layout/Layout.jsx";
import { Button } from "../../components/shared/Button.jsx";
import { Input } from "../../components/shared/Input.jsx";
import { Select } from "../../components/shared/Select.jsx";
import { Modal } from "../../components/shared/Modal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import {
  getPlayerById,
  getPlayerMarketValue,
  updatePlayer,
  updatePlayerContract,
  deletePlayer,
  uploadPlayerPhoto,
} from "../../services/players.js";
import { getTeamById } from "../../services/teams.js";
import {
  POSITION_GROUPS,
  PLAYER_STATUS,
  PREFERRED_FEET,
} from "../../utils/constants.js";
import { calculateAge } from "../../utils/formatters.js";
import {
  validateAge,
  validateRating,
  validateDateOfBirth,
} from "../../utils/validators.js";
import { entityId } from "../../utils/ids.js";
import { publicUploadUrl } from "../../utils/uploads.js";
import { MarketValueCard } from "../../components/features/MarketValueCard.jsx";
import { ContractForm } from "../../components/features/ContractForm.jsx";
import { getMarketValueTier } from "../../utils/marketValue.js";
import { SectionHeader } from "../../components/shared/SectionHeader.jsx";
import { WorkstationPage } from "../../components/layout/WorkstationPage.jsx";

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

function playerToForm(p) {
  const dob = p.dateOfBirth
    ? new Date(p.dateOfBirth).toISOString().slice(0, 10)
    : "";
  return {
    name: p.name ?? "",
    age: p.age != null ? String(p.age) : "",
    position: p.position ?? "",
    nationality: p.nationality ?? "",
    dateOfBirth: dob,
    overallRating: p.overallRating != null ? String(p.overallRating) : "",
    potentialRating: p.potentialRating != null ? String(p.potentialRating) : "",
    preferredFoot: p.preferredFoot ?? "",
    pace: p.pace != null ? String(p.pace) : "",
    shooting: p.shooting != null ? String(p.shooting) : "",
    passing: p.passing != null ? String(p.passing) : "",
    dribbling: p.dribbling != null ? String(p.dribbling) : "",
    defense: p.defense != null ? String(p.defense) : "",
    physical: p.physical != null ? String(p.physical) : "",
    jerseyNumber: p.jerseyNumber != null ? String(p.jerseyNumber) : "",
    status: p.status || "Active",
  };
}

export default function EditPlayerPage() {
  const { teamId, playerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isContractSaving, setIsContractSaving] = useState(false);
  const photoInputRef = useRef(null);
  const [contractForm, setContractForm] = useState({
    contractExpiry: "",
    currentForm: "50",
  });
  const [marketValueData, setMarketValueData] = useState({
    marketValue: 0,
    tier: "Bronze",
    breakdown: { baseValue: 0, formModifier: 1, contractMultiplier: 1, finalValue: 0 },
  });
  const [formData, setFormData] = useState(playerToForm({}));
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    if (
      !teamId ||
      !playerId ||
      !MONGO_ID_RE.test(teamId) ||
      !MONGO_ID_RE.test(playerId)
    ) {
      showError("Invalid link");
      navigate("/teams");
      return;
    }
    setIsLoading(true);
    try {
      const pres = await getPlayerById(playerId);
      const player = pres.data ?? pres.player ?? null;
      if (!player) {
        showError("Player not found");
        navigate(`/teams/${teamId}/players`);
        return;
      }
      const onTeam = entityId(player.team);
      if (onTeam !== teamId) {
        showError("Player is not on this team");
        navigate(`/teams/${teamId}/players`);
        return;
      }
      const tres = await getTeamById(teamId);
      const team = tres.data ?? tres.team ?? null;
      const ownerRef = team?.ownerId ?? team?.owner?._id ?? team?.owner;
      if (!team || !user || String(ownerRef) !== String(user.id)) {
        showError("You can only edit players on teams you own");
        navigate(`/teams/${teamId}/players`);
        return;
      }
      setFormData(playerToForm(player));
      setPhotoUrl(player.photoUrl || "");
      setContractForm({
        contractExpiry: player.contractExpiry
          ? new Date(player.contractExpiry).toISOString().slice(0, 10)
          : "",
        currentForm:
          player.currentForm !== undefined && player.currentForm !== null
            ? String(player.currentForm)
            : "50",
      });

      try {
        const mvRes = await getPlayerMarketValue(playerId);
        const mv = mvRes.data ?? {};
        setMarketValueData({
          marketValue: mv.marketValue ?? player.marketValue ?? 0,
          tier: mv.tier || getMarketValueTier(mv.marketValue ?? player.marketValue ?? 0),
          breakdown:
            mv.breakdown || {
              baseValue: player.marketValue ?? 0,
              formModifier: 1,
              contractMultiplier: 1,
              finalValue: player.marketValue ?? 0,
            },
        });
      } catch {
        setMarketValueData({
          marketValue: player.marketValue ?? 0,
          tier: getMarketValueTier(player.marketValue ?? 0),
          breakdown: {
            baseValue: player.marketValue ?? 0,
            formModifier: 1,
            contractMultiplier: 1,
            finalValue: player.marketValue ?? 0,
          },
        });
      }
    } catch (err) {
      showError(err.message || "Failed to load player");
      navigate(`/teams/${teamId}/players`);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, playerId, user, navigate, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "dateOfBirth" && value) {
      const age = calculateAge(value);
      setFormData((prev) => ({ ...prev, age: age.toString() }));
    }
  };

  const handleContractChange = (e) => {
    const { name, value } = e.target;
    setContractForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContractSubmit = async () => {
    setIsContractSaving(true);
    try {
      const res = await updatePlayerContract(playerId, {
        contractExpiry: contractForm.contractExpiry || null,
        currentForm: contractForm.currentForm,
      });
      const payload = res.data?.marketValue ?? {};
      const latestValue = payload.marketValue ?? 0;
      setMarketValueData({
        marketValue: latestValue,
        tier: payload.tier || getMarketValueTier(latestValue),
        breakdown: payload.breakdown || {
          baseValue: latestValue,
          formModifier: 1,
          contractMultiplier: 1,
          finalValue: latestValue,
        },
      });
      showSuccess("Contract details updated");
    } catch (err) {
      showError(err.message || "Failed to update contract details");
    } finally {
      setIsContractSaving(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Player name is required";
    else if (formData.name.trim().length < 2)
      newErrors.name = "Name must be at least 2 characters";
    if (!formData.age) newErrors.age = "Age is required";
    else if (!validateAge(formData.age))
      newErrors.age = "Player must be between 16 and 45 years old";
    if (!formData.position) newErrors.position = "Position is required";
    if (!formData.nationality.trim())
      newErrors.nationality = "Nationality is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    else if (!validateDateOfBirth(formData.dateOfBirth))
      newErrors.dateOfBirth = "Invalid date of birth";
    if (!formData.overallRating) newErrors.overallRating = "Overall is required";
    else if (!validateRating(formData.overallRating))
      newErrors.overallRating = "Rating 0–99";
    if (!formData.potentialRating)
      newErrors.potentialRating = "Potential is required";
    else if (!validateRating(formData.potentialRating))
      newErrors.potentialRating = "Rating 0–99";
    else if (
      parseInt(formData.potentialRating, 10) <
      parseInt(formData.overallRating, 10)
    ) {
      newErrors.potentialRating = "Potential must be >= Overall";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      await updatePlayer(playerId, formData);
      showSuccess("Player updated");
      navigate(`/teams/${teamId}/players`);
    } catch (err) {
      showError(err.message || "Failed to update player");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Choose a JPEG, PNG, or WebP image");
      return;
    }
    setIsUploadingPhoto(true);
    try {
      const res = await uploadPlayerPhoto(playerId, file);
      const p = res.data ?? res.player;
      if (p?.photoUrl) setPhotoUrl(p.photoUrl);
      showSuccess("Photo updated");
    } catch (err) {
      showError(err.message || "Photo upload failed");
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = "";
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

  return (
    <Layout>
      <WorkstationPage>
      <div className="max-w-3xl space-y-5">
        <SectionHeader
          eyebrow="Squad management"
          title="Edit player"
          description="Update roster attributes, form, contract, and market value profile."
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(`/teams/${teamId}/players/${playerId}/stats`)
                }
              >
                Season stats
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate(`/teams/${teamId}/players`)}
              >
                Cancel
              </Button>
            </>
          }
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 bg-app-elevated rounded-xl border border-app-border">
          <div className="h-24 w-24 rounded-full border-2 border-app-border bg-app-elevated-light overflow-hidden flex items-center justify-center shrink-0">
            {photoUrl ? (
              <img
                src={publicUploadUrl(photoUrl)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm text-app-text-muted">No photo</span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-app-text">Player picture</p>
            <p className="text-xs text-app-text-secondary mt-1">
              Square image works best — max 2MB.
            </p>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2"
              isLoading={isUploadingPhoto}
              onClick={() => photoInputRef.current?.click()}
            >
              Upload photo
            </Button>
          </div>
        </div>

        <MarketValueCard
          marketValue={marketValueData.marketValue}
          tier={marketValueData.tier}
          breakdown={marketValueData.breakdown}
        />

        <ContractForm
          contractExpiry={contractForm.contractExpiry}
          currentForm={contractForm.currentForm}
          onChange={handleContractChange}
          onSubmit={handleContractSubmit}
          isSaving={isContractSaving}
        />

        <form
          onSubmit={handleSubmit}
          className="bg-app-elevated rounded-xl border border-app-border p-6 space-y-6 max-h-[calc(100vh-10rem)] overflow-y-auto"
        >
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-app-text">Basics</h2>
            <Input
              label="Full Name"
              name="name"
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
                value={formData.nationality}
                onChange={handleChange}
                error={errors.nationality}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-app-border pt-4">
            <h2 className="text-sm font-semibold text-app-text">Ratings</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Overall"
                name="overallRating"
                type="number"
                min="0"
                max="99"
                value={formData.overallRating}
                onChange={handleChange}
                error={errors.overallRating}
              />
              <Input
                label="Potential"
                name="potentialRating"
                type="number"
                min="0"
                max="99"
                value={formData.potentialRating}
                onChange={handleChange}
                error={errors.potentialRating}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-app-border pt-4">
            <h2 className="text-sm font-semibold text-app-text">Attributes</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["pace", "Pace"],
                ["shooting", "Shooting"],
                ["passing", "Passing"],
                ["dribbling", "Dribbling"],
                ["defense", "Defense"],
                ["physical", "Physical"],
              ].map(([key, label]) => (
                <Input
                  key={key}
                  label={label}
                  name={key}
                  type="number"
                  min="0"
                  max="99"
                  value={formData[key]}
                  onChange={handleChange}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t border-app-border pt-4">
            <h2 className="text-sm font-semibold text-app-text">Other</h2>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Preferred Foot"
                name="preferredFoot"
                options={PREFERRED_FEET}
                value={formData.preferredFoot}
                onChange={handleChange}
              />
              <Input
                label="Jersey #"
                name="jerseyNumber"
                type="number"
                min="1"
                max="99"
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

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Save changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/teams/${teamId}/players`)}
            >
              Back to squad
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDelete(true)}
            >
              Remove player
            </Button>
          </div>
        </form>
      </div>
      </WorkstationPage>

      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Remove this player?"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={isDeleting}
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await deletePlayer(playerId);
                  showSuccess("Player removed");
                  setShowDelete(false);
                  navigate(`/teams/${teamId}/players`);
                } catch (err) {
                  showError(err.message || "Could not remove player");
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              Remove
            </Button>
          </>
        }
      >
        <p className="text-app-text-secondary">
          Removes the player from this squad (soft delete). They will no longer appear
          in your team lists.
        </p>
      </Modal>
    </Layout>
  );
}
