/**
 * Representa un codigo de recuperacion de contrasena en el dominio.
 */
export interface RecoveryCode {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  used: boolean;
  createdAt: string;
}
