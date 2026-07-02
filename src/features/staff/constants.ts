export const REQUEST_KINDS = ['Loan','Advance','Reimbursement','Correction','Uniform','Tools','Other'] as const;
export const REQUEST_STATUSES = ['Pending','Under Review','Approved','Rejected','Cancelled','Disbursed'] as const;
export const TASK_STATUSES = ['Open','In Progress','Done','Cancelled','Blocked'] as const;
export const TASK_PRIORITIES = ['Low','Normal','High','Urgent'] as const;
export const SHIFT_KINDS = ['Morning','Afternoon','Evening','Night','Full-day','Standby','Off'] as const;
export const WORK_ORDER_KINDS = ['Maintenance','Cleaning','Transport','Grounds','Kitchen','Security','IT','Utilities','Other'] as const;
export const WORK_ORDER_STATUSES = ['Reported','Assigned','In Progress','On Hold','Completed','Verified','Cancelled'] as const;
export const LEAVE_TYPES = ['Annual','Sick','Maternity','Paternity','Casual','Compassionate','Study','Unpaid'] as const;
export const DOC_TYPES = ['Contract','Certificate','License','ID / Passport','KRA PIN','Insurance','Medical','Driver License','Reference','CV','Other'] as const;
export const CLINIC_VISIT_KINDS = ['Consultation','First Aid','Follow-up','Emergency','Vaccination','Screening','Other'] as const;
export const CLINIC_OUTCOMES = ['Discharged','Referred','Rest at School','Sent Home','Admitted','Under Observation'] as const;
export const CLINIC_ROUTES = ['Oral','Topical','IM','IV','Nasal','Ear','Eye','Rectal','Other'] as const;

export const SHIFT_COLORS: Record<string, string> = {
  Morning: '#f59e0b', Afternoon: '#0ea5e9', Evening: '#8b5cf6',
  Night: '#0f172a', 'Full-day': '#08428C', Standby: '#64748b', Off: '#94a3b8',
};