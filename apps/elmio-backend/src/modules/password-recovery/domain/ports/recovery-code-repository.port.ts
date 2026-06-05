import type { RecoveryCode } from '../types/recovery-code';

export const RECOVERY_CODE_REPOSITORY_PORT = Symbol(
  'RECOVERY_CODE_REPOSITORY_PORT',
);

/**
 * Puerto del repositorio de codigos de recuperacion.
 */
export interface RecoveryCodeRepositoryPort {
  /**
   * Persiste un codigo de recuperacion.
   * @param code Codigo de recuperacion a guardar.
   * @returns Codigo de recuperacion guardado.
   */
  save(code: RecoveryCode): Promise<RecoveryCode>;

  /**
   * Busca un codigo valido (no usado y no expirado) para un usuario.
   * @param userId ID del usuario.
   * @param codeHash Hash del codigo ingresado.
   * @returns Codigo valido si existe, null en caso contrario.
   */
  findValidCode(userId: string, codeHash: string): Promise<RecoveryCode | null>;

  /**
   * Invalida todos los codigos activos de un usuario.
   * @param userId ID del usuario.
   */
  invalidateAllForUser(userId: string): Promise<void>;
}
