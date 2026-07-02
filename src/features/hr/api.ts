import { supabase } from '@/lib/supabase/client';
import type {
  Appraisal, Attendance, Department, HrAudit, LeaveBalance, LeaveRequest,
  PayComponentCatalog, PayrollRun, Payslip, PayslipLine, Staff, StaffDocument,
  StaffPayAssignment, StaffSkill, SyllabusProgress, WorkloadAssignment,
} from './types';


/* ---------- Fetchers ---------- */
export async function fetchDepartments(): Promise<Department[]> {
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchStaff(): Promise<Staff[]> {
  const { data, error } = await supabase.from('staff').select('*').order('first_name');
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchStaffDocuments(staffId?: string): Promise<StaffDocument[]> {
  let q = supabase.from('staff_documents').select('*').order('uploaded_at', { ascending: false });
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function fetchAttendance(from?: string, to?: string, staffId?: string): Promise<Attendance[]> {
  let q = supabase.from('staff_attendance').select('*').order('date', { ascending: false });
  if (from) q = q.gte('date', from);
  if (to)   q = q.lte('date', to);
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function fetchLeaveRequests(): Promise<LeaveRequest[]> {
  const { data, error } = await supabase.from('leave_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchLeaveBalances(year?: number): Promise<LeaveBalance[]> {
  let q = supabase.from('leave_balances').select('*');
  if (year) q = q.eq('year', year);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function fetchPayComponents(): Promise<PayComponentCatalog[]> {
  const { data, error } = await supabase.from('pay_components_catalog').select('*').order('kind').order('name');
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchStaffPayAssignments(staffId?: string): Promise<StaffPayAssignment[]> {
  let q = supabase.from('staff_pay_assignments').select('*');
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function fetchPayrollRuns(): Promise<PayrollRun[]> {
  const { data, error } = await supabase.from('payroll_runs').select('*').order('period_year', { ascending: false }).order('period_month', { ascending: false });
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchPayslipsForRun(runId: string): Promise<Payslip[]> {
  const { data, error } = await supabase.from('payslips').select('*').eq('payroll_run_id', runId);
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchPayslipLines(payslipId: string): Promise<PayslipLine[]> {
  const { data, error } = await supabase.from('payslip_lines').select('*').eq('payslip_id', payslipId);
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchWorkload(staffId?: string): Promise<WorkloadAssignment[]> {
  let q = supabase.from('workload_assignments').select('*');
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function fetchSyllabusProgress(assignmentId?: string): Promise<SyllabusProgress[]> {
  let q = supabase.from('syllabus_progress').select('*');
  if (assignmentId) q = q.eq('assignment_id', assignmentId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function fetchAppraisals(staffId?: string): Promise<Appraisal[]> {
  let q = supabase.from('appraisals').select('*').order('created_at', { ascending: false });
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function fetchSkills(staffId?: string): Promise<StaffSkill[]> {
  let q = supabase.from('staff_skills').select('*');
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function fetchAudit(limit = 200): Promise<HrAudit[]> {
  const { data, error } = await supabase.from('hr_audit').select('*').order('date', { ascending: false }).limit(limit);
  if (error) throw error; return (data ?? []) as any;
}

/* ---------- Staff mutations ---------- */
export async function createStaff(input: Partial<Staff> & { first_name: string; last_name: string }): Promise<Staff> {
  const { data, error } = await supabase.from('staff').insert({
    staff_type: 'Teaching', work_category: 'Full-time', status: 'Active',
    date_of_hire: new Date().toISOString().slice(0, 10),
    basic_salary: 0,
    qualifications: [], certifications: [],
    ...input,
  }).select('*').single();
  if (error) throw error; return data as any;
}
export async function updateStaff(id: string, patch: Partial<Staff>) {
  const { error } = await supabase.from('staff').update(patch).eq('id', id);
  if (error) throw error;
}
export async function deleteStaff(id: string) {
  const { error } = await supabase.from('staff').delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Documents ---------- */
export async function addStaffDocument(input: Partial<StaffDocument> & { staff_id: string; doc_type: string; file_name: string }) {
  const { error } = await supabase.from('staff_documents').insert(input);
  if (error) throw error;
}
export async function deleteStaffDocument(id: string) {
  const { error } = await supabase.from('staff_documents').delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Attendance ---------- */
export async function upsertAttendance(input: {
  staff_id: string; date?: string; status?: string;
  check_in?: string | null; check_out?: string | null; method?: string; notes?: string;
}) {
  const row = { ...input, date: input.date ?? new Date().toISOString().slice(0, 10) };
  const { error } = await supabase.from('staff_attendance').upsert(row, { onConflict: 'staff_id,date' });
  if (error) throw error;
}
export async function checkIn(staffId: string, method = 'Web') {
  await upsertAttendance({ staff_id: staffId, check_in: new Date().toISOString(), method, status: 'Present' });
}
export async function checkOut(staffId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('staff_attendance').update({ check_out: new Date().toISOString() })
    .eq('staff_id', staffId).eq('date', today);
  if (error) throw error;
}

/* ---------- Leave ---------- */
export async function createLeaveRequest(input: Partial<LeaveRequest> & { staff_id: string; leave_type: any; start_date: string; end_date: string; days: number }) {
  const { error } = await supabase.from('leave_requests').insert({ ...input, status: 'Pending' });
  if (error) throw error;
}
export async function decideLeave(id: string, decision: 'Approved' | 'Rejected', approver: string, note?: string) {
  const { error } = await supabase.from('leave_requests').update({
    status: decision, approved_by: approver, approved_at: new Date().toISOString(), decision_note: note,
  }).eq('id', id);
  if (error) throw error;
}
export async function cancelLeave(id: string) {
  const { error } = await supabase.from('leave_requests').update({ status: 'Cancelled' }).eq('id', id);
  if (error) throw error;
}

/* ---------- Payroll ---------- */
export async function addPayAssignment(staffId: string, componentId: string, amount: number) {
  const { error } = await supabase.from('staff_pay_assignments').upsert({ staff_id: staffId, component_id: componentId, amount, active: true },
    { onConflict: 'staff_id,component_id' });
  if (error) throw error;
}
export async function removePayAssignment(id: string) {
  const { error } = await supabase.from('staff_pay_assignments').delete().eq('id', id);
  if (error) throw error;
}
export async function runPayroll(year: number, month: number, actor: string): Promise<string> {
  const { data, error } = await supabase.rpc('payroll_run_process', { _year: year, _month: month, _actor: actor });
  if (error) throw error; return data as string;
}
export async function approvePayrollRun(runId: string, approver: string) {
  const { error } = await supabase.from('payroll_runs').update({ status: 'Approved', approved_by: approver }).eq('id', runId);
  if (error) throw error;
}
export async function markPayrollPaid(runId: string) {
  const { error } = await supabase.from('payroll_runs').update({ status: 'Paid', paid_on: new Date().toISOString().slice(0, 10) }).eq('id', runId);
  if (error) throw error;
}

/* ---------- Workload ---------- */
export async function addWorkload(input: Omit<WorkloadAssignment, 'id'>) {
  const { error } = await supabase.from('workload_assignments').insert(input);
  if (error) throw error;
}
export async function deleteWorkload(id: string) {
  const { error } = await supabase.from('workload_assignments').delete().eq('id', id);
  if (error) throw error;
}
export async function updateSyllabus(id: string, patch: Partial<SyllabusProgress>) {
  const { error } = await supabase.from('syllabus_progress').update(patch).eq('id', id);
  if (error) throw error;
}
export async function addSyllabusRow(input: Omit<SyllabusProgress, 'id'>) {
  const { error } = await supabase.from('syllabus_progress').insert(input);
  if (error) throw error;
}

/* ---------- Performance ---------- */
export async function upsertAppraisal(input: Partial<Appraisal> & { staff_id: string; period_label: string }) {
  const { error } = await supabase.from('appraisals').upsert(input, { onConflict: 'staff_id,period_label' });
  if (error) throw error;
}
export async function addSkill(input: Omit<StaffSkill, 'id'>) {
  const { error } = await supabase.from('staff_skills').insert(input);
  if (error) throw error;
}
export async function removeSkill(id: string) {
  const { error } = await supabase.from('staff_skills').delete().eq('id', id);
  if (error) throw error;
}
export async function issueStaffPortalCredentials(staffId: string) {
  const { data, error } = await supabase.rpc('staff_portal_provision', { _staff_id: staffId });
  if (error) throw error;
  const row = (data ?? [])[0];
  return row ? { username: row.out_username, password: row.out_password } : null;
}

export async function fetchStaffPortalAccount(staffId: string) {
  const { data, error } = await supabase
    .from('portal_accounts')
    .select('id, username, must_change_password, last_login_at, is_active, created_at')
    .eq('staff_id', staffId)
    .eq('account_type', 'staff')
    .maybeSingle();
  if (error) throw error;
  return data;
}