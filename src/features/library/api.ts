import { supabase } from '@/lib/supabase/client';
import type {
  LibraryCopy, LibraryFine, LibraryLoan, LibraryMember, LibraryReservation,
  LibraryResource, LibraryResourceSummary, LibraryRule,
} from './types';

/* ---------- Resources & copies ---------- */
export async function fetchResources(): Promise<LibraryResourceSummary[]> {
  const { data, error } = await supabase.from('library_resource_summary').select('*').order('title');
  if (error) throw error;
  return (data ?? []) as any;
}
export async function fetchCopies(resourceId?: string): Promise<LibraryCopy[]> {
  let q = supabase.from('library_copies').select('*').order('copy_code');
  if (resourceId) q = q.eq('resource_id', resourceId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function createResource(input: Partial<LibraryResource> & { title: string }, copies = 1) {
  const { data: r, error } = await supabase.from('library_resources').insert({
    resource_type: input.resource_type ?? 'Book',
    ...input,
  }).select('*').single();
  if (error) throw error;
  if (copies > 0) {
    const rows = Array.from({ length: copies }, () => ({ resource_id: r.id }));
    const { error: e2 } = await supabase.from('library_copies').insert(rows);
    if (e2) throw e2;
  }
  return r as LibraryResource;
}
export async function updateResource(id: string, patch: Partial<LibraryResource>) {
  const { error } = await supabase.from('library_resources').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
export async function deleteResource(id: string) {
  const { error } = await supabase.from('library_resources').delete().eq('id', id);
  if (error) throw error;
}
export async function addCopies(resourceId: string, n: number) {
  const rows = Array.from({ length: n }, () => ({ resource_id: resourceId }));
  const { error } = await supabase.from('library_copies').insert(rows);
  if (error) throw error;
}
export async function updateCopy(id: string, patch: Partial<LibraryCopy>) {
  const { error } = await supabase.from('library_copies').update(patch).eq('id', id);
  if (error) throw error;
}

/* ---------- Members & rules ---------- */
export async function fetchMembers(): Promise<LibraryMember[]> {
  const { data, error } = await supabase.from('library_members').select('*').order('full_name');
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchRules(): Promise<LibraryRule[]> {
  const { data, error } = await supabase.from('library_rules').select('*').order('member_type');
  if (error) throw error; return (data ?? []) as any;
}
export async function updateRule(id: string, patch: Partial<LibraryRule>) {
  const { error } = await supabase.from('library_rules').update(patch).eq('id', id);
  if (error) throw error;
}
export async function createMember(input: Partial<LibraryMember> & { full_name: string; member_type: LibraryMember['member_type'] }) {
  const { data, error } = await supabase.from('library_members').insert(input).select('*').single();
  if (error) throw error; return data as LibraryMember;
}
export async function enrollStudentAsMember(studentId: string) {
  const { data: s, error } = await supabase.from('students')
    .select('id, first_name, last_name, guardian_email, guardian_phone').eq('id', studentId).single();
  if (error) throw error;
  const { data, error: e2 } = await supabase.from('library_members').insert({
    member_type: 'Student', student_id: s.id,
    full_name: `${s.first_name} ${s.last_name}`, email: s.guardian_email, phone: s.guardian_phone,
  }).select('*').single();
  if (e2) throw e2; return data as LibraryMember;
}
export async function updateMember(id: string, patch: Partial<LibraryMember>) {
  const { error } = await supabase.from('library_members').update(patch).eq('id', id);
  if (error) throw error;
}

/* ---------- Loans (issue / return / renew) ---------- */
export async function fetchLoans(): Promise<LibraryLoan[]> {
  const { data, error } = await supabase.from('library_loans').select('*').order('issue_date', { ascending: false }).limit(500);
  if (error) throw error; return (data ?? []) as any;
}
export async function issueLoan(input: { copy_id: string; member_id: string; days?: number; issued_by?: string }) {
  const days = input.days ?? 14;
  const due = new Date(); due.setDate(due.getDate() + days);
  const { data, error } = await supabase.from('library_loans').insert({
    copy_id: input.copy_id, member_id: input.member_id,
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: due.toISOString().slice(0, 10),
    issued_by: input.issued_by,
  }).select('*').single();
  if (error) throw error; return data as LibraryLoan;
}
export async function returnLoan(loanId: string, opts?: { condition_in?: string; returned_to?: string; notes?: string }) {
  const { error } = await supabase.from('library_loans').update({
    return_date: new Date().toISOString().slice(0, 10),
    condition_in: opts?.condition_in, returned_to: opts?.returned_to, notes: opts?.notes,
  }).eq('id', loanId);
  if (error) throw error;
}
export async function renewLoan(loanId: string, extraDays = 7) {
  const { data: l, error } = await supabase.from('library_loans').select('due_date, renewed_count, member_id').eq('id', loanId).single();
  if (error) throw error;
  const { data: mem } = await supabase.from('library_members').select('member_type').eq('id', l.member_id).single();
  const { data: rule } = await supabase.from('library_rules').select('renew_allowed').eq('member_type', mem!.member_type).single();
  if ((l.renewed_count ?? 0) >= (rule?.renew_allowed ?? 0)) {
    throw new Error(`Renewal limit reached (${rule?.renew_allowed})`);
  }
  const newDue = new Date(l.due_date); newDue.setDate(newDue.getDate() + extraDays);
  const { error: e2 } = await supabase.from('library_loans')
    .update({ due_date: newDue.toISOString().slice(0, 10), renewed_count: (l.renewed_count ?? 0) + 1 })
    .eq('id', loanId);
  if (e2) throw e2;
}
export async function markLoanLost(loanId: string, cost = 0) {
  const { data: l } = await supabase.from('library_loans').select('copy_id, member_id').eq('id', loanId).single();
  await supabase.from('library_loans').update({ status: 'Lost' }).eq('id', loanId);
  await supabase.from('library_copies').update({ status: 'Lost' }).eq('id', l!.copy_id);
  if (cost > 0) {
    const { data: mem } = await supabase.from('library_members').select('student_id').eq('id', l!.member_id).single();
    await supabase.from('library_fines').insert({
      loan_id: loanId, member_id: l!.member_id, student_id: mem?.student_id,
      kind: 'Lost', amount: cost, reason: 'Item declared lost — replacement cost',
    });
  }
}

/* ---------- Reservations ---------- */
export async function fetchReservations(): Promise<LibraryReservation[]> {
  const { data, error } = await supabase.from('library_reservations').select('*').order('reserved_at', { ascending: false });
  if (error) throw error; return (data ?? []) as any;
}
export async function reserveResource(resourceId: string, memberId: string) {
  const { data, error } = await supabase.from('library_reservations').insert({
    resource_id: resourceId, member_id: memberId,
  }).select('*').single();
  if (error) throw error; return data as LibraryReservation;
}
export async function cancelReservation(id: string) {
  const { error } = await supabase.from('library_reservations').update({ status: 'Cancelled' }).eq('id', id);
  if (error) throw error;
}

/* ---------- Fines ---------- */
export async function fetchFines(): Promise<LibraryFine[]> {
  const { data, error } = await supabase.from('library_fines').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) throw error; return (data ?? []) as any;
}
export async function waiveFine(id: string, waived_by: string, reason: string) {
  const { error } = await supabase.from('library_fines').update({
    status: 'Waived', waived_by, waived_reason: reason, updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw error;
}
export async function payFine(id: string) {
  const { error } = await supabase.from('library_fines').update({
    status: 'Paid', updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw error;
}
/** Post the fine to the finance module — creates an invoice line for the student. */
export async function postFineToFinance(id: string, actor = 'Librarian') {
  const { data: f, error } = await supabase.from('library_fines').select('*').eq('id', id).single();
  if (error) throw error;
  if (!f.student_id) throw new Error('Fine has no linked student — cannot post to finance');
  const { data: st } = await supabase.from('students')
    .select('id, first_name, last_name, class_name').eq('id', f.student_id).single();
  const invoiceNumber = `INV-LIB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 14);
  const { data: inv, error: e2 } = await supabase.from('invoices').insert({
    invoice_number: invoiceNumber,
    student_id: st!.id,
    student_name: `${st!.first_name} ${st!.last_name}`,
    class_name: st!.class_name,
    term: 'Library', academic_year: String(new Date().getFullYear()),
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: dueDate.toISOString().slice(0, 10),
    amount: f.amount, paid_amount: 0, adjustments: 0, status: 'Unpaid',
    lines: [{ id: `l-${Date.now()}`, description: `Library fine — ${f.reason}`, amount: f.amount }],
    notes: `Auto-generated from library fine ${f.id}`,
  }).select('id').single();
  if (e2) throw e2;
  await supabase.from('library_fines').update({
    status: 'Posted to Finance', posted_invoice_id: inv!.id, updated_at: new Date().toISOString(),
  }).eq('id', id);
  await supabase.from('audit_log').insert({
    actor, action: 'Posted Library Fine to Finance', entity: 'LibraryFine', entity_id: f.id,
    details: `KES ${f.amount} → ${invoiceNumber}`, date: new Date().toISOString(),
  });
}

/* ---------- Scans / batch ---------- */
export async function scanOverdue(): Promise<number> {
  const { data, error } = await supabase.rpc('library_scan_overdue');
  if (error) throw error;
  return (data as number) ?? 0;
}