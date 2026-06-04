/**
 * @fileoverview Componente de Paso 5: Completar Datos del Vehículo para La Mundial de Seguros.
 * @description Captura datos técnicos: color, placa, serial de carrocería (chasis) y motor.
 * @module components/molecules/MundialRCVSteps/Step5CompleteVehicle
 */

'use client'

import { Wrench } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { FormField } from '@/components/molecules/FormField/FormField'

interface Step5CompleteVehicleProps {
  vehicleColorId: string
  setVehicleColorId: (v: string) => void
  vehiclePlate: string
  setVehiclePlate: (v: string) => void
  vehicleChassisSerial: string
  setVehicleChassisSerial: (v: string) => void
  vehicleEngineSerial: string
  setVehicleEngineSerial: (v: string) => void
  isVehicleCompletionValid: boolean
  onBack: () => void
  onNext: () => Promise<void>
}

const VEHICLE_COLORS = [
  { value: 'BLANCO', label: 'Blanco' },
  { value: 'NEGRO', label: 'Negro' },
  { value: 'GRIS', label: 'Gris' },
  { value: 'PLATA', label: 'Plata' },
  { value: 'AZUL', label: 'Azul' },
  { value: 'ROJO', label: 'Rojo' },
  { value: 'VERDE', label: 'Verde' },
  { value: 'AMARILLO', label: 'Amarillo' },
  { value: 'MARRON', label: 'Marrón' },
  { value: 'BEIGE', label: 'Beige' },
  { value: 'ANARANJADO', label: 'Anaranjado' },
  { value: 'OTROS', label: 'Otros' },
]

export function Step5CompleteVehicle({
  vehicleColorId,
  setVehicleColorId,
  vehiclePlate,
  setVehiclePlate,
  vehicleChassisSerial,
  setVehicleChassisSerial,
  vehicleEngineSerial,
  setVehicleEngineSerial,
  isVehicleCompletionValid,
  onBack,
  onNext,
}: Step5CompleteVehicleProps) {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <Wrench className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Completar Vehículo</h2>
          <p className="text-xs text-body-muted">
            Ingrese los datos técnicos del vehículo a asegurar en La Mundial.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Color" required>
          <Select
            value={vehicleColorId}
            onChange={setVehicleColorId}
            options={VEHICLE_COLORS}
            placeholder="Seleccione color"
          />
        </FormField>
        <FormField label="Placa" required>
          <Input
            type="text"
            value={vehiclePlate}
            onChange={(e) =>
              setVehiclePlate(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .slice(0, 7),
              )
            }
            placeholder="Ej: AB123CD"
            maxLength={7}
          />
        </FormField>
        <FormField label="Serial de Carrocería (Chasis)" required>
          <Input
            type="text"
            value={vehicleChassisSerial}
            onChange={(e) =>
              setVehicleChassisSerial(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
            }
            placeholder="Ej: 1HGCM82633A123456"
          />
        </FormField>
        <FormField label="Serial de Motor" required>
          <Input
            type="text"
            value={vehicleEngineSerial}
            onChange={(e) =>
              setVehicleEngineSerial(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
            }
            placeholder="Ej: K24A123456"
          />
        </FormField>
      </div>

      <div className="flex gap-3 border-t border-gray-100 pt-5 mt-4">
        <Button type="button" variant="ghost" fullWidth onClick={onBack}>
          Anterior
        </Button>
        <Button type="button" fullWidth disabled={!isVehicleCompletionValid} onClick={onNext}>
          Continuar
        </Button>
      </div>
    </div>
  )
}
