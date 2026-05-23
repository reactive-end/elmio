/**
 * DTO para el cambio de password de un usuario autenticado.
 */
export class ChangePasswordDto {
  currentPassword?: string;
  newPassword!: string;
}
