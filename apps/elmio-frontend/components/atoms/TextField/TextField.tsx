'use client'

import { Input } from '@/components/atoms/Input/Input'
import type { TextFieldProps } from './TextField.d'

/**
 * Componente atomo de campo de texto con etiqueta.
 * Envuelve el atomo Input con una etiqueta superior.
 */
export function TextField({ label, value, onChange, placeholder }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-gray-400">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="!py-2 !text-xs"
      />
    </div>
  )
}
