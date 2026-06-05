/**
 * Roles de usuario disponibles en el sistema.
 * ADMIN    - Administrador del sistema.
 * COMPANY  - Cuenta de empresa.
 * EMPLOYEE - Empleado registrado por una empresa.
 * CLIENT   - Persona natural que solicita prestamos.
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  COMPANY = 'COMPANY',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT',
  ALLIED = 'ALLIED',
  FINANCE = 'FINANCE',
}

/**
 * Representa un usuario autenticable del sistema.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole | string;
  owner: string;
  createdAt: string;
  requirePasswordChange?: boolean;
  slug?: string | null;
  countryCode?: string;
  phone?: string;
}

/**
 * Datos de sesion extraidos del token de autenticacion.
 * Se adjunta al request por el AuthGuard.
 */
export interface UserSession {
  userId: string;
  email: string;
  role: UserRole | string;
  owner: string;
  requirePasswordChange?: boolean;
}
