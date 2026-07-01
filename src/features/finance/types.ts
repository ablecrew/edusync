export type PaymentMethod =
  | 'Cash'
  | 'Bank Transfer'
  | 'MPESA'
  | 'Paybill'
  | 'Till'
  | 'Cheque'
  | 'Sponsor'
  | 'Bursary Credit';

export type InvoiceStatus = 'Draft' | 'Unpaid' | 'Partial' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  class_name: string;
  stream: string;
  boarding: 'Day' | 'Boarding';
  transport_route?: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  photo?: string;
}

export interface FeeItem {
  id: string;
  name: string;
  category: 'Tuition' | 'Boarding' | 'Transport' | 'Activity' | 'Uniform' | 'Exam' | 'Other';
  amount: number;
  applies_to: {
    classes?: string[];
    boarding?: ('Day' | 'Boarding')[];
    transport_routes?: string[];
    stream?: string[];
  };
  mandatory: boolean;
}

export interface FeeStructure {
  id: string;
  name: string;
  term: string;
  academic_year: string;
  class_name: string;
  items: string[]; // FeeItem ids
  total: number;
  active: boolean;
}

export interface InvoiceLine {
  id: string;
  description: string;
  amount: number;
  fee_item_id?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  student_id: string;
  term: string;
  academic_year: string;
  issue_date: string;
  due_date: string;
  lines: InvoiceLine[];
  amount: number;
  paid_amount: number;
  adjustments: number; // waivers/discounts/write-offs (positive = credited off)
  status: InvoiceStatus;
  notes?: string;
}

export interface Payment {
  id: string;
  receipt_no: string;
  invoice_id: string;
  student_id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string; // MPESA code, cheque no, txn ref
  received_by: string;
  reconciled: boolean;
  reconciled_at?: string;
  bank_statement_ref?: string;
  notes?: string;
  sponsor_id?: string;
}

export type AdjustmentKind = 'Waiver' | 'Discount' | 'Write-off' | 'Overpayment Refund' | 'Correction';

export interface Adjustment {
  id: string;
  student_id: string;
  invoice_id?: string;
  kind: AdjustmentKind;
  amount: number;
  reason: string;
  requested_by: string;
  approval_status: 'Pending' | 'Approved' | 'Rejected';
  approved_by?: string;
  date: string;
}

export interface Sponsor {
  id: string;
  name: string;
  type: 'Individual' | 'Corporate' | 'NGO' | 'Government' | 'Faith-based';
  contact: string;
  email: string;
  students: string[];
  total_committed: number;
  total_remitted: number;
  active: boolean;
}

export type BursaryStatus =
  | 'Applied'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Disbursed'
  | 'Suspended'
  | 'Closed';

export interface BursaryDocument {
  id: string;
  name: string;
  uploaded_at: string;
  size_kb: number;
}

export interface BursaryNote {
  id: string;
  date: string;
  author: string;
  message: string;
}

export interface Bursary {
  id: string;
  reference: string;
  program: string; // e.g. "Constituency Bursary Fund"
  sponsor_id?: string;
  student_id: string;
  application_date: string;
  awarded_amount: number;
  requested_amount: number;
  status: BursaryStatus;
  eligibility_notes: string;
  academic_year: string;
  term: string;
  progress_flag: 'On Track' | 'At Risk' | 'Not Set';
  approved_by?: string;
  approved_at?: string;
  disbursed_at?: string;
  documents: BursaryDocument[];
  communications: BursaryNote[];
  claim_schedule?: {
    installments: { due: string; amount: number; remitted: boolean }[];
  };
}

export interface AuditEntry {
  id: string;
  date: string;
  actor: string;
  action: string;
  entity: string;
  entity_id: string;
  details?: string;
}
