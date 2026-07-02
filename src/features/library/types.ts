export type ResourceType = 'Book' | 'Journal' | 'Magazine' | 'Newspaper' | 'eBook' | 'Audio' | 'Video' | 'Other';
export type CopyStatus   = 'Available' | 'Issued' | 'Reserved' | 'Lost' | 'Damaged' | 'Under Repair' | 'Withdrawn';
export type LoanStatus   = 'Active' | 'Returned' | 'Overdue' | 'Lost' | 'Cancelled';
export type ReservationStatus = 'Pending' | 'Ready' | 'Fulfilled' | 'Cancelled' | 'Expired';
export type FineStatus   = 'Pending' | 'Paid' | 'Waived' | 'Posted to Finance';
export type FineKind     = 'Overdue' | 'Lost' | 'Damaged' | 'Other';
export type MemberType   = 'Student' | 'Teacher' | 'Staff' | 'External';

export interface LibraryResource {
  id: string;
  resource_type: ResourceType;
  title: string;
  subtitle?: string;
  authors?: string;
  isbn?: string;
  issn?: string;
  publisher?: string;
  edition?: string;
  publication_year?: number;
  language?: string;
  category?: string;
  subcategory?: string;
  shelf_location?: string;
  description?: string;
  cover_url?: string;
  keywords?: string;
  created_at?: string;
}
export interface LibraryResourceSummary extends LibraryResource {
  total_copies: number;
  available_copies: number;
  issued_copies: number;
  damaged_copies: number;
  lost_copies: number;
}
export interface LibraryCopy {
  id: string;
  resource_id: string;
  copy_code: string;
  status: CopyStatus;
  condition?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
  notes?: string;
}
export interface LibraryMember {
  id: string;
  member_type: MemberType;
  student_id?: string;
  staff_id?: string;
  card_no: string;
  full_name: string;
  email?: string;
  phone?: string;
  active: boolean;
  suspended_until?: string;
  notes?: string;
  created_at?: string;
}
export interface LibraryRule {
  id: string;
  member_type: MemberType;
  max_active: number;
  loan_days: number;
  renew_allowed: number;
  fine_per_day: number;
  grace_days: number;
}
export interface LibraryLoan {
  id: string;
  copy_id: string;
  member_id: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  renewed_count: number;
  status: LoanStatus;
  issued_by?: string;
  returned_to?: string;
  condition_out?: string;
  condition_in?: string;
  notes?: string;
}
export interface LibraryReservation {
  id: string;
  resource_id: string;
  member_id: string;
  reserved_at: string;
  expires_at?: string;
  status: ReservationStatus;
  ready_copy_id?: string;
  notes?: string;
}
export interface LibraryFine {
  id: string;
  loan_id?: string;
  member_id: string;
  student_id?: string;
  kind: FineKind;
  amount: number;
  reason?: string;
  status: FineStatus;
  waived_by?: string;
  waived_reason?: string;
  posted_invoice_id?: string;
  created_at: string;
}