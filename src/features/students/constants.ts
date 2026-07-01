export const GENDERS = ['Male', 'Female', 'Other'] as const;
export const STUDENT_STATUSES = ['Active', 'Graduated', 'Suspended', 'Transferred', 'Withdrawn'] as const;
export const INQUIRY_STATUSES = ['New', 'Contacted', 'Interested', 'Cold', 'Converted', 'Closed'] as const;
export const APPLICATION_STATUSES = [
  'Draft', 'Submitted', 'Under Review', 'Interview Scheduled',
  'Merit List', 'Approved', 'Rejected', 'Waitlisted', 'Enrolled', 'Withdrawn',
] as const;
export const LIFECYCLE_KINDS = [
  'Enrollment', 'Promotion', 'Transfer In', 'Transfer Out',
  'Withdrawal', 'Re-enrollment', 'Graduation', 'Suspension', 'Reinstatement',
] as const;
export const DOC_TYPES = [
  'Birth Certificate', 'Previous Report Card', 'ID / Passport',
  'Photo', 'Medical Report', 'Immunization Record', 'Transfer Letter', 'Other',
] as const;
export const INQUIRY_SOURCES = ['Web', 'Walk-in', 'Referral', 'Open Day', 'Social Media', 'Advert', 'Other'] as const;