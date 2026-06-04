/**
 * @fileoverview Componente de Paso 6: Completar Datos del Cliente para La Mundial de Seguros.
 * @description Captura estado civil, y dirección de residencia (Estado, Ciudad, Dirección, CP).
 * @module components/molecules/MundialRCVSteps/Step6CompleteData
 */

'use client'

import { MapPin } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Select } from '@/components/atoms/Select/Select'
import { Input } from '@/components/atoms/Input/Input'
import { FormField } from '@/components/molecules/FormField/FormField'
import { Spinner } from '@/components/atoms/Spinner/Spinner'

interface Step6CompleteDataProps {
  states: Array<{ value: string; label: string }>
  cities: Array<{ value: string; label: string }>
  civilStates: Array<{ value: string; label: string }>
  genders: Array<{ value: string; label: string }>
  selectedStateId: string
  selectedCityId: string
  setSelectedCityId: (v: string) => void
  civilStateId: string
  setCivilStateId: (v: string) => void
  addressLine: string
  setAddressLine: (v: string) => void
  postalCode: string
  setPostalCode: (v: string) => void
  handleStateChange: (v: string) => Promise<void>
  loadingStates?: boolean
  loadingCities?: boolean
  loading: boolean
  onBack: () => void
  onNext: () => Promise<void>
}

export function Step6CompleteData({
  states,
  cities,
  civilStates,
  selectedStateId,
  selectedCityId,
  setSelectedCityId,
  civilStateId,
  setCivilStateId,
  addressLine,
  setAddressLine,
  postalCode,
  setPostalCode,
  handleStateChange,
  loadingStates = false,
  loadingCities = false,
  loading,
  onBack,
  onNext,
}: Step6CompleteDataProps) {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <MapPin className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Completar Datos</h2>
          <p className="text-xs text-body-muted">
            Complete los datos de dirección y estado civil del asegurado.
          </p>
        </div>
      </div>

      {loadingStates ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Spinner size="md" />
          <p className="text-xs text-body-muted">Cargando catálogos de La Mundial...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4">
            <FormField label="Estado Civil" required>
              <Select
                value={civilStateId}
                onChange={setCivilStateId}
                options={civilStates}
                placeholder="Seleccione estado civil"
              />
            </FormField>
          </div>

          <div className="border-t border-gray-100 pt-5 mt-2 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Dirección de Residencia
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Estado" required>
                <Select
                  value={selectedStateId}
                  onChange={handleStateChange}
                  options={states}
                  placeholder="Seleccione Estado"
                />
              </FormField>
              <FormField label="Ciudad" required>
                <Select
                  value={selectedCityId}
                  onChange={setSelectedCityId}
                  options={cities}
                  disabled={!selectedStateId || loadingCities}
                  placeholder={loadingCities ? 'Cargando ciudades...' : 'Seleccione Ciudad'}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <FormField label="Dirección Detallada" required>
                  <Input
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Ej: Av. Francisco de Miranda, Res. Avila, Apto 5"
                  />
                </FormField>
              </div>
              <FormField label="Código Postal" required>
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Ej: 1080"
                />
              </FormField>
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-100 pt-5 mt-4">
            <Button type="button" variant="ghost" fullWidth onClick={onBack}>
              Anterior
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={!civilStateId || !selectedStateId || !selectedCityId || !addressLine}
              isLoading={loading}
              onClick={onNext}
            >
              Emitir Póliza
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
