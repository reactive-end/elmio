/**
 * Formatea digitos de telefono venezolano (7 digitos) a formato visual.
 *
 * Ejemplo: "1234567" -> "123 4567"
 *
 * @param digits - Cadena de digitos sin formatear.
 * @returns Cadena formateada con espacio entre los primeros 3 y los ultimos 4 digitos.
 */
export function formatPhoneDisplay(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 7)
  if (clean.length <= 3) return clean
  return `${clean.slice(0, 3)} ${clean.slice(3, 7)}`
}

/**
 * Elimina todo caracter no digito de una cadena de telefono formateada.
 *
 * @param formatted - Cadena con formato visual (ej: "123 4567").
 * @returns Solo los digitos (ej: "1234567").
 */
export function stripPhoneFormat(formatted: string): string {
  return formatted.replace(/\D/g, '')
}
