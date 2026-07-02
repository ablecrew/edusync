export const RESOURCE_TYPES = ['Book', 'Journal', 'Magazine', 'Newspaper', 'eBook', 'Audio', 'Video', 'Other'] as const;
export const MEMBER_TYPES   = ['Student', 'Teacher', 'Staff', 'External'] as const;
export const COPY_STATUSES  = ['Available', 'Issued', 'Reserved', 'Lost', 'Damaged', 'Under Repair', 'Withdrawn'] as const;
export const LOAN_STATUSES  = ['Active', 'Returned', 'Overdue', 'Lost', 'Cancelled'] as const;
export const FINE_STATUSES  = ['Pending', 'Paid', 'Waived', 'Posted to Finance'] as const;
export const FINE_KINDS     = ['Overdue', 'Lost', 'Damaged', 'Other'] as const;
export const CONDITIONS     = ['Good', 'Fair', 'Worn', 'Damaged'] as const;
export const BOOK_CATEGORIES = [
  'Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'Technology',
  'History', 'Geography', 'Literature', 'Languages', 'Religion',
  'Arts', 'Sports', 'Reference', 'Children', 'Other',
] as const;