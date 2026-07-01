import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type {
  Adjustment,
  Bursary,
  BursaryStatus,
  FeeItem,
  Invoice,
  PaymentMethod,
  Sponsor,
  Student,
} from './types';

const ACTOR = 'You (Bursar)';

/**
 * Central data + mutation hook for the Finance & Bursary module.
 * All state comes from Supabase — no local seed / dummy data.
 */
export function useFinanceStore() {
  const qc = useQueryClient();

  const studentsQ = useQuery({ queryKey: ['students'], queryFn: api.fetchStudents });
  const feeItemsQ = useQuery({ queryKey: ['fee_items'], queryFn: api.fetchFeeItems });
  const feeStructuresQ = useQuery({
    queryKey: ['fee_structures'],
    queryFn: api.fetchFeeStructures,
  });
  const invoicesQ = useQuery({ queryKey: ['invoices'], queryFn: api.fetchInvoices });
  const paymentsQ = useQuery({ queryKey: ['payments'], queryFn: api.fetchPayments });
  const adjustmentsQ = useQuery({ queryKey: ['adjustments'], queryFn: api.fetchAdjustments });
  const sponsorsQ = useQuery({ queryKey: ['sponsors'], queryFn: api.fetchSponsors });
  const bursariesQ = useQuery({ queryKey: ['bursaries'], queryFn: api.fetchBursaries });
  const auditQ = useQuery({ queryKey: ['audit_log'], queryFn: api.fetchAudit });
  const rulesQ = useQuery({ queryKey: ['approval_rules'], queryFn: api.fetchApprovalRules });
  const termsQ = useQuery({ queryKey: ['terms'], queryFn: api.fetchTerms });
  const classesQ = useQuery({ queryKey: ['classes'], queryFn: api.fetchClasses });

  const students: Student[] = studentsQ.data ?? [];
  const feeItems: FeeItem[] = feeItemsQ.data ?? [];
  const feeStructures = feeStructuresQ.data ?? [];
  const invoices: Invoice[] = invoicesQ.data ?? [];
  const payments = paymentsQ.data ?? [];
  const adjustments: Adjustment[] = adjustmentsQ.data ?? [];
  const sponsors: Sponsor[] = sponsorsQ.data ?? [];
  const bursaries: Bursary[] = bursariesQ.data ?? [];
  const audit = auditQ.data ?? [];
  const approvalRules = rulesQ.data ?? [];
  const terms = termsQ.data ?? [];
  const classes = classesQ.data ?? [];

  const isLoading =
    studentsQ.isLoading ||
    feeItemsQ.isLoading ||
    invoicesQ.isLoading ||
    paymentsQ.isLoading ||
    bursariesQ.isLoading ||
    sponsorsQ.isLoading;

  const errors = [
    studentsQ.error,
    feeItemsQ.error,
    invoicesQ.error,
    paymentsQ.error,
    bursariesQ.error,
    sponsorsQ.error,
    feeStructuresQ.error,
    adjustmentsQ.error,
    auditQ.error,
    rulesQ.error,
    termsQ.error,
    classesQ.error,
  ].filter(Boolean) as Error[];

  const studentById = useCallback(
    (id: string) => students.find((s) => s.id === id),
    [students]
  );
  const invoiceById = useCallback(
    (id: string) => invoices.find((i) => i.id === id),
    [invoices]
  );

  const balanceForInvoice = useCallback(
    (inv: Invoice) => inv.amount - inv.paid_amount - inv.adjustments,
    []
  );

  const studentBalance = useCallback(
    (studentId: string) =>
      invoices
        .filter((i) => i.student_id === studentId)
        .reduce((acc, i) => acc + (i.amount - i.paid_amount - i.adjustments), 0),
    [invoices]
  );

  const invalidateFinancials = () => {
    qc.invalidateQueries({ queryKey: ['invoices'] });
    qc.invalidateQueries({ queryKey: ['payments'] });
    qc.invalidateQueries({ queryKey: ['adjustments'] });
    qc.invalidateQueries({ queryKey: ['bursaries'] });
    qc.invalidateQueries({ queryKey: ['audit_log'] });
  };

  const createInvoiceM = useMutation({
    mutationFn: (data: Parameters<typeof api.createInvoice>[0]) =>
      api.createInvoice({ ...data, actor: ACTOR }),
    onSuccess: () => invalidateFinancials(),
  });

  const recordPaymentM = useMutation({
    mutationFn: (data: Parameters<typeof api.recordPayment>[0]) => api.recordPayment(data),
    onSuccess: () => invalidateFinancials(),
  });

  const reconcilePaymentM = useMutation({
    mutationFn: ({ id, bankRef }: { id: string; bankRef: string }) =>
      api.reconcilePayment(id, bankRef, ACTOR),
    onSuccess: () => invalidateFinancials(),
  });

  const decideAdjustmentM = useMutation({
    mutationFn: ({
      id,
      decision,
      approver,
    }: {
      id: string;
      decision: 'Approved' | 'Rejected';
      approver: string;
    }) => api.decideAdjustment(id, decision, approver),
    onSuccess: () => invalidateFinancials(),
  });

  const createBursaryM = useMutation({
    mutationFn: (data: Parameters<typeof api.createBursary>[0]) => api.createBursary(data),
    onSuccess: () => invalidateFinancials(),
  });

  const decideBursaryM = useMutation({
    mutationFn: ({
      id,
      status,
      approver,
      amount,
    }: {
      id: string;
      status: BursaryStatus;
      approver: string;
      amount?: number;
    }) => api.decideBursary(id, status, approver, amount),
    onSuccess: () => invalidateFinancials(),
  });

  const disburseBursaryM = useMutation({
    mutationFn: (id: string) => api.disburseBursary(id, ACTOR),
    onSuccess: () => invalidateFinancials(),
  });

  const addBursaryDocM = useMutation({
    mutationFn: ({ id, name, size_kb }: { id: string; name: string; size_kb: number }) =>
      api.addBursaryDocument(id, name, size_kb, ACTOR),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bursaries'] });
      qc.invalidateQueries({ queryKey: ['audit_log'] });
    },
  });

  const addBursaryNoteM = useMutation({
    mutationFn: ({
      id,
      author,
      message,
    }: {
      id: string;
      author: string;
      message: string;
    }) => api.addBursaryNote(id, author, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bursaries'] }),
  });

  const createFeeItemM = useMutation({
    mutationFn: (data: {
      name: string;
      category: FeeItem['category'];
      amount: number;
    }) => api.createFeeItem({ ...data, actor: ACTOR }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee_items'] });
      qc.invalidateQueries({ queryKey: ['audit_log'] });
    },
  });

  /* Public API */
  const createInvoice = (
    data: Omit<
      Invoice,
      'id' | 'invoice_number' | 'issue_date' | 'status' | 'paid_amount' | 'adjustments'
    >
  ) =>
    createInvoiceM.mutateAsync({
      student_id: data.student_id,
      term: data.term,
      academic_year: data.academic_year,
      due_date: data.due_date,
      amount: data.amount,
      lines: data.lines,
      notes: data.notes,
    });

  const recordPayment = (data: {
    invoice_id: string;
    amount: number;
    method: PaymentMethod;
    reference: string;
    received_by: string;
    sponsor_id?: string;
    notes?: string;
  }) => recordPaymentM.mutateAsync(data);

  const reconcilePayment = (id: string, bankRef: string) =>
    reconcilePaymentM.mutateAsync({ id, bankRef });

  const decideAdjustment = (
    id: string,
    decision: 'Approved' | 'Rejected',
    approver: string
  ) => decideAdjustmentM.mutateAsync({ id, decision, approver });

  const createBursary = (data: {
    student_id: string;
    sponsor_id?: string;
    program: string;
    requested_amount: number;
    academic_year: string;
    term: string;
    eligibility_notes?: string;
  }) => createBursaryM.mutateAsync(data);

  const decideBursary = (
    id: string,
    status: BursaryStatus,
    approver: string,
    amount?: number
  ) => decideBursaryM.mutateAsync({ id, status, approver, amount });

  const disburseBursary = (id: string) => disburseBursaryM.mutateAsync(id);

  const addBursaryDoc = (id: string, name: string, size_kb: number) =>
    addBursaryDocM.mutateAsync({ id, name, size_kb });

  const addBursaryNote = (id: string, author: string, message: string) =>
    addBursaryNoteM.mutateAsync({ id, author, message });

  const addFeeItem = (data: {
    name: string;
    category: FeeItem['category'];
    amount: number;
  }) => createFeeItemM.mutateAsync(data);

  const totals = useMemo(() => {
    const invoiced = invoices.reduce((a, i) => a + i.amount, 0);
    const collected = invoices.reduce((a, i) => a + i.paid_amount, 0);
    const adjustments_total = invoices.reduce((a, i) => a + i.adjustments, 0);
    const outstanding = invoiced - collected - adjustments_total;
    const overdue = invoices
      .filter((i) => i.status === 'Overdue')
      .reduce((a, i) => a + (i.amount - i.paid_amount - i.adjustments), 0);
    return { invoiced, collected, adjustments_total, outstanding, overdue };
  }, [invoices]);

  return {
    // data
    students,
    feeItems,
    feeStructures,
    invoices,
    payments,
    adjustments,
    sponsors,
    bursaries,
    audit,
    approvalRules,
    terms,
    classes,
    // helpers
    studentById,
    invoiceById,
    balanceForInvoice,
    studentBalance,
    totals,
    // mutations
    createInvoice,
    recordPayment,
    reconcilePayment,
    decideAdjustment,
    createBursary,
    decideBursary,
    disburseBursary,
    addBursaryDoc,
    addBursaryNote,
    addFeeItem,
    // state
    isLoading,
    errors,
  };
}

/* CSV export helper */
export function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
