import React, { useMemo, useState } from 'react';
import { DollarSign, Search, Send, XCircle, CheckCircle2, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useLibraryStore, downloadCSV } from '../store';
import { FINE_STATUSES } from '../constants';

export const Fines: React.FC<{ store: ReturnType<typeof useLibraryStore> }> = ({ store }) => {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [waiving, setWaiving] = useState<any>(null);
  const [waiveReason, setWaiveReason] = useState('');

  const enriched = useMemo(() => store.fines.map(f => {
    const mem = store.memberById(f.member_id);
    return { ...f, memberName: mem?.full_name ?? '—', cardNo: mem?.card_no ?? '', memberType: mem?.member_type };
  }), [store.fines, store.members]);

  const filtered = enriched.filter(f => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (q && !`${f.memberName} ${f.cardNo} ${f.reason ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const totals = useMemo(() => ({
    pending: enriched.filter(f => f.status === 'Pending').reduce((a, f) => a + Number(f.amount), 0),
    paid:    enriched.filter(f => f.status === 'Paid').reduce((a, f) => a + Number(f.amount), 0),
    waived:  enriched.filter(f => f.status === 'Waived').reduce((a, f) => a + Number(f.amount), 0),
    posted:  enriched.filter(f => f.status === 'Posted to Finance').reduce((a, f) => a + Number(f.amount), 0),
  }), [enriched]);

  const exportCSV = () => downloadCSV('library-fines.csv', filtered.map(f => ({
    date: f.created_at?.slice(0, 10), member: f.memberName, card: f.cardNo,
    kind: f.kind, amount: f.amount, status: f.status, reason: f.reason ?? '',
  })));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: totals.pending, color: 'text-rose-600' },
          { label: 'Paid',    value: totals.paid,    color: 'text-emerald-600' },
          { label: 'Waived',  value: totals.waived,  color: 'text-slate-500' },
          { label: 'Posted to Finance', value: totals.posted, color: 'text-[#08428C]' },
        ].map(k => (
          <Card key={k.label} className="p-4">
            <p className="text-[11px] font-bold uppercase text-slate-400">{k.label}</p>
            <p className={`text-xl font-black mt-1 ${k.color}`}>KES {k.value.toLocaleString()}</p>
          </Card>
        ))}
      </div>

      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search fines…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All statuses</option>{FINE_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="w-3.5 h-3.5" /> Export CSV</Button>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={DollarSign} title="No fines to show" description="Overdue and lost-book fines will appear here as they're generated." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 px-5 text-left">Date</th>
                <th className="py-3 px-5 text-left">Member</th>
                <th className="py-3 px-5 text-left">Reason</th>
                <th className="py-3 px-5 text-right">Amount</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(f => (
                <tr key={f.id}>
                  <td className="py-3 px-5 text-xs">{f.created_at?.slice(0, 10)}</td>
                  <td className="py-3 px-5">
                    <p className="font-semibold">{f.memberName}</p>
                    <p className="text-[11px] font-mono text-slate-500">{f.cardNo}</p>
                  </td>
                  <td className="py-3 px-5">
                    <Badge variant="muted">{f.kind}</Badge>
                    <p className="text-xs text-slate-500 mt-0.5">{f.reason}</p>
                  </td>
                  <td className="py-3 px-5 text-right font-mono font-bold">KES {Number(f.amount).toLocaleString()}</td>
                  <td className="py-3 px-5">
                    <Badge variant={
                      f.status === 'Paid' || f.status === 'Posted to Finance' ? 'success' :
                      f.status === 'Waived' ? 'muted' : 'danger'
                    }>{f.status}</Badge>
                  </td>
                  <td className="py-3 px-5 text-right">
                    {f.status === 'Pending' && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="success" onClick={() => store.payFine.mutate(f.id)}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark paid
                        </Button>
                        {f.student_id && (
                          <Button size="sm" variant="outline" onClick={() => store.postFine.mutate(f.id)} title="Create invoice line in Finance">
                            <Send className="w-3.5 h-3.5" /> Post
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => { setWaiving(f); setWaiveReason(''); }}>
                          <XCircle className="w-3.5 h-3.5" /> Waive
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Waive dialog */}
      {waiving && (
        <Dialog isOpen onClose={() => setWaiving(null)} title="Waive fine" maxWidth="sm">
          <div className="space-y-3">
            <p className="text-xs">Waiving <b>KES {Number(waiving.amount).toLocaleString()}</b> for <b>{waiving.memberName}</b>. This action is logged.</p>
            <Textarea label="Reason for waiver" value={waiveReason} onChange={e => setWaiveReason(e.target.value)} placeholder="e.g. Book returned within grace period after appeal." />
            <Input label="Waived by" placeholder="Your name" onChange={e => (waiving as any)._by = e.target.value} />
            <Button variant="primary" className="w-full"
              onClick={async () => { await store.waiveFine.mutateAsync({ id: waiving.id, waived_by: (waiving as any)._by ?? 'Librarian', reason: waiveReason }); setWaiving(null); }}>
              Confirm waiver
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};