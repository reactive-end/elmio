'use client'

import { useState, useRef } from 'react'
import type { ColorInputProps } from './ColorInput.d'

const TRANSPARENTE = 'transparente'

/**
 * Componente molecule para seleccionar color.
 * Incluye un selector nativo tipo color picker, previsualizacion,
 * campo hexadecimal y cuadricula de colores predefinidos.
 */
export function ColorInput({ label, value, onChange, disabled = false }: ColorInputProps) {
  const [hexInput, setHexInput] = useState(value === TRANSPARENTE ? '' : value)
  const nativeRef = useRef<HTMLInputElement>(null)

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    onChange(color)
    setHexInput(color)
  }

  const handleHexChange = (v: string) => {
    setHexInput(v)
    if (v.match(/^#[0-9a-fA-F]{3,8}$/)) {
      onChange(v)
    }
  }

  const handleTransparente = () => {
    onChange(TRANSPARENTE)
    setHexInput('')
  }

  const esTransparente = value === TRANSPARENTE

  return (
    <div className={`flex flex-col gap-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <label className="text-[10px] font-medium text-gray-400">{label}</label>

      {/* Color picker nativo + preview + hex + sin fondo */}
      <div className="flex items-center gap-2">
        {/* Native color picker wrapped in a styled button */}
        <div className="relative flex-shrink-0">
          <input
            ref={nativeRef}
            type="color"
            value={esTransparente ? '#ffffff' : value}
            onChange={handleNativeChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={`Selector de color para ${label}`}
          />
          <div
            className="w-10 h-10 rounded-xl border-2 border-gray-200 shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
            style={
              esTransparente
                ? {
                    backgroundColor: '#ffffff',
                    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                    backgroundPosition: '0 0, 4px 4px',
                    backgroundSize: '8px 8px',
                  }
                : { backgroundColor: value }
            }
          />
        </div>

        <div className="flex-1 flex items-center gap-1.5">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder={esTransparente ? 'Transparente' : '#000000'}
            className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-body placeholder:text-gray-400 outline-none focus:border-border-focus focus:ring-1 focus:ring-ring/20 font-mono"
          />
          <button
            type="button"
            onClick={handleTransparente}
            className={`text-[10px] font-medium rounded-lg px-2 py-1.5 transition-colors flex-shrink-0 ${
              esTransparente ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            Sin fondo
          </button>
        </div>
      </div>


    </div>
  )
}
