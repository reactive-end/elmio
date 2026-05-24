/**
 * @fileoverview Componente de Paso 4: Completar Datos Personales y de Residencia.
 * @description Recoge información avanzada de geografía (país de nacimiento, estado civil y dirección) interactuando con la API de catálogos.
 * @module components/molecules/MercantilSteps/Step4CompleteData
 */

'use client'

import { MapPin } from 'lucide-react'
import { Select } from '@/components/atoms/Select/Select'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { FormField } from '@/components/molecules/FormField/FormField'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { type Country, type CountryLocations } from '@/src/services/mercantil.service'

interface Step4CompleteDataProps {
  /** Colección de países disponibles en el catálogo */
  countries: Country[]
  /** Estructura geográfica detallada del país seleccionado */
  countryLocations: CountryLocations | null
  /** Indicador de carga de países */
  loadingCountries: boolean
  /** Indicador de carga de provincias/ubicaciones */
  loadingLocations: boolean
  /** ID del país de nacimiento del cliente */
  selectedCountryOfBirthId: string
  /** Función para actualizar el país de nacimiento */
  setSelectedCountryOfBirthId: (id: string) => void
  /** ID del estado civil del cliente */
  civilStateId: string
  /** Función para actualizar el estado civil */
  setCivilStateId: (id: string) => void
  /** ID de la división administrativa del estado */
  selectedAdministrativeAreaId: string
  /** Función para actualizar el estado geográfico */
  setSelectedAdministrativeAreaId: (id: string) => void
  /** ID del municipio seleccionado */
  selectedSubAdministrativeAreaId: string
  /** Función para actualizar el municipio */
  setSelectedSubAdministrativeAreaId: (id: string) => void
  /** ID de la localidad/parroquia seleccionada */
  selectedLocalityId: string
  /** Función para actualizar la localidad */
  setSelectedLocalityId: (id: string) => void
  /** ID de la zona de residencia seleccionada */
  selectedZoneId: string
  /** Función para actualizar la zona */
  setSelectedZoneId: (id: string) => void
  /** Línea de dirección libre de residencia */
  addressLine: string
  /** Función para actualizar la línea de dirección */
  setAddressLine: (line: string) => void
  /** Código postal de residencia */
  postalCode: string
  /** Función para actualizar el código postal */
  setPostalCode: (code: string) => void
  /** Indicador de carga de la transición a base de datos */
  loading: boolean
  /** Mensaje de error general si la transacción falla */
  stepError: string
  /** Función para retroceder de paso */
  onBack: () => void
  /** Función para avanzar al paso 5 (completa cliente) */
  onNext: () => Promise<void>
}

