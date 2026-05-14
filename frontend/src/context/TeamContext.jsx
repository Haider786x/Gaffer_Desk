import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import { getUserTeams } from "../services/users.js";

const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [teams, setTeams] = useState([]);
  const [primaryTeamId, setPrimaryTeamId] = useState(() => localStorage.getItem("gd_primary_team_id"));
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  const fetchTeams = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingTeams(true);
    try {
      // Just fetch the first 50 teams for the dropdown/context
      const response = await getUserTeams(1, 50);
      const list = response.data || [];
      setTeams(list);
      
      // If we don't have a primary team yet, or it's not in the list, pick the first one
      if (list.length > 0 && (!primaryTeamId || !list.find(t => t._id === primaryTeamId))) {
        setPrimaryTeamId(list[0]._id);
      }
    } catch (err) {
      console.error("Failed to load teams for context", err);
    } finally {
      setIsLoadingTeams(false);
    }
  }, [isAuthenticated, primaryTeamId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (primaryTeamId) {
      localStorage.setItem("gd_primary_team_id", primaryTeamId);
    }
  }, [primaryTeamId]);

  const primaryTeam = teams.find(t => t._id === primaryTeamId) || teams[0] || null;

  return (
    <TeamContext.Provider value={{ teams, primaryTeam, setPrimaryTeamId, isLoadingTeams, refreshTeams: fetchTeams }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeamContext = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeamContext must be used within a TeamProvider");
  }
  return context;
};
