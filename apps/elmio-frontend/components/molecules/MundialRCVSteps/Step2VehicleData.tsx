/**
 * @fileoverview Componente de Paso 2: Datos del Vehículo para La Mundial de Seguros.
 * @description Cascada de selects de año, marca, modelo, versión de la API INMA.
 * @module components/molecules/MundialRCVSteps/Step2VehicleData
 */

'use client'

import { Car } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Select } from '@/components/atoms/Select/Select'
import { Toggle } from '@/components/atoms/Toggle/Toggle'
import { FormField } from '@/components/molecules/FormField/FormField'
import type { VehicleSelectOption } from '@/src/hooks/pages/useMundialConsultaRCV'

interface Step2VehicleDataProps {
  year: string
  setYear: (v: string) => void
  brand: string
  setBrand: (v: string) => void
  model: string
  setModel: (v: string) => void
  version: string
  setVersion: (v: string) => void
  years: string[]
  brands: VehicleSelectOption[]
  models: VehicleSelectOption[]
  versions: VehicleSelectOption[]
  loadingBrands: boolean
  loadingModels: boolean
  loadingVersions: boolean
  loadingPlans: boolean
  handleYearChange: (v: string) => Promise<void>
  handleBrandChange: (v: string) => Promise<void>
  handleModelChange: (v: string) => Promise<void>
  handleVersionChange: (v: string) => Promise<void>
  isVehicleFormValid: boolean
  onSubmit: (e: React.FormEvent) => Promise<void>
  onBack: () => void
}

export function Step2VehicleData({
  year,
  brand,
  model,
  version,
  years,
  brands,
  models,
  versions,
  loadingBrands,
  loadingModels,
  loadingVersions,
  loadingPlans,
  handleYearChange,
  handleBrandChange,
  handleModelChange,
  handleVersionChange,
  isVehicleFormValid,
  onSubmit,
  onBack,
}: Step2VehicleDataProps) {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <Car className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Datos del Vehículo</h2>
          <p className="text-xs text-body-muted">
            Seleccione el año, marca y modelo del vehículo desde la base de datos INMA.
          </p>
        </div>
      </div>

      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={onSubmit}>
        <FormField label="Año" required>
          <Select
            value={year}
            onChange={handleYearChange}
            options={years.map((y) => ({ value: y, label: y }))}
            placeholder="Seleccione año"
          />
        </FormField>
        <FormField label="Marca" required>
          <Select
            value={brand}
            onChange={handleBrandChange}
            options={brands}
            placeholder={loadingBrands ? 'Cargando marcas...' : 'Seleccione marca'}
            disabled={!year || loadingBrands}
          />
        </FormField>
        <FormField label="Modelo" required>
          <Select
            value={model}
            onChange={handleModelChange}
            options={models}
            placeholder={loadingModels ? 'Cargando modelos...' : 'Seleccione modelo'}
            disabled={!brand || loadingModels}
          />
        </FormField>
        <FormField label="Versión" required>
          <Select
            value={version}
            onChange={handleVersionChange}
            options={versions}
            placeholder={loadingVersions ? 'Cargando versiones...' : 'Seleccione versión'}
            disabled={!model || loadingVersions}
          />
        </FormField>

        <div className="sm:col-span-2 flex gap-3 border-t border-gray-100 pt-5 mt-4">
          <Button type="button" variant="ghost" fullWidth onClick={onBack}>
            Anterior
          </Button>
          <Button type="submit" fullWidth disabled={!isVehicleFormValid} isLoading={loadingPlans}>
            Consultar Planes
          </Button>
        </div>
      </form>
    </div>
  )
}
