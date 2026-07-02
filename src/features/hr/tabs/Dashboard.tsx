import React, { useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Users, GraduationCap, CalendarCheck, Plane, DollarSign, AlertTriangle, TrendingUp, Clock, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useHrStore } from '../store';

const COLORS = ['#08428C', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];

export const Dashboard: React.FC<{ store: ReturnType<typeof useHrStore>; onNavigate: (t: any) => void }> = ({ store, onNavigate }) => {
  const kpis = [
    { label: 'Total Staff',   value: store.stats.total,       icon: Users,         color: 'text-[#08428C]' },
    { label: 'Active',        value: store.stats.active,      icon: UserCheck,     color: 'text-emerald-600' },
    { label: 'Teaching',      value: store.stats.teaching,    icon: GraduationCap, color: 'text-sky-600' },
    { label: 'Non-Teaching',  value: store.stats.nonTeaching, icon: Users,         color: 'text-slate-600' },
    { label: 'Present Today', value: store.stats.present,     icon: CalendarCheck, color: 'text-emerald-600' },
    { label: 'Late Today',    value: store.stats.late,        icon: Clock,         color: 'text-amber-600' },
    { label: 'On Leave',      value: store.stats.onLeave,     icon: Plane,         color: 'text-amber-600' },
    { label: 'Pending Leave', value: store.stats.pendingLeave, icon: AlertTriangle, color: 'text-rose-600' },
  ];

  const byDept = useMemo(() => {
    const map: Record<string, number> = {};
    store.staff.forEach(s => {
      const dept = store.deptById(s.department_id ?? '');
      const key = dept?.name ?? 'Unassigned';
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [store.staff, store.departments]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    store.staff.forEach(s => { map[s.staff_type] = (map[s.staff_type] ?? 0) + 1; });
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [store.staff]);

  const pendingLeaves = store.leaveReqs.filter(l => l.status === 'Pending').slice(0, 5);
  const expiringDocs = store.documents.filter(d => {
    if (!d.expires_on) return false;
    const days = Math.floor((new Date(d.expires_on).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 60;
  }).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
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

      <Card className="p-5 bg-gradient-to-r from-[#08428C] to-[#0a56b8] text-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase text-blue-200">Monthly payroll (basic × active staff)</p>
            <p className="text-3xl font-black mt-1">KES {store.stats.monthlyPayroll.toLocaleString()}</p>
          </div>
          <Button variant="outline" onClick={() => onNavigate('payroll')} className="bg-white/10 border-white/30 text-white hover:bg-white/20">
            <DollarSign className="w-4 h-4" /> Manage payroll
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Staff by Department</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('directory')}>Manage</Button>
          </div>
          {byDept.length === 0 ? <EmptyState icon={Users} title="No staff yet" description="Add staff members and assign them to departments." />
            : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDept} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                    <XAxis type="number" allowDecimals={false} fontSize={10} />
                    <YAxis type="category" dataKey="name" fontSize={10} width={140} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#08428C" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
        </Card>

        <Card className="p-5">
          <h4 className="font-bold mb-3">Workforce Mix</h4>
          {byType.length === 0 ? <EmptyState icon={Users} title="No staff yet" />
            : (
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={byType} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                      {byType.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><Plane className="w-4 h-4" /> Leave Awaiting Approval</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('leave')}>Review</Button>
          </div>
          {pendingLeaves.length === 0 ? <EmptyState icon={Plane} title="Nothing pending" description="All leave requests are decided." />
            : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingLeaves.map(l => {
                  const s = store.staffById(l.staff_id);
                  return (
                    <li key={l.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{s?.first_name} {s?.last_name}</p>
                        <p className="text-[11px] text-slate-500">{l.leave_type} · {l.days} day{l.days === 1 ? '' : 's'} from {l.start_date}</p>
                      </div>
                      <Badge variant="warning">{l.status}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Documents Expiring Soon</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('directory')}>View</Button>
          </div>
          {expiringDocs.length === 0 ? <EmptyState icon={AlertTriangle} title="No expiring documents" description="Any staff contracts, licenses, or permits expiring within 60 days will appear here." />
            : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {expiringDocs.map(d => {
                  const s = store.staffById(d.staff_id);
                  const days = Math.floor((new Date(d.expires_on!).getTime() - Date.now()) / 86400000);
                  return (
                    <li key={d.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{s?.first_name} {s?.last_name}</p>
                        <p className="text-[11px] text-slate-500">{d.doc_type} · {d.file_name}</p>
                      </div>
                      <Badge variant={days <= 14 ? 'danger' : 'warning'}>expires in {days}d</Badge>
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