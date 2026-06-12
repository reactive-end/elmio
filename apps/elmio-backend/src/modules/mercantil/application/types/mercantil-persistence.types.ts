export type MercantilShopcartStatus =
  | 'in_progress'
  | 'cancelled'
  | 'emitted'
  | 'quoted'
  | 'paid'
  | 'emission_error';

export type MercantilPolicyStatus =
  | 'active'
  | 'upcoming_payment'
  | 'in_debt'
  | 'finished'
  | 'nullified';

export type MercantilQuoteStatus = 'paid' | 'upcoming_payment' | 'coming_soon';

export type MercantilPaymentFrequency =
  | 'monthly'
  | 'quarterly'
  | 'biannual'
  | 'yearly';

export type MercantilTraceStage =
  | 'emit'
  | 'emit_status'
  | 'shopcart_summary'
  | 'persist_client'
  | 'persist_policies'
  | 'persist_quotes'
  | 'notify_external_payment'
  | 'upload_dni_bucket'
  | 'finalize_persistence';

export type MercantilTraceStatus = 'success' | 'failed';

export interface MercantilPaymentQuoteStrict {
  quote: string;
  agreement?: string | null;
  receipt?: string | null;
  receiptStatus?: MercantilQuoteStatus | null;
  quoteStatus?: MercantilQuoteStatus | null;
  directPayUrl?: string | null;
  isPaid?: boolean;
  isNextDuePayment?: boolean;
  amount?: number | null;
  expirationDate?: string | null;
}

export interface MercantilPolicyStrict {
  id: string;
  status?: MercantilPolicyStatus;
  title?: string;
  certificateNumber?: string;
  number?: string;
  entity?: string;
  area?: string;
  policyNumber?: string;
  startDate?: string;
  endDate?: string;
  assuredSum?: number;
  quotedAmount?: number;
  annualPremium?: number;
  paymentQuotes?: MercantilPaymentQuoteStrict[];
}

export interface MercantilShopcartSummaryStrict {
  id: string;
  paymentUrl?: string;
  status?: MercantilShopcartStatus;
  paymentFrequency?: MercantilPaymentFrequency;
  quotedAmount?: number;
  policies?: MercantilPolicyStrict[];
}
