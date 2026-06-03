/**
 * Permiso de visibilidad de un grupo de la sidebar para un rol.
 */
export interface RolePermission {
  id: string;
  role: string;
  groupKey: string;
  visible: boolean;
}
