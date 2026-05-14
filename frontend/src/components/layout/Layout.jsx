import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTeamContext } from "../../context/TeamContext.jsx";
import { Button } from "../shared/Button.jsx";
import { GafferDeskLogo, GAFFER_DESK_LOGO_SRC } from "../brand/GafferDeskLogo.jsx";

export const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { primaryTeam, teams, setPrimaryTeamId } = useTeamContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/signup");
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: "grid" },
    { label: "Teams", path: "/teams", icon: "shield" },
    { label: "Profile", path: "/profile", icon: "user" },
  ];

  const activePlayers = primaryTeam?.players?.filter(p => p.status !== "Injured" && p.status !== "Loaned")?.length || 0;
  const injuredPlayers = primaryTeam?.players?.filter(p => p.status === "Injured")?.length || 0;

  const bottomWidgets = [
    { label: "Budget", value: primaryTeam?.budget ? `$${(primaryTeam.budget / 1000000).toFixed(1)}M` : "—", tone: "text-emerald-300" },
    { label: "Form", value: primaryTeam?.recentForm || "—", tone: "text-zinc-300" },
    { label: "League", value: primaryTeam?.league || "—", tone: "text-zinc-300" },
    { label: "Morale", value: injuredPlayers > 2 ? "Low" : (activePlayers > 15 ? "High" : "Stable"), tone: "text-zinc-300" },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? "w-64" : "w-16"}
          bg-zinc-950 border-r border-white/5
          transition-all duration-300 ease-in-out
          flex flex-col relative overflow-hidden
        `}
      >
        {/* Logo */}
        <div className="p-3 border-b border-white/5 relative z-10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-between gap-2 px-2 py-2 hover:bg-zinc-900 rounded-md transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="h-8 shrink-0 flex items-center">
                {sidebarOpen ? (
                  <GafferDeskLogo compact className="max-h-8 max-w-[120px]" />
                ) : (
                  <div className="h-8 w-8 rounded-sm overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                    <img
                      src={GAFFER_DESK_LOGO_SRC}
                      alt=""
                      className="h-full w-full object-cover object-left scale-[1.35]"
                    />
                  </div>
                )}
              </div>
              {sidebarOpen && (
                <span className="font-semibold text-sm tracking-tight text-zinc-100 truncate">
                  Gaffer Desk
                </span>
              )}
            </div>
            <span className="text-zinc-500 text-xs">
              {sidebarOpen ? "Collapse" : "Open"}
            </span>
          </button>
          {sidebarOpen && (
            <div className="mt-3 rounded-md border border-white/5 bg-zinc-900 px-3 py-2 text-left">
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1">
                Club identity
              </p>
              {teams.length > 1 ? (
                <select
                  value={primaryTeam?._id || ""}
                  onChange={(e) => setPrimaryTeamId(e.target.value)}
                  className="w-full bg-zinc-950 text-zinc-100 text-sm font-semibold tracking-tight border border-white/10 rounded px-1 py-0.5 focus:outline-none focus:border-emerald-500/50"
                >
                  {teams.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-semibold tracking-tight text-zinc-100 mt-1">
                  {primaryTeam?.name || "No active club"}
                </p>
              )}
              <p className="text-xs text-zinc-400 mt-1 truncate">
                {primaryTeam ? `${primaryTeam.formation} · ${primaryTeam.city}` : "Create a team to start"}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 relative z-10">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                w-full px-2 py-2 rounded-md transition-colors text-left flex items-center gap-2 text-xs border-l-2
                ${
                  isActive(item.path)
                    ? "border-emerald-500 bg-zinc-900 text-zinc-100 font-semibold"
                    : "border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }
              `}
            >
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-[11px]"
                aria-hidden="true"
              >
                {item.icon === "grid" && "⧉"}
                {item.icon === "shield" && "⚒"}
                {item.icon === "user" && "◎"}
              </span>
              <span className={sidebarOpen ? "truncate" : "sr-only"}>
                {item.label}
              </span>
              {!sidebarOpen && (
                <span className="ml-1 text-[10px] text-zinc-500">
                  {item.label[0]}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-white/5 space-y-2 relative z-10">
          {sidebarOpen && (
            <div className="px-2 py-2 bg-zinc-900 rounded-md border border-white/5">
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                Logged in
              </p>
              <p className="text-sm font-medium text-zinc-100 truncate mt-0.5">
                {user?.username || user?.email}
              </p>
            </div>
          )}
          {sidebarOpen && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              {bottomWidgets.map((w) => (
                <div
                  key={w.label}
                  className="rounded-md border border-white/5 bg-zinc-900 px-2 py-2"
                >
                  <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                    {w.label}
                  </p>
                  <p className={`text-xs font-semibold mt-1 ${w.tone}`}>
                    {w.value}
                  </p>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            className="w-full"
          >
            {sidebarOpen ? "Logout" : "Out"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-zinc-950 border-b border-white/5 px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={GAFFER_DESK_LOGO_SRC}
              alt=""
              className="hidden sm:block h-7 w-auto max-w-[100px] object-contain opacity-90 shrink-0"
            />
            <div className="hidden sm:flex flex-col text-xs text-zinc-500 leading-tight min-w-0">
              <span className="uppercase tracking-widest font-bold text-[10px]">
                Gaffer Desk
              </span>
              <span className="text-[11px]">
                Squad, contracts & season stats
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-500 tabular-nums">
            <span className="hidden sm:inline">
              {new Date().toLocaleDateString()}
            </span>
            <span className="inline-flex h-6 items-center rounded-full border border-white/10 bg-zinc-900 px-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
              Matchday workspace
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">{children}</div>
        </div>
      </main>
    </div>
  );
};
