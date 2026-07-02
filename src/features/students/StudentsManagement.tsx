import React, { useState } from 'react';
import { Users, LayoutDashboard, UserPlus, FolderOpen, ArrowUpRight, BarChart3, AlertTriangle, Bell, ClipboardList } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useStudentsStore } from './store';
import { Dashboard } from './tabs/Dashboard';
import { Directory } from './tabs/Directory';
import { Admissions } from './tabs/Admissions';
import { Documents } from './tabs/Documents';
import { Lifecycle } from './tabs/Lifecycle';
import { Reports } from './tabs/Reports';
import { Notifications } from './tabs/Notifications';
import { Records } from './tabs/Records';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'directory', label: 'Directory', icon: Users },
  { id: 'admissions', label: 'Admissions', icon: UserPlus },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'lifecycle', label: 'Lifecycle', icon: ArrowUpRight },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'records', label: 'Records', icon: ClipboardList },
] as const;

type TabId = typeof TABS[number]['id'];

export const StudentsManagement: React.FC = () => {
  const store = useStudentsStore();
  const [tab, setTab] = useState<TabId>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-14">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#08428C] to-[#0a4fa8] flex items-center justify-center shadow-md shadow-[#08428C]/25">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
                Students &amp; Admissions
                <Badge variant="primary">{store.stats.total} enrolled</Badge>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full learner lifecycle — inquiry → application → enrollment → promotion → graduation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  active ? 'bg-[#08428C] text-white shadow-md shadow-[#08428C]/25'
                         : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {store.isLoading && (
          <Card className="p-6"><Spinner size="md" text="Loading data from Supabase…" /></Card>
        )}
        {!store.isLoading && store.errors.length > 0 && (
          <Card className="p-4 border-rose-300 bg-rose-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-rose-800">Could not load some Supabase tables.</p>
                <ul className="mt-1 space-y-0.5 text-rose-700 font-mono">
                  {store.errors.slice(0, 3).map((e, i) => <li key={i}>· {e.message}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {!store.isLoading && (
          <>
            {tab === 'dashboard' && <Dashboard store={store} onNavigate={setTab} />}
            {tab === 'directory' && <Directory store={store} />}
            {tab === 'admissions' && <Admissions store={store} />}
            {tab === 'documents' && <Documents store={store} />}
            {tab === 'lifecycle' && <Lifecycle store={store} />}
            {tab === 'reports' && <Reports store={store} />}
            {tab === 'records' && <Records store={store} />}
            {tab === 'notifications' && <Notifications store={store} />}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentsManagement;