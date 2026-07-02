import React, { useMemo, useState } from 'react';
import { Plane, Plus, CheckCircle2, XCircle, Search, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useHrStore } from '../store';
import { LEAVE_TYPES, LEAVE_STATUSES } from '../constants';

const daysBetween = (a: string, b: string) => Math.max(0, Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000)) + 1;

export const Leave: React.FC<{ store: ReturnType<typeof useHrStore> }> = ({ store }) => {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [form, setForm] = useState<any>({ leave_type: 'Annual', start_date: '', end_date: '', reason: '' });
  const [decisionFor, setDecisionFor] = useState<any>(null);
  const [decisionKind, setDecisionKind] = useState<'Approved' | 'Rejected' | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [approver, setApprover] = useState('HR');

  const filtered = useMemo(() => store.leaveReqs.filter(l => {
    const s = store.staffById(l.staff_id);
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
    if (q) {
      const t = q.toLowerCase();
      return `${s?.first_name} ${s?.last_name} ${s?.staff_code} ${l.leave_type} ${l.reason ?? ''}`.toLowerCase().includes(t);
    }
    return true;
  }), [store.leaveReqs, store, q, statusFilter]);

  const balancesByStaff = useMemo(() => {
    const map: Record<string, Record<string, { entitlement: number; taken: number; pending: number }>> = {};
    store.leaveBals.forEach(b => {
      map[b.staff_id] = map[b.staff_id] ?? {};
      map[b.staff_id][b.leave_type] = { entitlement: b.entitlement, taken: b.taken, pending: b.pending };
    });
    return map;
  }, [store.leaveBals]);

  const submitRequest = async () => {
    if (!selectedStaff || !form.start_date || !form.end_date) return;
    const days = daysBetween(form.start_date, form.end_date);
    await store.createLeave.mutateAsync({
      staff_id: selectedStaff,
      leave_type: form.leave_type,
      start_date: form.start_date, end_date: form.end_date, days,
      reason: form.reason,
    });
    setAddOpen(false); setSelectedStaff(''); setForm({ leave_type: 'Annual', start_date: '', end_date: '', reason: '' });
  };

  const runDecision = async () => {
    if (!decisionFor || !decisionKind) return;
    await store.decideLeave.mutateAsync({ id: decisionFor.id, decision: decisionKind, approver, note: decisionNote });
    setDecisionFor(null); setDecisionKind(null); setDecisionNote('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {['ALL', 'Pending', 'Approved', 'Rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${statusFilter === s ? 'bg-white dark:bg-slate-900 text-[#08428C] shadow-sm' : 'text-slate-600'}`}>
              {s === 'ALL' ? 'All' : s}
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
                {s === 'ALL' ? store.leaveReqs.length : store.leaveReqs.filter(l => l.status === s).length}
              </span>
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}><Plus className="w-3.5 h-3.5" /> New request</Button>
      </div>

      <Card className="p-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search staff, type, reason…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Plane}
          title={store.leaveReqs.length === 0 ? 'No leave requests yet' : 'No leave matches your filters'}
          description="Leave requests submitted by staff appear here for review and approval."
          actionLabel={store.leaveReqs.length === 0 ? 'Log first request' : undefined}
          onAction={store.leaveReqs.length === 0 ? () => setAddOpen(true) : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 px-5 text-left">Staff</th>
                <th className="py-3 px-5 text-left">Type</th>
                <th className="py-3 px-5 text-left">Period</th>
                <th className="py-3 px-5 text-right">Days</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(l => {
                const s = store.staffById(l.staff_id);
                return (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-5">
                      <p className="font-semibold">{s?.first_name} {s?.last_name}</p>
                      <p className="text-[11px] font-mono text-slate-500">{s?.staff_code}</p>
                    </td>
                    <td className="py-3 px-5"><Badge variant="info">{l.leave_type}</Badge></td>
                    <td className="py-3 px-5 text-xs">{l.start_date} → {l.end_date}</td>
                    <td className="py-3 px-5 text-right font-mono font-bold">{l.days}</td>
                    <td className="py-3 px-5">
                      <Badge variant={l.status === 'Approved' || l.status === 'Taken' ? 'success' : l.status === 'Rejected' ? 'danger' : l.status === 'Cancelled' ? 'muted' : 'warning'}>{l.status}</Badge>
                    </td>
                    <td className="py-3 px-5 text-right">
                      {l.status === 'Pending' && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="success" onClick={() => { setDecisionFor(l); setDecisionKind('Approved'); }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setDecisionFor(l); setDecisionKind('Rejected'); }}>
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Balances snapshot */}
      {store.staff.length > 0 && (
        <Card className="p-5">
          <h4 className="font-bold text-sm mb-3">Leave balances ({new Date().getFullYear()})</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 font-bold">
                  <th className="text-left py-2">Staff</th>
                  {LEAVE_TYPES.map(lt => <th key={lt} className="py-2 text-right">{lt}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {store.staff.filter(s => s.status === 'Active').map(s => (
                  <tr key={s.id}>
                    <td className="py-2 font-semibold">{s.first_name} {s.last_name}</td>
                    {LEAVE_TYPES.map(lt => {
                      const b = balancesByStaff[s.id]?.[lt];
                      const remaining = b ? (b.entitlement - b.taken - b.pending) : 0;
                      return (
                        <td key={lt} className="py-2 text-right font-mono">
                          {b
                            ? <span className={remaining <= 0 ? 'text-rose-600 font-bold' : ''}>{remaining.toFixed(1)}</span>
                            : <span className="text-slate-400">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Values shown are <b>remaining days</b>. Balances auto-refresh when requests are created, approved, or cancelled.</p>
        </Card>
      )}

      {/* New request dialog */}
      <Dialog isOpen={addOpen} onClose={() => setAddOpen(false)} title="New leave request" maxWidth="lg">
        <div className="space-y-3">
          <Select label="Staff" options={[{ value: '', label: '— Select —' }, ...store.staff.filter(s => s.status === 'Active').map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name} · ${s.staff_code}` }))]}
            value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Type" options={LEAVE_TYPES.map(l => ({ value: l, label: l }))} value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })} />
            <Input label="Start date" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End date" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
          </div>
          {form.start_date && form.end_date && (
            <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {daysBetween(form.start_date, form.end_date)} day(s)</p>
          )}
          <Textarea label="Reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={submitRequest} isLoading={store.createLeave.isPending} disabled={!selectedStaff || !form.start_date || !form.end_date}>
            Submit request
          </Button>
        </div>
      </Dialog>

      {/* Decision dialog */}
      {decisionFor && decisionKind && (
        <Dialog isOpen onClose={() => { setDecisionFor(null); setDecisionKind(null); }} title={`${decisionKind} leave request`} maxWidth="sm">
          <div className="space-y-3">
            <p className="text-xs">
              {store.staffById(decisionFor.staff_id)?.first_name} {store.staffById(decisionFor.staff_id)?.last_name} · <b>{decisionFor.leave_type}</b> · {decisionFor.days} day(s)
            </p>
            <Input label="Approver name" value={approver} onChange={e => setApprover(e.target.value)} />
            <Textarea label="Decision note (optional)" value={decisionNote} onChange={e => setDecisionNote(e.target.value)} />
            <Button variant={decisionKind === 'Approved' ? 'success' : 'danger'} className="w-full" onClick={runDecision}>
              Confirm {decisionKind}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};