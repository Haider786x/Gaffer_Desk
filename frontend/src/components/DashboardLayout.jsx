import React, { useState } from "react";
import {
  Home,
  Users,
  Activity,
  Settings,
  Menu,
  Bell,
  Search,
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Solid, Professional */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0A0A0A] border-r border-zinc-800 transform transition-transform duration-200 ease-in-out flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 flex-shrink-0">
          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-5 h-5 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-100">
            StatStriker
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <a
            href="#"
            className="flex items-center px-3 py-2 bg-zinc-800/50 text-zinc-100 rounded-md text-sm font-medium"
          >
            <Home className="w-4 h-4 mr-3 text-zinc-400" />
            Overview
          </a>
          <a
            href="#"
            className="flex items-center px-3 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30 rounded-md text-sm font-medium transition-colors"
          >
            <Users className="w-4 h-4 mr-3" />
            Teams
          </a>
          <a
            href="#"
            className="flex items-center px-3 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30 rounded-md text-sm font-medium transition-colors"
          >
            <Activity className="w-4 h-4 mr-3" />
            Players
          </a>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <a
            href="#"
            className="flex items-center px-3 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30 rounded-md text-sm font-medium transition-colors"
          >
            <Settings className="w-4 h-4 mr-3" /> Settings
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#0A0A0A] border-b border-zinc-800 flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="flex items-center">
            <button
              className="lg:hidden text-zinc-400 hover:text-zinc-100 focus:outline-none mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-1.5 bg-[#141414] border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors w-64"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-zinc-400 hover:text-zinc-100 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="h-8 w-8 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-medium text-zinc-300 cursor-pointer border border-zinc-700">
              M
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
