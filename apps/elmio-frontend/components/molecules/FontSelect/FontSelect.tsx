'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import type { FontSelectProps } from './FontSelect.d'

const FUENTES = [
  { value: 'WixMadeforText', label: 'Wix Madefor Text', category: 'Sin serifa' },
  { value: 'Inter', label: 'Inter', category: 'Sin serifa' },
  { value: 'Geist', label: 'Geist', category: 'Sin serifa' },
  { value: 'Roboto', label: 'Roboto', category: 'Sin serifa' },
  { value: 'Open Sans', label: 'Open Sans', category: 'Sin serifa' },
  { value: 'Lato', label: 'Lato', category: 'Sin serifa' },
  { value: 'Poppins', label: 'Poppins', category: 'Sin serifa' },
  { value: 'Montserrat', label: 'Montserrat', category: 'Sin serifa' },
  { value: 'Nunito', label: 'Nunito', category: 'Sin serifa' },
  { value: 'Raleway', label: 'Raleway', category: 'Sin serifa' },
  { value: 'Ubuntu', label: 'Ubuntu', category: 'Sin serifa' },
  { value: 'Merriweather', label: 'Merriweather', category: 'Con serifa' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'Con serifa' },
  { value: 'Lora', label: 'Lora', category: 'Con serifa' },
  { value: 'PT Serif', label: 'PT Serif', category: 'Con serifa' },
  { value: 'Source Code Pro', label: 'Source Code Pro', category: 'Monoespaciada' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', category: 'Monoespaciada' },
  { value: 'Fira Code', label: 'Fira Code', category: 'Monoespaciada' },
  { value: 'DM Sans', label: 'DM Sans', category: 'Sin serifa' },
  { value: 'Work Sans', label: 'Work Sans', category: 'Sin serifa' },
  { value: 'Quicksand', label: 'Quicksand', category: 'Sin serifa' },
]

const categorias = ['Sin serifa', 'Con serifa', 'Monoespaciada']

/**
 * Componente molecule para seleccionar una fuente tipografica.
 * Rediseñado como dropdown flotante interactivo y de estética premium que
 * no afecta el espacio físico en el DOM.
 */
export function FontSelect({ label, value, onChange }: FontSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [abrirHaciaArriba, setAbrirHaciaArriba] = useState(false)
  const selectedFont = FUENTES.find((f) => f.value === value) || { value, label: value, category: 'Sin serifa' }

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const espacioAbajo = window.innerHeight - rect.bottom
      // Si hay menos de 260px de espacio debajo del componente, abrimos el selector hacia arriba
      setAbrirHaciaArriba(espacioAbajo < 260)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col gap-1 w-full relative" ref={containerRef}>
      <label className="text-[10px] font-medium text-gray-400">{label}</label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-body transition-all duration-200 outline-none hover:border-gray-300 focus:border-border-focus focus:ring-2 focus:ring-ring/20 cursor-pointer shadow-sm"
        >
          <span style={{ fontFamily: selectedFont.value }} className="font-medium">
            {selectedFont.label}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            strokeWidth={1.5}
          />
        </button>

        {isOpen && (
          <div 
            className={`absolute left-0 right-0 rounded-xl border border-gray-200 bg-white shadow-xl max-h-64 overflow-y-auto z-50 animate-fadeIn divide-y divide-gray-50 py-1 ${
              abrirHaciaArriba ? 'bottom-full mb-2' : 'top-full mt-1'
            }`}
          >
            {categorias.map((cat) => (
              <div key={cat} className="py-1">
                <div className="px-3 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  {cat}
                </div>
                <div className="flex flex-col">
                  {FUENTES.filter((f) => f.category === cat).map((f) => {
                    const isSelected = f.value === value
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => {
                          onChange(f.value)
                          setIsOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                          isSelected ? 'bg-secondary/5 text-secondary font-semibold' : 'text-body'
                        }`}
                        style={{ fontFamily: f.value }}
                      >
                        <span>{f.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-secondary shrink-0" strokeWidth={2} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 mt-1.5 shadow-inner">
        <p className="text-xs text-gray-400 mb-1">Vista previa</p>
        <p className="text-base text-body" style={{ fontFamily: value }}>
          ABC abc 123 — ElMio
        </p>
      </div>
    </div>
  )
}
