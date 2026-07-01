import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { GraduationCap, ExternalLink, ShieldCheck } from 'lucide-react';
import { MAIN_NAV_ITEMS } from '../../config/navigation';
import { APP_CONFIG } from '../../config/constants';
import { useAuth } from '../../features/auth/AuthContext';
import { Badge } from '../ui/badge';

export const Sidebar: React.FC = () => {
  const { user, currentRole } = useAuth();

  // Filter navigation items by role permissions
  const authorizedNavItems = MAIN_NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(currentRole)
  );

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between hidden md:flex h-[calc(100vh-4rem)] sticky top-16 transition-colors duration-200">
      <div className="p-4 overflow-y-auto space-y-1">
        <div className="px-3 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#08428C] text-white flex items-center justify-center font-bold text-xl shadow-md shadow-[#08428C]/25 group-hover:scale-105 transition-transform shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                {APP_CONFIG.name}
              </h1>
              <p className="text-[10px] font-medium text-slate-400">Enterprise Edition</p>
            </div>
          </Link>
        </div>

        {/* Logged in User & Role Permissions Badge */}
        {user && (
          <div className="mx-2 my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                alt=""
                className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-[#08428C]/30"
              />
              <div className="truncate flex-1">
                <p className="font-bold text-slate-900 dark:text-white truncate text-[11px]">
                  {user.full_name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-500 font-medium">Access Sandbox</span>
              <Badge variant="primary" size="sm" className="flex items-center gap-1 font-bold">
                <ShieldCheck className="w-3 h-3 text-[#08428C] dark:text-blue-400" />
                <span>{currentRole}</span>
              </Badge>
            </div>
          </div>
        )}

        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Authorized Modules ({authorizedNavItems.length})
        </div>

        {authorizedNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/dashboard'}
              className={({ isActive }) => `
                flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group
                ${
                  isActive
                    ? 'bg-[#08428C] text-white shadow-md shadow-[#08428C]/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#08428C] dark:group-hover:text-blue-400'}`} />
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-[#e8f1fc] dark:bg-blue-900/50 text-[#08428C] dark:text-blue-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="rounded-xl bg-[#e8f1fc] dark:bg-blue-950/40 p-3 border border-[#08428C]/15">
          <p className="text-xs font-bold text-[#08428C] dark:text-blue-300">Supabase Connected</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            PostgreSQL Realtime Storage & UI analytics enabled.
          </p>
          <Link
            to="/"
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#08428C] dark:text-blue-400 hover:underline"
          >
            Landing Page <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
};
