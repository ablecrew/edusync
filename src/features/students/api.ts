import { supabase } from '@/lib/supabase/client';
import type {
  AdmissionApplication, AdmissionInquiry, ApplicationStatus,
  InquiryStatus, LifecycleEvent, LifecycleKind, SiblingLink,
  Student, StudentDocument, StudentStatus,
} from './types';

/* ---------- Mappers ---------- */
const toStudent = (r: any): Student => ({
  id: r.id,
  admission_number: r.admission_number ?? '',
  first_name: r.first_name,
  last_name: r.last_name,
  gender: r.gender ?? 'Other',
  date_of_birth: r.date_of_birth,
  class_id: r.class_id ?? '',
  class_name: r.class_name ?? '',
  stream: r.stream ?? undefined,
  section: r.section ?? undefined,
  roll_no: r.roll_no ?? undefined,
  status: r.status,
  guardian_name: r.guardian_name ?? '',
  guardian_phone: r.guardian_phone ?? '',
  guardian_email: r.guardian_email ?? undefined,
  address: r.address ?? undefined,
  medical_conditions: r.medical_conditions ?? undefined,
  blood_group: r.blood_group ?? undefined,
  allergies: r.allergies ?? undefined,
  enrolled_date: r.enrolled_date ?? '',
  avatar_url: r.avatar_url ?? undefined,
  fee_balance: Number(r.fee_balance ?? 0),
  created_at: r.created_at ?? undefined,
});

const toInquiry = (r: any): AdmissionInquiry => ({ ...r });
const toApplication = (r: any): AdmissionApplication => ({
  ...r,
  documents: r.documents ?? [],
  entrance_score: r.entrance_score != null ? Number(r.entrance_score) : undefined,
  merit_rank: r.merit_rank != null ? Number(r.merit_rank) : undefined,
});
const toDoc = (r: any): StudentDocument => ({ ...r, size_kb: r.size_kb != null ? Number(r.size_kb) : undefined });
const toLifecycle = (r: any): LifecycleEvent => ({ ...r });
const toSibling = (r: any): SiblingLink => ({ ...r });

