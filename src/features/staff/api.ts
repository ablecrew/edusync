import { supabase } from '@/lib/supabase/client';
import type {
  ClinicDispensation, ClinicReferral, ClinicVisit, MeProfile, MyAttendance, MyDocument,
  MyLeaveBalance, MyLeaveRequest, MyMessage, MyNotice, MyPayslip, MyRequest, MyShift,
  MyTask, MyTraining, MyWorkOrder,
} from './types';

/* ---------- Session helpers (reuse shared portal auth) ---------- */
export async function portalLogin(username: string, password: string) {
  const { data, error } = await supabase.rpc('portal_login', { _username: username, _password: password });
  if (error) throw error;
  const row = (data ?? [])[0]; if (!row) return null;
  return {
    id: row.out_id, account_type: row.out_account_type,
    full_name: row.out_full_name, must_change_password: row.out_must_change_password,
    email: row.out_email, phone: row.out_phone,
  };
}
export async function portalChangePassword(accountId: string, oldPass: string, newPass: string) {
  const { data, error } = await supabase.rpc('portal_change_password', { _account_id: accountId, _old: oldPass, _new: newPass });
  if (error) throw error;
  return data as boolean;
}

/* ---------- Me ---------- */
export async function fetchMe(accountId: string): Promise<MeProfile | null> {
  const { data, error } = await supabase.rpc('staff_portal_me', { _account_id: accountId });
  if (error) throw error;
  return ((data ?? [])[0] ?? null) as any;
}
export async function updateMyProfile(staffId: string, patch: Partial<MeProfile>) {
  const allowed: any = {};
  ['phone','email','address','emergency_name','emergency_phone','emergency_relation','photo_url','bank_name','bank_account_no']
    .forEach(k => { if ((patch as any)[k] !== undefined) allowed[k] = (patch as any)[k]; });
  const { error } = await supabase.from('staff').update(allowed).eq('id', staffId);
  if (error) throw error;
}

/* ---------- Attendance ---------- */
export async function fetchMyAttendance(staffId: string): Promise<MyAttendance[]> {
  const { data, error } = await supabase.from('staff_attendance').select('*').eq('staff_id', staffId).order('date', { ascending: false }).limit(90);
  if (error) throw error; return (data ?? []) as any;
}
export async function myCheckIn(accountId: string, method = 'Web') {
  const { error } = await supabase.rpc('staff_portal_checkin', { _account_id: accountId, _method: method });
  if (error) throw error;
}
export async function myCheckOut(accountId: string) {
  const { error } = await supabase.rpc('staff_portal_checkout', { _account_id: accountId });
  if (error) throw error;
}

/* ---------- Shifts ---------- */
export async function fetchMyShifts(staffId: string): Promise<MyShift[]> {
  const from = new Date(); from.setDate(from.getDate() - 7);
  const { data, error } = await supabase.from('staff_shifts').select('*')
    .eq('staff_id', staffId).gte('shift_date', from.toISOString().slice(0, 10))
    .order('shift_date').order('starts_at');
  if (error) throw error; return (data ?? []) as any;
}

/* ---------- Work orders ---------- */
export async function fetchMyWorkOrders(staffId: string): Promise<MyWorkOrder[]> {
  const { data, error } = await supabase.from('work_orders').select('*')
    .or(`assigned_to.eq.${staffId},reported_by.eq.${staffId}`)
    .order('reported_at', { ascending: false }).limit(100);
  if (error) throw error; return (data ?? []) as any;
}
export async function createWorkOrder(input: Partial<MyWorkOrder> & { title: string; kind: any }) {
  const { error } = await supabase.from('work_orders').insert(input);
  if (error) throw error;
}
export async function updateWorkOrder(id: string, patch: Partial<MyWorkOrder>) {
  const { error } = await supabase.from('work_orders').update(patch).eq('id', id);
  if (error) throw error;
}

