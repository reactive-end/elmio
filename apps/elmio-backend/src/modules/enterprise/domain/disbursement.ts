/**
 * Desembolso manual ejecutado por finanzas.
 */
export interface Disbursement {
  id: string;
  loanRequestId: string;
  paymentId: string;
  financeUserId: string;
  financeUserName: string;
  amountUsd: number;
  amountBs: number;
  exchangeRate: number;
  bankCode: string;
  accountNumber: string;
  phoneNumber: string;
  documentId: string;
  concept: string;
  bankReference: string | null;
  bankOperationId: string | null;
  status: 'success' | 'failed' | 'pending';
  createdAt: string;
}
