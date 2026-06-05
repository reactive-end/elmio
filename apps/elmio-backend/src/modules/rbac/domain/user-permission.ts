/**
 * Representa un permiso de visibilidad personalizado para un usuario (excepcion a su rol).
 */
export interface UserPermission {
  id: string;
  userId: string;
  groupKey: string;
  visible: boolean;
}
