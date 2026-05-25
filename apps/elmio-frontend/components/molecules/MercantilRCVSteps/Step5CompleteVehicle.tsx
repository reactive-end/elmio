/**
 * @fileoverview Componente de Paso 5: Completar Datos del Vehículo.
 * @description Captura datos técnicos: color, placa, serial de chasis y motor.
 * @module components/molecules/MercantilRCVSteps/Step5CompleteVehicle
 */

'use client';

import { Wrench } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Select } from '@/components/atoms/Select/Select';
import { FormField } from '@/components/molecules/FormField/FormField';
import type { VehicleSelectOption } from '@/src/hooks/pages/useMercantilConsultaRCV';

interface Step5CompleteVehicleProps {
  vehicleColors: VehicleSelectOption[];
  vehicleColorId: string;
  setVehicleColorId: (v: string) => void;
  vehiclePlate: string;
  setVehiclePlate: (v: string) => void;
  vehicleChassisSerial: string;
  setVehicleChassisSerial: (v: string) => void;
  vehicleEngineSerial: string;
  setVehicleEngineSerial: (v: string) => void;
  loadingVehicleColors: boolean;
  isVehicleCompletionValid: boolean;
  loading: boolean;
  onBack: () => void;
  onNext: () => Promise<void>;
}

export function Step5CompleteVehicle({
  vehicleColors,
  vehicleColorId,
  setVehicleColorId,
  vehiclePlate,
  setVehiclePlate,
  vehicleChassisSerial,
  setVehicleChassisSerial,
  vehicleEngineSerial,
  setVehicleEngineSerial,
  loadingVehicleColors,
  isVehicleCompletionValid,
  loading,
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
          <p className="text-xs text-body-muted">Ingrese los datos técnicos del vehículo a asegurar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Color" required>
          <Select
            value={vehicleColorId}
            onChange={setVehicleColorId}
            options={vehicleColors}
            placeholder={loadingVehicleColors ? 'Cargando...' : 'Seleccione color'}
            disabled={loadingVehicleColors}
          />
        </FormField>
        <FormField label="Placa" required>
          <Input
            type="text"
            value={vehiclePlate}
            onChange={(e) => setVehiclePlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
            placeholder="Ej: AB123CD"
            maxLength={7}
          />
        </FormField>
        <FormField label="Serial de Chasis (17 caracteres)" required>
          <Input
            type="text"
            value={vehicleChassisSerial}
            onChange={(e) => setVehicleChassisSerial(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17))}
            placeholder="Ej: 1HGCM82633A123456"
            maxLength={17}
          />
        </FormField>
        <FormField label="Serial de Motor (18 caracteres)" required>
          <Input
            type="text"
            value={vehicleEngineSerial}
            onChange={(e) => setVehicleEngineSerial(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18))}
            placeholder="Ej: K24A12345678901234"
            maxLength={18}
          />
        </FormField>
      </div>

      <div className="flex gap-3 border-t border-gray-100 pt-5 mt-4">
        <Button type="button" variant="ghost" fullWidth onClick={onBack}>
          Anterior
        </Button>
        <Button
          type="button"
          fullWidth
          disabled={!isVehicleCompletionValid}
          isLoading={loading}
          onClick={onNext}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
