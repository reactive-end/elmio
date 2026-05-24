export interface OtpInputProps {
  /** Cantidad de digitos del codigo OTP (por defecto 6). */
  length?: number
  /** Codigo OTP actual. */
  value: string
  /** Funcion que se ejecuta al cambiar el valor completo del codigo OTP. */
  onChange: (value: string) => void
  /** Indica si el componente esta deshabilitado. */
  disabled?: boolean
  /** Clase CSS adicional. */
  className?: string
}
