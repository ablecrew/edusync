import { supabase } from '@/lib/supabase/client';
import type {
  Adjustment,
  AuditEntry,
  Bursary,
  BursaryStatus,
  FeeItem,
  FeeStructure,
  Invoice,
  Payment,
  PaymentMethod,
  Sponsor,
  Student,
} from './types';

/* ---------- Row → domain mappers ---------- */

const toStudent = (r: any): Student => ({
  id: r.id,
  // Your DB uses `admission_number`; older/alt code may use `admission_no`.
  admission_no: r.admission_number ?? r.admission_no ?? '',
  first_name: r.first_name,
  last_name: r.last_name,
  class_name: r.class_name,
  stream: r.stream ?? '',
  // Your `students` table has no boarding/transport columns yet.
  // Default to 'Day' so the UI doesn't blow up.
  boarding: r.boarding ?? 'Day',
  transport_route: r.transport_route ?? undefined,
  guardian_name: r.guardian_name ?? '',
  guardian_phone: r.guardian_phone ?? '',
  guardian_email: r.guardian_email ?? '',
});

const toFeeItem = (r: any): FeeItem => ({
  id: r.id,
  name: r.name,
  category: r.category,
  amount: Number(r.amount),
  applies_to: r.applies_to ?? {},
  mandatory: !!r.mandatory,
});

const toFeeStructure = (r: any): FeeStructure => ({
  id: r.id,
  name: r.name,
  term: r.term,
  academic_year: r.academic_year,
  class_name: r.class_name,
  items: r.items ?? [],
  total: Number(r.total ?? 0),
  active: !!r.active,
});

const toInvoice = (r: any): Invoice => ({
  id: r.id,
  invoice_number: r.invoice_number,
  student_id: r.student_id,
  term: r.term,
  academic_year: r.academic_year,
  // Fall back to created_at if issue_date hasn't been added yet
  issue_date:
    r.issue_date ??
    (r.created_at ? String(r.created_at).slice(0, 10) : ''),
  due_date: r.due_date,
  lines: r.lines ?? [],
  amount: Number(r.amount),
  paid_amount: Number(r.paid_amount ?? 0),
  adjustments: Number(r.adjustments ?? 0),
  status: r.status,
  notes: r.notes ?? undefined,
});

const toPayment = (r: any): Payment => ({
  id: r.id,
  receipt_no: r.receipt_no,
  invoice_id: r.invoice_id,
  student_id: r.student_id,
  date: r.date,
  amount: Number(r.amount),
  method: r.method,
  reference: r.reference ?? '',
  received_by: r.received_by ?? '',
  reconciled: !!r.reconciled,
  reconciled_at: r.reconciled_at ?? undefined,
  bank_statement_ref: r.bank_statement_ref ?? undefined,
  notes: r.notes ?? undefined,
  sponsor_id: r.sponsor_id ?? undefined,
});

const toAdjustment = (r: any): Adjustment => ({
  id: r.id,
  student_id: r.student_id,
  invoice_id: r.invoice_id ?? undefined,
  kind: r.kind,
  amount: Number(r.amount),
  reason: r.reason ?? '',
  requested_by: r.requested_by ?? '',
  approval_status: r.approval_status,
  approved_by: r.approved_by ?? undefined,
  date: r.date,
});

const toSponsor = (r: any): Sponsor => ({
  id: r.id,
  name: r.name,
  type: r.type,
  contact: r.contact ?? '',
  email: r.email ?? '',
  students: r.students ?? [],
  total_committed: Number(r.total_committed ?? 0),
  total_remitted: Number(r.total_remitted ?? 0),
  active: !!r.active,
});

const toBursary = (r: any): Bursary => ({
  id: r.id,
  reference: r.reference,
  program: r.program,
  sponsor_id: r.sponsor_id ?? undefined,
  student_id: r.student_id,
  application_date: r.application_date,
  awarded_amount: Number(r.awarded_amount ?? 0),
  requested_amount: Number(r.requested_amount ?? 0),
  status: r.status,
  eligibility_notes: r.eligibility_notes ?? '',
  academic_year: r.academic_year,
  term: r.term,
  progress_flag: r.progress_flag ?? 'Not Set',
  approved_by: r.approved_by ?? undefined,
  approved_at: r.approved_at ?? undefined,
  disbursed_at: r.disbursed_at ?? undefined,
  documents: r.documents ?? [],
  communications: r.communications ?? [],
  claim_schedule: r.claim_schedule ?? undefined,
});

