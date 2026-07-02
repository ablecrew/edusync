import React, { useState } from 'react';
import {
  Users, LayoutDashboard, CalendarCheck, Plane, DollarSign, BookOpen, Award, BarChart3, AlertTriangle, UserPlus,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useHrStore } from './store';
import { Dashboard } from './tabs/Dashboard';
import { Directory } from './tabs/Directory';
import { Attendance } from './tabs/Attendance';
import { Leave } from './tabs/Leave';
import { Payroll } from './tabs/Payroll';
import { Workload } from './tabs/Workload';
import { Performance } from './tabs/Performance';
import { Reports } from './tabs/Reports';

const TABS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'directory',   label: 'Directory',   icon: UserPlus },
  { id: 'attendance',  label: 'Attendance',  icon: CalendarCheck },
  { id: 'leave',       label: 'Leave',       icon: Plane },
  { id: 'payroll',     label: 'Payroll',     icon: DollarSign },
  { id: 'workload',    label: 'Workload',    icon: BookOpen },
  { id: 'performance', label: 'Performance', icon: Award },
  { id: 'reports',     label: 'Reports',     icon: BarChart3 },
] as const;
type TabId = typeof TABS[number]['id'];

export const HRManagement: React.FC = () => {
  const store = useHrStore();
  const [tab, setTab] = useState<TabId>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-14">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#08428C] to-[#0a4fa8] flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                Teachers &amp; Staff
                <Badge variant="primary">{store.stats.total} on roster</Badge>
                <Badge variant="success">{store.stats.active} active</Badge>
                {store.stats.pendingLeave > 0 && <Badge variant="warning">{store.stats.pendingLeave} leave pending</Badge>}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                HR hub — records, attendance, leave, payroll, workload, and performance.
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

        {store.isLoading && <Card className="p-6"><Spinner size="md" text="Loading HR data…" /></Card>}
        {!store.isLoading && store.errors.length > 0 && (
          <Card className="p-4 border-rose-300 bg-rose-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-rose-800">Some HR tables failed to load.</p>
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
            {tab === 'directory'   && <Directory   store={store} />}
            {tab === 'attendance'  && <Attendance  store={store} />}
            {tab === 'leave'       && <Leave       store={store} />}
            {tab === 'payroll'     && <Payroll     store={store} />}
            {tab === 'workload'    && <Workload    store={store} />}
            {tab === 'performance' && <Performance store={store} />}
            {tab === 'reports'     && <Reports     store={store} />}
          </>
        )}
      </div>
    </div>
  );
};

export default HRManagement;