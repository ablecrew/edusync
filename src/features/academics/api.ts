import { supabase } from '@/lib/supabase/client';
import type {
  AcademicYear, AcademicTerm, AcademicsAudit, AssessmentResult, ClassSubject,
  Competency, CurriculumSubject, ExamPaper, ExamSchedule, GradeBand, GradingScheme,
  LearningArea, PortfolioItem, ReportCard, ReportLine, SchemeOfWork, SchemeTopic,
  Strand, SubStrand, SubjectPerformanceRow,
} from './types';

/* ---------- Years / terms ---------- */
export async function fetchYears(): Promise<AcademicYear[]> {
  const { data, error } = await supabase.from('academic_years').select('*').order('starts_on', { ascending: false });
  if (error) throw error; return (data ?? []) as any;
}
export async function upsertYear(input: Partial<AcademicYear> & { name: string; starts_on: string; ends_on: string }) {
  const { error } = await supabase.from('academic_years').upsert(input, { onConflict: 'name' });
  if (error) throw error;
}
export async function fetchTerms(): Promise<AcademicTerm[]> {
  const { data, error } = await supabase.from('academic_terms').select('*');
  if (error) throw error; return (data ?? []) as any;
}
export async function upsertTerm(input: Partial<AcademicTerm> & { name: string }) {
  const { error } = await supabase.from('academic_terms').upsert(input, { onConflict: 'name' });
  if (error) throw error;
}