const toAudit = (r: any): AuditEntry => ({
  id: r.id,
  date: r.date,
  actor: r.actor,
  action: r.action,
  entity: r.entity,
  entity_id: r.entity_id,
  details: r.details ?? undefined,
});

/* ---------- List queries ---------- */

export async function fetchStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('first_name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toStudent);
}

export async function fetchFeeItems(): Promise<FeeItem[]> {
  const { data, error } = await supabase
    .from('fee_items')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []).map(toFeeItem);
}

export async function fetchFeeStructures(): Promise<FeeStructure[]> {
  const { data, error } = await supabase
    .from('fee_structures')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []).map(toFeeStructure);
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    // Sort by created_at (always present) rather than issue_date (added later)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toInvoice);
}

export async function fetchPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toPayment);
}

export async function fetchAdjustments(): Promise<Adjustment[]> {
  const { data, error } = await supabase
    .from('adjustments')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toAdjustment);
}

export async function fetchSponsors(): Promise<Sponsor[]> {
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []).map(toSponsor);
}

export async function fetchBursaries(): Promise<Bursary[]> {
  const { data, error } = await supabase
    .from('bursaries')
    .select('*')
    .order('application_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toBursary);
}

export async function fetchAudit(): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('date', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map(toAudit);
}

export async function fetchApprovalRules(): Promise<
  { id: string; scope: string; threshold: number; approver: string }[]
> {
  const { data, error } = await supabase
    .from('approval_rules')
    .select('*')
    .order('threshold');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    scope: r.scope,
    threshold: Number(r.threshold),
    approver: r.approver,
  }));
}

/* ---------- Reference lookup lists ---------- */

export async function fetchTerms(): Promise<string[]> {
  const { data, error } = await supabase
    .from('academic_terms')
    .select('name')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((r: any) => r.name);
}

export async function fetchClasses(): Promise<string[]> {
  // Use your populated `academic_classes` table instead of the empty `classes` table.
  const { data, error } = await supabase
    .from('academic_classes')
    .select('name')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((r: any) => r.name);
}

/* ---------- Audit helper ---------- */

async function writeAudit(entry: Omit<AuditEntry, 'id' | 'date'>) {
  await supabase.from('audit_log').insert({
    actor: entry.actor,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entity_id,
    details: entry.details ?? null,
    date: new Date().toISOString(),
  });
}

/* ---------- Mutations ---------- */

export async function createInvoice(input: {
  student_id: string;
  term: string;
  academic_year: string;
  due_date: string;
  amount: number;
  lines: { id: string; description: string; amount: number; fee_item_id?: string }[];
  notes?: string;
  actor?: string;
}): Promise<Invoice> {
  // Your invoices table has student_name + class_name as NOT NULL,
  // so we need to look up the student first.
  const { data: st, error: stErr } = await supabase
    .from('students')
    .select('id, first_name, last_name, class_name')
    .eq('id', input.student_id)
    .single();
  if (stErr) throw stErr;

  const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      student_id: input.student_id,
      student_name: `${st.first_name} ${st.last_name}`,
      class_name: st.class_name,
      term: input.term,
      academic_year: input.academic_year,
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: input.due_date,
      amount: input.amount,
      paid_amount: 0,
      adjustments: 0,
      status: 'Unpaid',
      lines: input.lines,
      notes: input.notes ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;

  await writeAudit({
    actor: input.actor ?? 'System',
    action: 'Created Invoice',
    entity: 'Invoice',
    entity_id: invoiceNumber,
    details: `Total ${input.amount}`,
  });
  return toInvoice(data);
}

