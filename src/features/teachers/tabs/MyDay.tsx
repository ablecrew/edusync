import React, { useMemo } from 'react';
import {
  CalendarDays, ClipboardCheck, BookOpen, FileText, TrendingUp, MessageSquare,
  Clock, AlertTriangle, GraduationCap, Users, Bell,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useTeachersStore } from '../store';

const DAY_MAP: Record<number, string> = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };

export const MyDay: React.FC<{ store: ReturnType<typeof useTeachersStore>; onNavigate: (t: any) => void }> = ({ store, onNavigate }) => {
  const today = new Date();
  const todayLabel = DAY_MAP[today.getDay()];
  const todayISO = today.toISOString().slice(0, 10);

  const todaysLessons = useMemo(() => {
    return store.myTimetable
      .filter(t => t.day === todayLabel)
      .sort((a, b) => a.slot.localeCompare(b.slot));
  }, [store.myTimetable, todayLabel]);

  const upcomingDue = useMemo(() =>
    store.myAssessments
      .filter(a => new Date(a.due_date) >= today)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 5),
    [store.myAssessments]);

  const recentSubmissions = useMemo(() =>
    store.submissions
      .filter(s => s.status === 'Submitted' || s.status === 'Late')
      .sort((a, b) => (b.submitted_at ?? '').localeCompare(a.submitted_at ?? ''))
      .slice(0, 5),
    [store.submissions]);

  const dashRow = store.myDashboardRow;

  const kpis = [
    { label: 'Classes',            value: dashRow?.class_count       ?? store.myClassNames.length, icon: Users,          color: 'text-[#08428C]' },
    { label: 'Subjects',           value: dashRow?.subject_count     ?? store.mySubjects.length,   icon: BookOpen,       color: 'text-emerald-600' },
    { label: 'Lessons Today',      value: todaysLessons.length,                                      icon: CalendarDays,   color: 'text-sky-600' },
    { label: 'Pending Grading',    value: dashRow?.pending_grading   ?? store.pendingGrading.length, icon: FileText,       color: 'text-rose-600' },
    { label: 'Upcoming Assessments', value: dashRow?.upcoming_assessments ?? upcomingDue.length,     icon: TrendingUp,     color: 'text-amber-600' },
    { label: 'Unread Messages',    value: store.messages.filter(m => !m.read_at && m.to_staff_id === store.activeTeacherId).length, icon: MessageSquare, color: 'text-violet-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <Card className="p-5 bg-gradient-to-r from-[#08428C] to-[#0a4fa8] text-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase text-blue-200 font-bold tracking-wider">
              {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <h2 className="text-2xl font-black mt-1">
              Good {today.getHours() < 12 ? 'morning' : today.getHours() < 17 ? 'afternoon' : 'evening'}
              {store.activeTeacher && `, ${store.activeTeacher.first_name}`}
            </h2>
            <p className="text-sm text-blue-100 mt-1">
              {todaysLessons.length > 0
                ? `You have ${todaysLessons.length} lesson${todaysLessons.length === 1 ? '' : 's'} today.`
                : 'No lessons scheduled today. Enjoy the break.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => onNavigate('attendance')} className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <ClipboardCheck className="w-4 h-4" /> Mark attendance
            </Button>
            <Button variant="outline" onClick={() => onNavigate('lessons')} className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <BookOpen className="w-4 h-4" /> Post lesson
            </Button>
            <Button variant="outline" onClick={() => onNavigate('assessments')} className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <FileText className="w-4 h-4" /> Assign work
            </Button>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="p-4">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
                {k.label}<Icon className={`w-3.5 h-3.5 ${k.color}`} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{k.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's timetable */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><Clock className="w-4 h-4" /> Today's Timetable</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('timetable')}>Full week</Button>
          </div>
          {todaysLessons.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No lessons today" description="Your day is free. You can plan lessons ahead or catch up on grading." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {todaysLessons.map(t => {
                const period = store.periods.find(p => p.slot === t.slot);
                return (
                  <li key={t.id} className="py-3 flex items-center gap-4">
                    <div className="w-16 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{t.slot}</p>
                      {period && <p className="text-[11px] font-mono">{period.starts_at.slice(0, 5)}</p>}
                    </div>
                    <div className="w-1 h-10 rounded-full" style={{ backgroundColor: t.color ?? '#08428C' }} />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{t.subject}</p>
                      <p className="text-[11px] text-slate-500">{t.class_name}{t.room && ` · Room ${t.room}`}</p>
                    </div>
                    <Badge variant="info">{period && `${period.starts_at.slice(0, 5)} → ${period.ends_at.slice(0, 5)}`}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Notices */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><Bell className="w-4 h-4" /> Notices</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('communication')}>All</Button>
          </div>
          {store.notices.length === 0 ? (
            <EmptyState icon={Bell} title="No notices" description="School-wide notices will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {store.notices.slice(0, 4).map(n => (
                <li key={n.id} className="py-2">
                  <div className="flex items-start gap-2">
                    {n.pinned && <span className="text-amber-500 text-xs">📌</span>}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{n.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(n.published_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending grading */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-rose-500" /> Recent Submissions</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('assessments')}>Grade now</Button>
          </div>
          {recentSubmissions.length === 0 ? (
            <EmptyState icon={FileText} title="Nothing to grade" description="Submissions from your assessments appear here." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSubmissions.map(s => {
                const stu = store.studentById(s.student_id);
                const asmt = store.myAssessments.find(a => a.id === s.assessment_id);
                return (
                  <li key={s.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{stu?.first_name} {stu?.last_name}</p>
                      <p className="text-[11px] text-slate-500">{asmt?.title ?? '—'} · {s.submitted_at?.slice(0, 10)}</p>
                    </div>
                    <Badge variant={s.status === 'Late' ? 'warning' : 'primary'}>{s.status}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Upcoming due */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Upcoming Due</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('assessments')}>Manage</Button>
          </div>
          {upcomingDue.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Nothing due" description="You have no upcoming assessments." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingDue.map(a => {
                const days = Math.max(0, Math.floor((new Date(a.due_date).getTime() - Date.now()) / 86400000));
                return (
                  <li key={a.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{a.title}</p>
                      <p className="text-[11px] text-slate-500">{a.class_name} · {a.subject}</p>
                    </div>
                    <Badge variant={days <= 1 ? 'danger' : days <= 3 ? 'warning' : 'muted'}>
                      {days === 0 ? 'Due today' : `in ${days}d`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};