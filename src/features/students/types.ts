export type StudentStatus = 'Active' | 'Graduated' | 'Suspended' | 'Transferred' | 'Withdrawn';

export interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  class_id: string;
  class_name: string;
  stream?: string;
  section?: string;
  roll_no?: string;
  status: StudentStatus;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  address?: string;
  medical_conditions?: string;
  blood_group?: string;
  allergies?: string;
  enrolled_date: string;
  avatar_url?: string;
  fee_balance: number;
  created_at?: string;
}

export type InquiryStatus = 'New' | 'Contacted' | 'Interested' | 'Cold' | 'Converted' | 'Closed';

export interface AdmissionInquiry {
  id: string;
  first_name: string;
  last_name: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  interested_class?: string;
  desired_start_date?: string;
  source?: string;
  notes?: string;
  status: InquiryStatus;
  contacted_at?: string;
  converted_to_id?: string;
  created_at: string;
}

export type ApplicationStatus =
  | 'Draft' | 'Submitted' | 'Under Review' | 'Interview Scheduled'
  | 'Merit List' | 'Approved' | 'Rejected' | 'Waitlisted' | 'Enrolled' | 'Withdrawn';

export interface ApplicationDocument {
  id: string;
  name: string;
  url?: string;
  size_kb?: number;
  uploaded_at: string;
}

export interface AdmissionApplication {
  id: string;
  application_no: string;
  first_name: string;
  last_name: string;
  gender?: string;
  date_of_birth?: string;
  applying_for_class: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  address?: string;
  previous_school?: string;
  entrance_score?: number;
  interview_date?: string;
  interview_notes?: string;
  merit_rank?: number;
  status: ApplicationStatus;
  decision_by?: string;
  decision_at?: string;
  decision_reason?: string;
  enrolled_student_id?: string;
  documents: ApplicationDocument[];
  inquiry_id?: string;
  submitted_at: string;
}

export interface StudentDocument {
  id: string;
  student_id: string;
  doc_type: string;
  file_name: string;
  file_url?: string;
  size_kb?: number;
  uploaded_by?: string;
  uploaded_at: string;
  notes?: string;
}

export type LifecycleKind =
  | 'Enrollment' | 'Promotion' | 'Transfer In' | 'Transfer Out'
  | 'Withdrawal' | 'Re-enrollment' | 'Graduation' | 'Suspension' | 'Reinstatement';

export interface LifecycleEvent {
  id: string;
  student_id: string;
  kind: LifecycleKind;
  effective_date: string;
  from_value?: string;
  to_value?: string;
  reason?: string;
  actor?: string;
  created_at: string;
}

export type SiblingType = 'Sibling' | 'Alumni' | 'Guardian' | 'Same Household' | 'Other';

export interface SiblingLink {
  id: string;
  student_id: string;
  related_id?: string;
  related_name: string;
  relation: SiblingType;
  notes?: string;
  created_at: string;
}