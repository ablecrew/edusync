import React, { useMemo, useState } from 'react';
import { Plane, Plus, XCircle, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useStaffPortalStore } from '../store';
import { LEAVE_TYPES } from '../constants';

const daysBetween = (a: string, b: string) => Math.max(0, Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000)) + 1;

export const Leave: React.FC<{ store: ReturnType<typeof useStaffPortalStore> }> = ({ store }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<any>({ leave_type: 'Annual' });

  const submit = async () => {
    if (!form.start_date || !form.end_date) return;
    const days = daysBetween(form.start_date, form.end_date);
    await store.applyLeave.mutateAsync({
      leave_type: form.leave_type, start_date: form.start_date, end_date: form.end_date, days,
      reason: form.reason ?? '',
    });
    setAddOpen(false); setForm({ leave_type: 'Annual' });
  };

  return (
    <div className="space-y-6">
      {/* Balances */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold flex items-center gap-2"><Plane className="w-4 h-4" /> My leave balances ({new Date().getFullYear()})</h4>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}><Plus className="w-3.5 h-3.5" /> Apply leave</Button>
        </div>
        {store.leaveBalances.length === 0 ? (
          <EmptyState icon={Plane} title="No balances yet" description="Balances are auto-created when you first apply for a leave type." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {store.leaveBalances.map(b => {
              const remaining = Number(b.entitlement) - Number(b.taken) - Number(b.pending);
              return (
                <div key={b.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">{b.leave_type}</p>
                  <p className={`text-2xl font-black mt-1 ${remaining <= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{remaining.toFixed(1)}</p>
                  <p className="text-[11px] text-slate-500 mt-1">of {b.entitlement} days · {b.taken} taken · {b.pending} pending</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* History */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h4 className="font-bold">My leave requests</h4>
        </div>
        {store.leaveRequests.length === 0 ? (
          <EmptyState icon={Plane} title="No leave requests yet"
            description="Submit a request and track its approval status here."
            actionLabel="Apply for leave" onAction={() => setAddOpen(true)} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 px-5 text-left">Type</th>
                <th className="py-3 px-5 text-left">Period</th>
                <th className="py-3 px-5 text-right">Days</th>
                <th className="py-3 px-5 text-left">Reason</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {store.leaveRequests.map(l => (
                <tr key={l.id}>
                  <td className="py-3 px-5"><Badge variant="info">{l.leave_type}</Badge></td>
                  <td className="py-3 px-5 text-xs">{l.start_date} → {l.end_date}</td>
                  <td className="py-3 px-5 text-right font-mono font-bold">{l.days}</td>
                  <td className="py-3 px-5 text-xs text-slate-500 max-w-[240px] truncate">{l.reason}</td>
                  <td className="py-3 px-5">
                    <Badge variant={l.status === 'Approved' || l.status === 'Taken' ? 'success' : l.status === 'Rejected' ? 'danger' : l.status === 'Cancelled' ? 'muted' : 'warning'}>{l.status}</Badge>
                    {l.decision_note && <p className="text-[10px] text-slate-500 mt-1">"{l.decision_note}"</p>}
                  </td>
                  <td className="py-3 px-5 text-right">
                    {l.status === 'Pending' && (
                      <Button size="sm" variant="ghost" onClick={() => store.cancelLeave.mutate(l.id)}>
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Apply dialog */}
      <Dialog isOpen={addOpen} onClose={() => setAddOpen(false)} title="Apply for leave" maxWidth="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Type" options={LEAVE_TYPES.map(l => ({ value: l, label: l }))} value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })} />
            <Input label="Start" type="date" value={form.start_date ?? ''} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End" type="date" value={form.end_date ?? ''} onChange={e => setForm({ ...form, end_date: e.target.value })} />
          </div>
          {form.start_date && form.end_date && (
            <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {daysBetween(form.start_date, form.end_date)} day(s)</p>
          )}
          <Textarea label="Reason" value={form.reason ?? ''} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Why do you need this leave?" />
          <Button variant="primary" className="w-full" onClick={submit} isLoading={store.applyLeave.isPending}>Submit request</Button>
        </div>
      </Dialog>
    </div>
  );
};