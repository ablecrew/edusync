import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Download, FileSpreadsheet, Users, Award, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useFinanceStore, downloadCSV } from '../store';
import { money } from '@/utils/cn';

const COLORS = ['#08428C', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];

export const Reports: React.FC<{ store: ReturnType<typeof useFinanceStore> }> = ({ store }) => {
  const [reportKind, setReportKind] = useState<'collections' | 'balances' | 'bursaries' | 'sponsors'>('collections');

  // Fee item breakdown
  const feeItemBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    store.invoices.forEach((i) =>
      i.lines.forEach((l) => {
        map[l.description] = (map[l.description] || 0) + l.amount;
      })
    );
    return Object.entries(map)
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [store.invoices]);

  // Class balances
  const classBreakdown = useMemo(() => {
    const map: Record<string, { billed: number; paid: number; balance: number }> = {};
    store.invoices.forEach((i) => {
      const st = store.studentById(i.student_id);
      const key = st?.class_name || 'Unknown';
      map[key] = map[key] || { billed: 0, paid: 0, balance: 0 };
      map[key].billed += i.amount;
      map[key].paid += i.paid_amount;
      map[key].balance += i.amount - i.paid_amount - i.adjustments;
    });
    return Object.entries(map).map(([Class, v]) => ({ class: Class, ...v }));
  }, [store.invoices, store]);

  // Collections timeline (by payment date)
  const timeline = useMemo(() => {
    const map: Record<string, number> = {};
    store.payments.forEach((p) => {
      map[p.date] = (map[p.date] || 0) + p.amount;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({ date, amount }));
  }, [store.payments]);

  // Bursary by program
  const bursaryByProgram = useMemo(() => {
    const map: Record<string, number> = {};
    store.bursaries.forEach((b) => (map[b.program] = (map[b.program] || 0) + b.awarded_amount));
    return Object.entries(map).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length],
    }));
  }, [store.bursaries]);

  const sponsorReport = useMemo(() => {
    return store.sponsors.map((s) => ({
      name: s.name,
      committed: s.total_committed,
      remitted: s.total_remitted,
      pending: s.total_committed - s.total_remitted,
      learners: s.students.length,
    }));
  }, [store.sponsors]);

  const learnerBalances = useMemo(() => {
    return store.students.map((s) => {
      const invs = store.invoices.filter((i) => i.student_id === s.id);
      const billed = invs.reduce((a, i) => a + i.amount, 0);
      const paid = invs.reduce((a, i) => a + i.paid_amount, 0);
      const adj = invs.reduce((a, i) => a + i.adjustments, 0);
      return {
        student: `${s.first_name} ${s.last_name}`,
        class: s.class_name,
        admission: s.admission_no,
        billed,
        paid,
        adjustments: adj,
        balance: billed - paid - adj,
      };
    });
  }, [store.students, store.invoices]);

  const exportCurrent = () => {
    if (reportKind === 'balances') downloadCSV('learner-balances.csv', learnerBalances);
    if (reportKind === 'sponsors') downloadCSV('sponsor-report.csv', sponsorReport);
    if (reportKind === 'collections')
      downloadCSV('collections-timeline.csv', timeline);
    if (reportKind === 'bursaries')
      downloadCSV(
        'bursary-summary.csv',
        store.bursaries.map((b) => ({
          reference: b.reference,
          program: b.program,
          student: store.studentById(b.student_id)?.first_name + ' ' + store.studentById(b.student_id)?.last_name,
          status: b.status,
          awarded: b.awarded_amount,
          requested: b.requested_amount,
          progress: b.progress_flag,
        }))
      );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          {(
            [
              { id: 'collections', label: 'Collections', icon: FileSpreadsheet },
              { id: 'balances', label: 'Balances by Learner', icon: Users },
              { id: 'bursaries', label: 'Bursary Summary', icon: Award },
              { id: 'sponsors', label: 'Sponsor Remittances', icon: Users },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setReportKind(t.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer ${
                  reportKind === t.id
                    ? 'bg-[#08428C] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
        <Button variant="outline" size="sm" onClick={exportCurrent}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {reportKind === 'collections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <h4 className="font-bold mb-4">Daily Collections Trend</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="date" fontSize={10} stroke="#64748b" />
                  <YAxis fontSize={10} stroke="#64748b" tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v: any) => money(Number(v))} />
                  <Line type="monotone" dataKey="amount" stroke="#08428C" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <h4 className="font-bold mb-4">Revenue by Fee Item</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={feeItemBreakdown} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                    {feeItemBreakdown.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => money(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="text-[11px] mt-3 space-y-1">
              {feeItemBreakdown.map((f) => (
                <li key={f.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: f.color }} />
                    {f.name}
                  </span>
                  <span className="font-mono font-semibold">{money(f.value)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {reportKind === 'balances' && (
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-bold">Balances by Learner</h4>
            <p className="text-xs text-slate-500 mt-1">Aggregated across all invoices this term.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="class" fontSize={10} />
                  <YAxis fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v: any) => money(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="billed" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="paid" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="balance" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 font-bold">
                    <th className="text-left py-2">Learner</th>
                    <th className="text-left py-2">Class</th>
                    <th className="text-right py-2">Billed</th>
                    <th className="text-right py-2">Paid</th>
                    <th className="text-right py-2">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {learnerBalances.map((r, i) => (
                    <tr key={i}>
                      <td className="py-2 font-semibold">{r.student}</td>
                      <td className="py-2">{r.class}</td>
                      <td className="py-2 text-right font-mono">{money(r.billed)}</td>
                      <td className="py-2 text-right font-mono text-emerald-600">{money(r.paid)}</td>
                      <td className={`py-2 text-right font-mono font-bold ${r.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {money(Math.max(0, r.balance))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {reportKind === 'bursaries' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <h4 className="font-bold mb-4">Awards by Program</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bursaryByProgram} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                  <XAxis type="number" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                  <YAxis dataKey="name" type="category" fontSize={10} width={140} />
                  <Tooltip formatter={(v: any) => money(Number(v))} />
                  <Bar dataKey="value" fill="#08428C" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <h4 className="font-bold mb-3">Bursary Pipeline</h4>
            <div className="space-y-2 text-xs">
              {['Applied', 'Under Review', 'Approved', 'Disbursed', 'Rejected'].map((s) => {
                const count = store.bursaries.filter((b) => b.status === s).length;
                return (
                  <div key={s} className="flex items-center justify-between">
                    <Badge
                      variant={
                        s === 'Approved'
                          ? 'primary'
                          : s === 'Disbursed'
                          ? 'success'
                          : s === 'Rejected'
                          ? 'danger'
                          : s === 'Under Review'
                          ? 'info'
                          : 'muted'
                      }
                    >
                      {s}
                    </Badge>
                    <span className="font-bold text-slate-900 dark:text-white">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {reportKind === 'sponsors' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Sponsor</th>
                  <th className="py-3 px-5 text-left">Type</th>
                  <th className="py-3 px-5 text-right">Learners</th>
                  <th className="py-3 px-5 text-right">Committed</th>
                  <th className="py-3 px-5 text-right">Remitted</th>
                  <th className="py-3 px-5 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {store.sponsors.map((s) => {
                  const out = s.total_committed - s.total_remitted;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-5 font-semibold">{s.name}</td>
                      <td className="py-3 px-5">
                        <Badge variant="muted">{s.type}</Badge>
                      </td>
                      <td className="py-3 px-5 text-right">{s.students.length}</td>
                      <td className="py-3 px-5 text-right font-mono">{money(s.total_committed)}</td>
                      <td className="py-3 px-5 text-right font-mono text-emerald-600">
                        {money(s.total_remitted)}
                      </td>
                      <td
                        className={`py-3 px-5 text-right font-mono font-bold ${
                          out > 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {money(out)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
