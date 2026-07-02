import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { LibraryFine, LibraryMember, LibraryResource } from './types';

export function useLibraryStore() {
  const qc = useQueryClient();
  const resourcesQ    = useQuery({ queryKey: ['library_resources'],    queryFn: api.fetchResources });
  const copiesQ       = useQuery({ queryKey: ['library_copies'],       queryFn: () => api.fetchCopies() });
  const membersQ      = useQuery({ queryKey: ['library_members'],      queryFn: api.fetchMembers });
  const rulesQ        = useQuery({ queryKey: ['library_rules'],        queryFn: api.fetchRules });
  const loansQ        = useQuery({ queryKey: ['library_loans'],        queryFn: api.fetchLoans });
  const reservationsQ = useQuery({ queryKey: ['library_reservations'], queryFn: api.fetchReservations });
  const finesQ        = useQuery({ queryKey: ['library_fines'],        queryFn: api.fetchFines });
  const studentsQ     = useQuery({ queryKey: ['students'],              queryFn: async () => {
    const { data, error } = await (await import('@/lib/supabase/client')).supabase
      .from('students').select('id, first_name, last_name, admission_number, class_name').order('first_name');
    if (error) throw error; return data ?? [];
  }});

  const resources = resourcesQ.data ?? [];
  const copies = copiesQ.data ?? [];
  const members = membersQ.data ?? [];
  const rules = rulesQ.data ?? [];
  const loans = loansQ.data ?? [];
  const reservations = reservationsQ.data ?? [];
  const fines = finesQ.data ?? [];
  const students = (studentsQ.data ?? []) as any[];

  const isLoading = resourcesQ.isLoading || copiesQ.isLoading || membersQ.isLoading || loansQ.isLoading;
  const errors = [resourcesQ.error, copiesQ.error, membersQ.error, loansQ.error, finesQ.error, reservationsQ.error].filter(Boolean) as Error[];

  const inv = (k: string) => qc.invalidateQueries({ queryKey: [k] });
  const invAll = () => ['library_resources','library_copies','library_members','library_loans','library_reservations','library_fines'].forEach(inv);

  // Mutations
  const createResource = useMutation({ mutationFn: (p: { input: Partial<LibraryResource> & { title: string }; copies: number }) => api.createResource(p.input, p.copies), onSuccess: invAll });
  const updateResource = useMutation({ mutationFn: (p: { id: string; patch: Partial<LibraryResource> }) => api.updateResource(p.id, p.patch), onSuccess: () => inv('library_resources') });
  const deleteResource = useMutation({ mutationFn: (id: string) => api.deleteResource(id), onSuccess: invAll });
  const addCopies      = useMutation({ mutationFn: (p: { resourceId: string; n: number }) => api.addCopies(p.resourceId, p.n), onSuccess: invAll });
  const updateCopy     = useMutation({ mutationFn: (p: { id: string; patch: any }) => api.updateCopy(p.id, p.patch), onSuccess: invAll });

  const createMember       = useMutation({ mutationFn: api.createMember, onSuccess: () => inv('library_members') });
  const enrollStudent      = useMutation({ mutationFn: api.enrollStudentAsMember, onSuccess: () => inv('library_members') });
  const updateMember       = useMutation({ mutationFn: (p: { id: string; patch: Partial<LibraryMember> }) => api.updateMember(p.id, p.patch), onSuccess: () => inv('library_members') });
  const updateRule         = useMutation({ mutationFn: (p: { id: string; patch: any }) => api.updateRule(p.id, p.patch), onSuccess: () => inv('library_rules') });

  const issueLoan   = useMutation({ mutationFn: api.issueLoan,  onSuccess: invAll });
  const returnLoan  = useMutation({ mutationFn: (p: { loanId: string; opts?: any }) => api.returnLoan(p.loanId, p.opts), onSuccess: invAll });
  const renewLoan   = useMutation({ mutationFn: (p: { loanId: string; extraDays?: number }) => api.renewLoan(p.loanId, p.extraDays), onSuccess: invAll });
  const markLost    = useMutation({ mutationFn: (p: { loanId: string; cost: number }) => api.markLoanLost(p.loanId, p.cost), onSuccess: invAll });

  const reserve       = useMutation({ mutationFn: (p: { resourceId: string; memberId: string }) => api.reserveResource(p.resourceId, p.memberId), onSuccess: invAll });
  const cancelReserve = useMutation({ mutationFn: (id: string) => api.cancelReservation(id), onSuccess: invAll });

  const waiveFine       = useMutation({ mutationFn: (p: { id: string; waived_by: string; reason: string }) => api.waiveFine(p.id, p.waived_by, p.reason), onSuccess: () => inv('library_fines') });
  const payFine         = useMutation({ mutationFn: (id: string) => api.payFine(id), onSuccess: () => inv('library_fines') });
  const postFine        = useMutation({ mutationFn: (id: string) => api.postFineToFinance(id), onSuccess: () => inv('library_fines') });
  const scanOverdue     = useMutation({ mutationFn: api.scanOverdue, onSuccess: invAll });

  // Helpers
  const resourceById = (id: string) => resources.find(r => r.id === id);
  const memberById   = (id: string) => members.find(m => m.id === id);
  const copyById     = (id: string) => copies.find(c => c.id === id);
  const loanForCopy  = (copyId: string) => loans.find(l => l.copy_id === copyId && l.status === 'Active');
  const activeLoansForMember = (memberId: string) => loans.filter(l => l.member_id === memberId && l.status === 'Active');
  const finesForMember = (memberId: string) => fines.filter(f => f.member_id === memberId && f.status === 'Pending');
  const ruleFor = (mt: string) => rules.find(r => r.member_type === mt);

  const stats = useMemo(() => {
    const totalTitles = resources.length;
    const totalCopies = resources.reduce((a, r: any) => a + Number(r.total_copies ?? 0), 0);
    const availableCopies = resources.reduce((a, r: any) => a + Number(r.available_copies ?? 0), 0);
    const activeLoans = loans.filter(l => l.status === 'Active' || l.status === 'Overdue').length;
    const overdueLoans = loans.filter(l => l.status === 'Overdue' || (l.status === 'Active' && new Date(l.due_date) < new Date())).length;
    const openReservations = reservations.filter(r => r.status === 'Pending' || r.status === 'Ready').length;
    const pendingFinesTotal = fines.filter(f => f.status === 'Pending').reduce((a, f) => a + Number(f.amount), 0);
    return { totalTitles, totalCopies, availableCopies, activeLoans, overdueLoans, openReservations, pendingFinesTotal };
  }, [resources, loans, reservations, fines]);

  return {
    resources, copies, members, rules, loans, reservations, fines, students,
    isLoading, errors, stats,
    resourceById, memberById, copyById, loanForCopy, activeLoansForMember, finesForMember, ruleFor,
    createResource, updateResource, deleteResource, addCopies, updateCopy,
    createMember, enrollStudent, updateMember, updateRule,
    issueLoan, returnLoan, renewLoan, markLost,
    reserve, cancelReserve,
    waiveFine, payFine, postFine, scanOverdue,
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