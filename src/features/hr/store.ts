import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

export function useHrStore() {
  const qc = useQueryClient();

  const staffQ         = useQuery({ queryKey: ['hr_staff'],          queryFn: api.fetchStaff });
  const deptsQ         = useQuery({ queryKey: ['hr_departments'],    queryFn: api.fetchDepartments });
  const docsQ          = useQuery({ queryKey: ['hr_documents'],      queryFn: () => api.fetchStaffDocuments() });
  const attendanceQ    = useQuery({ queryKey: ['hr_attendance'],     queryFn: () => api.fetchAttendance() });
  const leaveReqQ      = useQuery({ queryKey: ['hr_leave_requests'], queryFn: api.fetchLeaveRequests });
  const leaveBalQ      = useQuery({ queryKey: ['hr_leave_balances'], queryFn: () => api.fetchLeaveBalances(new Date().getFullYear()) });
  const componentsQ    = useQuery({ queryKey: ['hr_pay_components'], queryFn: api.fetchPayComponents });
  const assignmentsQ   = useQuery({ queryKey: ['hr_pay_assignments'], queryFn: () => api.fetchStaffPayAssignments() });
  const runsQ          = useQuery({ queryKey: ['hr_payroll_runs'],   queryFn: api.fetchPayrollRuns });
  const workloadQ      = useQuery({ queryKey: ['hr_workload'],       queryFn: () => api.fetchWorkload() });
  const appraisalsQ    = useQuery({ queryKey: ['hr_appraisals'],     queryFn: () => api.fetchAppraisals() });
  const skillsQ        = useQuery({ queryKey: ['hr_skills'],         queryFn: () => api.fetchSkills() });
  const auditQ         = useQuery({ queryKey: ['hr_audit'],          queryFn: () => api.fetchAudit() });

  const staff       = staffQ.data ?? [];
  const departments = deptsQ.data ?? [];
  const documents   = docsQ.data ?? [];
  const attendance  = attendanceQ.data ?? [];
  const leaveReqs   = leaveReqQ.data ?? [];
  const leaveBals   = leaveBalQ.data ?? [];
  const components  = componentsQ.data ?? [];
  const assignments = assignmentsQ.data ?? [];
  const runs        = runsQ.data ?? [];
  const workload    = workloadQ.data ?? [];
  const appraisals  = appraisalsQ.data ?? [];
  const skills      = skillsQ.data ?? [];
  const audit       = auditQ.data ?? [];

  const isLoading = staffQ.isLoading || deptsQ.isLoading || attendanceQ.isLoading;
  const errors = [staffQ.error, deptsQ.error, docsQ.error, attendanceQ.error, leaveReqQ.error, leaveBalQ.error, componentsQ.error, assignmentsQ.error, runsQ.error, workloadQ.error, appraisalsQ.error, skillsQ.error, auditQ.error].filter(Boolean) as Error[];

  const inv = (k: string) => qc.invalidateQueries({ queryKey: [k] });
  const invAll = () => ['hr_staff','hr_departments','hr_documents','hr_attendance','hr_leave_requests','hr_leave_balances','hr_pay_components','hr_pay_assignments','hr_payroll_runs','hr_workload','hr_appraisals','hr_skills','hr_audit'].forEach(inv);

  // Mutations
  const createStaff  = useMutation({ mutationFn: api.createStaff, onSuccess: () => { inv('hr_staff'); inv('hr_audit'); } });
  const updateStaff  = useMutation({ mutationFn: (p: any) => api.updateStaff(p.id, p.patch), onSuccess: () => { inv('hr_staff'); inv('hr_audit'); } });
  const deleteStaff  = useMutation({ mutationFn: (id: string) => api.deleteStaff(id), onSuccess: invAll });

  const addDoc     = useMutation({ mutationFn: api.addStaffDocument, onSuccess: () => inv('hr_documents') });
  const removeDoc  = useMutation({ mutationFn: (id: string) => api.deleteStaffDocument(id), onSuccess: () => inv('hr_documents') });

  const checkIn    = useMutation({ mutationFn: (p: { staffId: string; method?: string }) => api.checkIn(p.staffId, p.method), onSuccess: () => inv('hr_attendance') });
  const checkOut   = useMutation({ mutationFn: (staffId: string) => api.checkOut(staffId), onSuccess: () => inv('hr_attendance') });
  const upsertAtt  = useMutation({ mutationFn: api.upsertAttendance, onSuccess: () => inv('hr_attendance') });

  const createLeave  = useMutation({ mutationFn: api.createLeaveRequest, onSuccess: () => { inv('hr_leave_requests'); inv('hr_leave_balances'); } });
  const decideLeave  = useMutation({ mutationFn: (p: { id: string; decision: 'Approved' | 'Rejected'; approver: string; note?: string }) => api.decideLeave(p.id, p.decision, p.approver, p.note), onSuccess: () => { inv('hr_leave_requests'); inv('hr_leave_balances'); } });
  const cancelLeave  = useMutation({ mutationFn: (id: string) => api.cancelLeave(id), onSuccess: () => { inv('hr_leave_requests'); inv('hr_leave_balances'); } });

  const addPayAssign    = useMutation({ mutationFn: (p: { staffId: string; componentId: string; amount: number }) => api.addPayAssignment(p.staffId, p.componentId, p.amount), onSuccess: () => inv('hr_pay_assignments') });
  const removePayAssign = useMutation({ mutationFn: (id: string) => api.removePayAssignment(id), onSuccess: () => inv('hr_pay_assignments') });
  const runPayroll      = useMutation({ mutationFn: (p: { year: number; month: number; actor: string }) => api.runPayroll(p.year, p.month, p.actor), onSuccess: () => inv('hr_payroll_runs') });
  const approveRun      = useMutation({ mutationFn: (p: { runId: string; approver: string }) => api.approvePayrollRun(p.runId, p.approver), onSuccess: () => inv('hr_payroll_runs') });
  const payRun          = useMutation({ mutationFn: (runId: string) => api.markPayrollPaid(runId), onSuccess: () => inv('hr_payroll_runs') });

  const addWorkload    = useMutation({ mutationFn: api.addWorkload, onSuccess: () => inv('hr_workload') });
  const deleteWorkload = useMutation({ mutationFn: (id: string) => api.deleteWorkload(id), onSuccess: () => inv('hr_workload') });

  const upsertAppraisal = useMutation({ mutationFn: api.upsertAppraisal, onSuccess: () => inv('hr_appraisals') });
  const addSkill        = useMutation({ mutationFn: api.addSkill, onSuccess: () => inv('hr_skills') });
  const removeSkill     = useMutation({ mutationFn: (id: string) => api.removeSkill(id), onSuccess: () => inv('hr_skills') });

  // Helpers
  const staffById  = (id: string) => staff.find(s => s.id === id);
  const deptById   = (id: string) => departments.find(d => d.id === id);
  const docsForStaff       = (id: string) => documents.filter(d => d.staff_id === id);
  const attendanceForStaff = (id: string) => attendance.filter(a => a.staff_id === id);
  const leavesForStaff     = (id: string) => leaveReqs.filter(l => l.staff_id === id);
  const balancesForStaff   = (id: string) => leaveBals.filter(b => b.staff_id === id);
  const workloadForStaff   = (id: string) => workload.filter(w => w.staff_id === id);

  const stats = useMemo(() => {
    const total = staff.length;
    const active = staff.filter(s => s.status === 'Active').length;
    const onLeave = staff.filter(s => s.status === 'On Leave').length;
    const teaching = staff.filter(s => s.staff_type === 'Teaching').length;
    const nonTeaching = total - teaching;
    const today = new Date().toISOString().slice(0, 10);
    const present = attendance.filter(a => a.date === today && (a.status === 'Present' || a.status === 'Late')).length;
    const late    = attendance.filter(a => a.date === today && a.status === 'Late').length;
    const pendingLeave = leaveReqs.filter(l => l.status === 'Pending').length;
    const monthlyPayroll = staff.reduce((a, s) => a + Number(s.basic_salary ?? 0), 0);
    return { total, active, onLeave, teaching, nonTeaching, present, late, pendingLeave, monthlyPayroll };
  }, [staff, attendance, leaveReqs]);

  const issueCredentials = useMutation({
    mutationFn: (staffId: string) => api.issueStaffPortalCredentials(staffId),
  });

  return {
    staff, departments, documents, attendance, leaveReqs, leaveBals,
    components, assignments, runs, workload, appraisals, skills, audit,
    isLoading, errors, stats, issueCredentials,
    staffById, deptById, docsForStaff, attendanceForStaff, leavesForStaff, balancesForStaff, workloadForStaff,
    createStaff, updateStaff, deleteStaff,
    addDoc, removeDoc,
    checkIn, checkOut, upsertAtt,
    createLeave, decideLeave, cancelLeave,
    addPayAssign, removePayAssign, runPayroll, approveRun, payRun,
    addWorkload, deleteWorkload,
    upsertAppraisal, addSkill, removeSkill,
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