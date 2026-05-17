'use client'

import type { TextAreaProps } from './TextArea.d'

/**
 * Componente atomo de area de texto multilinea con etiqueta.
 */
export function TextArea({ label, value, onChange, placeholder }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-gray-400">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-body placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-border-focus focus:ring-2 focus:ring-ring/20 resize-none"
      />
    </div>
  )
}
