import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/layout/Layout.jsx";
import { Button } from "../../components/shared/Button.jsx";
import { Input } from "../../components/shared/Input.jsx";
import { Modal } from "../../components/shared/Modal.jsx";
import { Card } from "../../components/shared/Card.jsx";
import { Avatar } from "../../components/shared/Avatar.jsx";
import { SectionHeader } from "../../components/shared/SectionHeader.jsx";
import { Badge } from "../../components/shared/Badge.jsx";
import { WorkstationPage } from "../../components/layout/WorkstationPage.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import {
  getUserProfile,
  getUserTeams,
  updateUserProfile,
  deleteUserAccount,
} from "../../services/users.js";
import { validateUsername, validateEmail } from "../../utils/validators.js";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(user || null);
  const [teamCount, setTeamCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });
  const [errors, setErrors] = useState({});

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileRes, teamsRes] = await Promise.all([
        getUserProfile(),
        getUserTeams(1, 1),
      ]);
      const latestUser = profileRes?.user || profileRes?.data || null;
      setProfileUser(latestUser);
      setTeamCount(Number(teamsRes?.pagination?.total) || (teamsRes?.data || []).length || 0);
      setFormData({
        username: latestUser?.username || "",
        email: latestUser?.email || "",
      });
    } catch (err) {
      showError(err.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.username !== profileUser?.username) {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
      } else if (!validateUsername(formData.username)) {
        newErrors.username =
          "Username must be 3-30 characters (alphanumeric, - or _)";
      }
    }

    if (formData.email !== profileUser?.email) {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!validateEmail(formData.email)) {
        newErrors.email = "Please enter a valid email";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsUpdating(true);
    try {
      const response = await updateUserProfile(formData);
      if (response.user) {
        setProfileUser(response.user);
        updateProfile(response.user);
        showSuccess("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (err) {
      showError(err.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== profileUser?.email) {
      showError("Please enter your email to confirm deletion");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUserAccount();
      showSuccess("Account deleted successfully");
      logout();
      navigate("/login");
    } catch (err) {
      showError(err.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-zinc-100 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <WorkstationPage>
        <SectionHeader
          eyebrow="Manager"
          title="Profile"
          description="Identity, account preferences, and security controls."
        />

        <div className="max-w-2xl">
          <Card padded={false}>
            <div className="p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar size="lg" rounded="full" initials={profileUser?.username} />
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-app-text">
                      {profileUser?.username}
                    </h2>
                    <p className="text-sm text-app-text-secondary">{profileUser?.email}</p>
                    <div className="mt-2">
                      <Badge tone="subtle">Manager account</Badge>
                    </div>
                  </div>
                </div>

                {!isEditing ? (
                  <div className="space-y-4 border-t border-app-border pt-6">
                    <div>
                      <p className="text-xs font-medium text-app-text-muted uppercase mb-1">
                        Username
                      </p>
                      <p className="text-app-text">{profileUser?.username}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-app-text-muted uppercase mb-1">
                        Email
                      </p>
                      <p className="text-app-text">{profileUser?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-app-text-muted uppercase mb-1">
                        Member Since
                      </p>
                      <p className="text-app-text">
                        {profileUser?.createdAt
                          ? new Date(profileUser.createdAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-app-text-muted uppercase mb-1">
                        Teams managed
                      </p>
                      <p className="text-app-text tabular-nums">{teamCount}</p>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-app-border">
                      <Button variant="primary" onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          logout();
                          navigate("/login");
                        }}
                      >
                        Logout
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 border-t border-app-border pt-6"
                  >
                    <Input
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      error={errors.username}
                    />
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" variant="primary" isLoading={isUpdating}>
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            username: profileUser?.username || "",
                            email: profileUser?.email || "",
                          });
                          setErrors({});
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </Card>
        </div>
      </WorkstationPage>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={isDeleting}
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-app-text-secondary">
            This action cannot be undone. All your teams, players, and stats
            will be permanently deleted.
          </p>

          <Input
            label={`Type your email to confirm: ${profileUser?.email}`}
            name="deleteConfirm"
            placeholder={profileUser?.email}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
        </div>
      </Modal>
    </Layout>
  );
}
