import React, { useState } from 'react';
import { Library, LayoutDashboard, BookOpen, ArrowLeftRight, Users, DollarSign, BarChart3, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useLibraryStore } from './store';
import { Dashboard } from './tabs/Dashboard';
import { Catalog } from './tabs/Catalog';
import { Circulation } from './tabs/Circulation';
import { Members } from './tabs/Members';
import { Fines } from './tabs/Fines';
import { Reports } from './tabs/Reports';

const TABS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'catalog',     label: 'Catalog',     icon: BookOpen },
  { id: 'circulation', label: 'Circulation', icon: ArrowLeftRight },
  { id: 'members',     label: 'Members',     icon: Users },
  { id: 'fines',       label: 'Fines',       icon: DollarSign },
  { id: 'reports',     label: 'Reports',     icon: BarChart3 },
] as const;
type TabId = typeof TABS[number]['id'];

export const LibraryManagement: React.FC = () => {
  const store = useLibraryStore();
  const [tab, setTab] = useState<TabId>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-14">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#08428C] to-[#0a4fa8] flex items-center justify-center shadow-md">
              <Library className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                Library Management
                <Badge variant="primary">{store.stats.totalTitles} titles</Badge>
                <Badge variant="success">{store.stats.availableCopies} available</Badge>
                {store.stats.overdueLoans > 0 && <Badge variant="danger">{store.stats.overdueLoans} overdue</Badge>}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Cataloging, circulation, reservations, fines, and reporting — end-to-end.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {TABS.map(t => {
            const Icon = t.icon; const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  active ? 'bg-[#08428C] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {store.isLoading && <Card className="p-6"><Spinner size="md" text="Loading library data…" /></Card>}
        {!store.isLoading && store.errors.length > 0 && (
          <Card className="p-4 border-rose-300 bg-rose-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-rose-800">Some library tables failed to load.</p>
                <ul className="mt-1 text-rose-700 font-mono space-y-0.5">
                  {store.errors.slice(0, 3).map((e, i) => <li key={i}>· {e.message}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {!store.isLoading && (
          <>
            {tab === 'dashboard'   && <Dashboard   store={store} onNavigate={setTab} />}
            {tab === 'catalog'     && <Catalog     store={store} />}
            {tab === 'circulation' && <Circulation store={store} />}
            {tab === 'members'     && <Members     store={store} />}
            {tab === 'fines'       && <Fines       store={store} />}
            {tab === 'reports'     && <Reports     store={store} />}
          </>
        )}
      </div>
    </div>
  );
};

export default LibraryManagement;