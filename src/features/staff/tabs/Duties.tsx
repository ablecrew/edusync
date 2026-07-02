import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList, Wrench, Plus, CheckCircle2, PlayCircle, Trash2, Award, Calendar,
  RefreshCw, XCircle, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useStaffPortalStore } from '../store';
import * as api from '../api';
import { SHIFT_COLORS, TASK_PRIORITIES, WORK_ORDER_KINDS, WORK_ORDER_STATUSES, REQUEST_KINDS } from '../constants';

type SubTab = 'shifts' | 'workorders' | 'tasks' | 'requests' | 'trainings';

export const Duties: React.FC<{ store: ReturnType<typeof useStaffPortalStore> }> = ({ store }) => {
  const [sub, setSub] = useState<SubTab>('shifts');
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<any>({ priority: 'Normal' });
  const [woOpen, setWoOpen] = useState(false);
  const [woForm, setWoForm] = useState<any>({ priority: 'Normal', kind: 'Maintenance' });
  const [reqOpen, setReqOpen] = useState(false);
  const [reqForm, setReqForm] = useState<any>({ kind: 'Reimbursement' });
  const [trainOpen, setTrainOpen] = useState(false);
  const [trainForm, setTrainForm] = useState<any>({});

  // Shift-swap dialog state
  const [swapOpen, setSwapOpen] = useState<any>(null);
  const [swapResponderId, setSwapResponderId] = useState('');
  const [swapResponderShifts, setSwapResponderShifts] = useState<any[]>([]);
  const [swapResponderShiftId, setSwapResponderShiftId] = useState('');
  const [swapReason, setSwapReason] = useState('');

  // NEW: category filter for the item picker
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('ALL');

  const TABS = [
    { id: 'shifts',     label: 'Shifts',      count: store.shifts.length },
    { id: 'workorders', label: 'Work orders', count: store.workOrders.length },
    { id: 'tasks',      label: 'Tasks',       count: store.tasks.length },
    { id: 'requests',   label: 'Requests',    count: store.requests.length },
    { id: 'trainings',  label: 'Trainings',   count: store.trainings.length },
  ] as const;

  // Prefill inventory-linked fields when a Uniform/Tools item is picked
  const needsItemPicker = reqForm.kind === 'Uniform' || reqForm.kind === 'Tools';

  // NEW: distinct categories from the inventory list, for the filter chips
  const inventoryCategories = useMemo(() => {
    const set = new Set<string>();
    store.inventoryItems.forEach((i: any) => { if (i.category) set.add(i.category); });
    return Array.from(set).sort();
  }, [store.inventoryItems]);

  // NEW: filtered inventory list based on the chip selection
  const filteredInventory = useMemo(() => {
    if (inventoryCategoryFilter === 'ALL') return store.inventoryItems;
    return store.inventoryItems.filter((i: any) => i.category === inventoryCategoryFilter);
  }, [store.inventoryItems, inventoryCategoryFilter]);

  // Load responder's future shifts when a colleague is selected
  useEffect(() => {
    if (!swapResponderId) { setSwapResponderShifts([]); return; }
    api.fetchShiftsForStaff(swapResponderId, new Date().toISOString().slice(0, 10))
      .then(setSwapResponderShifts)
      .catch(() => setSwapResponderShifts([]));
    setSwapResponderShiftId('');
  }, [swapResponderId]);

  const submitTask = async () => {
    if (!taskForm.title) return;
    await store.upsertTask.mutateAsync(taskForm);
    setTaskOpen(false); setTaskForm({ priority: 'Normal' });
  };
  const submitWo = async () => {
    if (!woForm.title || !woForm.kind) return;
    await store.createWorkOrder.mutateAsync(woForm);
    setWoOpen(false); setWoForm({ priority: 'Normal', kind: 'Maintenance' });
  };
  const submitReq = async () => {
    if (!reqForm.reason) return;
    if (needsItemPicker && (!reqForm.inventory_item_id || !reqForm.reserved_quantity)) {
      alert('Please pick an item and a quantity.');
      return;
    }
    await store.createRequest.mutateAsync(reqForm);
    setReqOpen(false); setReqForm({ kind: 'Reimbursement' });
    setInventoryCategoryFilter('ALL');
  };
  const submitTrain = async () => {
    if (!trainForm.title) return;
    await store.upsertTraining.mutateAsync(trainForm);
    setTrainOpen(false); setTrainForm({});
  };

  const submitSwap = async () => {
    if (!swapOpen || !swapResponderId) return;
    await store.requestShiftSwap.mutateAsync({
      responder_id: swapResponderId,
      requester_shift_id: swapOpen.id,
      responder_shift_id: swapResponderShiftId || undefined,
      reason: swapReason,
    });
    setSwapOpen(null); setSwapResponderId(''); setSwapResponderShiftId(''); setSwapReason('');
  };

  const today = new Date().toISOString().slice(0, 10);
  const isFutureShift = (dateISO: string) => dateISO >= today;

  // Pending swaps that need MY response
  const swapsForMe = useMemo(
    () => store.shiftSwaps.filter((s: any) => s.responder_id === store.staffId && s.status === 'Pending'),
    [store.shiftSwaps, store.staffId]
  );
  // Swaps I initiated (still pending)
  const swapsByMe = useMemo(
    () => store.shiftSwaps.filter((s: any) => s.requester_id === store.staffId && s.status === 'Pending'),
    [store.shiftSwaps, store.staffId]
  );
  const shiftById = (id: string) => store.shifts.find(s => s.id === id) ?? swapResponderShifts.find((s: any) => s.id === id);

  // NEW: currently selected item (for the info card below the picker)
  const selectedItem = useMemo(
    () => store.inventoryItems.find((i: any) => i.id === reqForm.inventory_item_id),
    [store.inventoryItems, reqForm.inventory_item_id]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setSub(t.id as SubTab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                sub === t.id ? 'bg-white dark:bg-slate-900 text-[#08428C] shadow-sm' : 'text-slate-600'
              }`}>
              {t.label}<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">{t.count}</span>
              {t.id === 'shifts' && store.pendingSwapsForMe > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white ml-0.5">{store.pendingSwapsForMe}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {sub === 'tasks'     && <Button size="sm" variant="primary" onClick={() => setTaskOpen(true)}><Plus className="w-3.5 h-3.5" /> New task</Button>}
          {sub === 'workorders' && <Button size="sm" variant="primary" onClick={() => setWoOpen(true)}><Plus className="w-3.5 h-3.5" /> Report work order</Button>}
          {sub === 'requests'  && <Button size="sm" variant="primary" onClick={() => setReqOpen(true)}><Plus className="w-3.5 h-3.5" /> New request</Button>}
          {sub === 'trainings' && <Button size="sm" variant="primary" onClick={() => setTrainOpen(true)}><Plus className="w-3.5 h-3.5" /> Log training</Button>}
        </div>
      </div>

      {/* SHIFTS */}
      {sub === 'shifts' && (
        <>
          {/* Swaps needing my response */}
          {swapsForMe.length > 0 && (
            <Card className="p-4 border-amber-300 bg-amber-50">
              <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> {swapsForMe.length} shift swap{swapsForMe.length === 1 ? '' : 's'} awaiting your response
              </p>
              <ul className="divide-y divide-amber-200 text-xs">
                {swapsForMe.map((sw: any) => {
                  const requesterShift = shiftById(sw.requester_shift_id);
                  const responderShift = sw.responder_shift_id ? shiftById(sw.responder_shift_id) : null;
                  const requester = store.colleagues.find((c: any) => c.id === sw.requester_id);
                  return (
                    <li key={sw.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {requester ? `${requester.first_name} ${requester.last_name}` : 'A colleague'} wants to swap
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Their shift: {requesterShift ? `${requesterShift.shift_date} · ${requesterShift.kind}` : '—'}
                          {responderShift && <> · in exchange for yours: {responderShift.shift_date} · {responderShift.kind}</>}
                        </p>
                        {sw.reason && <p className="text-[11px] text-slate-500 italic mt-1">"{sw.reason}"</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="success" onClick={() => store.respondShiftSwap.mutate({ id: sw.id, accept: true })}>
                          <ThumbsUp className="w-3.5 h-3.5" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => store.respondShiftSwap.mutate({ id: sw.id, accept: false })}>
                          <ThumbsDown className="w-3.5 h-3.5" /> Decline
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {/* Pending swaps I initiated */}
          {swapsByMe.length > 0 && (
            <Card className="p-4 border-sky-300 bg-sky-50">
              <p className="text-xs font-bold text-sky-800 mb-2">
                {swapsByMe.length} shift swap{swapsByMe.length === 1 ? '' : 's'} you requested — awaiting response
              </p>
              <ul className="divide-y divide-sky-200 text-xs">
                {swapsByMe.map((sw: any) => {
                  const responder = store.colleagues.find((c: any) => c.id === sw.responder_id);
                  const requesterShift = shiftById(sw.requester_shift_id);
                  return (
                    <li key={sw.id} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">To: {responder ? `${responder.first_name} ${responder.last_name}` : '—'}</p>
                        <p className="text-[11px] text-slate-500">
                          Your shift: {requesterShift ? `${requesterShift.shift_date} · ${requesterShift.kind}` : '—'}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => store.cancelShiftSwap.mutate(sw.id)}>
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {/* Shifts list */}
          {store.shifts.length === 0 ? (
            <EmptyState icon={Calendar} title="No shifts scheduled" description="Your duty roster will appear here once published by HR." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {store.shifts.map(s => {
                const future = isFutureShift(s.shift_date);
                const swapPending = store.shiftSwaps.some((sw: any) =>
                  sw.status === 'Pending' && (sw.requester_shift_id === s.id || sw.responder_shift_id === s.id)
                );
                return (
                  <Card key={s.id} className="p-4">
                    <div className="flex gap-3">
                      <div className="w-1.5 rounded-full" style={{ backgroundColor: SHIFT_COLORS[s.kind] ?? '#08428C' }} />
                      <div className="flex-1">
                        <p className="font-bold text-sm">{new Date(s.shift_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        <p className="text-[11px] text-slate-500">{s.kind} · {s.starts_at.slice(0,5)} → {s.ends_at.slice(0,5)}</p>
                        {s.location && <Badge variant="muted" className="mt-2">{s.location}</Badge>}
                        {s.role_label && <p className="text-[11px] text-slate-600 mt-1 italic">{s.role_label}</p>}
                      </div>
                    </div>
                    {future && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        {swapPending
                          ? <Badge variant="warning">Swap pending</Badge>
                          : <span className="text-[11px] text-slate-400">Available to swap</span>}
                        <Button size="sm" variant="ghost" onClick={() => { setSwapOpen(s); setSwapResponderId(''); setSwapReason(''); }}
                          disabled={swapPending}>
                          <RefreshCw className="w-3.5 h-3.5" /> Request swap
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* WORK ORDERS */}
      {sub === 'workorders' && (
        store.workOrders.length === 0 ? (
          <EmptyState icon={Wrench} title="No work orders" description="Report a maintenance issue or track ones assigned to you."
            actionLabel="Report work order" onAction={() => setWoOpen(true)} />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Ticket</th>
                  <th className="py-3 px-5 text-left">Title</th>
                  <th className="py-3 px-5">Kind</th>
                  <th className="py-3 px-5">Priority</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {store.workOrders.map(w => {
                  const mine = w.assigned_to === store.staffId;
                  return (
                    <tr key={w.id}>
                      <td className="py-3 px-5 font-mono text-xs text-[#08428C]">{w.ticket_no}</td>
                      <td className="py-3 px-5">
                        <p className="font-semibold text-sm">{w.title}</p>
                        {w.location && <p className="text-[11px] text-slate-500">{w.location}</p>}
                      </td>
                      <td className="py-3 px-5"><Badge variant="muted">{w.kind}</Badge></td>
                      <td className="py-3 px-5"><Badge variant={w.priority === 'Urgent' ? 'danger' : w.priority === 'High' ? 'warning' : 'muted'}>{w.priority}</Badge></td>
                      <td className="py-3 px-5">
                        {mine ? (
                          <select value={w.status}
                            onChange={e => store.updateWorkOrder.mutate({ id: w.id, patch: { status: e.target.value, started_at: e.target.value === 'In Progress' ? new Date().toISOString() : undefined, completed_at: e.target.value === 'Completed' ? new Date().toISOString() : undefined } })}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {WORK_ORDER_STATUSES.map(x => <option key={x}>{x}</option>)}
                          </select>
                        ) : <Badge variant="muted">{w.status}</Badge>}
                      </td>
                      <td className="py-3 px-5 text-right text-[11px] text-slate-500">
                        {w.assigned_to === store.staffId ? 'Assigned to you' : w.reported_by === store.staffId ? 'Reported by you' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )
      )}

      {/* TASKS */}
      {sub === 'tasks' && (
        store.tasks.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No tasks yet" description="Track your personal to-dos and reminders here."
            actionLabel="Add task" onAction={() => setTaskOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {['Open','In Progress','Done'].map(status => {
              const list = store.tasks.filter(t => (status === 'Open' ? t.status !== 'In Progress' && t.status !== 'Done' && t.status !== 'Cancelled' : t.status === status));
              return (
                <Card key={status} className="p-4">
                  <h4 className="font-bold text-sm mb-3 flex items-center justify-between">
                    {status}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{list.length}</span>
                  </h4>
                  <ul className="space-y-2">
                    {list.map(t => {
                      const overdue = t.due_date && new Date(t.due_date) < new Date();
                      return (
                        <li key={t.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-semibold">{t.title}</p>
                            <Badge variant={t.priority === 'Urgent' ? 'danger' : t.priority === 'High' ? 'warning' : 'muted'}>{t.priority}</Badge>
                          </div>
                          {t.description && <p className="text-[11px] text-slate-500 mt-1">{t.description}</p>}
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-[11px] ${overdue ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>{t.due_date ?? 'No due date'}</span>
                            <div className="flex gap-1">
                              {t.status !== 'In Progress' && t.status !== 'Done' && (
                                <button onClick={() => store.upsertTask.mutate({ id: t.id, status: 'In Progress' } as any)}
                                  className="p-1 rounded text-[#08428C] hover:bg-[#e8f1fc]" title="Start"><PlayCircle className="w-3.5 h-3.5" /></button>
                              )}
                              {t.status !== 'Done' && (
                                <button onClick={() => store.completeTask.mutate(t.id)} className="p-1 rounded text-emerald-600 hover:bg-emerald-50" title="Complete"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                              )}
                              <button onClick={() => store.deleteTask.mutate(t.id)} className="p-1 rounded text-rose-500 hover:bg-rose-50" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                    {list.length === 0 && <li className="text-[11px] text-slate-400 italic py-2">Nothing here</li>}
                  </ul>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* REQUESTS */}
      {sub === 'requests' && (
        store.requests.length === 0 ? (
          <EmptyState icon={Plus} title="No requests" description="Submit loan / advance / reimbursement / uniform / tool requests."
            actionLabel="New request" onAction={() => setReqOpen(true)} />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Kind</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  <th className="py-3 px-5 text-left">Reason</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {store.requests.map(r => (
                  <tr key={r.id}>
                    <td className="py-3 px-5"><Badge variant="info">{r.kind}</Badge></td>
                    <td className="py-3 px-5 text-right font-mono">{r.amount ? `KES ${Number(r.amount).toLocaleString()}` : '—'}</td>
                    <td className="py-3 px-5 text-xs text-slate-500 max-w-[240px] truncate">{r.reason}</td>
                    <td className="py-3 px-5"><Badge variant={r.status === 'Approved' || r.status === 'Disbursed' ? 'success' : r.status === 'Rejected' ? 'danger' : r.status === 'Cancelled' ? 'muted' : 'warning'}>{r.status}</Badge></td>
                    <td className="py-3 px-5 text-right">
                      {r.status === 'Pending' && <Button size="sm" variant="ghost" onClick={() => store.cancelRequest.mutate(r.id)}>Cancel</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      )}

      {/* TRAININGS */}
      {sub === 'trainings' && (
        store.trainings.length === 0 ? (
          <EmptyState icon={Award} title="No trainings recorded" description="Log courses, certifications, and CPD hours."
            actionLabel="Log training" onAction={() => setTrainOpen(true)} />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Title</th>
                  <th className="py-3 px-5 text-left">Provider</th>
                  <th className="py-3 px-5">Dates</th>
                  <th className="py-3 px-5 text-right">Hours</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {store.trainings.map(t => (
                  <tr key={t.id}>
                    <td className="py-3 px-5 font-semibold">{t.title}</td>
                    <td className="py-3 px-5 text-xs">{t.provider ?? '—'}</td>
                    <td className="py-3 px-5 text-xs">{t.starts_on ?? '—'} → {t.ends_on ?? '—'}</td>
                    <td className="py-3 px-5 text-right font-mono">{t.hours ?? '—'}</td>
                    <td className="py-3 px-5"><Badge variant={t.status === 'Completed' ? 'success' : 'muted'}>{t.status ?? '—'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      )}

      {/* Dialogs */}
      <Dialog isOpen={taskOpen} onClose={() => setTaskOpen(false)} title="Add task" maxWidth="md">
        <div className="space-y-3">
          <Input label="Title" value={taskForm.title ?? ''} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
          <Textarea label="Description" value={taskForm.description ?? ''} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Due date" type="date" value={taskForm.due_date ?? ''} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
            <Select label="Priority" options={TASK_PRIORITIES.map(p => ({ value: p, label: p }))} value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} />
          </div>
          <Input label="Category" value={taskForm.category ?? ''} onChange={e => setTaskForm({ ...taskForm, category: e.target.value })} placeholder="e.g. Meeting, Inspection, Supply run" />
          <Button variant="primary" className="w-full" onClick={submitTask}>Save task</Button>
        </div>
      </Dialog>

      <Dialog isOpen={woOpen} onClose={() => setWoOpen(false)} title="Report a work order" maxWidth="lg">
        <div className="space-y-3">
          <Input label="Title" value={woForm.title ?? ''} onChange={e => setWoForm({ ...woForm, title: e.target.value })} placeholder="Leaky tap in staff room" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Kind" options={WORK_ORDER_KINDS.map(k => ({ value: k, label: k }))} value={woForm.kind} onChange={e => setWoForm({ ...woForm, kind: e.target.value })} />
            <Select label="Priority" options={TASK_PRIORITIES.map(p => ({ value: p, label: p }))} value={woForm.priority} onChange={e => setWoForm({ ...woForm, priority: e.target.value })} />
            <Input label="Due date" type="date" value={woForm.due_date ?? ''} onChange={e => setWoForm({ ...woForm, due_date: e.target.value })} />
          </div>
          <Input label="Location" value={woForm.location ?? ''} onChange={e => setWoForm({ ...woForm, location: e.target.value })} />
          <Textarea label="Description" value={woForm.description ?? ''} onChange={e => setWoForm({ ...woForm, description: e.target.value })} />
          <Input label="Materials needed" value={woForm.materials_needed ?? ''} onChange={e => setWoForm({ ...woForm, materials_needed: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={submitWo}>Report</Button>
        </div>
      </Dialog>

      {/* NEW STAFF REQUEST — with UPGRADED inventory picker */}
      <Dialog isOpen={reqOpen} onClose={() => { setReqOpen(false); setInventoryCategoryFilter('ALL'); }} title="New staff request" maxWidth="md">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Kind" options={REQUEST_KINDS.map(k => ({ value: k, label: k }))} value={reqForm.kind}
              onChange={e => { setReqForm({ ...reqForm, kind: e.target.value, inventory_item_id: undefined, reserved_quantity: undefined }); setInventoryCategoryFilter('ALL'); }} />
            <Input label="Amount (KES)" type="number" value={reqForm.amount ?? ''} onChange={e => setReqForm({ ...reqForm, amount: e.target.value })} />
          </div>

          {needsItemPicker && (
            <div className="p-3 rounded-xl bg-[#e8f1fc] dark:bg-blue-950/30 border border-[#08428C]/20 space-y-3">
              <p className="text-[11px] font-bold uppercase text-[#08428C]">Item from stores</p>

              {store.inventoryItems.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No items in inventory yet — HR will need to add them first.</p>
              ) : (
                <>
                  {/* Category filter chips */}
                  {inventoryCategories.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Filter by category</p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => { setInventoryCategoryFilter('ALL'); setReqForm({ ...reqForm, inventory_item_id: undefined }); }}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-colors ${
                            inventoryCategoryFilter === 'ALL'
                              ? 'bg-[#08428C] text-white'
                              : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 hover:border-[#08428C]/40'
                          }`}
                        >
                          All ({store.inventoryItems.length})
                        </button>
                        {inventoryCategories.map(cat => {
                          const count = store.inventoryItems.filter((i: any) => i.category === cat).length;
                          return (
                            <button
                              key={cat}
                              onClick={() => { setInventoryCategoryFilter(cat); setReqForm({ ...reqForm, inventory_item_id: undefined }); }}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-colors ${
                                inventoryCategoryFilter === cat
                                  ? 'bg-[#08428C] text-white'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 hover:border-[#08428C]/40'
                              }`}
                            >
                              {cat} ({count})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Item picker with richer labels */}
                  <Select
                    label="Pick an item"
                    options={[
                      { value: '', label: '— Select —' },
                      ...filteredInventory.map((i: any) => ({
                        value: i.id,
                        label:
                          `${i.name}` +
                          (i.item_code ? ` (${i.item_code})` : '') +
                          ` · ${i.quantity_on_hand} ${i.unit ?? 'pcs'}` +
                          (i.category ? ` · ${i.category}` : '') +
                          (i.quantity_on_hand <= 0 ? ' — OUT OF STOCK' : ''),
                      })),
                    ]}
                    value={reqForm.inventory_item_id ?? ''}
                    onChange={e => setReqForm({ ...reqForm, inventory_item_id: e.target.value })}
                  />

                  {filteredInventory.length === 0 && inventoryCategoryFilter !== 'ALL' && (
                    <p className="text-[11px] text-slate-500 italic">
                      No items in "{inventoryCategoryFilter}". Try another category or "All".
                    </p>
                  )}

                  {/* Selected-item info card */}
                  {selectedItem && (
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-sm">{selectedItem.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {selectedItem.item_code ?? '—'}{selectedItem.category && <> · {selectedItem.category}</>}
                          </p>
                        </div>
                        <Badge variant={selectedItem.quantity_on_hand <= 0 ? 'danger' : selectedItem.quantity_on_hand < 5 ? 'warning' : 'success'}>
                          {selectedItem.quantity_on_hand} {selectedItem.unit ?? 'pcs'} left
                        </Badge>
                      </div>
                    </div>
                  )}

                  <Input
                    label="Quantity requested"
                    type="number"
                    min={1}
                    value={reqForm.reserved_quantity ?? ''}
                    onChange={e => setReqForm({ ...reqForm, reserved_quantity: e.target.value })}
                    disabled={!reqForm.inventory_item_id}
                  />

                  {reqForm.inventory_item_id && selectedItem && (() => {
                    const qty = Number(reqForm.reserved_quantity) || 0;
                    if (qty > 0 && qty > Number(selectedItem.quantity_on_hand)) {
                      return (
                        <p className="text-[11px] text-rose-600 font-bold">
                          ⚠ Only {selectedItem.quantity_on_hand} {selectedItem.unit ?? 'pcs'} available in stock.
                        </p>
                      );
                    }
                    if (selectedItem.quantity_on_hand <= 0) {
                      return (
                        <p className="text-[11px] text-rose-600 font-bold">
                          ⚠ This item is currently out of stock.
                        </p>
                      );
                    }
                    return null;
                  })()}

                  <p className="text-[10px] text-slate-500">
                    Once approved by HR, {reqForm.reserved_quantity || 'the requested quantity'} will be automatically deducted from stores.
                  </p>
                </>
              )}
            </div>
          )}

          <Textarea label="Reason" value={reqForm.reason ?? ''} onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} />
          <Input label="Attachment URL" value={reqForm.attachment_url ?? ''} onChange={e => setReqForm({ ...reqForm, attachment_url: e.target.value })} placeholder="Optional receipt or supporting doc" />
          <Button variant="primary" className="w-full" onClick={submitReq} isLoading={store.createRequest.isPending}>Submit</Button>
        </div>
      </Dialog>

      <Dialog isOpen={trainOpen} onClose={() => setTrainOpen(false)} title="Log training" maxWidth="md">
        <div className="space-y-3">
          <Input label="Title" value={trainForm.title ?? ''} onChange={e => setTrainForm({ ...trainForm, title: e.target.value })} />
          <Input label="Provider" value={trainForm.provider ?? ''} onChange={e => setTrainForm({ ...trainForm, provider: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Starts" type="date" value={trainForm.starts_on ?? ''} onChange={e => setTrainForm({ ...trainForm, starts_on: e.target.value })} />
            <Input label="Ends" type="date" value={trainForm.ends_on ?? ''} onChange={e => setTrainForm({ ...trainForm, ends_on: e.target.value })} />
            <Input label="Hours" type="number" value={trainForm.hours ?? ''} onChange={e => setTrainForm({ ...trainForm, hours: e.target.value })} />
          </div>
          <Input label="Certificate URL" value={trainForm.certificate_url ?? ''} onChange={e => setTrainForm({ ...trainForm, certificate_url: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={submitTrain}>Save</Button>
        </div>
      </Dialog>

      {/* Request shift swap dialog */}
      {swapOpen && (
        <Dialog isOpen onClose={() => setSwapOpen(null)} title="Request shift swap" maxWidth="lg">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <p className="text-[10px] font-bold uppercase text-slate-400">Your shift to give up</p>
              <p className="font-semibold mt-1">
                {new Date(swapOpen.shift_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              <p className="text-slate-500">{swapOpen.kind} · {swapOpen.starts_at.slice(0,5)} → {swapOpen.ends_at.slice(0,5)}{swapOpen.location && ` · ${swapOpen.location}`}</p>
            </div>

            <Select
              label="Swap with"
              options={[
                { value: '', label: '— Choose a colleague —' },
                ...store.colleagues.map((c: any) => ({
                  value: c.id,
                  label: `${c.first_name} ${c.last_name}${c.designation ? ` · ${c.designation}` : ''}`,
                })),
              ]}
              value={swapResponderId}
              onChange={e => setSwapResponderId(e.target.value)}
            />

            {swapResponderId && (
              <Select
                label="Their shift to take in exchange (optional)"
                options={[
                  { value: '', label: '— No exchange, just cover for me —' },
                  ...swapResponderShifts.map((s: any) => ({
                    value: s.id,
                    label: `${s.shift_date} · ${s.kind} · ${s.starts_at.slice(0,5)}–${s.ends_at.slice(0,5)}${s.location ? ` · ${s.location}` : ''}`,
                  })),
                ]}
                value={swapResponderShiftId}
                onChange={e => setSwapResponderShiftId(e.target.value)}
              />
            )}

            <Textarea label="Reason (optional)" value={swapReason} onChange={e => setSwapReason(e.target.value)} placeholder="e.g. Medical appointment · Family event" />

            <p className="text-[11px] text-slate-500">
              Your colleague will get a notification to accept or decline. When accepted, the swap is applied automatically.
            </p>

            <Button variant="primary" className="w-full" onClick={submitSwap} isLoading={store.requestShiftSwap.isPending} disabled={!swapResponderId}>
              <RefreshCw className="w-4 h-4" /> Send swap request
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};