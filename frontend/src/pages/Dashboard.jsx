import React from "react";
import { TrendingUp, Goal, Activity, Shield } from "lucide-react";

export default function Dashboard() {
  const teams = [
    {
      id: 1,
      name: "FC Blue United",
      players: 24,
      form: "4-3-3",
      winRate: "68%",
    },
    {
      id: 2,
      name: "Red City FC",
      players: 18,
      form: "4-2-3-1",
      winRate: "52%",
    },
  ];

  const starPlayers = [
    {
      id: 1,
      name: "Alex Hunter",
      position: "ST",
      rating: 88,
      matches: 24,
      goals: 14,
    },
    {
      id: 2,
      name: "Marcus Rashford",
      position: "LW",
      rating: 85,
      matches: 22,
      goals: 9,
    },
    {
      id: 3,
      name: "Kevin De Bruyne",
      position: "CM",
      rating: 91,
      matches: 20,
      goals: 5,
    },
    {
      id: 4,
      name: "Virgil van Dijk",
      position: "CB",
      rating: 89,
      matches: 25,
      goals: 2,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
            Overview
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your active squads and monitor player performance.
          </p>
        </div>
        <button className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors">
          Create Squad
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Matches" value="42" change="+3 this week" />
        <StatCard title="Goals Scored" value="89" change="+12 this month" />
        <StatCard title="Assists" value="64" change="+8 this month" />
        <StatCard title="Clean Sheets" value="12" change="Stable" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left Column: Teams */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#141414] rounded-xl border border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#0f0f0f]">
              <h2 className="text-sm font-semibold text-zinc-100">
                Active Teams
              </h2>
            </div>
            <div className="p-2">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="p-3 hover:bg-zinc-800/30 rounded-lg transition-colors cursor-pointer mb-1 last:mb-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-zinc-200">
                      {team.name}
                    </h3>
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                      {team.winRate} WR
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{team.form}</span>
                    <span>{team.players} Squad Size</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Player Table */}
        <div className="lg:col-span-2">
          <div className="bg-[#141414] rounded-xl border border-zinc-800 overflow-hidden h-full flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#0f0f0f]">
              <h2 className="text-sm font-semibold text-zinc-100">
                Top Performers
              </h2>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="px-5 py-3 font-medium">Player</th>
                    <th className="px-5 py-3 font-medium">Pos</th>
                    <th className="px-5 py-3 font-medium text-right">Apps</th>
                    <th className="px-5 py-3 font-medium text-right">Gls</th>
                    <th className="px-5 py-3 font-medium text-right">OVR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {starPlayers.map((player) => (
                    <tr
                      key={player.id}
                      className="hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-zinc-200">
                        {player.name}
                      </td>
                      <td className="px-5 py-3 text-zinc-400">
                        {player.position}
                      </td>
                      <td className="px-5 py-3 text-zinc-400 text-right">
                        {player.matches}
                      </td>
                      <td className="px-5 py-3 text-zinc-400 text-right">
                        {player.goals}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-semibold text-zinc-200">
                          {player.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Clean, enterprise-style stat card
function StatCard({ title, value, change }) {
  return (
    <div className="bg-[#141414] p-5 rounded-xl border border-zinc-800 flex flex-col justify-between">
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-zinc-100">{value}</p>
      </div>
      <p className="text-xs text-zinc-500 mt-2">{change}</p>
    </div>
  );
}
