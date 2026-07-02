import React, { useState } from 'react';
import {
  Users, LayoutDashboard, CalendarDays, ClipboardCheck, BookOpen, FileText,
  Award, TrendingUp, MessageSquare, AlertTriangle, GraduationCap, ChevronsRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useTeachersStore } from './store';
import { MyDay } from './tabs/MyDay';
import { Timetable } from './tabs/Timetable';
import { Classes } from './tabs/Classes';
import { Lessons } from './tabs/Lessons';
import { Attendance } from './tabs/Attendance';
import { Assessments } from './tabs/Assessments';
import { Progress } from './tabs/Progress';
import { Communication } from './tabs/Communication';
import { Directory } from './tabs/Directory';

const TABS = [
  { id: 'myday',         label: 'My Day',        icon: LayoutDashboard },
  { id: 'timetable',     label: 'Timetable',     icon: CalendarDays },
  { id: 'classes',       label: 'Classes',       icon: Users },
  { id: 'lessons',       label: 'Lessons',       icon: BookOpen },
  { id: 'attendance',    label: 'Attendance',    icon: ClipboardCheck },
  { id: 'assessments',   label: 'Assessments',   icon: FileText },
  { id: 'progress',      label: 'Progress',      icon: TrendingUp },
  { id: 'communication', label: 'Communication', icon: MessageSquare },
  { id: 'directory',     label: 'Directory',     icon: Award },
] as const;
type TabId = typeof TABS[number]['id'];

export const TeachersWorkspace: React.FC = () => {
  const store = useTeachersStore();
  const [tab, setTab] = useState<TabId>('myday');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-14">

        {/* Header + teacher switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#08428C] to-[#0a4fa8] flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                Teachers Workspace
                {store.activeTeacher && (
                  <>
                    <ChevronsRight className="w-4 h-4 text-slate-400" />
                    <Badge variant="primary">{store.activeTeacher.first_name} {store.activeTeacher.last_name}</Badge>
                  </>
                )}
                {store.myDashboardRow && store.myDashboardRow.pending_grading > 0 && (
                  <Badge variant="danger">{store.myDashboardRow.pending_grading} to grade</Badge>
                )}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Today's timetable, lessons, attendance, assessments and communication — all in one place.
              </p>
            </div>
          </div>

          {store.activeTeachers.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold uppercase text-slate-400">Viewing as</label>
              <select
                value={store.activeTeacherId}
                onChange={e => store.setActiveTeacherId(e.target.value)}
                className="px-3 py-2 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              >
                {store.activeTeachers.map(t => (
                  <option key={t.id} value={t.id}>{t.first_name} {t.last_name} · {t.staff_code}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab strip */}
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

        {/* Global loading + errors */}
        {store.isLoading && <Card className="p-6"><Spinner size="md" text="Loading teacher workspace…" /></Card>}
        {!store.isLoading && store.errors.length > 0 && (
          <Card className="p-4 border-rose-300 bg-rose-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-rose-800">Some teacher tables failed to load.</p>
                <ul className="mt-1 text-rose-700 font-mono space-y-0.5">
                  {store.errors.slice(0, 3).map((e, i) => <li key={i}>· {e.message}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* No active teacher */}
        {!store.isLoading && store.activeTeachers.length === 0 && (
          <EmptyState
            icon={Users}
            title="No teaching staff yet"
            description="Add teachers in the HR module (Directory tab) with staff_type = Teaching to activate this workspace."
          />
        )}

        {!store.isLoading && store.activeTeachers.length > 0 && (
          <>
            {tab === 'myday'         && <MyDay         store={store} onNavigate={setTab} />}
            {tab === 'timetable'     && <Timetable     store={store} />}
            {tab === 'classes'       && <Classes       store={store} />}
            {tab === 'lessons'       && <Lessons       store={store} />}
            {tab === 'attendance'    && <Attendance    store={store} />}
            {tab === 'assessments'   && <Assessments   store={store} />}
            {tab === 'progress'      && <Progress      store={store} />}
            {tab === 'communication' && <Communication store={store} />}
            {tab === 'directory'     && <Directory     store={store} />}
          </>
        )}
      </div>
    </div>
  );
};

export default TeachersWorkspace;