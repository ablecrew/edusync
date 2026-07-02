import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, BookOpen, AlertTriangle, DollarSign, Users, PackageX, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useLibraryStore, downloadCSV } from '../store';

const COLORS = ['#08428C', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#22c55e', '#64748b'];

export const Reports: React.FC<{ store: ReturnType<typeof useLibraryStore> }> = ({ store }) => {
  const [kind, setKind] = useState<'overdue' | 'popular' | 'fines' | 'damage' | 'member' | 'stock'>('overdue');

  const overdueRows = useMemo(() => store.loans
    .filter(l => l.status === 'Overdue' || (l.status === 'Active' && new Date(l.due_date) < new Date()))
    .map(l => {
      const copy = store.copyById(l.copy_id);
      const res = copy ? store.resourceById(copy.resource_id) : undefined;
      const mem = store.memberById(l.member_id);
      const days = Math.floor((Date.now() - new Date(l.due_date).getTime()) / 86400000);
      return {
        title: res?.title, copy_code: copy?.copy_code,
        member: mem?.full_name, card_no: mem?.card_no,
        issued: l.issue_date, due: l.due_date, days_overdue: days,
      };
    }), [store]);

  const popular = useMemo(() => {
    const map: Record<string, number> = {};
    store.loans.forEach(l => {
      const copy = store.copyById(l.copy_id);
      const res = copy ? store.resourceById(copy.resource_id) : undefined;
      const key = res?.title ?? '—';
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map).map(([title, loans]) => ({ title, loans }))
      .sort((a, b) => b.loans - a.loans).slice(0, 20);
  }, [store]);

  const damageRows = useMemo(() => store.copies
    .filter(c => c.status === 'Lost' || c.status === 'Damaged')
    .map(c => {
      const r = store.resourceById(c.resource_id);
      return { title: r?.title, copy_code: c.copy_code, status: c.status, condition: c.condition, notes: c.notes };
    }), [store]);

  const memberHistory = useMemo(() => store.loans.map(l => {
    const mem = store.memberById(l.member_id);
    const copy = store.copyById(l.copy_id);
    const res = copy ? store.resourceById(copy.resource_id) : undefined;
    return { member: mem?.full_name, card_no: mem?.card_no, title: res?.title, issued: l.issue_date, due: l.due_date, returned: l.return_date ?? '', status: l.status };
  }), [store]);

  const stockRows = useMemo(() => store.resources.map((r: any) => ({
    title: r.title, authors: r.authors ?? '', isbn: r.isbn ?? '', category: r.category ?? '',
    total: r.total_copies, available: r.available_copies, issued: r.issued_copies, damaged: r.damaged_copies, lost: r.lost_copies,
  })), [store.resources]);

  const finesRows = useMemo(() => store.fines.map(f => {
    const mem = store.memberById(f.member_id);
    return { date: f.created_at?.slice(0, 10), member: mem?.full_name, card_no: mem?.card_no, kind: f.kind, amount: f.amount, status: f.status, reason: f.reason };
  }), [store.fines, store.members]);

  const finesByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    store.fines.forEach(f => { map[f.status] = (map[f.status] ?? 0) + Number(f.amount); });
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [store.fines]);

  const exportCurrent = () => {
    if (kind === 'overdue') downloadCSV('overdue.csv', overdueRows);
    if (kind === 'popular') downloadCSV('most-issued.csv', popular);
    if (kind === 'damage')  downloadCSV('lost-damaged.csv', damageRows);
    if (kind === 'member')  downloadCSV('member-history.csv', memberHistory);
    if (kind === 'stock')   downloadCSV('stock.csv', stockRows);
    if (kind === 'fines')   downloadCSV('fines.csv', finesRows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          {([
            { id: 'overdue', label: 'Overdue',      icon: AlertTriangle },
            { id: 'popular', label: 'Most Issued',  icon: TrendingUp },
            { id: 'fines',   label: 'Fines',        icon: DollarSign },
            { id: 'damage',  label: 'Lost/Damaged', icon: PackageX },
            { id: 'member',  label: 'Member History', icon: Users },
            { id: 'stock',   label: 'Stock',        icon: BookOpen },
          ] as const).map(k => {
            const Icon = k.icon;
            return (
              <button key={k.id} onClick={() => setKind(k.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer ${
                  kind === k.id ? 'bg-[#08428C] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {k.label}
              </button>
            );
          })}
        </div>
        <Button size="sm" variant="outline" onClick={exportCurrent}><Download className="w-3.5 h-3.5" /> Export CSV</Button>
      </div>

      {kind === 'overdue' && (
        overdueRows.length === 0
          ? <EmptyState icon={AlertTriangle} title="No overdue loans" />
          : <SimpleTable rows={overdueRows} columns={['title','copy_code','member','card_no','issued','due','days_overdue']} />)}

      {kind === 'popular' && (
        popular.length === 0
          ? <EmptyState icon={TrendingUp} title="No loan history yet" />
          : (
            <Card className="p-5">
              <div className="h-80">
                <ResponsiveContainer>
                  <BarChart data={popular} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                    <XAxis type="number" allowDecimals={false} fontSize={10} />
                    <YAxis type="category" dataKey="title" fontSize={10} width={220} />
                    <Tooltip />
                    <Bar dataKey="loans" fill="#08428C" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ))}

      {kind === 'fines' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <h4 className="font-bold mb-3">Fines summary</h4>
            {finesRows.length === 0 ? <EmptyState icon={DollarSign} title="No fines recorded" />
              : <SimpleTable rows={finesRows} columns={['date','member','card_no','kind','amount','status','reason']} />}
          </Card>
          <Card className="p-5">
            <h4 className="font-bold mb-3">By status</h4>
            {finesByStatus.length === 0 ? <EmptyState icon={DollarSign} title="—" />
              : (
                <div className="h-56">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={finesByStatus} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                        {finesByStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
          </Card>
        </div>
      )}

      {kind === 'damage' && (
        damageRows.length === 0
          ? <EmptyState icon={PackageX} title="No lost or damaged items" description="Items marked as lost or damaged in the Circulation tab will appear here." />
          : <SimpleTable rows={damageRows} columns={['title','copy_code','status','condition','notes']} />)}

      {kind === 'member' && (
        memberHistory.length === 0
          ? <EmptyState icon={Users} title="No borrowing history yet" />
          : <SimpleTable rows={memberHistory} columns={['member','card_no','title','issued','due','returned','status']} />)}

      {kind === 'stock' && (
        stockRows.length === 0
          ? <EmptyState icon={BookOpen} title="No stock yet" />
          : (
            <Card className="p-5">
              <div className="flex items-center gap-4 mb-4 text-xs">
                <span>Total titles: <b>{stockRows.length}</b></span>
                <Badge variant="muted">Copies: {stockRows.reduce((a: number, r: any) => a + r.total, 0)}</Badge>
                <Badge variant="success">Available: {stockRows.reduce((a: number, r: any) => a + r.available, 0)}</Badge>
                <Badge variant="warning">Issued: {stockRows.reduce((a: number, r: any) => a + r.issued, 0)}</Badge>
                <Badge variant="danger">Lost/damaged: {stockRows.reduce((a: number, r: any) => a + r.lost + r.damaged, 0)}</Badge>
              </div>
              <SimpleTable rows={stockRows} columns={['title','authors','isbn','category','total','available','issued','damaged','lost']} />
            </Card>
          ))}
    </div>
  );
};

const SimpleTable: React.FC<{ rows: any[]; columns: string[] }> = ({ rows, columns }) => (
  <Card className="overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase text-slate-400">
            {columns.map(c => <th key={c} className="py-2 px-3 text-left">{c.replace(/_/g, ' ')}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c} className="py-2 px-3 whitespace-nowrap">
                  {typeof r[c] === 'number' ? <span className="font-mono">{r[c].toLocaleString?.() ?? r[c]}</span> : (r[c] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);