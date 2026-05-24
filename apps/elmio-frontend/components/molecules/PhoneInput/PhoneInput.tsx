'use client'

import { ChevronDown } from 'lucide-react'
import { usePhoneInput } from './usePhoneInput'
import type { PhoneInputProps } from './PhoneInput.d'

/**
 * Componente molecule para entrada de telefono con codigo de pais,
 * prefijo de operadora y numero formateado.
 *
 * Estructura visual:
 *   [VE +58 ▾] [412 ▾] [123 4567]
 */
export function PhoneInput({
  displayValue,
  onChange,
  countryCode,
  onCountryCodeChange,
  operatorPrefix,
  onOperatorPrefixChange,
  hasError = false,
  hideCountrySelector = false,
}: PhoneInputProps) {
  const { open, countryCodes, operatorPrefixes, toggleOpen, handleSelectCountry } =
    usePhoneInput(onCountryCodeChange)

  return (
    <div className="flex gap-2">
      {/* Country code selector */}
      {!hideCountrySelector && (
        <div className="relative">
          <button
            type="button"
            onClick={toggleOpen}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-body hover:border-secondary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring/20 whitespace-nowrap"
          >
            <span className="text-xs font-semibold text-secondary">{countryCode.code}</span>
            <span>{countryCode.dial}</span>
            <ChevronDown
              className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              strokeWidth={2}
            />
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-md overflow-hidden min-w-[200px]">
              {countryCodes.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelectCountry(c)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-surface-muted transition-colors duration-150 ${
                    c.code === countryCode.code
                      ? 'bg-surface-muted font-medium text-secondary'
                      : 'text-body'
                  }`}
                >
                  <span className="font-mono text-xs text-gray-400 w-10">{c.dial}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Operator prefix selector */}
      <select
        value={operatorPrefix}
        onChange={(e) => onOperatorPrefixChange(e.target.value as typeof operatorPrefix)}
        className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-body hover:border-secondary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring/20 appearance-none bg-white cursor-pointer"
      >
        {operatorPrefixes.map((prefix) => (
          <option key={prefix} value={prefix}>
            {prefix}
          </option>
        ))}
      </select>

      {/* Phone number input */}
      <input
        type="tel"
        value={displayValue}
        onChange={onChange}
        placeholder="123 4567"
        className={`flex-1 rounded-xl border px-4 py-3 text-sm text-body placeholder:text-gray-400 transition-all duration-200 outline-none ${
          hasError
            ? 'border-red-400 focus:ring-2 focus:ring-red-300'
            : 'border-gray-200 focus:border-border-focus focus:ring-2 focus:ring-ring/20'
        }`}
      />
    </div>
  )
}
