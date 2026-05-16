/** Codigos de operadora movil validos en Venezuela. */
export type PhoneCode = '0412' | '0422' | '0414' | '0424' | '0416' | '0426'

/** Valor completo de un telefono: codigo de operadora + digitos sin formatear. */
export interface PhoneValue {
  code: PhoneCode
  digits: string
}

/** Propiedades del componente PhoneInput. */
export interface PhoneInputProps {
  /** Valor controlado del componente. */
  value?: PhoneValue
  /** Callback invocado cuando cambia el codigo o los digitos. */
  onChange?: (value: PhoneValue) => void
  /** Texto del placeholder para el campo numerico. */
  placeholder?: string
}
