import React, { useMemo, useState } from 'react';
import { ArrowUpRight, ArrowLeftRight, LogOut, RefreshCw, GraduationCap, PauseCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useStudentsStore } from '../store';
import type { LifecycleKind, StudentStatus } from '../types';

const KIND_ICON: Record<LifecycleKind, any> = {
  Enrollment: GraduationCap, Promotion: ArrowUpRight, 'Transfer In': ArrowLeftRight,
  'Transfer Out': ArrowLeftRight, Withdrawal: LogOut, 'Re-enrollment': RefreshCw,
  Graduation: GraduationCap, Suspension: PauseCircle, Reinstatement: CheckCircle2,
};

export const Lifecycle: React.FC<{ store: ReturnType<typeof useStudentsStore> }> = ({ store }) => {
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState<{ id: string; newStatus: StudentStatus } | null>(null);
  const [reason, setReason] = useState('');
  const [studentFilter, setStudentFilter] = useState('ALL');
  const [selectedFromClass, setSelectedFromClass] = useState('');
  const [selectedToClass, setSelectedToClass] = useState('');
  const [promotionRunning, setPromotionRunning] = useState(false);
  const [promotedCount, setPromotedCount] = useState<number | null>(null);

  const filteredEvents = useMemo(() => {
    return studentFilter === 'ALL' ? store.lifecycle : store.lifecycle.filter(e => e.student_id === studentFilter);
  }, [store.lifecycle, studentFilter]);

  const runBatchPromotion = async () => {
    if (!selectedFromClass || !selectedToClass) return;
    const targets = store.students.filter(s => s.status === 'Active' && s.class_name === selectedFromClass);
    setPromotionRunning(true);
    for (const s of targets) {
      await store.promoteStudent.mutateAsync({ id: s.id, newClass: selectedToClass, actor: 'Bulk Promotion' });
    }
    setPromotedCount(targets.length);
    setPromotionRunning(false);
    setTimeout(() => { setPromoteOpen(false); setPromotedCount(null); }, 2500);
  };

  const runStatusChange = async () => {
    if (!statusOpen) return;
    await store.changeStatus.mutateAsync({ id: statusOpen.id, status: statusOpen.newStatus, reason, actor: 'You' });
    setStatusOpen(null);
    setReason('');
  };

  return (
    <div className="space-y-6">
      {/* Action toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <ArrowUpRight className="w-8 h-8 text-[#08428C]" />
          <div>
            <p className="font-bold text-sm">Batch Promote</p>
            <p className="text-[11px] text-slate-500">Move a whole class up a grade</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setPromoteOpen(true)}>Run</Button>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase text-slate-400">Total Events</p>
          <p className="text-2xl font-black mt-1">{store.lifecycle.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase text-slate-400">Transfers</p>
          <p className="text-2xl font-black mt-1">
            {store.lifecycle.filter(e => e.kind === 'Transfer In' || e.kind === 'Transfer Out').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase text-slate-400">Withdrawals</p>
          <p className="text-2xl font-black mt-1 text-rose-600">
            {store.lifecycle.filter(e => e.kind === 'Withdrawal').length}
          </p>
        </Card>
      </div>

      {/* Per-student quick status changer */}
      <Card className="p-5">
        <h4 className="font-bold mb-3">Quick Status Change</h4>
        <p className="text-xs text-slate-500 mb-3">Change any student's enrollment status — the event is logged automatically to their lifecycle history.</p>
        {store.students.length === 0 ? (
          <p className="text-xs text-slate-400">No students yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {store.students.map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div>
                  <p className="font-semibold">{s.first_name} {s.last_name} <span className="text-slate-400 text-xs font-normal">· {s.class_name}</span></p>
                  <Badge variant={s.status === 'Active' ? 'success' : 'warning'}>{s.status}</Badge>
                </div>
                <select
                  value={s.status}
                  onChange={e => setStatusOpen({ id: s.id, newStatus: e.target.value as StudentStatus })}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  {['Active', 'Graduated', 'Suspended', 'Transferred', 'Withdrawn'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Lifecycle timeline */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <h4 className="font-bold">Lifecycle Timeline</h4>
          <select value={studentFilter} onChange={e => setStudentFilter(e.target.value)} className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <option value="ALL">All students</option>
            {store.students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
          </select>
        </div>
        {filteredEvents.length === 0 ? (
          <EmptyState icon={ArrowUpRight} title="No lifecycle events yet" description="Enrollments, promotions, transfers and withdrawals will appear here as a timeline." />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEvents.map(e => {
              const s = store.studentById(e.student_id);
              const Icon = KIND_ICON[e.kind] ?? ArrowUpRight;
              return (
                <li key={e.id} className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#e8f1fc] text-[#08428C] mt-0.5"><Icon className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{e.kind}</span>
                      <span className="text-slate-400">·</span>
                      <span>{s ? `${s.first_name} ${s.last_name}` : 'Unknown student'}</span>
                      {(e.from_value || e.to_value) && (
                        <span className="text-xs text-slate-500 font-mono">
                          {e.from_value && <>{e.from_value} → </>}<b>{e.to_value}</b>
                        </span>
                      )}
                    </div>
                    {e.reason && <p className="text-xs text-slate-500 mt-1">{e.reason}</p>}
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">{e.effective_date} · {e.actor}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Batch promotion dialog */}
      <Dialog isOpen={promoteOpen} onClose={() => setPromoteOpen(false)} title="Batch Class Promotion" maxWidth="md">
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Move every <b>Active</b> student in one class up to another. A lifecycle event is created for each.</p>
          <Select label="From Class" options={[{ value: '', label: '—' }, ...store.classes.map(c => ({ value: c.name, label: c.name }))]} value={selectedFromClass} onChange={e => setSelectedFromClass(e.target.value)} />
          <Select label="To Class" options={[{ value: '', label: '—' }, ...store.classes.map(c => ({ value: c.name, label: c.name }))]} value={selectedToClass} onChange={e => setSelectedToClass(e.target.value)} />
          {selectedFromClass && (
            <p className="text-xs">
              <b>{store.students.filter(s => s.status === 'Active' && s.class_name === selectedFromClass).length}</b> active learners will be promoted.
            </p>
          )}
          <Button variant="primary" className="w-full" onClick={runBatchPromotion} disabled={!selectedFromClass || !selectedToClass || promotionRunning} isLoading={promotionRunning}>
            Promote All
          </Button>
          {promotedCount !== null && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4" /> Promoted {promotedCount} learner(s).
            </div>
          )}
        </div>
      </Dialog>

      {/* Status change reason dialog */}
      {statusOpen && (
        <Dialog isOpen onClose={() => setStatusOpen(null)} title={`Change status to "${statusOpen.newStatus}"`} maxWidth="sm">
          <div className="space-y-3">
            <Textarea label="Reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional — appears in the lifecycle audit trail" />
            <Button variant="primary" className="w-full" onClick={runStatusChange}>Confirm</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};