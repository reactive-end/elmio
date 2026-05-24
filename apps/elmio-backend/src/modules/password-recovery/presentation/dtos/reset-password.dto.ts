/**
 * DTO para resetear la contrasena usando un token temporal.
 */
export class ResetPasswordDto {
  /** Token temporal JWT obtenido al verificar el codigo. */
  token!: string;
  /** Nueva contrasena del usuario. */
  newPassword!: string;
}
