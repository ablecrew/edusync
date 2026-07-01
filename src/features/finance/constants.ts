import type { PaymentMethod } from './types';

/** Payment method enum — must match the Postgres `payment_method` enum. */
export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank Transfer',
  'MPESA',
  'Paybill',
  'Till',
  'Cheque',
  'Sponsor',
  'Bursary Credit',
];

/** Fee item categories — matches Postgres `fee_category` enum. */
export const FEE_CATEGORIES = [
  'Tuition',
  'Boarding',
  'Transport',
  'Activity',
  'Uniform',
  'Exam',
  'Other',
] as const;
