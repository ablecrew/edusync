import React, { useState } from 'react';
import {
  GraduationCap, LayoutDashboard, BookOpen, ClipboardList, Calculator,
  Award, BarChart3, FolderKanban, AlertTriangle, FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useAcademicsStore } from './store';
import { Dashboard } from './tabs/Dashboard';
import { Curriculum } from './tabs/Curriculum';
import { Planning } from './tabs/Planning';
import { Assessments } from './tabs/Assessments';
import { Grading } from './tabs/Grading';
import { Reports } from './tabs/Reports';
import { Analytics } from './tabs/Analytics';
import { Portfolio } from './tabs/Portfolio';

const TABS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'curriculum',  label: 'Curriculum',  icon: BookOpen },
  { id: 'planning',    label: 'Planning',    icon: ClipboardList },
  { id: 'assessments', label: 'Assessments', icon: Calculator },
  { id: 'grading',     label: 'Grading',     icon: Award },
  { id: 'reports',     label: 'Report Cards', icon: FileText },
  { id: 'analytics',   label: 'Analytics',   icon: BarChart3 },
  { id: 'portfolio',   label: 'CBC Portfolio', icon: FolderKanban },
] as const;
type TabId = typeof TABS[number]['id'];

export const AcademicsManagement: React.FC = () => {
  const store = useAcademicsStore();
  const [tab, setTab] = useState<TabId>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-14">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#08428C] to-[#0a4fa8] flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                Academics &amp; CBC
                {store.currentYear && <Badge variant="primary">{store.currentYear.name}</Badge>}
                {store.currentTerm && <Badge variant="info">{store.currentTerm.name}</Badge>}
                {store.stats.pending > 0 && <Badge variant="warning">{store.stats.pending} draft reports</Badge>}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Curriculum engine — from subject setup and schemes of work to CBC report cards and analytics.
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

        {store.isLoading && <Card className="p-6"><Spinner size="md" text="Loading curriculum data…" /></Card>}
        {!store.isLoading && store.errors.length > 0 && (
          <Card className="p-4 border-rose-300 bg-rose-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-rose-800">Some academic tables failed to load.</p>
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
            {tab === 'curriculum'  && <Curriculum  store={store} />}
            {tab === 'planning'    && <Planning    store={store} />}
            {tab === 'assessments' && <Assessments store={store} />}
            {tab === 'grading'     && <Grading     store={store} />}
            {tab === 'reports'     && <Reports     store={store} />}
            {tab === 'analytics'   && <Analytics   store={store} />}
            {tab === 'portfolio'   && <Portfolio   store={store} />}
          </>
        )}
      </div>
    </div>
  );
};

export default AcademicsManagement;