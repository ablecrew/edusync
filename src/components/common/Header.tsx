import React, { useState } from 'react';
import { Search, Bell, Moon, Sun, LogOut, UserCheck, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Badge } from '../ui/badge';

export const Header: React.FC<{ onToggleSidebar?: () => void }> = () => {
  const { user, currentRole, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isSuperAdmin = user?.email.toLowerCase() === 'dandemarasighan@gmail.com' || currentRole === 'Super Admin';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between transition-colors duration-200 font-sans">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            window.dispatchEvent(event);
          }}
          className="flex items-center w-full max-w-md px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-all cursor-pointer border border-slate-200 dark:border-slate-700/60"
        >
          <Search className="w-4 h-4 mr-2.5 shrink-0 text-slate-400" />
          <span className="truncate">Global search students, teachers, invoices...</span>
          <kbd className="ml-auto pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-1.5 font-mono text-[10px] font-medium text-slate-600 dark:text-slate-300">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Pure RBAC Role Status Badge */}
        {user && (
          <Badge variant="primary" size="md" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 font-bold rounded-xl bg-[#e8f1fc] dark:bg-blue-950 text-[#08428C] dark:text-blue-300 border border-[#08428C]/20">
            <Shield className="w-3.5 h-3.5" />
            <span>{currentRole}</span>
          </Badge>
        )}

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        {user && (
          <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user.full_name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#08428C]/30"
            />
            <div className="hidden md:block text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                  {user.full_name}
                </p>
                {isSuperAdmin && <span title="Verified Super Admin"><UserCheck className="w-3.5 h-3.5 text-emerald-500" /></span>}
              </div>
              <p className="text-[10px] text-slate-500 truncate max-w-[130px] font-mono">{user.email}</p>
            </div>

            {/* Functional Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Sign Out of Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
