/**
 * DTO para verificar un codigo de recuperacion.
 */
export class VerifyCodeDto {
  /** Correo electronico del usuario. */
  email!: string;
  /** Codigo OTP de 6 digitos. */
  code!: string;
}