/* ---------- Leave ---------- */
export async function fetchMyLeaveRequests(staffId: string): Promise<MyLeaveRequest[]> {
  const { data, error } = await supabase.from('leave_requests').select('*').eq('staff_id', staffId).order('created_at', { ascending: false });
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchMyLeaveBalances(staffId: string): Promise<MyLeaveBalance[]> {
  const { data, error } = await supabase.from('leave_balances').select('*').eq('staff_id', staffId).eq('year', new Date().getFullYear());
  if (error) throw error; return (data ?? []) as any;
}
export async function applyLeave(accountId: string, leave_type: string, start_date: string, end_date: string, days: number, reason: string) {
  const { error } = await supabase.rpc('staff_portal_apply_leave', {
    _account_id: accountId, _leave_type: leave_type, _start_date: start_date, _end_date: end_date, _days: days, _reason: reason,
  });
  if (error) throw error;
}
export async function cancelMyLeave(id: string) {
  const { error } = await supabase.from('leave_requests').update({ status: 'Cancelled' }).eq('id', id);
  if (error) throw error;
}

/* ---------- Payslips ---------- */
export async function fetchMyPayslips(staffId: string): Promise<MyPayslip[]> {
  const { data, error } = await supabase.from('payslips').select('*').eq('staff_id', staffId).order('created_at', { ascending: false });
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchMyPayslipLines(payslipId: string) {
  const { data, error } = await supabase.from('payslip_lines').select('*').eq('payslip_id', payslipId);
  if (error) throw error; return data ?? [];
}
export async function fetchPayrollRun(runId: string) {
  const { data, error } = await supabase.from('payroll_runs').select('*').eq('id', runId).single();
  if (error) throw error; return data;
}

/* ---------- Documents ---------- */
export async function fetchMyDocuments(staffId: string): Promise<MyDocument[]> {
  const { data, error } = await supabase.from('staff_documents').select('*').eq('staff_id', staffId).order('uploaded_at', { ascending: false });
  if (error) throw error; return (data ?? []) as any;
}
export async function uploadMyDocument(staffId: string, doc: Partial<MyDocument> & { doc_type: string; file_name: string }) {
  const { error } = await supabase.from('staff_documents').insert({ ...doc, staff_id: staffId, uploaded_by: 'Self-service' });
  if (error) throw error;
}
export async function deleteMyDocument(id: string) {
  const { error } = await supabase.from('staff_documents').delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Tasks, requests, trainings ---------- */
export async function fetchMyTasks(staffId: string): Promise<MyTask[]> {
  const { data, error } = await supabase.from('staff_tasks').select('*').eq('staff_id', staffId).order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error; return (data ?? []) as any;
}
export async function upsertMyTask(input: Partial<MyTask> & { staff_id: string; title: string }) {
  const { error } = await supabase.from('staff_tasks').upsert(input);
  if (error) throw error;
}
export async function completeTask(id: string) {
  const { error } = await supabase.from('staff_tasks').update({ status: 'Done', completed_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
export async function deleteMyTask(id: string) {
  const { error } = await supabase.from('staff_tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchMyRequests(staffId: string): Promise<MyRequest[]> {
  const { data, error } = await supabase.from('staff_requests').select('*').eq('staff_id', staffId).order('created_at', { ascending: false });
  if (error) throw error; return (data ?? []) as any;
}
export async function createRequest(input: Partial<MyRequest> & { staff_id: string; kind: any; reason: string }) {
  const { error } = await supabase.from('staff_requests').insert(input);
  if (error) throw error;
}
export async function cancelRequest(id: string) {
  const { error } = await supabase.from('staff_requests').update({ status: 'Cancelled' }).eq('id', id);
  if (error) throw error;
}

export async function fetchMyTrainings(staffId: string): Promise<MyTraining[]> {
  const { data, error } = await supabase.from('staff_trainings').select('*').eq('staff_id', staffId).order('starts_on', { ascending: false });
  if (error) throw error; return (data ?? []) as any;
}
export async function upsertTraining(input: Partial<MyTraining> & { staff_id: string; title: string }) {
  const { error } = await supabase.from('staff_trainings').upsert(input);
  if (error) throw error;
}

/* ---------- Messages / notices ---------- */
export async function fetchMyMessages(staffId: string): Promise<MyMessage[]> {
  const { data, error } = await supabase.from('teacher_messages')
    .select('*')
    .or(`to_staff_id.eq.${staffId},from_staff_id.eq.${staffId}`)
    .order('created_at', { ascending: false }).limit(200);
  if (error) throw error; return (data ?? []) as any;
}
export async function markMessageRead(id: string) {
  const { error } = await supabase.from('teacher_messages').update({ read_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
export async function sendMessage(input: Partial<MyMessage> & { subject: string; body: string; from_staff_id: string }) {
  const { error } = await supabase.from('teacher_messages').insert({ ...input, scope: input.scope ?? 'Staff' });
  if (error) throw error;
}
export async function fetchNotices(): Promise<MyNotice[]> {
  const { data, error } = await supabase.from('school_notices')
    .select('*').in('audience', ['All','Staff'])
    .order('pinned', { ascending: false }).order('published_at', { ascending: false }).limit(50);
  if (error) throw error; return (data ?? []) as any;
}

/* ---------- Clinic (nurse) ---------- */
export async function fetchClinicVisits(dateFrom?: string): Promise<ClinicVisit[]> {
  let q = supabase.from('clinic_visits').select('*').order('visit_date', { ascending: false }).limit(300);
  if (dateFrom) q = q.gte('visit_date', dateFrom);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function createClinicVisit(input: Partial<ClinicVisit>) {
  const { data, error } = await supabase.from('clinic_visits').insert(input).select('*').single();
  if (error) throw error; return data as ClinicVisit;
}
export async function updateClinicVisit(id: string, patch: Partial<ClinicVisit>) {
  const { error } = await supabase.from('clinic_visits').update(patch).eq('id', id);
  if (error) throw error;
}
export async function fetchDispensations(visitId: string): Promise<ClinicDispensation[]> {
  const { data, error } = await supabase.from('clinic_dispensations').select('*').eq('visit_id', visitId).order('created_at');
  if (error) throw error; return (data ?? []) as any;
}
export async function addDispensation(input: Partial<ClinicDispensation> & { visit_id: string; medication: string }) {
  const { error } = await supabase.from('clinic_dispensations').insert(input);
  if (error) throw error;
}
export async function fetchReferrals(visitId: string): Promise<ClinicReferral[]> {
  const { data, error } = await supabase.from('clinic_referrals').select('*').eq('visit_id', visitId).order('created_at');
  if (error) throw error; return (data ?? []) as any;
}
export async function addReferral(input: Partial<ClinicReferral> & { visit_id: string; referred_to: string }) {
  const { error } = await supabase.from('clinic_referrals').insert(input);
  if (error) throw error;
}
export async function fetchStudentsLite() {
  const { data, error } = await supabase.from('students').select('id, first_name, last_name, admission_number, class_name, guardian_phone').eq('status','Active').order('first_name');
  if (error) throw error; return data ?? [];
}
/* ---------- Inventory (for Uniform / Tools requests) ---------- */
export async function fetchInventoryItems() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, item_code, name, category, quantity, status')
    .in('status', ['Active', 'In Stock', 'Available'])   // remove this line if your `status` column doesn't use these labels
    .order('name');
  if (error) throw error;

  // Normalize to the shape the Duties tab expects: { id, name, quantity_on_hand, unit }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    item_code: r.item_code,
    category: r.category,
    quantity_on_hand: Number(r.quantity ?? 0),
    unit: r.unit ?? 'pcs'
  }));
}

/* ---------- Colleagues (for shift swap responder picker) ---------- */
export async function fetchColleagues(excludeStaffId: string) {
  const { data, error } = await supabase
    .from('staff')
    .select('id, staff_code, first_name, last_name, designation')
    .eq('status', 'Active')
    .neq('staff_type', 'Teaching')
    .neq('id', excludeStaffId)
    .order('first_name');
  if (error) throw error;
  return data ?? [];
}

/* ---------- Shift swaps ---------- */
export async function fetchMyShiftSwaps(staffId: string) {
  const { data, error } = await supabase
    .from('shift_swaps')
    .select('*')
    .or(`requester_id.eq.${staffId},responder_id.eq.${staffId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function fetchShiftsForStaff(staffId: string, fromDate: string) {
  const { data, error } = await supabase
    .from('staff_shifts')
    .select('*')
    .eq('staff_id', staffId)
    .gte('shift_date', fromDate)
    .order('shift_date');
  if (error) throw error;
  return data ?? [];
}
export async function createShiftSwap(input: {
  requester_id: string;
  responder_id: string;
  requester_shift_id: string;
  responder_shift_id?: string;
  reason?: string;
}) {
  const { error } = await supabase.from('shift_swaps').insert({ ...input, status: 'Pending' });
  if (error) throw error;
}
export async function respondShiftSwap(id: string, accept: boolean) {
  const { error } = await supabase
    .from('shift_swaps')
    .update({ status: accept ? 'Accepted' : 'Declined', responded_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
export async function cancelShiftSwap(id: string) {
  const { error } = await supabase
    .from('shift_swaps')
    .update({ status: 'Cancelled' })
    .eq('id', id);
  if (error) throw error;
}