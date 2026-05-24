/**
 * Datos del destinatario de una notificacion.
 */
export interface NotificationRecipient {
  /** Numero de telefono con codigo de pais (ej: +584121234567). Opcional. */
  phone?: string;
  /** Correo electronico del destinatario. */
  email: string;
  /** Nombre del destinatario para personalizar el mensaje. */
  name: string;
}
