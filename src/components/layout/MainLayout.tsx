import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Header } from '../common/Header';
import { Sidebar } from './Sidebar';
import { useSidebar } from './use-sidebar';
import { GlobalSearchCmdK } from '../common/GlobalSearchCmdK';
import { FloatingAICheckoutDrawer } from '../../features/ai/FloatingAICheckoutDrawer';

export const MainLayout: React.FC = () => {
  const s = useSidebar();

  // Restore persisted dark-mode preference on first mount
  useEffect(() => {
    try {
      const t = localStorage.getItem('edusync_theme');
      if (t === 'dark') document.documentElement.classList.add('dark');
      else if (t === 'light') document.documentElement.classList.remove('dark');
    } catch { /* ignore */ }
  }, []);

  // Reserve space on the left equal to the current sidebar width (0 on mobile)
  const mainPadLeft = s.isMobile ? 0 : s.collapsed ? 72 : 260;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090e17] transition-colors duration-200">
      {/* Responsive sidebar (desktop rail + mobile drawer) */}
      <Sidebar
        bp={s.bp}
        collapsed={s.collapsed}
        mobileOpen={s.mobileOpen}
        toggleCollapsed={s.toggleCollapsed}
        closeMobile={s.closeMobile}
      />

      {/* Main column — offset by sidebar width on desktop/tablet */}
      <div
        className="min-h-screen flex flex-col transition-[padding] duration-200 ease-out"
        style={{ paddingLeft: mainPadLeft }}
      >
        {/* Mobile-only hamburger bar (sits above your Header on phones) */}
        {s.isMobile && (
          <div
            className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pt-[env(safe-area-inset-top)]"
          >
            <div className="h-12 px-3 flex items-center gap-2">
              <button
                onClick={s.openMobile}
                aria-label="Open menu"
                className="p-2 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">EduSync</p>
              </div>
            </div>
          </div>
        )}

        {/* Your existing header (renders on all sizes, but the topmost bar on mobile is the hamburger) */}
        <Header />

        {/* Content */}
        <main className="flex-1 relative overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global overlays — always mounted, work independently of layout */}
      <GlobalSearchCmdK />
      <FloatingAICheckoutDrawer />
    </div>
  );
};