import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

const KEY = 'edusync_staff_portal_session';

export interface StaffPortalSession {
  id: string; account_type: string; full_name: string;
  must_change_password?: boolean; email?: string; phone?: string;
}

export function useStaffPortalSession() {
  const [session, setSession] = useState<StaffPortalSession | null>(() => {
    try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const persist = (s: StaffPortalSession | null) => {
    if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY);
    setSession(s);
  };
  return { session, setSession: persist };
}

export function useStaffPortalStore(session: StaffPortalSession) {
  const qc = useQueryClient();

  const meQ         = useQuery({ queryKey: ['sp_me', session.id], queryFn: () => api.fetchMe(session.id) });
  const me          = meQ.data ?? null;
  const staffId     = me?.staff_id;
  const isClinical  = !!me?.is_clinical;

  const attendanceQ = useQuery({ queryKey: ['sp_att', staffId],     queryFn: () => staffId ? api.fetchMyAttendance(staffId) : Promise.resolve([]), enabled: !!staffId });
  const shiftsQ     = useQuery({ queryKey: ['sp_shifts', staffId],  queryFn: () => staffId ? api.fetchMyShifts(staffId)     : Promise.resolve([]), enabled: !!staffId });
  const workOrdersQ = useQuery({ queryKey: ['sp_wo', staffId],      queryFn: () => staffId ? api.fetchMyWorkOrders(staffId) : Promise.resolve([]), enabled: !!staffId });
  const leaveReqQ   = useQuery({ queryKey: ['sp_leave', staffId],   queryFn: () => staffId ? api.fetchMyLeaveRequests(staffId) : Promise.resolve([]), enabled: !!staffId });
  const leaveBalQ   = useQuery({ queryKey: ['sp_leave_bal', staffId], queryFn: () => staffId ? api.fetchMyLeaveBalances(staffId) : Promise.resolve([]), enabled: !!staffId });
  const payslipsQ   = useQuery({ queryKey: ['sp_payslips', staffId], queryFn: () => staffId ? api.fetchMyPayslips(staffId)   : Promise.resolve([]), enabled: !!staffId });
  const documentsQ  = useQuery({ queryKey: ['sp_docs', staffId],    queryFn: () => staffId ? api.fetchMyDocuments(staffId)  : Promise.resolve([]), enabled: !!staffId });
  const tasksQ      = useQuery({ queryKey: ['sp_tasks', staffId],   queryFn: () => staffId ? api.fetchMyTasks(staffId)      : Promise.resolve([]), enabled: !!staffId });
  const messagesQ   = useQuery({ queryKey: ['sp_msgs', staffId],    queryFn: () => staffId ? api.fetchMyMessages(staffId)   : Promise.resolve([]), enabled: !!staffId });
  const noticesQ    = useQuery({ queryKey: ['sp_notices'],           queryFn: api.fetchNotices });
  const requestsQ   = useQuery({ queryKey: ['sp_reqs', staffId],    queryFn: () => staffId ? api.fetchMyRequests(staffId)   : Promise.resolve([]), enabled: !!staffId });
  const trainingsQ  = useQuery({ queryKey: ['sp_train', staffId],   queryFn: () => staffId ? api.fetchMyTrainings(staffId)  : Promise.resolve([]), enabled: !!staffId });
  const studentsQ   = useQuery({ queryKey: ['sp_students'],          queryFn: api.fetchStudentsLite, enabled: isClinical });
  const visitsQ     = useQuery({ queryKey: ['sp_clinic'],            queryFn: () => api.fetchClinicVisits(), enabled: isClinical });

  // NEW: inventory + colleagues + shift swaps
  const inventoryQ  = useQuery({ queryKey: ['sp_inventory'],         queryFn: api.fetchInventoryItems });
  const colleaguesQ = useQuery({ queryKey: ['sp_colleagues', staffId], queryFn: () => staffId ? api.fetchColleagues(staffId) : Promise.resolve([]), enabled: !!staffId });
  const swapsQ      = useQuery({ queryKey: ['sp_swaps', staffId],    queryFn: () => staffId ? api.fetchMyShiftSwaps(staffId) : Promise.resolve([]), enabled: !!staffId });

  const attendance = attendanceQ.data ?? [];
  const shifts     = shiftsQ.data ?? [];
  const workOrders = workOrdersQ.data ?? [];
  const leaveRequests = leaveReqQ.data ?? [];
  const leaveBalances = leaveBalQ.data ?? [];
  const payslips   = payslipsQ.data ?? [];
  const documents  = documentsQ.data ?? [];
  const tasks      = tasksQ.data ?? [];
  const messages   = messagesQ.data ?? [];
  const notices    = noticesQ.data ?? [];
  const requests   = requestsQ.data ?? [];
  const trainings  = trainingsQ.data ?? [];
  const students   = (studentsQ.data ?? []) as any[];
  const clinicVisits = visitsQ.data ?? [];
  const inventoryItems = (inventoryQ.data ?? []) as any[];
  const colleagues = (colleaguesQ.data ?? []) as any[];
  const shiftSwaps = (swapsQ.data ?? []) as any[];

  const isLoading = meQ.isLoading;
  const errors = [
    meQ.error, attendanceQ.error, shiftsQ.error, workOrdersQ.error, leaveReqQ.error,
    leaveBalQ.error, payslipsQ.error, documentsQ.error, tasksQ.error, messagesQ.error,
    noticesQ.error, requestsQ.error, trainingsQ.error, studentsQ.error, visitsQ.error,
    inventoryQ.error, colleaguesQ.error, swapsQ.error,
  ].filter(Boolean) as Error[];

  const inv = (k: string) => qc.invalidateQueries({ queryKey: [k] });

  // Existing mutations
  const updateProfile = useMutation({ mutationFn: (patch: any) => api.updateMyProfile(staffId!, patch), onSuccess: () => inv('sp_me') });
  const checkIn       = useMutation({ mutationFn: () => api.myCheckIn(session.id), onSuccess: () => inv('sp_att') });
  const checkOut      = useMutation({ mutationFn: () => api.myCheckOut(session.id), onSuccess: () => inv('sp_att') });

  const createWorkOrder = useMutation({ mutationFn: (o: any) => api.createWorkOrder({ ...o, reported_by: staffId }), onSuccess: () => inv('sp_wo') });
  const updateWorkOrder = useMutation({ mutationFn: (p: any) => api.updateWorkOrder(p.id, p.patch), onSuccess: () => inv('sp_wo') });

  const applyLeave    = useMutation({ mutationFn: (p: any) => api.applyLeave(session.id, p.leave_type, p.start_date, p.end_date, p.days, p.reason), onSuccess: () => { inv('sp_leave'); inv('sp_leave_bal'); } });
  const cancelLeave   = useMutation({ mutationFn: (id: string) => api.cancelMyLeave(id), onSuccess: () => { inv('sp_leave'); inv('sp_leave_bal'); } });

  const uploadDoc     = useMutation({ mutationFn: (doc: any) => api.uploadMyDocument(staffId!, doc), onSuccess: () => inv('sp_docs') });
  const removeDoc     = useMutation({ mutationFn: (id: string) => api.deleteMyDocument(id), onSuccess: () => inv('sp_docs') });

  const upsertTask    = useMutation({ mutationFn: (t: any) => api.upsertMyTask({ ...t, staff_id: staffId! }), onSuccess: () => inv('sp_tasks') });
  const deleteTask    = useMutation({ mutationFn: (id: string) => api.deleteMyTask(id), onSuccess: () => inv('sp_tasks') });
  const completeTask  = useMutation({ mutationFn: (id: string) => api.completeTask(id), onSuccess: () => inv('sp_tasks') });

  const sendMessage   = useMutation({ mutationFn: (m: any) => api.sendMessage({ ...m, from_staff_id: staffId! }), onSuccess: () => inv('sp_msgs') });
  const readMessage   = useMutation({ mutationFn: (id: string) => api.markMessageRead(id), onSuccess: () => inv('sp_msgs') });

  const createRequest = useMutation({ mutationFn: (r: any) => api.createRequest({ ...r, staff_id: staffId! }), onSuccess: () => { inv('sp_reqs'); inv('sp_inventory'); } });
  const cancelRequest = useMutation({ mutationFn: (id: string) => api.cancelRequest(id), onSuccess: () => inv('sp_reqs') });

  const upsertTraining = useMutation({ mutationFn: (t: any) => api.upsertTraining({ ...t, staff_id: staffId! }), onSuccess: () => inv('sp_train') });

  const createVisit    = useMutation({ mutationFn: api.createClinicVisit, onSuccess: () => inv('sp_clinic') });
  const updateVisit    = useMutation({ mutationFn: (p: any) => api.updateClinicVisit(p.id, p.patch), onSuccess: () => inv('sp_clinic') });
  const addDispensation = useMutation({ mutationFn: api.addDispensation, onSuccess: () => inv('sp_clinic') });
  const addReferral     = useMutation({ mutationFn: api.addReferral, onSuccess: () => inv('sp_clinic') });

  // NEW: shift-swap mutations
  const requestShiftSwap = useMutation({
    mutationFn: (p: { responder_id: string; requester_shift_id: string; responder_shift_id?: string; reason?: string }) =>
      api.createShiftSwap({ ...p, requester_id: staffId! }),
    onSuccess: () => inv('sp_swaps'),
  });
  const respondShiftSwap = useMutation({
    mutationFn: (p: { id: string; accept: boolean }) => api.respondShiftSwap(p.id, p.accept),
    onSuccess: () => { inv('sp_swaps'); inv('sp_shifts'); },
  });
  const cancelShiftSwap = useMutation({
    mutationFn: (id: string) => api.cancelShiftSwap(id),
    onSuccess: () => inv('sp_swaps'),
  });

  // Derived
  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = useMemo(() => attendance.find(a => a.date === today), [attendance, today]);
  const todayShift      = useMemo(() => shifts.find(s => s.shift_date === today), [shifts, today]);
  const openTasks       = useMemo(() => tasks.filter(t => t.status !== 'Done' && t.status !== 'Cancelled'), [tasks]);
  const overdueTasks    = useMemo(() => openTasks.filter(t => t.due_date && new Date(t.due_date) < new Date(today)), [openTasks, today]);
  const unreadMessages  = useMemo(() => messages.filter(m => !m.read_at && m.to_staff_id === staffId).length, [messages, staffId]);
  const pendingLeaves   = useMemo(() => leaveRequests.filter(l => l.status === 'Pending').length, [leaveRequests]);
  const openWorkOrders  = useMemo(() => workOrders.filter(w => w.assigned_to === staffId && !['Completed','Verified','Cancelled'].includes(w.status)), [workOrders, staffId]);
  const pendingSwapsForMe = useMemo(() => shiftSwaps.filter((s: any) => s.responder_id === staffId && s.status === 'Pending').length, [shiftSwaps, staffId]);

  return {
    me, staffId, isClinical, isLoading, errors,
    attendance, shifts, workOrders, leaveRequests, leaveBalances, payslips, documents,
    tasks, messages, notices, requests, trainings, students, clinicVisits,
    inventoryItems, colleagues, shiftSwaps,
    todayAttendance, todayShift, openTasks, overdueTasks, unreadMessages,
    pendingLeaves, openWorkOrders, pendingSwapsForMe,
    // mutations
    updateProfile, checkIn, checkOut,
    createWorkOrder, updateWorkOrder,
    applyLeave, cancelLeave,
    uploadDoc, removeDoc,
    upsertTask, deleteTask, completeTask,
    sendMessage, readMessage,
    createRequest, cancelRequest,
    upsertTraining,
    createVisit, updateVisit, addDispensation, addReferral,
    requestShiftSwap, respondShiftSwap, cancelShiftSwap,
  };
}

export function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}