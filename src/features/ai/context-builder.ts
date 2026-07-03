import { supabase } from '@/lib/supabase/client';

export interface LiveContext {
  totalStudents: number;
  activeStudents: number;
  totalStaff: number;
  activeTeachers: number;
  totalClasses: number;
  totalInvoiced: number;
  totalCollected: number;
  outstandingBalance: number;
  currentTerm?: string;
  currentYear?: string;
  overdueInvoices: number;
  pendingApplications: number;
  todayAttendanceRate?: number;
}

/** Fetch live snapshot from Supabase — cheap parallel counts */
export async function buildLiveContext(): Promise<LiveContext> {
  const [
    students,
    activeS,
    staff,
    teachers,
    classes,
    invoices,
    applications,
    year,
    term,
  ] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('staff').select('id', { count: 'exact', head: true }),
    supabase.from('staff').select('id', { count: 'exact', head: true }).eq('staff_type', 'Teaching').eq('status', 'Active'),
    supabase.from('academic_classes').select('id', { count: 'exact', head: true }),
    supabase.from('invoices').select('amount, paid_amount, adjustments, status'),
    supabase.from('admission_applications').select('id', { count: 'exact', head: true }).in('status', ['Submitted', 'Under Review', 'Interview Scheduled']),
    supabase.from('academic_years').select('name').eq('is_current', true).maybeSingle(),
    supabase.from('academic_terms').select('name').eq('is_current', true).maybeSingle(),
  ]);

  const invs = invoices.data ?? [];
  const totalInvoiced = invs.reduce((a, i: any) => a + Number(i.amount ?? 0), 0);
  const totalCollected = invs.reduce((a, i: any) => a + Number(i.paid_amount ?? 0), 0);
  const totalAdj = invs.reduce((a, i: any) => a + Number(i.adjustments ?? 0), 0);
  const overdue = invs.filter((i: any) => i.status === 'Overdue').length;

  return {
    totalStudents: students.count ?? 0,
    activeStudents: activeS.count ?? 0,
    totalStaff: staff.count ?? 0,
    activeTeachers: teachers.count ?? 0,
    totalClasses: classes.count ?? 0,
    totalInvoiced, totalCollected,
    outstandingBalance: totalInvoiced - totalCollected - totalAdj,
    overdueInvoices: overdue,
    pendingApplications: applications.count ?? 0,
    currentYear: (year.data as any)?.name,
    currentTerm: (term.data as any)?.name,
  };
}