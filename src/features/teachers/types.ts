export type PeriodSlot = 'P1'|'P2'|'P3'|'P4'|'P5'|'P6'|'P7'|'P8'|'BREAK'|'LUNCH';
export type DayOfWeek  = 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun';
export type MaterialKind    = 'Notes'|'Handout'|'Video'|'Slide'|'Question Paper'|'Worksheet'|'Link'|'Other';
export type AssessmentKind  = 'Assignment'|'Homework'|'Quiz'|'Test'|'Exam'|'Project'|'Practical';
export type SubmissionStatus = 'Assigned'|'Submitted'|'Late'|'Graded'|'Missing'|'Excused';
export type MessageScope    = 'Student'|'Guardian'|'Class'|'Staff'|'Broadcast';
export type BehaviorKind    = 'Positive'|'Concern'|'Serious';

export interface SchoolPeriod {
  id: string; slot: PeriodSlot; starts_at: string; ends_at: string; is_break: boolean;
}
export interface TimetableEntry {
  id: string; staff_id: string; class_id?: string; class_name: string; subject: string;
  day: DayOfWeek; slot: PeriodSlot; room?: string;
  academic_year?: string; term?: string; color?: string; notes?: string;
}
export interface Lesson {
  id: string; timetable_id?: string; staff_id: string; class_name: string; subject: string;
  date: string; topic: string; objectives?: string; activities?: string;
  homework?: string; resources_used?: string; reflection?: string; status?: string;
}
export interface StudyMaterial {
  id: string; staff_id: string; class_name?: string; subject: string; title: string;
  kind: MaterialKind; file_name?: string; file_url?: string; size_kb?: number;
  description?: string; shared_with_students: boolean; shared_with_staff: boolean;
  created_at: string;
}
export interface ClassAttendance {
  id: string; staff_id?: string; student_id: string; class_name?: string; subject?: string;
  date: string; status: string; notes?: string;
}
export interface BehaviorNote {
  id: string; staff_id?: string; student_id: string; date: string;
  kind: BehaviorKind; category?: string; note: string; action_taken?: string; follow_up?: string;
}
export interface Assessment {
  id: string; staff_id: string; class_name: string; subject: string; title: string;
  kind: AssessmentKind; instructions?: string;
  max_score: number; weight?: number;
  issue_date: string; due_date: string; visible: boolean;
  academic_year?: string; term?: string; attachment_url?: string;
  created_at: string;
}
export interface Submission {
  id: string; assessment_id: string; student_id: string;
  submitted_at?: string; file_url?: string; answer_text?: string;
  score?: number; grade?: string; feedback?: string;
  status: SubmissionStatus; graded_by?: string; graded_at?: string;
}
export interface TeacherMessage {
  id: string; from_staff_id?: string; scope: MessageScope;
  to_student_id?: string; to_class_name?: string; to_staff_id?: string;
  subject: string; body: string; read_at?: string; created_at: string;
}
export interface SchoolNotice {
  id: string; posted_by?: string; audience: string;
  title: string; body: string; pinned: boolean;
  published_at: string; expires_at?: string;
}
export interface GatePass {
  id: string; student_id: string; issued_by?: string; reason: string;
  leave_time: string; return_time?: string; approved_by?: string; status: string; notes?: string;
}

export interface TeacherDashboardRow {
  staff_id: string; staff_code: string; full_name: string;
  class_count: number; subject_count: number; lessons_today: number;
  pending_grading: number; upcoming_assessments: number;
}