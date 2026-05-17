'use client'

import { Minus, Plus } from 'lucide-react'
import type { PixelInputProps } from './PixelInput.d'

/**
 * Componente molecule para ingresar valores en pixeles.
 * Muestra botones +/- para ajuste rapido y el valor con sufijo "px".
 */
export function PixelInput({ label, value, onChange, min = 0, max = 2000, step = 1 }: PixelInputProps) {
  const decrement = () => {
    const next = value - step
    if (next >= min) onChange(next)
  }

  const increment = () => {
    const next = value + step
    if (next <= max) onChange(next)
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-gray-400">{label}</label>
      <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:border-border-focus focus-within:ring-2 focus-within:ring-ring/20 transition-all">
        <button
          type="button"
          onClick={decrement}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <Minus className="w-3 h-3" strokeWidth={2} />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
          }}
          min={min}
          max={max}
          step={step}
          className="w-full text-center text-xs font-medium text-body bg-transparent outline-none py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-gray-400 font-medium pr-2">px</span>
        <button
          type="button"
          onClick={increment}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <Plus className="w-3 h-3" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
