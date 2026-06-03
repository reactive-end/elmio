/**
 * Normaliza un numero de telefono al formato de 11 digitos con cero
 * inicial que espera el banco R4 en CreditoInmediato (ej. "04247413675"),
 * eliminando cualquier prefijo de pais independientemente de cual sea.
 *
 * Reglas de normalizacion:
 *  - Solo se conservan los digitos; el resto (espacios, guiones, "+",
 *    parentesis, puntos) se elimina.
 *  - Si hay mas de 11 digitos, se asume que los digitos iniciales son
 *    el codigo de pais: se conservan los ultimos 10 y se antepone "0".
 *  - Si hay exactamente 11 digitos, se devuelven tal cual (formato
 *    nacional con el "0" inicial ya presente).
 *  - Si hay 10 digitos, se antepone "0".
 *  - Cualquier otro caso se devuelve sin cambios: la validacion del
 *    DTO `/^\d{11}$/` se encargara de rechazar el valor si no cumple
 *    el contrato.
 *
 * Ejemplos:
 *  - "+584247413675"      -> "04247413675"
 *  - "584247413675"       -> "04247413675"
 *  - "04141234567"        -> "04141234567"
 *  - "4141234567"         -> "04141234567"
 *  - "+1 (415) 555-1234"  -> "14155551234" (11 digitos, se respeta)
 *  - "+5491145551234"    -> "01145551234" (13 digitos -> ultimos 10 + 0)
 *
 * @param input Telefono crudo, posiblemente con prefijo internacional o separadores.
 * @returns Cadena de digitos normalizada al formato R4 (vacia si no hay digitos).
 */
export function normalizePhoneToR4(input: string | null | undefined): string {
  const digits = String(input ?? '').replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  if (digits.length > 11) {
    return `0${digits.slice(-10)}`
  }

  if (digits.length === 11) {
    return digits
  }

  if (digits.length === 10) {
    return `0${digits}`
  }

  return digits
}
