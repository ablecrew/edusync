import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  GraduationCap, ChevronsLeft, ChevronsRight, LogOut, ExternalLink, X,
} from 'lucide-react';
import { NAV_GROUPS, PORTAL_LINKS } from './nav-config';
import type { Breakpoint } from './use-sidebar';
import { useAuth } from '../../features/auth/AuthContext';

interface Props {
  bp: Breakpoint;
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  closeMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({ bp, collapsed, mobileOpen, toggleCollapsed, closeMobile }) => {
  const { user, currentRole, logout } = useAuth();
  const location = useLocation();
  const isMobile = bp === 'mobile';
  const showLabels = !collapsed || isMobile;   // in mobile drawer we always show labels

  // Desktop/tablet: rail is always present. Mobile: slides in from left, backdrop over content.
  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div
          onClick={closeMobile}
          className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200 ${
            mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={!mobileOpen}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col',
          'bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800',
          'transition-[width,transform] duration-200 ease-out',
          isMobile
            ? `w-72 transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`
            : collapsed
              ? 'w-[72px] translate-x-0'
              : 'w-[260px] translate-x-0',
          'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
        ].join(' ')}
        aria-label="Primary navigation"
      >
        {/* Brand header */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-slate-100 dark:border-slate-800 ${collapsed && !isMobile ? 'justify-center px-2' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#08428C] to-[#0a4fa8] flex items-center justify-center shadow-md shadow-[#08428C]/25 shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {showLabels && (
            <div className="min-w-0 flex-1">
              <p className="font-black text-slate-900 dark:text-white text-sm truncate">EduSync</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">School Suite</p>
            </div>
          )}
          {isMobile && (
            <button onClick={closeMobile} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable nav area */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="mb-4">
              {group.title && showLabels && (
                <p className="px-4 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{group.title}</p>
              )}
              {group.title && !showLabels && gi > 0 && (
                <div className="mx-3 h-px bg-slate-200 dark:bg-slate-800 mb-2" aria-hidden />
              )}
              <ul className="space-y-0.5 px-2">
                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/dashboard'}
                        onClick={isMobile ? closeMobile : undefined}
                        className={({ isActive }) => [
                          'group relative flex items-center gap-3 rounded-xl transition-all',
                          collapsed && !isMobile ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                          isActive
                            ? 'bg-[#08428C] text-white shadow-md shadow-[#08428C]/25'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
                        ].join(' ')}
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && !collapsed && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-white/80" aria-hidden />
                            )}
                            <Icon className="w-5 h-5 shrink-0" />
                            {showLabels && (
                              <span className="text-sm font-semibold truncate flex-1">{item.label}</span>
                            )}
                            {showLabels && item.badge != null && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                isActive ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                            {/* Tooltip when collapsed */}
                            {collapsed && !isMobile && (
                              <span className="pointer-events-none absolute left-full ml-3 px-2 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                {item.label}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Portal links */}
          {showLabels && (
            <p className="px-4 mb-1.5 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Portals</p>
          )}
          {!showLabels && <div className="mx-3 h-px bg-slate-200 dark:bg-slate-800 mb-2 mt-4" aria-hidden />}
          <ul className="space-y-0.5 px-2">
            {PORTAL_LINKS.map(link => {
              const Icon = link.icon;
              return (
                <li key={link.path}>
                  <a
                    href={link.path}
                    target="_blank"
                    rel="noreferrer"
                    className={[
                      'group relative flex items-center gap-3 rounded-xl transition-all',
                      collapsed && !isMobile ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                      'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                    ].join(' ')}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {showLabels && (
                      <span className="text-sm font-semibold truncate flex-1">{link.label}</span>
                    )}
                    {showLabels && <ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
                    {collapsed && !isMobile && (
                      <span className="pointer-events-none absolute left-full ml-3 px-2 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                        {link.label}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer: user card + collapse toggle */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-2">
          {showLabels ? (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#08428C] to-[#0a4fa8] text-white font-bold flex items-center justify-center text-xs shrink-0">
                {(user?.full_name ?? '?').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.full_name ?? 'Signed out'}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentRole ?? user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Collapse toggle — desktop + tablet only */}
          {!isMobile && (
            <button
              onClick={toggleCollapsed}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc] dark:hover:bg-blue-950/30 transition-colors text-xs font-bold"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronsRight className="w-4 h-4" /> : (
                <>
                  <ChevronsLeft className="w-4 h-4" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};