export function Step4CompleteData({
  countries,
  countryLocations,
  loadingCountries,
  loadingLocations,
  selectedCountryOfBirthId,
  setSelectedCountryOfBirthId,
  civilStateId,
  setCivilStateId,
  selectedAdministrativeAreaId,
  setSelectedAdministrativeAreaId,
  selectedSubAdministrativeAreaId,
  setSelectedSubAdministrativeAreaId,
  selectedLocalityId,
  setSelectedLocalityId,
  selectedZoneId,
  setSelectedZoneId,
  addressLine,
  setPostalCode,
  postalCode,
  setAddressLine,
  loading,
  stepError,
  onBack,
  onNext,
}: Step4CompleteDataProps) {
  // Opciones de estados civiles Mercantil
  const CIVIL_STATES = [
    { value: '1', label: 'Soltero(a)' },
    { value: '2', label: 'Casado(a)' },
    { value: '3', label: 'Divorciado(a)' },
    { value: '4', label: 'Viudo(a)' },
    { value: '5', label: 'Unión Estable de Hecho' },
  ]

  // Resolver opciones geográficas basadas en catálogos del backend
  const administrativeAreaOptions =
    countryLocations?.administrativeAreas?.map((aa) => ({
      value: aa.id,
      label: aa.name,
    })) ?? []

  const activeAdminArea = countryLocations?.administrativeAreas?.find(
    (aa) => aa.id === selectedAdministrativeAreaId,
  )

  const subAdminAreaOptions =
    activeAdminArea?.subAdministrativeAreas?.map((saa) => ({
      value: saa.id,
      label: saa.name,
    })) ?? []

  const activeSubAdminArea = activeAdminArea?.subAdministrativeAreas?.find(
    (saa) => saa.id === selectedSubAdministrativeAreaId,
  )

  const localityOptions =
    activeAdminArea?.localities?.map((l) => ({
      value: l.id,
      label: l.name,
    })) ?? []

  const zoneOptions =
    activeSubAdminArea?.zones?.map((z) => ({
      value: z.id,
      label: z.name,
    })) ?? []

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <MapPin className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Completar Datos</h2>
          <p className="text-xs text-body-muted">
            Indique su lugar de nacimiento y complete los campos obligatorios de dirección física.
          </p>
        </div>
      </div>

      {stepError && <Alert type="error" message={stepError} />}

      {loadingCountries ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Spinner size="md" />
          <p className="text-xs text-body-muted">Cargando catálogos de países...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="País de Nacimiento" required>
              <Select
                value={selectedCountryOfBirthId}
                onChange={setSelectedCountryOfBirthId}
                options={countries.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Seleccione país"
              />
            </FormField>
            <FormField label="Estado Civil" required>
              <Select
                value={civilStateId}
                onChange={setCivilStateId}
                options={CIVIL_STATES}
                placeholder="Seleccione estado civil"
              />
            </FormField>
          </div>

          <div className="border-t border-gray-100 pt-5 mt-2 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Dirección de Residencia (Venezuela)
            </span>

            {loadingLocations ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Spinner size="sm" />
                <p className="text-[10px] text-body-muted">
                  Cargando divisiones geográficas de Venezuela...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Estado" required>
                  <Select
                    value={selectedAdministrativeAreaId}
                    onChange={(v) => {
                      setSelectedAdministrativeAreaId(v)
                      setSelectedSubAdministrativeAreaId('')
                      setSelectedLocalityId('')
                      setSelectedZoneId('')
                    }}
                    options={administrativeAreaOptions}
                    placeholder="Seleccione Estado"
                  />
                </FormField>

                <FormField label="Municipio / Región" required>
                  <Select
                    value={selectedSubAdministrativeAreaId}
                    onChange={(v) => {
                      setSelectedSubAdministrativeAreaId(v)
                      setSelectedZoneId('')
                    }}
                    options={subAdminAreaOptions}
                    disabled={!selectedAdministrativeAreaId}
                    placeholder="Seleccione Municipio"
                  />
                </FormField>

                <FormField label="Localidad / Parroquia" required>
                  <Select
                    value={selectedLocalityId}
                    onChange={setSelectedLocalityId}
                    options={localityOptions}
                    disabled={!selectedAdministrativeAreaId}
                    placeholder="Seleccione Localidad"
                  />
                </FormField>

                <FormField label="Zona de Residencia" required>
                  <Select
                    value={selectedZoneId}
                    onChange={setSelectedZoneId}
                    options={zoneOptions}
                    disabled={!selectedSubAdministrativeAreaId || zoneOptions.length === 0}
                    placeholder={
                      zoneOptions.length === 0 ? 'Sin zonas asociadas' : 'Seleccione Zona'
                    }
                  />
                </FormField>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <FormField label="Línea de Dirección (Calle/Edificio/Casa)" required>
                  <Input
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Ej: Av. Principal, Res. La Colina, Apto 4B"
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
              disabled={
                !selectedCountryOfBirthId ||
                !civilStateId ||
                !selectedAdministrativeAreaId ||
                !selectedSubAdministrativeAreaId ||
                !selectedLocalityId ||
                !addressLine
              }
              isLoading={loading}
              onClick={onNext}
            >
              Completar y guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
