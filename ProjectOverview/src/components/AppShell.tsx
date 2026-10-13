import type { Page, UserProfile } from "../lib/types";
import { UserAvatar } from "./Avatar";
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  TrendingUp,
  User,
  LogOut,
  Zap,
} from "lucide-react";

interface Props {
  user: UserProfile;
  page: Page;
  onNav: (p: Page) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: {
  page: Page;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
}[] = [
  { page: "dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { page: "diet", label: "My Diet", shortLabel: "Diet", icon: Utensils },
  { page: "workout", label: "My Workout", shortLabel: "Workout", icon: Dumbbell },
  { page: "progress", label: "Progress", shortLabel: "Progress", icon: TrendingUp },
  { page: "profile", label: "Profile & Settings", shortLabel: "Profile", icon: User },
];

export default function AppShell({
  user,
  page,
  onNav,
  onLogout,
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-[#0f172a]/95 backdrop-blur-md sticky top-0 z-40">
        <button
          type="button"
          onClick={() => onNav("dashboard")}
          className="flex items-center gap-1.5 focus:outline-none"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4 fill-emerald-400" />
          </div>
          <span className="text-emerald-400 font-black text-xl font-display tracking-tight">FIT</span>
          <span className="font-black text-xl font-display text-white tracking-tight">PLAN</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNav("profile")}
            className="flex items-center gap-2 focus:outline-none"
            title="Profile & Settings"
          >
            <UserAvatar avatarId={user.avatarId} name={user.name} size="sm" />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-semibold text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-[#0f172a] sticky top-0 h-screen select-none">
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNav("dashboard")}
            className="flex items-center gap-2 text-left focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 fill-emerald-400" />
            </div>
            <div>
              <span className="text-emerald-400 font-black text-xl font-display tracking-tight">FIT</span>
              <span className="font-black text-xl font-display text-white tracking-tight">PLAN</span>
            </div>
          </button>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
            PRO
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.page;
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => onNav(item.page)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          <button
            type="button"
            onClick={() => onNav("profile")}
            className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl hover:bg-slate-800/80 transition-colors text-left border border-transparent hover:border-slate-700/60"
          >
            <UserAvatar avatarId={user.avatarId} name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-200">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors flex items-center gap-2 border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main id="root-content" className="flex-1 overflow-y-auto pb-24 md:pb-8 bg-[#0b0f19]">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 border-t border-slate-800/80 flex z-50 backdrop-blur-md"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.page;
          return (
            <button
              key={item.page}
              type="button"
              onClick={() => onNav(item.page)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 text-[10px] font-semibold gap-1 transition-colors ${
                isActive
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
