/**
 * DTO para registro de usuario.
 */
export class RegisterDto {
  name!: string;
  email!: string;
  password!: string;
  role!: 'COMPANY' | 'CLIENT';
  owner!: string;
}
