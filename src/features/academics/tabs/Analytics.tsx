import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { BarChart3, TrendingUp, Trophy, History } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useAcademicsStore } from '../store';
import { CBC_LEVEL_COLORS } from '../constants';

const COLORS = ['#08428C', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];

export const Analytics: React.FC<{ store: ReturnType<typeof useAcademicsStore> }> = ({ store }) => {
  const [classFilter, setClassFilter] = useState('ALL');

  const uniqueClasses = useMemo(() => Array.from(new Set(store.performance.map(p => p.class_name).filter(Boolean))), [store.performance]);
  const filtered = useMemo(() => classFilter === 'ALL' ? store.performance : store.performance.filter(p => p.class_name === classFilter), [store.performance, classFilter]);

  const classAverages = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    filtered.forEach(p => {
      map[p.class_name] = map[p.class_name] ?? { total: 0, count: 0 };
      map[p.class_name].total += p.avg_score;
      map[p.class_name].count += 1;
    });
    return Object.entries(map).map(([name, v]) => ({ name, avg: Math.round((v.total / v.count) * 10) / 10 }));
  }, [filtered]);

  const ranking = useMemo(() =>
    store.reports.filter(r => r.position_class).sort((a, b) => (a.position_class ?? 0) - (b.position_class ?? 0)).slice(0, 20),
    [store.reports]);

  const cbcHistogram = useMemo(() => {
    const map: Record<string, number> = {};
    store.reports.forEach(r => {
      const k = r.overall_cbc_level ?? 'Unrated';
      map[k] = (map[k] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value, color: CBC_LEVEL_COLORS[name] ?? '#64748b' }));
  }, [store.reports]);

  return (
    <div className="space-y-6">
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All classes</option>
          {uniqueClasses.map(c => <option key={c}>{c}</option>)}
        </select>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <h4 className="font-bold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Subject Performance</h4>
          {filtered.length === 0 ? (
            <EmptyState icon={BarChart3} title="No performance data yet" description="Score entries in the Assessments tab feed this chart automatically." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={filtered}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="subject_name" fontSize={10} angle={-20} textAnchor="end" height={70} />
                  <YAxis domain={[0, 100]} fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="avg_score" fill="#08428C" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="max_score" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h4 className="font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Class averages</h4>
          {classAverages.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No data" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={classAverages}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis domain={[0, 100]} fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg" stroke="#08428C" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <h4 className="font-bold mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Class Ranking (Top 20)</h4>
          {ranking.length === 0 ? (
            <EmptyState icon={Trophy} title="Rankings not computed yet" description={`Use "Build reports for class" in the Reports tab — it auto-ranks after building.`} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 font-bold">
                  <th className="py-2 text-left">#</th>
                  <th className="py-2 text-left">Learner</th>
                  <th className="py-2 text-left">Class</th>
                  <th className="py-2 text-right">Overall</th>
                  <th className="py-2 text-left">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ranking.map(r => {
                  const s = store.studentById(r.student_id);
                  return (
                    <tr key={r.id}>
                      <td className="py-2">
                        <span className={`inline-flex w-8 h-8 rounded-lg items-center justify-center font-black text-sm ${
                          (r.position_class ?? 0) <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>#{r.position_class}</span>
                      </td>
                      <td className="py-2 font-semibold">{s?.first_name} {s?.last_name}</td>
                      <td className="py-2 text-xs">{s?.class_name}</td>
                      <td className="py-2 text-right font-mono font-bold">{r.overall_score}%</td>
                      <td className="py-2">{r.overall_cbc_level && <Badge variant="success">{r.overall_cbc_level}</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-5">
          <h4 className="font-bold mb-3 flex items-center gap-2"><History className="w-4 h-4" /> CBC distribution</h4>
          {cbcHistogram.length === 0 ? (
            <EmptyState icon={History} title="No published reports" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={cbcHistogram} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                    {cbcHistogram.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};