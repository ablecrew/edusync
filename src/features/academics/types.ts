export type CurriculumType = 'CBC'|'8-4-4'|'IGCSE'|'IB'|'Other';
export type SubjectKind    = 'Core'|'Optional'|'Co-curricular'|'Life-skill';
export type AssessmentType = 'Formative'|'Summative'|'Continuous'|'Project'|'Practical'|'End-of-Term';
export type ReportStatus   = 'Draft'|'Ready-for-Review'|'Approved'|'Published'|'Archived';
export type PathwayType    = 'STEM'|'Arts and Sports Science'|'Social Sciences'|'Languages'|'None';
export type EvidenceKind   = 'Document'|'Image'|'Video'|'Audio'|'Link'|'Reflection';

export interface AcademicYear {
  id: string; name: string; starts_on: string; ends_on: string; is_current: boolean;
}
export interface AcademicTerm {
  id: string; name: string; academic_year_id?: string;
  starts_on?: string; ends_on?: string; is_current: boolean;
}
export interface CurriculumSubject {
  id: string; code: string; name: string;
  curriculum: CurriculumType; kind: SubjectKind;
  department?: string; description?: string; color?: string; is_active: boolean;
}
export interface LearningArea {
  id: string; subject_id: string; name: string; order_no?: number; description?: string;
}
export interface Strand {
  id: string; learning_area_id: string; name: string; order_no?: number; description?: string;
}
export interface SubStrand {
  id: string; strand_id: string; name: string; order_no?: number; description?: string; competency?: string;
}
export interface ClassSubject {
  id: string; class_id: string; subject_id: string; is_mandatory: boolean; academic_year_id?: string;
}
export interface GradingScheme {
  id: string; name: string; curriculum: CurriculumType; is_default: boolean; description?: string;
}
export interface GradeBand {
  id: string; scheme_id: string; label: string; code?: string;
  min_score: number; max_score: number; points?: number; descriptor?: string; color?: string;
}
export interface Competency {
  id: string; subject_id?: string; sub_strand_id?: string;
  code: string; name: string; descriptor?: string; order_no?: number;
}
export interface SchemeOfWork {
  id: string; staff_id: string; subject_id?: string; class_id?: string;
  academic_year_id?: string; term_id?: string; title: string; file_url?: string;
}
export interface SchemeTopic {
  id: string; scheme_id: string; week_no: number; topic: string;
  learning_outcome?: string; resources?: string;
  lessons_planned: number; lessons_taught: number;
  target_date?: string; actual_date?: string; status?: string; notes?: string;
}
export interface ExamSchedule {
  id: string; name: string;
  academic_year_id?: string; term_id?: string;
  assessment_type: AssessmentType;
  starts_on: string; ends_on: string; publish_target?: string;
  created_by?: string; notes?: string;
}
export interface ExamPaper {
  id: string; schedule_id: string; subject_id?: string; subject_name: string;
  class_id?: string; class_name: string;
  paper_date: string; start_time?: string; duration_mins?: number;
  room?: string; invigilator?: string; max_score: number;
}
export interface AssessmentResult {
  id: string;
  assessment_id?: string; exam_paper_id?: string; student_id: string;
  raw_score?: number; moderated_score?: number;
  grade_band_id?: string; cbc_level?: string; remarks?: string;
  entered_by?: string; entered_at?: string;
  moderated_by?: string; moderated_at?: string;
  is_final: boolean;
}
export interface ReportCard {
  id: string; student_id: string; academic_year_id?: string; term_id?: string;
  overall_score?: number; overall_grade?: string; overall_cbc_level?: string;
  position_class?: number; position_stream?: number;
  class_teacher_remark?: string; principal_remark?: string;
  attendance_days?: number; attendance_total?: number;
  status: ReportStatus; approved_by?: string; approved_at?: string; published_at?: string;
  created_at: string;
}
export interface ReportLine {
  id: string; report_id: string; subject_id?: string; subject_name: string;
  teacher_name?: string; raw_score?: number; moderated_score?: number;
  grade?: string; cbc_level?: string; teacher_remark?: string; competencies?: any[];
}
export interface PortfolioItem {
  id: string; student_id: string; subject_id?: string; competency_id?: string;
  title: string; reflection?: string; kind: EvidenceKind; file_url?: string;
  captured_on?: string; uploaded_by?: string; visible_to_parent: boolean;
}
export interface AcademicsAudit {
  id: string; actor: string; action: string; entity: string; entity_id: string; details?: string; date: string;
}
export interface SubjectPerformanceRow {
  subject_id?: string; subject_name: string; class_name: string;
  attempts: number; avg_score: number; max_score: number; min_score: number;
}