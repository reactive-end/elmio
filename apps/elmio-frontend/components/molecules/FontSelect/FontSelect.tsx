'use client'

import { ChevronDown } from 'lucide-react'
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

const GOOGLE_FONTS_MAP: Record<string, string> = {
  WixMadeforText: 'Wix Madefor Text',
  Inter: 'Inter',
  Geist: 'Geist',
  Roboto: 'Roboto',
  'Open Sans': 'Open Sans',
  Lato: 'Lato',
  Poppins: 'Poppins',
  Montserrat: 'Montserrat',
  Nunito: 'Nunito',
  Raleway: 'Raleway',
  Ubuntu: 'Ubuntu',
  Merriweather: 'Merriweather',
  'Playfair Display': 'Playfair Display',
  Lora: 'Lora',
  'PT Serif': 'PT Serif',
  'Source Code Pro': 'Source Code Pro',
  'JetBrains Mono': 'JetBrains Mono',
  'Fira Code': 'Fira Code',
  'DM Sans': 'DM Sans',
  'Work Sans': 'Work Sans',
  Quicksand: 'Quicksand',
}

const categorias = ['Sin serifa', 'Con serifa', 'Monoespaciada']

/**
 * Componente molecule para seleccionar una fuente tipografica.
 * Rediseñado como dropdown flotante interactivo y de estética premium que
 * no afecta el espacio físico en el DOM.
 */
export function FontSelect({ label, value, onChange }: FontSelectProps) {
  const googleFontName = GOOGLE_FONTS_MAP[value] || value
  const fontUrl = googleFontName !== 'Geist'
    ? `https://fonts.googleapis.com/css2?family=${googleFontName.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900&display=swap`
    : null

  return (
    <div className="flex flex-col gap-1 w-full">
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} />
      )}
      <label className="text-[10px] font-medium text-gray-400">{label}</label>
      
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-body transition-all duration-200 outline-none hover:border-gray-300 focus:border-border-focus focus:ring-2 focus:ring-ring/20 cursor-pointer shadow-sm font-medium"
          style={{ fontFamily: `'${googleFontName}', sans-serif` }}
        >
          {categorias.map((cat) => (
            <optgroup key={cat} label={cat.toUpperCase()} className="text-[10px] font-bold text-gray-400">
              {FUENTES.filter((f) => f.category === cat).map((f) => {
                const fontNameOption = GOOGLE_FONTS_MAP[f.value] || f.value
                return (
                  <option key={f.value} value={f.value} style={{ fontFamily: `'${fontNameOption}', sans-serif` }} className="text-body text-sm py-1">
                    {f.label}
                  </option>
                )
              })}
            </optgroup>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          strokeWidth={1.5}
        />
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 mt-1.5 shadow-inner">
        <p className="text-xs text-gray-400 mb-1">Vista previa</p>
        <p className="text-base text-body" style={{ fontFamily: `'${googleFontName}', sans-serif` }}>
          ABC abc 123 — ElMio
        </p>
      </div>
    </div>
  )
}

