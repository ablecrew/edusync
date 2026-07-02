export type StaffType = 'Teaching' | 'Non-Teaching' | 'Support' | 'Administrative' | 'Executive';
export type StaffStatus = 'Active' | 'On Leave' | 'Suspended' | 'Resigned' | 'Terminated' | 'Retired';
export type WorkCategory = 'Full-time' | 'Part-time' | 'Contract' | 'Intern' | 'Consultant';
export type AttendanceState = 'Present' | 'Absent' | 'Late' | 'Half-day' | 'Excused' | 'Holiday' | 'Weekend';
export type LeaveType = 'Annual' | 'Sick' | 'Maternity' | 'Paternity' | 'Casual' | 'Compassionate' | 'Study' | 'Unpaid';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Taken';
export type PayComponent = 'Basic' | 'Allowance' | 'Bonus' | 'Overtime' | 'Deduction' | 'Tax' | 'Pension' | 'Loan' | 'Advance';
export type PayrunStatus = 'Draft' | 'Approved' | 'Paid' | 'Cancelled';
export type AppraisalStatus = 'Draft' | 'Self-Review' | 'Manager-Review' | 'Finalized';

export interface Department { id: string; name: string; head_id?: string; description?: string }

export interface Staff {
  id: string;
  staff_code: string;
  first_name: string; last_name: string;
  gender?: string; date_of_birth?: string;
  national_id?: string; passport_no?: string;
  email?: string; phone?: string; alt_phone?: string;
  address?: string; photo_url?: string;
  emergency_name?: string; emergency_phone?: string; emergency_relation?: string;
  staff_type: StaffType;
  work_category: WorkCategory;
  department_id?: string;
  designation?: string; role_label?: string;
  status: StaffStatus;
  date_of_hire: string;
  contract_end_date?: string; probation_end_date?: string;
  basic_salary: number;
  bank_name?: string; bank_account_no?: string;
  tax_pin?: string; nssf_no?: string; nhif_no?: string;
  qualifications: Array<{ qualification: string; institution?: string; year?: number }>;
  certifications: Array<{ name: string; issuer?: string; year?: number }>;
  specializations?: string[];
  subjects_taught?: string[];
  notes?: string;
  created_at?: string;
}

export interface StaffDocument {
  id: string; staff_id: string; doc_type: string; file_name: string;
  file_url?: string; size_kb?: number; expires_on?: string;
  uploaded_by?: string; uploaded_at: string; notes?: string;
}

export interface Attendance {
  id: string; staff_id: string; date: string;
  check_in?: string; check_out?: string;
  status: AttendanceState; method?: string;
  ip_address?: string; location?: string;
  overtime_mins: number; notes?: string;
}

export interface LeaveBalance {
  id: string; staff_id: string; year: number; leave_type: LeaveType;
  entitlement: number; taken: number; pending: number;
}
export interface LeaveRequest {
  id: string; staff_id: string; leave_type: LeaveType;
  start_date: string; end_date: string; days: number;
  reason?: string; status: LeaveStatus;
  approved_by?: string; approved_at?: string; decision_note?: string;
  handover_to?: string; attachment_url?: string; created_at: string;
}

export interface PayComponentCatalog {
  id: string; code: string; name: string; kind: PayComponent;
  default_amount?: number; taxable: boolean;
  applies_to?: StaffType[]; active: boolean;
}
export interface StaffPayAssignment {
  id: string; staff_id: string; component_id: string;
  amount: number; active: boolean; starts_on?: string; ends_on?: string; notes?: string;
}
export interface PayrollRun {
  id: string; period_year: number; period_month: number;
  status: PayrunStatus; run_by?: string; approved_by?: string;
  paid_on?: string; notes?: string; created_at: string;
}
export interface Payslip {
  id: string; payroll_run_id: string; staff_id: string;
  basic_salary: number; gross_pay: number; total_deductions: number; net_pay: number;
  working_days?: number; days_present?: number; days_absent?: number; overtime_mins: number;
  notes?: string; created_at: string;
}
export interface PayslipLine {
  id: string; payslip_id: string; component_id?: string;
  code: string; name: string; kind: PayComponent; amount: number;
}

export interface WorkloadAssignment {
  id: string; staff_id: string; class_id?: string; class_name?: string;
  subject: string; weekly_hours: number;
  is_class_teacher: boolean; is_supervisor: boolean;
  academic_year?: string; term?: string; notes?: string;
}
export interface SyllabusProgress {
  id: string; assignment_id: string; topic: string;
  total_lessons: number; lessons_taught: number;
  target_date?: string; actual_date?: string; status?: string; notes?: string;
}

export interface Appraisal {
  id: string; staff_id: string; period_label: string;
  self_score?: number; manager_score?: number; final_score?: number;
  self_comments?: string; manager_comments?: string;
  goals: Array<{ title: string; status?: string; due?: string }>;
  competencies: Array<{ name: string; rating?: number }>;
  status: AppraisalStatus; reviewer_name?: string; finalized_at?: string;
}
export interface StaffSkill {
  id: string; staff_id: string; skill: string; level?: string;
  acquired_on?: string; certified: boolean; notes?: string;
}
export interface HrAudit {
  id: string; actor: string; action: string;
  entity: string; entity_id: string; details?: string; date: string;
}