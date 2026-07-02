export type StaffRequestKind    = 'Loan' | 'Advance' | 'Reimbursement' | 'Correction' | 'Uniform' | 'Tools' | 'Other';
export type StaffRequestStatus  = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Cancelled' | 'Disbursed';
export type TaskStatus          = 'Open' | 'In Progress' | 'Done' | 'Cancelled' | 'Blocked';
export type TaskPriority        = 'Low' | 'Normal' | 'High' | 'Urgent';
export type ShiftKind           = 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Full-day' | 'Standby' | 'Off';
export type WorkOrderKind       = 'Maintenance' | 'Cleaning' | 'Transport' | 'Grounds' | 'Kitchen' | 'Security' | 'IT' | 'Utilities' | 'Other';
export type WorkOrderStatus     = 'Reported' | 'Assigned' | 'In Progress' | 'On Hold' | 'Completed' | 'Verified' | 'Cancelled';
export type ClinicVisitKind     = 'Consultation' | 'First Aid' | 'Follow-up' | 'Emergency' | 'Vaccination' | 'Screening' | 'Other';
export type ClinicOutcome       = 'Discharged' | 'Referred' | 'Rest at School' | 'Sent Home' | 'Admitted' | 'Under Observation';

export interface MeProfile {
  staff_id: string;
  full_name: string;
  staff_code: string;
  email?: string; phone?: string; photo_url?: string;
  staff_type: string; work_category: string;
  designation?: string; role_label?: string;
  department_id?: string; department_name?: string;
  status: string; date_of_hire: string; basic_salary: number;
  emergency_name?: string; emergency_phone?: string; emergency_relation?: string;
  address?: string;
  tax_pin?: string; nssf_no?: string; nhif_no?: string;
  bank_name?: string; bank_account_no?: string;
  is_clinical: boolean;
}

export interface MyShift {
  id: string; staff_id: string; shift_date: string; kind: ShiftKind;
  starts_at: string; ends_at: string; location?: string; role_label?: string; notes?: string;
}
export interface MyWorkOrder {
  id: string; ticket_no: string; kind: WorkOrderKind; title: string; description?: string;
  location?: string; reported_by?: string; assigned_to?: string;
  priority: TaskPriority; status: WorkOrderStatus;
  due_date?: string; materials_needed?: string; completion_notes?: string;
  reported_at: string; started_at?: string; completed_at?: string;
  verified_by?: string; verified_at?: string;
}
export interface MyAttendance {
  id: string; staff_id: string; date: string;
  check_in?: string; check_out?: string;
  status: string; method?: string; overtime_mins: number;
}
export interface MyLeaveRequest {
  id: string; staff_id: string; leave_type: string;
  start_date: string; end_date: string; days: number;
  reason?: string; status: string;
  approved_by?: string; approved_at?: string; decision_note?: string;
  created_at: string;
}
export interface MyLeaveBalance {
  id: string; staff_id: string; year: number; leave_type: string;
  entitlement: number; taken: number; pending: number;
}
export interface MyPayslip {
  id: string; payroll_run_id: string; staff_id: string;
  basic_salary: number; gross_pay: number; total_deductions: number; net_pay: number;
  working_days?: number; days_present?: number; days_absent?: number; overtime_mins: number;
}
export interface MyDocument {
  id: string; staff_id: string; doc_type: string; file_name: string;
  file_url?: string; expires_on?: string; uploaded_at: string; notes?: string;
}
export interface MyTask {
  id: string; staff_id: string; assigned_by?: string;
  title: string; description?: string;
  due_date?: string; priority: TaskPriority; status: TaskStatus;
  category?: string; completed_at?: string; created_at: string;
}
export interface MyRequest {
  id: string; staff_id: string; kind: StaffRequestKind;
  amount?: number; reason: string; attachment_url?: string;
  status: StaffRequestStatus; decision_by?: string; decision_at?: string;
  decision_note?: string; created_at: string;
}
export interface MyTraining {
  id: string; staff_id: string; title: string; provider?: string;
  starts_on?: string; ends_on?: string; hours?: number;
  certificate_url?: string; status?: string; notes?: string;
}
export interface MyMessage {
  id: string; from_staff_id?: string; scope: string;
  to_staff_id?: string; subject: string; body: string;
  read_at?: string; created_at: string;
}
export interface MyNotice {
  id: string; audience: string;
  title: string; body: string; pinned: boolean;
  published_at: string; expires_at?: string;
}
export interface ClinicVisit {
  id: string; visit_number: string;
  student_id?: string; staff_patient_id?: string;
  visit_date: string; kind: ClinicVisitKind;
  symptoms?: string; temperature?: number; blood_pressure?: string;
  pulse?: number; weight?: number; height?: number;
  diagnosis?: string; treatment_summary?: string;
  outcome: ClinicOutcome; seen_by?: string;
  guardian_notified: boolean; follow_up_date?: string; notes?: string;
}
export interface ClinicDispensation {
  id: string; visit_id: string; medication: string;
  dosage?: string; quantity?: number; route?: string; frequency?: string; notes?: string;
}
export interface ClinicReferral {
  id: string; visit_id: string; referred_to: string;
  reason?: string; urgency?: string; transported_by?: string;
  contact_notified: boolean; notes?: string;
}