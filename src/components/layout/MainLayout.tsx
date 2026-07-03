import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../common/Header';
import { Sidebar } from './Sidebar';
import { useSidebar } from './use-sidebar';
import { GlobalSearchCmdK } from '../common/GlobalSearchCmdK';
import { FloatingAIChat } from '../../features/ai/FloatingAIChat';

export const MainLayout: React.FC = () => {
  const s = useSidebar();

  useEffect(() => {
    try {
      const t = localStorage.getItem('edusync_theme');
      if (t === 'dark') document.documentElement.classList.add('dark');
      else if (t === 'light') document.documentElement.classList.remove('dark');
    } catch {}
  }, []);

  const mainPadLeft = s.isMobile ? 0 : s.collapsed ? 72 : 260;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090e17] transition-colors duration-200">
      <Sidebar
        bp={s.bp}
        collapsed={s.collapsed}
        mobileOpen={s.mobileOpen}
        toggleCollapsed={s.toggleCollapsed}
        closeMobile={s.closeMobile}
      />

      <div
        className="min-h-screen flex flex-col transition-[padding] duration-200 ease-out"
        style={{ paddingLeft: mainPadLeft }}
      >
        {/* Single header — hamburger only rendered on mobile via the prop */}
        <Header onMenuClick={s.openMobile} />

        <main className="flex-1 relative overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      <GlobalSearchCmdK />
      <FloatingAIChat />
    </div>
  );
};

export default MainLayout;