// ─────────────────────────────────────────────────────────────────────────────
// PersonBankAccount Domain — Cuenta bancaria de persona natural/colaborador.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cuenta bancaria asociada a un perfil de persona.
 */
export interface PersonBankAccount {
  id: string;
  personProfileId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  phoneNumber: string;
  documentId: string;
  documentPhoto: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}
