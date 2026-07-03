import React, { useState } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, UserCog, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

interface Props {
  onMenuClick: () => void;
  isMobile: boolean;
}

export const Topbar: React.FC<Props> = ({ onMenuClick, isMobile }) => {
  const { user, currentRole, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState<boolean>(() => document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('edusync_theme', next ? 'dark' : 'light'); } catch {}
    setDark(next);
  };

  return (
    <header
      className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pt-[env(safe-area-inset-top)]"
    >
      <div className="h-14 sm:h-16 px-3 sm:px-6 flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search — grows to fill available space */}
        <div className="flex-1 max-w-xl relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search students, staff, invoices…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-[#08428C] focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#08428C]/20"
          />
        </div>
        <div className="flex-1 sm:hidden" />  {/* spacer on small screens */}

        {/* Theme toggle */}
        <button
          onClick={toggleDark}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 p-1.5 pr-2 sm:pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#08428C] to-[#0a4fa8] text-white font-bold flex items-center justify-center text-xs">
              {(user?.full_name ?? '?').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">{user?.full_name ?? 'User'}</p>
              <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[120px]">{currentRole ?? '—'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 overflow-hidden">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>
                <a href="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <UserCog className="w-4 h-4" /> Account settings
                </a>
                <button onClick={() => { setMenuOpen(false); logout(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};