import React, { useMemo } from 'react';
import { BookOpen, ArrowLeftRight, AlertTriangle, DollarSign, Bookmark, RefreshCw, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useLibraryStore } from '../store';

const COLORS = ['#08428C', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];

export const Dashboard: React.FC<{ store: ReturnType<typeof useLibraryStore>; onNavigate: (t: any) => void }> = ({ store, onNavigate }) => {
  const kpis = [
    { label: 'Titles',        value: store.stats.totalTitles,      icon: BookOpen,        color: 'text-[#08428C]' },
    { label: 'Total Copies',  value: store.stats.totalCopies,      icon: BookOpen,        color: 'text-slate-600' },
    { label: 'Available',     value: store.stats.availableCopies,  icon: BookOpen,        color: 'text-emerald-600' },
    { label: 'Active Loans',  value: store.stats.activeLoans,      icon: ArrowLeftRight,  color: 'text-sky-600' },
    { label: 'Overdue',       value: store.stats.overdueLoans,     icon: AlertTriangle,   color: 'text-rose-600' },
    { label: 'Reservations',  value: store.stats.openReservations, icon: Bookmark,        color: 'text-amber-600' },
    { label: 'Pending Fines', value: `KES ${store.stats.pendingFinesTotal.toLocaleString()}`, icon: DollarSign, color: 'text-rose-600' },
  ];

  const topIssued = useMemo(() => {
    const map: Record<string, number> = {};
    store.loans.forEach(l => {
      const copy = store.copyById(l.copy_id);
      const res = copy ? store.resourceById(copy.resource_id) : undefined;
      const key = res?.title ?? '—';
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 8);
  }, [store.loans, store.copies, store.resources]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    store.resources.forEach((r: any) => { map[r.category ?? 'Uncategorized'] = (map[r.category ?? 'Uncategorized'] ?? 0) + Number(r.total_copies ?? 0); });
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [store.resources]);

  const overdueLoans = store.loans
    .filter(l => l.status === 'Overdue' || (l.status === 'Active' && new Date(l.due_date) < new Date()))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
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
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Most-Issued Titles</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('circulation')}>Circulation</Button>
          </div>
          {topIssued.length === 0 ? <EmptyState icon={TrendingUp} title="No loans recorded yet" description="Issue books from the Catalog or Circulation tab to see rankings here." />
            : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topIssued} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                    <XAxis type="number" allowDecimals={false} fontSize={10} />
                    <YAxis type="category" dataKey="name" fontSize={10} width={200} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#08428C" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
        </Card>

        <Card className="p-5">
          <h4 className="font-bold mb-3">Stock by Category</h4>
          {byCategory.length === 0 ? <EmptyState icon={BookOpen} title="No stock yet" />
            : (
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                      {byCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" /> Overdue Loans</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => store.scanOverdue.mutate()} isLoading={store.scanOverdue.isPending}>
              <RefreshCw className="w-3.5 h-3.5" /> Scan overdue
            </Button>
            <Button size="sm" variant="primary" onClick={() => onNavigate('circulation')}>View all</Button>
          </div>
        </div>
        {overdueLoans.length === 0
          ? <EmptyState icon={AlertTriangle} title="Nothing overdue" description="All loans are within their due dates." />
          : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {overdueLoans.map(l => {
                const copy = store.copyById(l.copy_id);
                const res = copy ? store.resourceById(copy.resource_id) : undefined;
                const mem = store.memberById(l.member_id);
                const days = Math.max(0, Math.floor((Date.now() - new Date(l.due_date).getTime()) / 86400000));
                return (
                  <li key={l.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{res?.title ?? 'Unknown title'}</p>
                      <p className="text-[11px] text-slate-500">{mem?.full_name} · <span className="font-mono">{mem?.card_no}</span> · due {l.due_date}</p>
                    </div>
                    <Badge variant="danger">{days} day{days === 1 ? '' : 's'} late</Badge>
                  </li>
                );
              })}
            </ul>
          )}
      </Card>
    </div>
  );
};