/* ---------- Subjects & hierarchy ---------- */
export async function fetchSubjects(): Promise<CurriculumSubject[]> {
  const { data, error } = await supabase.from('curriculum_subjects').select('*').order('name');
  if (error) throw error; return (data ?? []) as any;
}
export async function createSubject(input: Partial<CurriculumSubject> & { code: string; name: string }) {
  const { data, error } = await supabase.from('curriculum_subjects').insert(input).select('*').single();
  if (error) throw error; return data as CurriculumSubject;
}
export async function updateSubject(id: string, patch: Partial<CurriculumSubject>) {
  const { error } = await supabase.from('curriculum_subjects').update(patch).eq('id', id);
  if (error) throw error;
}
export async function deleteSubject(id: string) {
  const { error } = await supabase.from('curriculum_subjects').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchLearningAreas(subjectId?: string): Promise<LearningArea[]> {
  let q = supabase.from('learning_areas').select('*').order('order_no');
  if (subjectId) q = q.eq('subject_id', subjectId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function addLearningArea(input: Omit<LearningArea, 'id'>) {
  const { error } = await supabase.from('learning_areas').insert(input);
  if (error) throw error;
}
export async function fetchStrands(areaId?: string): Promise<Strand[]> {
  let q = supabase.from('strands').select('*').order('order_no');
  if (areaId) q = q.eq('learning_area_id', areaId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function addStrand(input: Omit<Strand, 'id'>) {
  const { error } = await supabase.from('strands').insert(input);
  if (error) throw error;
}
export async function fetchSubStrands(strandId?: string): Promise<SubStrand[]> {
  let q = supabase.from('sub_strands').select('*').order('order_no');
  if (strandId) q = q.eq('strand_id', strandId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function addSubStrand(input: Omit<SubStrand, 'id'>) {
  const { error } = await supabase.from('sub_strands').insert(input);
  if (error) throw error;
}
export async function deleteHierarchyRow(table: 'learning_areas'|'strands'|'sub_strands', id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Class-subject mapping ---------- */
export async function fetchClassSubjects(): Promise<ClassSubject[]> {
  const { data, error } = await supabase.from('class_subjects').select('*');
  if (error) throw error; return (data ?? []) as any;
}
export async function assignClassSubject(input: Partial<ClassSubject> & { class_id: string; subject_id: string }) {
  const { error } = await supabase.from('class_subjects').upsert(input, { onConflict: 'class_id,subject_id,academic_year_id' });
  if (error) throw error;
}
export async function unassignClassSubject(id: string) {
  const { error } = await supabase.from('class_subjects').delete().eq('id', id);
  if (error) throw error;
}
export async function fetchAcademicClasses() {
  const { data, error } = await supabase.from('academic_classes').select('id, name, code, capacity, current_students').order('name');
  if (error) throw error; return data ?? [];
}

/* ---------- Grading ---------- */
export async function fetchSchemes(): Promise<GradingScheme[]> {
  const { data, error } = await supabase.from('grading_schemes').select('*').order('name');
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchBands(schemeId?: string): Promise<GradeBand[]> {
  let q = supabase.from('grade_bands').select('*').order('min_score', { ascending: false });
  if (schemeId) q = q.eq('scheme_id', schemeId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function upsertScheme(input: Partial<GradingScheme> & { name: string }) {
  const { data, error } = await supabase.from('grading_schemes').upsert(input, { onConflict: 'name' }).select('*').single();
  if (error) throw error; return data as GradingScheme;
}
export async function addBand(input: Omit<GradeBand, 'id'>) {
  const { error } = await supabase.from('grade_bands').insert(input);
  if (error) throw error;
}
export async function deleteBand(id: string) {
  const { error } = await supabase.from('grade_bands').delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Competencies ---------- */
export async function fetchCompetencies(subjectId?: string): Promise<Competency[]> {
  let q = supabase.from('competencies').select('*').order('order_no');
  if (subjectId) q = q.eq('subject_id', subjectId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function addCompetency(input: Omit<Competency, 'id'>) {
  const { error } = await supabase.from('competencies').insert(input);
  if (error) throw error;
}

/* ---------- Schemes of work ---------- */
export async function fetchSchemesOfWork(staffId?: string): Promise<SchemeOfWork[]> {
  let q = supabase.from('schemes_of_work').select('*').order('created_at', { ascending: false });
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function createSchemeOfWork(input: Omit<SchemeOfWork, 'id'>) {
  const { data, error } = await supabase.from('schemes_of_work').insert(input).select('*').single();
  if (error) throw error; return data as SchemeOfWork;
}
export async function fetchSchemeTopics(schemeId: string): Promise<SchemeTopic[]> {
  const { data, error } = await supabase.from('scheme_topics').select('*').eq('scheme_id', schemeId).order('week_no');
  if (error) throw error; return (data ?? []) as any;
}
export async function addSchemeTopic(input: Omit<SchemeTopic, 'id'>) {
  const { error } = await supabase.from('scheme_topics').insert(input);
  if (error) throw error;
}
export async function updateSchemeTopic(id: string, patch: Partial<SchemeTopic>) {
  const { error } = await supabase.from('scheme_topics').update(patch).eq('id', id);
  if (error) throw error;
}

/* ---------- Exam schedules & papers ---------- */
export async function fetchExamSchedules(): Promise<ExamSchedule[]> {
  const { data, error } = await supabase.from('exam_schedules').select('*').order('starts_on', { ascending: false });
  if (error) throw error; return (data ?? []) as any;
}
export async function createExamSchedule(input: Omit<ExamSchedule, 'id'>) {
  const { data, error } = await supabase.from('exam_schedules').insert(input).select('*').single();
  if (error) throw error; return data as ExamSchedule;
}
export async function fetchExamPapers(scheduleId?: string): Promise<ExamPaper[]> {
  let q = supabase.from('exam_papers').select('*').order('paper_date');
  if (scheduleId) q = q.eq('schedule_id', scheduleId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function addExamPaper(input: Omit<ExamPaper, 'id'>) {
  const { error } = await supabase.from('exam_papers').insert(input);
  if (error) throw error;
}
export async function deleteExamPaper(id: string) {
  const { error } = await supabase.from('exam_papers').delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Assessment results (score entry + moderation) ---------- */
export async function fetchResultsForPaper(paperId: string): Promise<AssessmentResult[]> {
  const { data, error } = await supabase.from('assessment_results').select('*').eq('exam_paper_id', paperId);
  if (error) throw error; return (data ?? []) as any;
}
export async function upsertResults(rows: Partial<AssessmentResult>[]) {
  const { error } = await supabase.from('assessment_results').upsert(rows);
  if (error) throw error;
}
export async function moderateResult(id: string, moderated_score: number, moderated_by: string) {
  const { error } = await supabase.from('assessment_results').update({
    moderated_score, moderated_by, moderated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw error;
}
export async function finalizeResults(paperId: string) {
  const { error } = await supabase.from('assessment_results').update({ is_final: true }).eq('exam_paper_id', paperId);
  if (error) throw error;
}

/* ---------- Report cards ---------- */
export async function fetchReports(): Promise<ReportCard[]> {
  const { data, error } = await supabase.from('report_cards').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchReportLines(reportId: string): Promise<ReportLine[]> {
  const { data, error } = await supabase.from('report_lines').select('*').eq('report_id', reportId);
  if (error) throw error; return (data ?? []) as any;
}
export async function buildReportCard(studentId: string, yearId: string | null, termId: string | null, actor: string) {
  const { data, error } = await supabase.rpc('build_report_card', { _student_id: studentId, _year_id: yearId, _term_id: termId, _actor: actor });
  if (error) throw error; return data as string;
}
export async function rankClass(className: string, yearId: string | null, termId: string | null) {
  const { data, error } = await supabase.rpc('rank_class_reports', { _class_name: className, _year_id: yearId, _term_id: termId });
  if (error) throw error; return data as number;
}
export async function updateReportCard(id: string, patch: Partial<ReportCard>) {
  const { error } = await supabase.from('report_cards').update(patch).eq('id', id);
  if (error) throw error;
}
export async function updateReportLine(id: string, patch: Partial<ReportLine>) {
  const { error } = await supabase.from('report_lines').update(patch).eq('id', id);
  if (error) throw error;
}

/* ---------- Portfolio ---------- */
export async function fetchPortfolio(studentId?: string): Promise<PortfolioItem[]> {
  let q = supabase.from('portfolio_items').select('*').order('captured_on', { ascending: false });
  if (studentId) q = q.eq('student_id', studentId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as any;
}
export async function addPortfolioItem(input: Partial<PortfolioItem> & { student_id: string; title: string }) {
  const { error } = await supabase.from('portfolio_items').insert(input);
  if (error) throw error;
}
export async function deletePortfolioItem(id: string) {
  const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Audit + analytics ---------- */
export async function fetchAudit(): Promise<AcademicsAudit[]> {
  const { data, error } = await supabase.from('academics_audit').select('*').order('date', { ascending: false }).limit(300);
  if (error) throw error; return (data ?? []) as any;
}
export async function fetchSubjectPerformance(): Promise<SubjectPerformanceRow[]> {
  const { data, error } = await supabase.from('subject_performance').select('*');
  if (error) throw error; return (data ?? []) as any;
}