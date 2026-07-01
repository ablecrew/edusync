import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../common/Header';
import { Sidebar } from '../common/Sidebar';
import { GlobalSearchCmdK } from '../common/GlobalSearchCmdK';
import { FloatingAICheckoutDrawer } from '../../features/ai/FloatingAICheckoutDrawer';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090e17] flex flex-col transition-colors duration-200">
      <Header />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <GlobalSearchCmdK />
      <FloatingAICheckoutDrawer />
    </div>
  );
};
