'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  noResultsText?: string
  hasError?: boolean
  className?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción',
  searchPlaceholder = 'Buscar...',
  noResultsText = 'No se encontraron resultados',
  hasError = false,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Encontrar el label actual seleccionado
  const selectedOption = options.find((opt) => opt.value === value)

  // Filtrar las opciones según el query de búsqueda
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Cerrar el dropdown al hacer click fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Limpiar el campo de búsqueda cuando el dropdown se cierra
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  const handleSelectOption = (optValue: string) => {
    onChange(optValue)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Botón Disparador */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm text-body transition-all duration-200 outline-none text-left bg-white cursor-pointer ${
          hasError
            ? 'border-red-400 focus:ring-2 focus:ring-red-300'
            : isOpen
            ? 'border-secondary ring-2 ring-secondary/20'
            : 'border-gray-200 hover:border-gray-300 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          strokeWidth={1.5}
        />
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-gray-100 shadow-lg p-2 flex flex-col gap-1.5 max-h-72 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Input de Búsqueda */}
          <div className="relative flex items-center">
            <Search
              className="absolute left-3 w-4 h-4 text-gray-400"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg outline-none focus:border-secondary focus:bg-white transition-all"
              autoFocus
            />
          </div>

          {/* Opciones */}
          <div className="overflow-y-auto flex-1 flex flex-col gap-0.5 max-h-48 pr-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectOption(opt.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-secondary/10 text-secondary font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })
            ) : (
              <span className="text-xs text-gray-400 text-center py-4 block">
                {noResultsText}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
