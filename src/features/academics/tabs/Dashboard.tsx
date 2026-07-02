import React, { useMemo } from 'react';
import {
  BookOpen, GraduationCap, Award, FileText, TrendingUp, Calculator, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useAcademicsStore } from '../store';
import { CBC_LEVEL_COLORS } from '../constants';

const COLORS = ['#08428C', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];

export const Dashboard: React.FC<{ store: ReturnType<typeof useAcademicsStore>; onNavigate: (t: any) => void }> = ({ store, onNavigate }) => {
  const kpis = [
    { label: 'Subjects',        value: store.stats.subjects,       icon: BookOpen,     color: 'text-[#08428C]' },
    { label: 'Classes',         value: store.stats.classes,        icon: GraduationCap, color: 'text-emerald-600' },
    { label: 'Schemes of Work', value: store.stats.schemesOfWork,  icon: FileText,     color: 'text-sky-600' },
    { label: 'Exam Schedules',  value: store.stats.schedules,      icon: Calculator,   color: 'text-amber-600' },
    { label: 'Exam Papers',     value: store.stats.papers,         icon: FileText,     color: 'text-violet-600' },
    { label: 'Report Cards',    value: store.stats.reports,        icon: Award,        color: 'text-emerald-600' },
    { label: 'Published',       value: store.stats.published,      icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Draft / Review',  value: store.stats.pending,        icon: AlertTriangle, color: 'text-rose-600' },
  ];

  const cbcMix = useMemo(() => {
    const map: Record<string, number> = {};
    store.reports.forEach(r => {
      const k = r.overall_cbc_level ?? 'Unrated';
      map[k] = (map[k] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value, color: CBC_LEVEL_COLORS[name] ?? '#64748b' }));
  }, [store.reports]);

  const topSubjects = useMemo(() =>
    [...store.performance].sort((a, b) => b.avg_score - a.avg_score).slice(0, 8),
    [store.performance]);

  const coverageBySoW = useMemo(() =>
    store.sow.slice(0, 6).map(s => {
      // The topics query is per-scheme; we surface a lightweight placeholder here
      return { title: s.title, id: s.id };
    }), [store.sow]);

  const upcomingSchedules = useMemo(() =>
    store.examSchedules
      .filter(s => new Date(s.starts_on) >= new Date(new Date().toISOString().slice(0, 10)))
      .sort((a, b) => a.starts_on.localeCompare(b.starts_on))
      .slice(0, 5),
    [store.examSchedules]);

  const draftReports = useMemo(() =>
    store.reports
      .filter(r => r.status === 'Draft' || r.status === 'Ready-for-Review')
      .slice(0, 6),
    [store.reports]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
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
        {/* Top-performing subjects */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Top Performing Subjects</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('analytics')}>Analytics</Button>
          </div>
          {topSubjects.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No score data yet" description="Once teachers enter scores, top-performing subjects appear here." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={topSubjects} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                  <XAxis type="number" domain={[0, 100]} fontSize={10} />
                  <YAxis type="category" dataKey="subject_name" fontSize={10} width={140} />
                  <Tooltip />
                  <Bar dataKey="avg_score" fill="#08428C" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* CBC level distribution */}
        <Card className="p-5">
          <h4 className="font-bold mb-3">Report CBC Distribution</h4>
          {cbcMix.length === 0 ? (
            <EmptyState icon={Award} title="No reports yet" />
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={cbcMix} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                      {cbcMix.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1 text-xs">
                {cbcMix.map(c => (
                  <li key={c.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <span className="font-mono font-bold">{c.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><Calculator className="w-4 h-4" /> Upcoming Exam Schedules</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('assessments')}>Manage</Button>
          </div>
          {upcomingSchedules.length === 0 ? (
            <EmptyState icon={Calculator} title="No upcoming exams" description="Schedule an exam window under the Assessments tab." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingSchedules.map(s => (
                <li key={s.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-[11px] text-slate-500">{s.assessment_type} · {s.starts_on} → {s.ends_on}</p>
                  </div>
                  <Badge variant="primary">{s.assessment_type}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Draft Reports Awaiting Publish</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('reports')}>Review</Button>
          </div>
          {draftReports.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nothing pending" description="All report cards are approved or published." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {draftReports.map(r => {
                const s = store.studentById(r.student_id);
                return (
                  <li key={r.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{s?.first_name} {s?.last_name}</p>
                      <p className="text-[11px] text-slate-500">{s?.class_name ?? '—'} · Overall: {r.overall_score ?? '—'}</p>
                    </div>
                    <Badge variant={r.status === 'Draft' ? 'muted' : 'warning'}>{r.status}</Badge>
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