export async function recordPayment(input: {
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  received_by: string;
  sponsor_id?: string;
  notes?: string;
}): Promise<Payment> {
  const receiptNo = `RCP-${new Date().getFullYear()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .select('id, student_id, amount, paid_amount, adjustments, invoice_number')
    .eq('id', input.invoice_id)
    .single();
  if (invErr) throw invErr;

  const { data, error } = await supabase
    .from('payments')
    .insert({
      receipt_no: receiptNo,
      invoice_id: input.invoice_id,
      student_id: inv.student_id,
      date: new Date().toISOString().slice(0, 10),
      amount: input.amount,
      method: input.method,
      reference: input.reference,
      received_by: input.received_by,
      reconciled: input.method === 'Cash',
      reconciled_at:
        input.method === 'Cash' ? new Date().toISOString().slice(0, 10) : null,
      sponsor_id: input.sponsor_id ?? null,
      notes: input.notes ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;

  const newPaid = Number(inv.paid_amount ?? 0) + input.amount;
  const remaining = Number(inv.amount) - newPaid - Number(inv.adjustments ?? 0);
  const newStatus = remaining <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
  const { error: updErr } = await supabase
    .from('invoices')
    .update({ paid_amount: newPaid, status: newStatus })
    .eq('id', input.invoice_id);
  if (updErr) throw updErr;

  await writeAudit({
    actor: input.received_by,
    action: 'Recorded Payment',
    entity: 'Payment',
    entity_id: receiptNo,
    details: `${input.method} ${input.amount} → ${inv.invoice_number}`,
  });
  return toPayment(data);
}

export async function reconcilePayment(
  paymentId: string,
  bankRef: string,
  actor: string
): Promise<void> {
  const { data: p, error: fetchErr } = await supabase
    .from('payments')
    .select('receipt_no')
    .eq('id', paymentId)
    .single();
  if (fetchErr) throw fetchErr;
  const { error } = await supabase
    .from('payments')
    .update({
      reconciled: true,
      reconciled_at: new Date().toISOString().slice(0, 10),
      bank_statement_ref: bankRef,
    })
    .eq('id', paymentId);
  if (error) throw error;
  await writeAudit({
    actor,
    action: 'Reconciled Payment',
    entity: 'Payment',
    entity_id: p.receipt_no,
    details: `Matched ${bankRef}`,
  });
}

export async function requestAdjustment(input: {
  student_id: string;
  invoice_id?: string;
  kind: Adjustment['kind'];
  amount: number;
  reason: string;
  requested_by: string;
}): Promise<Adjustment> {
  const { data, error } = await supabase
    .from('adjustments')
    .insert({
      student_id: input.student_id,
      invoice_id: input.invoice_id ?? null,
      kind: input.kind,
      amount: input.amount,
      reason: input.reason,
      requested_by: input.requested_by,
      approval_status: 'Pending',
      date: new Date().toISOString().slice(0, 10),
    })
    .select('*')
    .single();
  if (error) throw error;
  await writeAudit({
    actor: input.requested_by,
    action: 'Requested Adjustment',
    entity: 'Adjustment',
    entity_id: data.id,
    details: `${input.kind} ${input.amount}`,
  });
  return toAdjustment(data);
}

export async function decideAdjustment(
  id: string,
  decision: 'Approved' | 'Rejected',
  approver: string
): Promise<void> {
  const { data: adj, error: fetchErr } = await supabase
    .from('adjustments')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr) throw fetchErr;
  const { error } = await supabase
    .from('adjustments')
    .update({ approval_status: decision, approved_by: approver })
    .eq('id', id);
  if (error) throw error;

  if (decision === 'Approved' && adj.invoice_id) {
    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('amount, paid_amount, adjustments')
      .eq('id', adj.invoice_id)
      .single();
    if (invErr) throw invErr;
    const newAdj = Number(inv.adjustments ?? 0) + Number(adj.amount);
    const remaining =
      Number(inv.amount) - Number(inv.paid_amount ?? 0) - newAdj;
    const newStatus = remaining <= 0 ? 'Paid' : undefined;
    await supabase
      .from('invoices')
      .update({
        adjustments: newAdj,
        ...(newStatus ? { status: newStatus } : {}),
      })
      .eq('id', adj.invoice_id);
  }
  await writeAudit({
    actor: approver,
    action: `${decision} Adjustment`,
    entity: 'Adjustment',
    entity_id: id,
  });
}

export async function createBursary(input: {
  student_id: string;
  sponsor_id?: string;
  program: string;
  requested_amount: number;
  academic_year: string;
  term: string;
  eligibility_notes?: string;
}): Promise<Bursary> {
  const reference = `BRS-${new Date().getFullYear()}-${Math.floor(
    100 + Math.random() * 900
  )}`;
  const { data, error } = await supabase
    .from('bursaries')
    .insert({
      reference,
      program: input.program,
      sponsor_id: input.sponsor_id ?? null,
      student_id: input.student_id,
      application_date: new Date().toISOString().slice(0, 10),
      awarded_amount: 0,
      requested_amount: input.requested_amount,
      status: 'Applied',
      eligibility_notes: input.eligibility_notes ?? '',
      academic_year: input.academic_year,
      term: input.term,
      progress_flag: 'Not Set',
      documents: [],
      communications: [],
    })
    .select('*')
    .single();
  if (error) throw error;
  await writeAudit({
    actor: 'System',
    action: 'Created Bursary Application',
    entity: 'Bursary',
    entity_id: reference,
  });
  return toBursary(data);
}

export async function decideBursary(
  id: string,
  status: BursaryStatus,
  approver: string,
  amount?: number
): Promise<void> {
  const patch: any = {
    status,
    approved_by: approver,
    approved_at: new Date().toISOString().slice(0, 10),
  };
  if (amount !== undefined) patch.awarded_amount = amount;
  const { error } = await supabase.from('bursaries').update(patch).eq('id', id);
  if (error) throw error;
  await writeAudit({
    actor: approver,
    action: `${status} Bursary`,
    entity: 'Bursary',
    entity_id: id,
    details: amount !== undefined ? `Awarded ${amount}` : undefined,
  });
}

export async function disburseBursary(id: string, actor: string): Promise<void> {
  const { data: b, error: fetchErr } = await supabase
    .from('bursaries')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr) throw fetchErr;
  const { error } = await supabase
    .from('bursaries')
    .update({
      status: 'Disbursed',
      disbursed_at: new Date().toISOString().slice(0, 10),
    })
    .eq('id', id);
  if (error) throw error;

  const { data: invs } = await supabase
    .from('invoices')
    .select('*')
    .eq('student_id', b.student_id)
    .in('status', ['Unpaid', 'Partial', 'Overdue'])
    .order('created_at', { ascending: false })
    .limit(1);
  const openInvoice = invs?.[0];
  if (openInvoice) {
    const newAdj =
      Number(openInvoice.adjustments ?? 0) + Number(b.awarded_amount);
    const remaining =
      Number(openInvoice.amount) -
      Number(openInvoice.paid_amount ?? 0) -
      newAdj;
    const newStatus = remaining <= 0 ? 'Paid' : openInvoice.status;
    await supabase
      .from('invoices')
      .update({ adjustments: newAdj, status: newStatus })
      .eq('id', openInvoice.id);
  }
  await writeAudit({
    actor,
    action: 'Disbursed Bursary',
    entity: 'Bursary',
    entity_id: b.reference,
    details: `Applied credit ${b.awarded_amount}`,
  });
}

export async function addBursaryDocument(
  id: string,
  name: string,
  size_kb: number,
  actor: string
): Promise<void> {
  const { data: b, error: fetchErr } = await supabase
    .from('bursaries')
    .select('documents')
    .eq('id', id)
    .single();
  if (fetchErr) throw fetchErr;
  const documents = [
    ...(b.documents ?? []),
    {
      id: `d-${Date.now()}`,
      name,
      size_kb,
      uploaded_at: new Date().toISOString().slice(0, 10),
    },
  ];
  const { error } = await supabase
    .from('bursaries')
    .update({ documents })
    .eq('id', id);
  if (error) throw error;
  await writeAudit({
    actor,
    action: 'Uploaded Document',
    entity: 'Bursary',
    entity_id: id,
    details: name,
  });
}

export async function addBursaryNote(
  id: string,
  author: string,
  message: string
): Promise<void> {
  const { data: b, error: fetchErr } = await supabase
    .from('bursaries')
    .select('communications')
    .eq('id', id)
    .single();
  if (fetchErr) throw fetchErr;
  const communications = [
    ...(b.communications ?? []),
    {
      id: `c-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      author,
      message,
    },
  ];
  const { error } = await supabase
    .from('bursaries')
    .update({ communications })
    .eq('id', id);
  if (error) throw error;
}

export async function createFeeItem(input: {
  name: string;
  category: FeeItem['category'];
  amount: number;
  actor: string;
}): Promise<FeeItem> {
  const { data, error } = await supabase
    .from('fee_items')
    .insert({
      name: input.name,
      category: input.category,
      amount: input.amount,
      applies_to: {},
      mandatory: false,
    })
    .select('*')
    .single();
  if (error) throw error;
  await writeAudit({
    actor: input.actor,
    action: 'Added Fee Item',
    entity: 'FeeItem',
    entity_id: data.id,
    details: `${input.category} · ${input.amount}`,
  });
  return toFeeItem(data);
}