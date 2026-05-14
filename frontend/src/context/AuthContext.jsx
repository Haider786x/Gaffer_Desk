import { createContext, useContext, useState } from "react";
import { storage } from "../utils/storage.js";

const AuthContext = createContext();

function readStoredAuth() {
  const storedToken = storage.getToken();
  const storedUser = storage.getUser();
  if (storedToken && storedUser) {
    return {
      user: storedUser,
      token: storedToken,
      isAuthenticated: true,
    };
  }
  return { user: null, token: null, isAuthenticated: false };
}

export const AuthProvider = ({ children }) => {
  const initial = readStoredAuth();
  const [user, setUser] = useState(initial.user);
  const [token, setToken] = useState(initial.token);
  const [isAuthenticated, setIsAuthenticated] = useState(
    initial.isAuthenticated,
  );
  const isLoading = false;

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
    storage.setUser(userData);
    storage.setToken(authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    storage.clearAuth();
  };

  const updateProfile = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    setUser(newUser);
    storage.setUser(newUser);
  };

  const isTeamOwner = (teamOwnerId) => {
    if (!user || teamOwnerId == null) return false;
    return String(user.id) === String(teamOwnerId);
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateProfile,
    isTeamOwner,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
