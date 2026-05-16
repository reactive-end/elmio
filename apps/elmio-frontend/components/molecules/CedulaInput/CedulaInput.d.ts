/** Letras validas para el prefijo de cedula de identidad. */
export type CedulaLetter = 'V' | 'E' | 'G'

/** Valor completo de una cedula: letra + digitos sin formatear. */
export interface CedulaValue {
  letter: CedulaLetter
  digits: string
}

/** Propiedades del componente CedulaInput. */
export interface CedulaInputProps {
  /** Valor controlado del componente. */
  value?: CedulaValue
  /** Callback invocado cuando cambia la letra o los digitos. */
  onChange?: (value: CedulaValue) => void
  /** Texto del placeholder para el campo numerico. */
  placeholder?: string
}
