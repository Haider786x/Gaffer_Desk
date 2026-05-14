import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { TeamProvider } from "./context/TeamContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ToastContainer } from "./components/shared/Toast.jsx";

import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import TeamsPage from "./pages/teams/TeamsPage.jsx";
import TeamDetailPage from "./pages/teams/TeamDetailPage.jsx";
import TeamSeasonStatsPage from "./pages/teams/TeamSeasonStatsPage.jsx";
import EditTeamPage from "./pages/teams/EditTeamPage.jsx";
import PlayersPage from "./pages/players/PlayersPage.jsx";
import EditPlayerPage from "./pages/players/EditPlayerPage.jsx";
import PlayerStatsPage from "./pages/players/PlayerStatsPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signup" replace />;
  }

  return children;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/signup" replace />;
};

const AppContent = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:teamId/players/:playerId/edit"
          element={
            <ProtectedRoute>
              <EditPlayerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:teamId/players/:playerId/stats"
          element={
            <ProtectedRoute>
              <PlayerStatsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:teamId/players"
          element={
            <ProtectedRoute>
              <PlayersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:teamId/edit"
          element={
            <ProtectedRoute>
              <EditTeamPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:teamId/season-stats"
          element={
            <ProtectedRoute>
              <TeamSeasonStatsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:teamId"
          element={
            <ProtectedRoute>
              <TeamDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <ProtectedRoute>
              <TeamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Unknown paths → onboarding entry (never a silent dead-end at `/`) */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>

      <ToastContainer />
    </>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TeamProvider>
          <ToastProvider>
            <div className="bg-app-bg text-app-text min-h-screen">
              <AppContent />
            </div>
          </ToastProvider>
        </TeamProvider>
      </AuthProvider>
    </Router>
  );
}
