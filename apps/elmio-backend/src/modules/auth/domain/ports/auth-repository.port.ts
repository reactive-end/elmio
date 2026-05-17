import type { User } from '../user';

export const AUTH_REPOSITORY_PORT = Symbol('AUTH_REPOSITORY_PORT');

/**
 * Puerto del dominio para persistir y consultar usuarios.
 */
export interface AuthRepositoryPort {
  /**
   * Busca un usuario por su email.
   * @param email Email del usuario.
   * @returns Usuario si existe, null en caso contrario.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Busca un usuario por su ID.
   * @param id ID del usuario.
   * @returns Usuario si existe, null en caso contrario.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Crea un nuevo usuario.
   * @param user Datos del usuario a registrar.
   * @returns Usuario creado.
   */
  create(user: User): Promise<User>;
}