/* ---------- Fetchers ---------- */
export async function fetchStudents(): Promise<Student[]> {
  const { data, error } = await supabase.from('students').select('*').order('first_name');
  if (error) throw error;
  return (data ?? []).map(toStudent);
}
export async function fetchClasses(): Promise<{ id: string; name: string; capacity?: number; current_students?: number }[]> {
  const { data, error } = await supabase.from('academic_classes').select('id,name,capacity,current_students').order('name');
  if (error) throw error;
  return (data ?? []) as any;
}
export async function fetchInquiries(): Promise<AdmissionInquiry[]> {
  const { data, error } = await supabase.from('admission_inquiries').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toInquiry);
}
export async function fetchApplications(): Promise<AdmissionApplication[]> {
  const { data, error } = await supabase.from('admission_applications').select('*').order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toApplication);
}
export async function fetchStudentDocuments(studentId?: string): Promise<StudentDocument[]> {
  let q = supabase.from('student_documents').select('*').order('uploaded_at', { ascending: false });
  if (studentId) q = q.eq('student_id', studentId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(toDoc);
}
export async function fetchLifecycleEvents(studentId?: string): Promise<LifecycleEvent[]> {
  let q = supabase.from('student_lifecycle_events').select('*').order('effective_date', { ascending: false });
  if (studentId) q = q.eq('student_id', studentId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(toLifecycle);
}
export async function fetchSiblingLinks(studentId?: string): Promise<SiblingLink[]> {
  let q = supabase.from('sibling_links').select('*').order('created_at', { ascending: false });
  if (studentId) q = q.eq('student_id', studentId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(toSibling);
}

/* ---------- Student mutations ---------- */
export async function createStudent(input: Partial<Student> & {
  first_name: string; last_name: string; class_name: string; class_id: string;
  guardian_name: string; guardian_phone: string; gender: string; date_of_birth: string;
}): Promise<Student> {
  const admission_number = input.admission_number ??
    `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const enrolled_date = input.enrolled_date ?? new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from('students').insert({
    ...input,
    admission_number,
    enrolled_date,
    status: input.status ?? 'Active',
    fee_balance: input.fee_balance ?? 0,
  }).select('*').single();
  if (error) throw error;

  await logLifecycle({
    student_id: data.id,
    kind: 'Enrollment',
    to_value: data.class_name,
    reason: 'Initial enrollment',
    actor: 'System',
  });
  return toStudent(data);
}

export async function updateStudent(id: string, patch: Partial<Student>): Promise<Student> {
  const { data, error } = await supabase.from('students').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return toStudent(data);
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw error;
}

export async function changeStudentStatus(id: string, status: StudentStatus, reason?: string, actor?: string): Promise<void> {
  const { data: cur } = await supabase.from('students').select('status,class_name').eq('id', id).single();
  const { error } = await supabase.from('students').update({ status }).eq('id', id);
  if (error) throw error;
  const kind: LifecycleKind =
    status === 'Withdrawn' ? 'Withdrawal' :
    status === 'Transferred' ? 'Transfer Out' :
    status === 'Graduated' ? 'Graduation' :
    status === 'Suspended' ? 'Suspension' :
    status === 'Active' && cur?.status === 'Suspended' ? 'Reinstatement' :
    'Enrollment';
  await logLifecycle({ student_id: id, kind, from_value: cur?.status, to_value: status, reason, actor });
}

export async function promoteStudent(id: string, newClass: string, actor?: string): Promise<void> {
  const { data: cur } = await supabase.from('students').select('class_name').eq('id', id).single();
  const { error } = await supabase.from('students').update({ class_name: newClass }).eq('id', id);
  if (error) throw error;
  await logLifecycle({
    student_id: id, kind: 'Promotion',
    from_value: cur?.class_name, to_value: newClass,
    reason: 'Annual promotion', actor,
  });
}

/* ---------- Inquiry mutations ---------- */
export async function createInquiry(input: Omit<AdmissionInquiry, 'id' | 'created_at' | 'status'>): Promise<AdmissionInquiry> {
  const { data, error } = await supabase.from('admission_inquiries')
    .insert({ ...input, status: 'New' }).select('*').single();
  if (error) throw error;
  return toInquiry(data);
}
export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const patch: any = { status };
  if (status === 'Contacted') patch.contacted_at = new Date().toISOString();
  const { error } = await supabase.from('admission_inquiries').update(patch).eq('id', id);
  if (error) throw error;
}

/* ---------- Application mutations ---------- */
export async function createApplication(input: Omit<AdmissionApplication,
  'id' | 'application_no' | 'submitted_at' | 'status' | 'documents'>): Promise<AdmissionApplication> {
  const application_no = `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const { data, error } = await supabase.from('admission_applications')
    .insert({ ...input, application_no, status: 'Submitted', documents: [] })
    .select('*').single();
  if (error) throw error;
  return toApplication(data);
}

export async function updateApplication(id: string, patch: Partial<AdmissionApplication>): Promise<void> {
  const { error } = await supabase.from('admission_applications').update(patch).eq('id', id);
  if (error) throw error;
}

export async function decideApplication(
  id: string, status: ApplicationStatus, decision_by: string, reason?: string
): Promise<void> {
  const { error } = await supabase.from('admission_applications').update({
    status, decision_by, decision_reason: reason ?? null,
    decision_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw error;
}

/** Approve → create student record → link back to application. */
export async function enrollApplication(applicationId: string, classId: string): Promise<Student> {
  const { data: app, error: aErr } = await supabase.from('admission_applications')
    .select('*').eq('id', applicationId).single();
  if (aErr) throw aErr;

  const student = await createStudent({
    first_name: app.first_name,
    last_name: app.last_name,
    gender: (app.gender ?? 'Other') as any,
    date_of_birth: app.date_of_birth ?? new Date().toISOString().slice(0, 10),
    class_id: classId,
    class_name: app.applying_for_class,
    guardian_name: app.guardian_name,
    guardian_phone: app.guardian_phone,
    guardian_email: app.guardian_email ?? '',
    address: app.address ?? '',
  });

  await supabase.from('admission_applications')
    .update({ status: 'Enrolled', enrolled_student_id: student.id, decision_at: new Date().toISOString() })
    .eq('id', applicationId);

  return student;
}

/* ---------- Documents ---------- */
export async function addStudentDocument(input: {
  student_id: string; doc_type: string; file_name: string;
  file_url?: string; size_kb?: number; uploaded_by?: string; notes?: string;
}): Promise<StudentDocument> {
  const { data, error } = await supabase.from('student_documents').insert(input).select('*').single();
  if (error) throw error;
  return toDoc(data);
}
export async function deleteStudentDocument(id: string): Promise<void> {
  const { error } = await supabase.from('student_documents').delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Lifecycle + Sibling ---------- */
export async function logLifecycle(input: Omit<LifecycleEvent, 'id' | 'created_at' | 'effective_date'> & { effective_date?: string }): Promise<void> {
  await supabase.from('student_lifecycle_events').insert({
    ...input, effective_date: input.effective_date ?? new Date().toISOString().slice(0, 10),
  });
}
export async function addSiblingLink(input: Omit<SiblingLink, 'id' | 'created_at'>): Promise<SiblingLink> {
  const { data, error } = await supabase.from('sibling_links').insert(input).select('*').single();
  if (error) throw error;
  return toSibling(data);
}
export async function removeSiblingLink(id: string): Promise<void> {
  const { error } = await supabase.from('sibling_links').delete().eq('id', id);
  if (error) throw error;
}