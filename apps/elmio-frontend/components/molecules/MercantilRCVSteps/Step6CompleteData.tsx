/**
 * @fileoverview Componente de Paso 6: Completar Datos del Cliente.
 * @description Captura país de nacimiento, estado civil y dirección de residencia.
 * @module components/molecules/MercantilRCVSteps/Step6CompleteData
 */

'use client';

import { MapPin } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Select } from '@/components/atoms/Select/Select';
import { Input } from '@/components/atoms/Input/Input';
import { FormField } from '@/components/molecules/FormField/FormField';
import { Spinner } from '@/components/atoms/Spinner/Spinner';
import type { Country, CountryLocations } from '@/src/services/mercantil.service';

interface Step6CompleteDataProps {
  countries: Country[];
  countryLocations: CountryLocations | null;
  loadingCountries: boolean;
  selectedCountryOfBirthId: string;
  setSelectedCountryOfBirthId: (v: string) => void;
  civilStateId: string;
  setCivilStateId: (v: string) => void;
  selectedAdministrativeAreaId: string;
  setSelectedAdministrativeAreaId: (v: string) => void;
  selectedSubAdministrativeAreaId: string;
  setSelectedSubAdministrativeAreaId: (v: string) => void;
  selectedLocalityId: string;
  setSelectedLocalityId: (v: string) => void;
  selectedZoneId: string;
  setSelectedZoneId: (v: string) => void;
  addressLine: string;
  setAddressLine: (v: string) => void;
  postalCode: string;
  setPostalCode: (v: string) => void;
  loading: boolean;
  onBack: () => void;
  onNext: () => Promise<void>;
}

const CIVIL_STATES = [
  { value: '1', label: 'Soltero(a)' },
  { value: '2', label: 'Casado(a)' },
  { value: '3', label: 'Divorciado(a)' },
  { value: '4', label: 'Viudo(a)' },
  { value: '5', label: 'Unión Estable de Hecho' },
];

export function Step6CompleteData({
  countries,
  countryLocations,
  loadingCountries,
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
  setAddressLine,
  postalCode,
  setPostalCode,
  loading,
  onBack,
  onNext,
}: Step6CompleteDataProps) {
  const administrativeAreaOptions =
    countryLocations?.administrativeAreas?.map((aa) => ({
      value: aa.id,
      label: aa.name,
    })) ?? [];

  const activeAdminArea = countryLocations?.administrativeAreas?.find(
    (aa) => aa.id === selectedAdministrativeAreaId,
  );

  const subAdminAreaOptions =
    activeAdminArea?.subAdministrativeAreas?.map((saa) => ({
      value: saa.id,
      label: saa.name,
    })) ?? [];

  const localityOptions =
    activeAdminArea?.localities?.map((l) => ({
      value: l.id,
      label: l.name,
    })) ?? [];

  const zoneOptions =
    activeAdminArea?.subAdministrativeAreas
      ?.find((saa) => saa.id === selectedSubAdministrativeAreaId)
      ?.zones?.map((z) => ({
        value: z.id,
        label: z.name,
      })) ?? [];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <MapPin className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Completar Datos</h2>
          <p className="text-xs text-body-muted">Indique su lugar de nacimiento y complete los campos obligatorios.</p>
        </div>
      </div>

      {loadingCountries ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Spinner size="md" />
          <p className="text-xs text-body-muted">Cargando catálogos...</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Estado" required>
                <Select
                  value={selectedAdministrativeAreaId}
                  onChange={(v) => {
                    setSelectedAdministrativeAreaId(v);
                    setSelectedSubAdministrativeAreaId('');
                    setSelectedLocalityId('');
                    setSelectedZoneId('');
                  }}
                  options={administrativeAreaOptions}
                  placeholder="Seleccione Estado"
                />
              </FormField>
              <FormField label="Municipio / Región" required>
                <Select
                  value={selectedSubAdministrativeAreaId}
                  onChange={(v) => {
                    setSelectedSubAdministrativeAreaId(v);
                    setSelectedZoneId('');
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
                  placeholder={zoneOptions.length === 0 ? 'Sin zonas' : 'Seleccione Zona'}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <FormField label="Línea de Dirección" required>
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
              Emitir Póliza
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
