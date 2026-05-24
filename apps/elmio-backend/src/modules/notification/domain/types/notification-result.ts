/**
 * Resultado del envio de una notificacion.
 */
export interface NotificationResult {
  /** Si el envio fue exitoso. */
  success: boolean;
  /** Canal utilizado para el envio. */
  channel: 'whatsapp' | 'email';
  /** Mensaje de error si el envio fallo. */
  error?: string;
}
