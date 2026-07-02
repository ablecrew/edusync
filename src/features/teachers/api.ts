import { supabase } from '@/lib/supabase/client';
import type {
  Assessment, BehaviorNote, ClassAttendance, GatePass, Lesson, SchoolNotice,
  SchoolPeriod, StudyMaterial, Submission, TeacherDashboardRow, TeacherMessage,
  TimetableEntry,
} from './types';

/* ---------- Reference / core ---------- */
export async function fetchPeriods(): Promise<SchoolPeriod[]> {
  const { data, error } = await supabase.from('school_periods').select('*').order('starts_at');
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchTeachers(): Promise<any[]> {
  const { data, error } = await supabase.from('staff')
    .select('id, staff_code, first_name, last_name, email, phone, photo_url, department_id, designation, staff_type, status, subjects_taught, specializations')
    .eq('staff_type', 'Teaching').eq('status', 'Active').order('first_name');
  if (error) throw error; return data ?? [];
}
export async function fetchAllTeachersFull(): Promise<any[]> {
  const { data, error } = await supabase.from('staff').select('*').eq('staff_type', 'Teaching').order('first_name');
  if (error) throw error; return data ?? [];
}
export async function fetchStudentsForClass(className: string) {
  const { data, error } = await supabase.from('students').select('*').eq('class_name', className).eq('status', 'Active').order('first_name');
  if (error) throw error; return data ?? [];
}
export async function fetchAllStudentsLite() {
  const { data, error } = await supabase.from('students').select('id, first_name, last_name, admission_number, class_name, guardian_phone').order('first_name');
  if (error) throw error; return data ?? [];
}
export async function fetchTeacherDashboard(): Promise<TeacherDashboardRow[]> {
  const { data, error } = await supabase.from('teacher_dashboard').select('*');
  if (error) throw error; return (data ?? []) as any;
}

/* ---------- Timetable ---------- */
export async function fetchTimetable(staffId?: string): Promise<TimetableEntry[]> {
  let q = supabase.from('timetable_entries').select('*').order('day').order('slot');
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function addTimetableEntry(input: Omit<TimetableEntry, 'id'>) {
  const { error } = await supabase.from('timetable_entries').insert(input);
  if (error) throw error;
}
export async function deleteTimetableEntry(id: string) {
  const { error } = await supabase.from('timetable_entries').delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Lessons ---------- */
export async function fetchLessons(staffId?: string, from?: string): Promise<Lesson[]> {
  let q = supabase.from('lessons').select('*').order('date', { ascending: false });
  if (staffId) q = q.eq('staff_id', staffId);
  if (from) q = q.gte('date', from);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function createLesson(input: Partial<Lesson> & { staff_id: string; class_name: string; subject: string; topic: string }) {
  const { error } = await supabase.from('lessons').insert(input);
  if (error) throw error;
}
export async function updateLesson(id: string, patch: Partial<Lesson>) {
  const { error } = await supabase.from('lessons').update(patch).eq('id', id);
  if (error) throw error;
}

/* ---------- Study materials ---------- */
export async function fetchMaterials(staffId?: string): Promise<StudyMaterial[]> {
  let q = supabase.from('study_materials').select('*').order('created_at', { ascending: false });
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function addMaterial(input: Partial<StudyMaterial> & { staff_id: string; subject: string; title: string }) {
  const { error } = await supabase.from('study_materials').insert(input);
  if (error) throw error;
}
export async function deleteMaterial(id: string) {
  const { error } = await supabase.from('study_materials').delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Class attendance ---------- */
export async function fetchClassAttendance(date?: string): Promise<ClassAttendance[]> {
  let q = supabase.from('class_attendance').select('*');
  if (date) q = q.eq('date', date);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function upsertClassAttendance(rows: Partial<ClassAttendance>[]) {
  const { error } = await supabase.from('class_attendance').upsert(rows, { onConflict: 'student_id,date,subject' });
  if (error) throw error;
}

/* ---------- Behavior notes ---------- */
export async function fetchBehaviorNotes(studentId?: string, staffId?: string): Promise<BehaviorNote[]> {
  let q = supabase.from('behavior_notes').select('*').order('date', { ascending: false });
  if (studentId) q = q.eq('student_id', studentId);
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function addBehaviorNote(input: Omit<BehaviorNote, 'id'>) {
  const { error } = await supabase.from('behavior_notes').insert(input);
  if (error) throw error;
}

/* ---------- Assessments & submissions ---------- */
export async function fetchAssessments(staffId?: string): Promise<Assessment[]> {
  let q = supabase.from('assessments').select('*').order('due_date', { ascending: false });
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function createAssessment(input: Omit<Assessment, 'id' | 'created_at' | 'issue_date' | 'visible'> & { issue_date?: string; visible?: boolean }) {
  const { data, error } = await supabase.from('assessments').insert({
    issue_date: new Date().toISOString().slice(0, 10),
    visible: true, ...input,
  }).select('*').single();
  if (error) throw error; return data as Assessment;
}
export async function deleteAssessment(id: string) {
  const { error } = await supabase.from('assessments').delete().eq('id', id);
  if (error) throw error;
}
export async function fetchSubmissionsForAssessment(assessmentId: string): Promise<Submission[]> {
  const { data, error } = await supabase.from('submissions').select('*').eq('assessment_id', assessmentId);
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchAllSubmissionsForStaff(staffId: string): Promise<Submission[]> {
  const { data: mine } = await supabase.from('assessments').select('id').eq('staff_id', staffId);
  const ids = (mine ?? []).map((r: any) => r.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('submissions').select('*').in('assessment_id', ids);
  if (error) throw error; return (data ?? []) as any;
}
export async function upsertSubmission(input: Partial<Submission> & { assessment_id: string; student_id: string }) {
  const { error } = await supabase.from('submissions').upsert(input, { onConflict: 'assessment_id,student_id' });
  if (error) throw error;
}
export async function gradeSubmission(id: string, score: number, feedback?: string, graderId?: string) {
  const { error } = await supabase.from('submissions').update({
    score, feedback, graded_by: graderId ?? null, graded_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw error;
}
export async function scanMissingSubmissions() {
  const { data, error } = await supabase.rpc('mark_missing_submissions');
  if (error) throw error; return data as number;
}

/* ---------- Messages & notices ---------- */
export async function fetchMessages(staffId?: string): Promise<TeacherMessage[]> {
  let q = supabase.from('teacher_messages').select('*').order('created_at', { ascending: false }).limit(200);
  if (staffId) q = q.or(`from_staff_id.eq.${staffId},to_staff_id.eq.${staffId}`);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function sendMessage(input: Partial<TeacherMessage> & { subject: string; body: string }) {
  const { error } = await supabase.from('teacher_messages').insert(input);
  if (error) throw error;
}
export async function markMessageRead(id: string) {
  const { error } = await supabase.from('teacher_messages').update({ read_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
export async function fetchNotices(): Promise<SchoolNotice[]> {
  const { data, error } = await supabase.from('school_notices').select('*').order('pinned', { ascending: false }).order('published_at', { ascending: false });
  if (error) throw error; return (data ?? []) as any;
}
export async function postNotice(input: Partial<SchoolNotice> & { title: string; body: string }) {
  const { error } = await supabase.from('school_notices').insert(input);
  if (error) throw error;
}
export async function deleteNotice(id: string) {
  const { error } = await supabase.from('school_notices').delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Gate passes ---------- */
export async function fetchGatePasses(): Promise<GatePass[]> {
  const { data, error } = await supabase.from('gate_passes').select('*').order('created_at', { ascending: false });
  if (error) throw error; return (data ?? []) as any;
}
export async function createGatePass(input: Partial<GatePass> & { student_id: string; reason: string }) {
  const { error } = await supabase.from('gate_passes').insert(input);
  if (error) throw error;
}
export async function updateGatePass(id: string, patch: Partial<GatePass>) {
  const { error } = await supabase.from('gate_passes').update(patch).eq('id', id);
  if (error) throw error;
}