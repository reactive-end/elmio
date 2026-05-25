/**
 * @fileoverview Hook personalizado para la consulta RCV de Mercantil (Responsabilidad Civil Vehicular).
 * @description Gestiona el wizard de 7 pasos: datos del asegurado, vehículo, planes, documentos, completar vehículo, completar datos del cliente, y confirmación.
 * @module hooks/pages/useMercantilConsultaRCV
 */

'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  mercantilService,
  type MercantilGender,
  type MercantilPlan,
  type MercantilProduct,
  type MercantilCategoryResult,
  type Country,
  type CountryLocations,
  type BucketUploadResult,
} from '@/src/services/mercantil.service';

export type { MercantilCategoryResult, MercantilProduct, MercantilPlan } from '@/src/services/mercantil.service';

export const PHONE_CODES = ['0412', '0422', '0414', '0424', '0426'] as const;
export type PhoneCode = (typeof PHONE_CODES)[number];

export type PaymentFrequency = 'yearly';

export const FREQUENCY_DIVISORS: Record<PaymentFrequency, number> = {
  yearly: 1,
};

export interface InsuredData {
  firstName: string;
  lastName: string;
  docType: string;
  docNumber: string;
  email: string;
  phoneCode: PhoneCode;
  phoneNumber: string;
  birthDate: string;
  genderId: MercantilGender;
}

export interface VehicleSelectOption {
  label: string;
  value: string;
}

export interface SelectedPlan {
  product: MercantilProduct;
  plan: MercantilPlan;
  frequency: PaymentFrequency;
}

export interface EmissionStatus {
  status: 'pending' | 'emitted' | 'error' | 'failed' | string;
}

export interface ShopcartSummary {
  policies?: { id: string; number?: string }[];
}

const getOptionValue = (option: unknown): string => {
  if (typeof option === 'string' || typeof option === 'number') {
    return String(option);
  }
  if (option && typeof option === 'object') {
    const obj = option as Record<string, unknown>;
    const nestedKeys = ['brand', 'model', 'version'];
    for (const key of nestedKeys) {
      const nested = obj[key];
      if (nested && typeof nested === 'object') {
        const nestedObj = nested as Record<string, unknown>;
        const nestedCandidate = nestedObj.name ?? nestedObj.label ?? nestedObj.description ?? nestedObj.value ?? nestedObj.code ?? nestedObj.id;
        if (typeof nestedCandidate === 'string' || typeof nestedCandidate === 'number') {
          return String(nestedCandidate);
        }
      }
    }
    const candidate = obj.name ?? obj.label ?? obj.description ?? obj.value ?? obj.code ?? obj.id;
    if (typeof candidate === 'string' || typeof candidate === 'number') {
      return String(candidate);
    }
  }
  return '';
};

const getGenericSelectOption = (option: unknown): VehicleSelectOption | null => {
  if (typeof option === 'string' || typeof option === 'number') {
    const normalized = String(option).trim();
    return normalized ? { label: normalized, value: normalized } : null;
  }
  if (!option || typeof option !== 'object') {
    return null;
  }
  const obj = option as Record<string, unknown>;
  const labelCandidate = obj.name ?? obj.label ?? obj.description ?? obj.text ?? obj.value ?? obj.code ?? obj.id;
  const valueCandidate = obj.id ?? obj.value ?? obj.code ?? obj.name ?? obj.label;
  if ((typeof labelCandidate !== 'string' && typeof labelCandidate !== 'number') || (typeof valueCandidate !== 'string' && typeof valueCandidate !== 'number')) {
    return null;
  }
  const label = String(labelCandidate).trim();
  const value = String(valueCandidate).trim();
  if (!label || !value) {
    return null;
  }
  return { label, value };
};

const toResponseArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  const candidates = [obj.vehicleData, obj.data, obj.items, obj.results, obj.content, obj.payload];
  const arrayCandidate = candidates.find(Array.isArray);
  return Array.isArray(arrayCandidate) ? arrayCandidate : [];
};

const normalizeSelectOptions = (payload: unknown): VehicleSelectOption[] => {
  const source = toResponseArray(payload);
  const optionsMap = new Map<string, VehicleSelectOption>();
  source.forEach((item) => {
    const option = getGenericSelectOption(item);
    if (option && !optionsMap.has(option.value)) {
      optionsMap.set(option.value, option);
    }
  });
  return Array.from(optionsMap.values());
};

const getVehicleEntityOption = (entity: unknown): VehicleSelectOption | null => {
  if (!entity) return null;
  if (typeof entity === 'string') {
    const normalized = entity.trim();
    return normalized ? { label: normalized, value: normalized } : null;
  }
  if (typeof entity !== 'object') return null;
  const obj = entity as Record<string, unknown>;
  const label = typeof obj.name === 'string' && obj.name.trim().length > 0
    ? obj.name.trim()
    : typeof obj.code === 'string' && obj.code.trim().length > 0
      ? obj.code.trim()
      : '';
  const value = typeof obj.code === 'string' && obj.code.trim().length > 0
    ? obj.code.trim()
    : label;
  if (!label || !value) return null;
  return { label, value };
};

const normalizeVehicleOptions = (payload: unknown, key: 'brand' | 'model' | 'version'): VehicleSelectOption[] => {
  const source = toResponseArray(payload);
  const optionsMap = new Map<string, VehicleSelectOption>();
  source.forEach((item) => {
    const entity = (item as Record<string, unknown>)?.[key];
    const option = getVehicleEntityOption(entity);
    if (option && !optionsMap.has(option.value)) {
      optionsMap.set(option.value, option);
    }
  });
  return Array.from(optionsMap.values());
};

const getVehicleTypeIdFromPayload = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') return '';
  const payloadObj = payload as Record<string, unknown>;
  if (payloadObj.vehicleData && typeof payloadObj.vehicleData === 'object') {
    const vehicleData = payloadObj.vehicleData as Record<string, unknown>;
    if (vehicleData.version && typeof vehicleData.version === 'object') {
      const versionObj = vehicleData.version as Record<string, unknown>;
      if (typeof versionObj.typeId === 'string' || typeof versionObj.typeId === 'number') {
        return String(versionObj.typeId);
      }
    }
  }
  const source = toResponseArray(payload) as Array<Record<string, unknown>>;
  const first = source[0];
  if (!first || typeof first !== 'object') return '';
  const versionEntity = first.version;
  if (versionEntity && typeof versionEntity === 'object') {
    const versionObject = versionEntity as Record<string, unknown>;
    if (typeof versionObject.typeId === 'string' || typeof versionObject.typeId === 'number') {
      return String(versionObject.typeId);
    }
  }
  const candidates = [first.vehicleTypeId, first.vehicleTypeCode, first.id, first.typeId, first.vehicle_id];
  const scalar = candidates.find((value) => typeof value === 'string' || typeof value === 'number');
  if (scalar !== undefined) {
    return String(scalar);
  }
  if (first.vehicle && typeof first.vehicle === 'object') {
    const vehicleObj = first.vehicle as Record<string, unknown>;
    const nested = [vehicleObj.id, vehicleObj.vehicleId, vehicleObj.vehicleTypeId].find(
      (value) => typeof value === 'string' || typeof value === 'number',
    );
    if (nested !== undefined) {
      return String(nested);
    }
  }
  return '';
};

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(`${birthDate}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function useMercantilConsultaRCV() {
  // Step tracking
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 7;

  // Step 1: Insured data
  const [insured, setInsured] = useState<InsuredData>({
    firstName: '', lastName: '', docType: 'V', docNumber: '', email: '', phoneCode: '0412', phoneNumber: '', birthDate: '', genderId: 'M',
  });

  // Step 2: Vehicle cascading selects
  const [year, setYear] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [version, setVersion] = useState('');
  const [locationId, setLocationId] = useState('');
  const [hasArmor, setHasArmor] = useState<boolean | null>(null);
  const [vehicleColors, setVehicleColors] = useState<VehicleSelectOption[]>([]);
  const [vehicleColorId, setVehicleColorId] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleChassisSerial, setVehicleChassisSerial] = useState('');
  const [vehicleEngineSerial, setVehicleEngineSerial] = useState('');

  const [brands, setBrands] = useState<VehicleSelectOption[]>([]);
  const [models, setModels] = useState<VehicleSelectOption[]>([]);
  const [versions, setVersions] = useState<VehicleSelectOption[]>([]);
  const [locations, setLocations] = useState<VehicleSelectOption[]>([]);

  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingVehicleTypeId, setLoadingVehicleTypeId] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingVehicleColors, setLoadingVehicleColors] = useState(false);
  const [vehicleCompletionLoading, setVehicleCompletionLoading] = useState(false);

  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [planCategories, setPlanCategories] = useState<MercantilCategoryResult[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<SelectedPlan[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [years, setYears] = useState<string[]>([]);

  // Backend state
  const [clientId, setClientId] = useState<string | null>(null);
  const [needsCompletion, setNeedsCompletion] = useState<boolean | null>(null);
  const [shopcartId, setShopcartId] = useState<string | null>(null);
  const [salesChannelId, setSalesChannelId] = useState<string | null>(null);
  const [emissionStatus, setEmissionStatus] = useState<'idle' | 'emitting' | 'polling' | 'completed' | 'error'>('idle');
  const [policyData, setPolicyData] = useState<{ policyId?: string; number?: string }[] | null>(null);
  const [shopcartSummary, setShopcartSummary] = useState<ShopcartSummary | null>(null);
  const [stepError, setStepError] = useState('');
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Step 4: Documents
  const [idFile, setIdFile] = useState<File | null>(null);
  const [vehiclePropertyFile, setVehiclePropertyFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragActiveProperty, setDragActiveProperty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const propertyFileInputRef = useRef<HTMLInputElement | null>(null);
  const dniBucketRef = useRef<BucketUploadResult | null>(null);

  // Step 6: Complete client data
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryLocations, setCountryLocations] = useState<CountryLocations | null>(null);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [selectedCountryOfBirthId, setSelectedCountryOfBirthId] = useState('');
  const [civilStateId, setCivilStateId] = useState('');
  const [selectedAdministrativeAreaId, setSelectedAdministrativeAreaId] = useState('');
  const [selectedSubAdministrativeAreaId, setSelectedSubAdministrativeAreaId] = useState('');
  const [selectedLocalityId, setSelectedLocalityId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [completeLoading, setCompleteLoading] = useState(false);

  // Step 1 loading
  const [step1Loading, setStep1Loading] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  // Init years
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setYears(Array.from({ length: 30 }, (_, i) => String(currentYear - i)));
  }, []);

  // Load vehicle locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const data = await mercantilService.getVehicleLocations();
        setLocations(normalizeSelectOptions(data));
      } catch {
        setLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  // Step 1: Client submit
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insured.firstName || !insured.lastName || !insured.docNumber || !insured.birthDate) {
      setErrorMessage('Completa todos los campos requeridos.');
      return;
    }
    setErrorMessage('');
    setStep1Loading(true);
    try {
      try {
        const clientCheck = await mercantilService.checkClientExists({
          birthDate: insured.birthDate,
          dniType: 'VEN',
          dniNumber: insured.docNumber,
          dniVenNationality: 'V',
        });
        if (clientCheck.exists && clientCheck.clientId) {
          setClientId(clientCheck.clientId);
          setNeedsCompletion(clientCheck.needsCompletion ?? true);
        } else {
          setClientId(null);
          setNeedsCompletion(true);
        }
      } catch {
        setClientId(null);
        setNeedsCompletion(true);
      }
      setStep(2);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error verificando cliente');
    } finally {
      setStep1Loading(false);
    }
  };

  // Step 2: Vehicle cascading selects
  const handleYearChange = async (newYear: string) => {
    setYear(newYear);
    setBrand('');
    setModel('');
    setVersion('');
    setVehicleTypeId('');
    setBrands([]);
    setModels([]);
    setVersions([]);
    if (!newYear) return;
    setLoadingBrands(true);
    setErrorMessage('');
    try {
      const data = await mercantilService.getVehicleInformation({ year: newYear });
      setBrands(normalizeVehicleOptions(data, 'brand'));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error consultando marcas');
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleBrandChange = async (newBrand: string) => {
    setBrand(newBrand);
    setModel('');
    setVersion('');
    setVehicleTypeId('');
    setModels([]);
    setVersions([]);
    if (!newBrand) return;
    setLoadingModels(true);
    setErrorMessage('');
    try {
      const data = await mercantilService.getVehicleInformation({ year, brand: newBrand });
      setModels(normalizeVehicleOptions(data, 'model'));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error consultando modelos');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleModelChange = async (newModel: string) => {
    setModel(newModel);
    setVersion('');
    setVehicleTypeId('');
    setVersions([]);
    if (!newModel) return;
    setLoadingVersions(true);
    setErrorMessage('');
    try {
      const data = await mercantilService.getVehicleInformation({ year, brand, model: newModel });
      setVersions(normalizeVehicleOptions(data, 'version'));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error consultando versiones');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleVersionChange = async (newVersion: string) => {
    setVersion(newVersion);
    setVehicleTypeId('');
    if (!newVersion) return;
    setLoadingVehicleTypeId(true);
    setErrorMessage('');
    try {
      const data = await mercantilService.getVehicleInformation({ year, brand, model, version: newVersion });
      const resolvedVehicleTypeId = getVehicleTypeIdFromPayload(data);
      setVehicleTypeId(resolvedVehicleTypeId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error consultando datos del vehículo');
    } finally {
      setLoadingVehicleTypeId(false);
    }
  };

  const isVehicleFormValid = year !== '' && brand !== '' && model !== '' && version !== '' && locationId !== '';

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVehicleFormValid) return;
    setLoadingPlans(true);
    setErrorMessage('');
    try {
      let typeId = vehicleTypeId;
      if (!typeId) {
        const vehicleData = await mercantilService.getVehicleInformation({ year, brand, model, version });
        typeId = getVehicleTypeIdFromPayload(vehicleData);
        setVehicleTypeId(typeId);
      }
      if (!typeId) {
        throw new Error('No se pudo obtener el tipo de vehículo');
      }
      const data = await mercantilService.getAutoPlans(typeId);
      setPlanCategories(data);
      setSelectedPlans([]);
      setTermsAccepted(false);
      setStep(3);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error consultando planes');
    } finally {
      setLoadingPlans(false);
    }
  };

  const togglePlan = (product: MercantilProduct, plan: MercantilPlan) => {
    setSelectedPlans((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing?.plan.id === plan.id) {
        return prev.filter((item) => item.product.id !== product.id);
      }
      return [...prev.filter((item) => item.product.id !== product.id), { product, plan, frequency: 'yearly' as PaymentFrequency }];
    });
  };

  // Step 4: Documents handlers
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) setIdFile(file);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setIdFile(file);
  }, []);

  const handlePropertyFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActiveProperty(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) setVehiclePropertyFile(file);
  }, []);

  const handlePropertyFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVehiclePropertyFile(file);
  }, []);

  // Step 3: Continue to documents (create client, shopcart, add products)
  const handleContinueToStep4 = async () => {
    setStepError('');
    setLoadingPlans(true);
    try {
      let currentClientId = clientId;
      if (!currentClientId) {
        const phoneDigits = `${insured.phoneCode}${insured.phoneNumber}`;
        const newClient = await mercantilService.createClient({
          firstName: insured.firstName,
          lastName: insured.lastName,
          email: insured.email,
          birthDate: insured.birthDate,
          genderId: insured.genderId,
          dniType: 'VEN',
          dniNumber: insured.docNumber,
          dniVenNationality: 'V',
          phone: { countryId: '29', areaCode: phoneDigits.slice(0, 3), number: phoneDigits.slice(3) },
          address: { countryId: '29' },
        });
        currentClientId = (newClient.id ?? newClient.clientId) as string;
        setClientId(currentClientId);
      }

      let channelId = salesChannelId;
      if (!channelId) {
        const channels = await mercantilService.getSalesChannels();
        if (channels && channels.length > 0) {
          channelId = (channels[0].id ?? channels[0].code) as string;
          setSalesChannelId(channelId);
        }
      }

      const cartResult = await mercantilService.createShopcart({ clientId: currentClientId, salesChannelId: channelId });
      const newShopcartId = (cartResult.id ?? cartResult.shopcartId) as string;
      setShopcartId(newShopcartId);

      await mercantilService.bulkLoadProducts(
        newShopcartId,
        selectedPlans.map((item) => ({
          productId: item.product.id,
          planId: item.plan.id,
          isPreferentialBeneficiaryEnabled: false,
          vehicleInformation: {
            year,
            brandCode: brand,
            modelCode: model,
            versionCode: version,
          },
        })),
      );

      setStep(4);
    } catch (error) {
      setStepError(error instanceof Error ? error.message : 'Error creando el carrito');
    } finally {
      setLoadingPlans(false);
    }
  };

  // Step 4: Upload documents and go to complete vehicle
  const handleContinueToStep5 = async () => {
    if (!shopcartId || !vehiclePropertyFile) return;
    if (needsCompletion !== false && !idFile) return;
    setStepError('');
    setLoadingDocuments(true);
    try {
      if (idFile) {
        dniBucketRef.current = await mercantilService.uploadDniToBucket(idFile, `${insured.docType}${insured.docNumber}-${shopcartId}`);
        await mercantilService.uploadDni(shopcartId, idFile);
      }
      await mercantilService.uploadVehiclePropertyTitle(shopcartId, vehiclePropertyFile);
      setStep(5);
    } catch (error) {
      setStepError(error instanceof Error ? error.message : 'Error subiendo los documentos');
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Step 5: Complete vehicle
  const isVehicleCompletionValid =
    vehicleColorId !== ''
    && vehiclePlate.length >= 6
    && vehiclePlate.length <= 7
    && vehicleChassisSerial.length === 17
    && vehicleEngineSerial.length === 18;

  const handleCompleteVehicleStep = async () => {
    if (!shopcartId) {
      setStepError('No se encontró el carrito de compras');
      return;
    }
    if (!isVehicleCompletionValid || !locationId) {
      setStepError('Completa todos los datos obligatorios del vehículo');
      return;
    }
    setVehicleCompletionLoading(true);
    setStepError('');
    try {
      await mercantilService.completeVehicleInfo(shopcartId, {
        vehicleInformation: {
          commonLocationId: locationId,
          isArmored: hasArmor ?? false,
          plate: vehiclePlate,
          colorId: vehicleColorId,
          chassisSerial: vehicleChassisSerial,
          engineSerial: vehicleEngineSerial,
        },
      });

      if (needsCompletion === false) {
        await handleEmitPolicy();
      } else {
        // Load vehicle colors and countries before entering step 6
        if (vehicleColors.length === 0) {
          setLoadingVehicleColors(true);
          try {
            const colors = await mercantilService.getVehicleColors();
            setVehicleColors(normalizeSelectOptions(colors));
          } catch {
            // ignore
          } finally {
            setLoadingVehicleColors(false);
          }
        }
        if (countries.length === 0) {
          setLoadingCountries(true);
          try {
            const data = await mercantilService.getCountries();
            setCountries(data);
          } catch {
            // ignore
          } finally {
            setLoadingCountries(false);
          }
        }
        setStep(6);
      }
    } catch (error) {
      setStepError(error instanceof Error ? error.message : 'Error completando los datos del vehículo');
    } finally {
      setVehicleCompletionLoading(false);
    }
  };

  // Step 6: Complete client data
  const handleContinueToStep6 = async () => {
    if (!clientId) {
      setStepError('No se encontró el ID del cliente');
      return;
    }
    if (!selectedCountryOfBirthId || !civilStateId) {
      setStepError('Completa todos los campos obligatorios');
      return;
    }
    setCompleteLoading(true);
    setStepError('');
    try {
      const phoneDigits = `${insured.phoneCode}${insured.phoneNumber}`;
      await mercantilService.completeClient(clientId, {
        email: insured.email,
        firstName: insured.firstName,
        lastName: insured.lastName,
        dniType: 'VEN',
        dniNumber: insured.docNumber,
        dniVenNationality: insured.docType,
        birthDate: insured.birthDate,
        genderId: insured.genderId,
        countryOfBirthId: selectedCountryOfBirthId,
        civilStateId,
        phone: {
          countryId: '29',
          areaCode: phoneDigits.slice(0, 3),
          number: phoneDigits.slice(3),
        },
        address: {
          countryId: '29',
          administrativeAreaId: selectedAdministrativeAreaId,
          subadministrativeAreaId: selectedSubAdministrativeAreaId,
          localityId: selectedLocalityId,
          zoneId: selectedZoneId || undefined,
          postalCode: postalCode || '1080',
          address1: addressLine || 'Gran Caracas',
        },
      });
      await handleEmitPolicy();
    } catch (error) {
      setStepError(error instanceof Error ? error.message : 'Error completando los datos');
    } finally {
      setCompleteLoading(false);
    }
  };

  // Load countries when entering step 6
  useEffect(() => {
    if (step === 6 && countries.length === 0) {
      setLoadingCountries(true);
      mercantilService.getCountries()
        .then((data) => {
          setCountries(data);
          setAddressLine('Gran Caracas');
          setPostalCode('1080');
        })
        .catch((err) => console.error('Error loading countries:', err))
        .finally(() => setLoadingCountries(false));
    }
  }, [step, countries.length]);

  // Load vehicle colors when entering step 5
  useEffect(() => {
    if (step === 5 && vehicleColors.length === 0) {
      setLoadingVehicleColors(true);
      mercantilService.getVehicleColors()
        .then((data) => setVehicleColors(normalizeSelectOptions(data)))
        .catch((err) => console.error('Error loading vehicle colors:', err))
        .finally(() => setLoadingVehicleColors(false));
    }
  }, [step, vehicleColors.length]);

  // Auto-select location when countryLocations change
  useEffect(() => {
    if (countryLocations?.administrativeAreas) {
      const capital = countryLocations.administrativeAreas.find((aa) =>
        aa.name.toUpperCase().includes('DISTRITO CAPITAL'),
      );
      if (capital) {
        setSelectedAdministrativeAreaId(capital.id);
        const baruta = capital.subAdministrativeAreas?.find((saa) =>
          saa.name.toUpperCase().includes('BARUTA'),
        );
        if (baruta) {
          setSelectedSubAdministrativeAreaId(baruta.id);
          const noId = baruta.zones?.find((z) =>
            z.name.toUpperCase().includes('NO IDENTIFICADA'),
          );
          if (noId) setSelectedZoneId(noId.id);
        }
        const caracas = capital.localities?.find((loc) =>
          loc.name.toUpperCase().includes('CARACAS'),
        );
        if (caracas) setSelectedLocalityId(caracas.id);
      }
    }
  }, [countryLocations]);

  // Load locations when address changes (hardcoded to Venezuela)
  useEffect(() => {
    const selectedAddressCountryId = '29';
    if (selectedAddressCountryId) {
      mercantilService.getCountryLocations(selectedAddressCountryId)
        .then((data) => setCountryLocations(data))
        .catch((err) => console.error('Error loading locations:', err));
    }
  }, []);

  // Emit policy with polling
  const handleEmitPolicy = async () => {
    if (!shopcartId || emissionStatus === 'emitting' || emissionStatus === 'polling') return;
    setEmissionStatus('emitting');
    setStepError('');
    setPolicyData(null);
    try {
      await mercantilService.emitShopcart(shopcartId, {
        paymentFrequency: 'yearly',
        sendEmailConfirmation: true,
        isHolderThePayee: true,
        holderAcceptedTermsAndConditions: true,
        isHolderNotPoliticallyExposed: true,
        holderEnjoysGoodHealth: true,
        holderAcceptsToLoadDniDocumentLater: false,
      });
      setEmissionStatus('polling');

      const maxAttempts = 10;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 12000));
        const status = await mercantilService.getEmissionStatus(shopcartId) as EmissionStatus;
        if (status.status === 'emitted') {
          const summary = await mercantilService.getShopcartSummary(shopcartId);
          setShopcartSummary(summary);

          const clientPayload = {
            clientId: clientId || undefined,
            firstName: insured.firstName,
            lastName: insured.lastName,
            email: insured.email,
            dniType: insured.docType,
            dniNumber: insured.docNumber,
            dniVenNationality: insured.docType,
            birthDate: insured.birthDate,
            genderId: insured.genderId,
            countryOfBirthId: selectedCountryOfBirthId || undefined,
            civilStateId: civilStateId || undefined,
            phone: {
              countryId: '29',
              areaCode: `${insured.phoneCode}${insured.phoneNumber}`.slice(0, 3),
              number: `${insured.phoneCode}${insured.phoneNumber}`.slice(3),
            },
            address: {
              countryId: '29',
              administrativeAreaId: selectedAdministrativeAreaId || undefined,
              subadministrativeAreaId: selectedSubAdministrativeAreaId || undefined,
              localityId: selectedLocalityId || undefined,
              zoneId: selectedZoneId || undefined,
              postalCode: postalCode || '1080',
              address1: addressLine || 'Gran Caracas',
            },
          };

          const findName = (options: VehicleSelectOption[], code: string): string | undefined => {
            const opt = options.find((o) => o.value === code);
            return opt?.label || undefined;
          };

          const vehiclePayload = {
            year,
            brandCode: brand,
            brandName: findName(brands, brand),
            modelCode: model,
            modelName: findName(models, model),
            versionCode: version,
            versionName: findName(versions, version),
            vehicleTypeId: vehicleTypeId || undefined,
            commonLocationId: locationId || undefined,
            commonLocationName: findName(locations, locationId),
            isArmored: hasArmor ?? undefined,
            plate: vehiclePlate || undefined,
            colorId: vehicleColorId || undefined,
            colorName: findName(vehicleColors, vehicleColorId),
            chassisSerial: vehicleChassisSerial || undefined,
            engineSerial: vehicleEngineSerial || undefined,
          };

          await mercantilService.finalizePersistence(shopcartId, {
            client: clientPayload,
            vehicle: vehiclePayload,
            ...(dniBucketRef.current?.path
              ? {
                  dniDocument: {
                    path: dniBucketRef.current.path,
                    originalName: dniBucketRef.current.originalName,
                    contentType: dniBucketRef.current.contentType,
                  },
                }
              : {}),
          });

          setPolicyData(summary.policies?.map((p) => ({ policyId: p.id, number: p.number })) || null);
          setEmissionStatus('completed');
          setStep(7);
          return;
        }
        if (status.status === 'error' || status.status === 'failed') {
          throw new Error('La emisión de la póliza falló');
        }
      }
      setEmissionStatus('error');
      setStepError('La emisión tardó más de lo esperado. Puedes reintentar.');
    } catch (error) {
      setEmissionStatus('error');
      setStepError(error instanceof Error ? error.message : 'Error emitiendo la póliza');
    }
  };

  // Download PDF
  const handleDownloadPdf = async (policyId: string) => {
    if (!shopcartId || !policyId) return;
    try {
      const result = await mercantilService.getPolicyPdf(shopcartId, policyId);
      let base64Data = result.pdfBase64;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.pdfName || `poliza-${policyId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setStepError('No fue posible descargar el PDF');
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
    setStepError('');
  };

  const totalEstimatedPrime = useMemo(() => {
    return selectedPlans.reduce((acc, item) => {
      const divisor = FREQUENCY_DIVISORS[item.frequency];
      return acc + ((item.plan.totalPrime || 0) / divisor);
    }, 0);
  }, [selectedPlans]);

  return {
    step,
    TOTAL_STEPS,
    setStep,
    // Step 1
    insured,
    setInsured,
    handleClientSubmit,
    step1Loading,
    errorMessage,
    // Step 2
    year,
    setYear,
    brand,
    setBrand,
    model,
    setModel,
    version,
    setVersion,
    locationId,
    setLocationId,
    hasArmor,
    setHasArmor,
    years,
    brands,
    models,
    versions,
    locations,
    loadingBrands,
    loadingModels,
    loadingVersions,
    loadingVehicleTypeId,
    loadingPlans,
    loadingLocations,
    handleYearChange,
    handleBrandChange,
    handleModelChange,
    handleVersionChange,
    isVehicleFormValid,
    handleVehicleSubmit,
    vehicleTypeId,
    // Step 3
    planCategories,
    selectedPlans,
    togglePlan,
    termsAccepted,
    setTermsAccepted,
    handleContinueToStep4,
    totalEstimatedPrime,
    // Step 4
    idFile,
    setIdFile,
    vehiclePropertyFile,
    setVehiclePropertyFile,
    dragActive,
    setDragActive,
    dragActiveProperty,
    setDragActiveProperty,
    fileInputRef,
    propertyFileInputRef,
    handleFileDrop,
    handleFileSelect,
    handlePropertyFileDrop,
    handlePropertyFileSelect,
    handleContinueToStep5,
    loadingDocuments,
    // Step 5
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
    handleCompleteVehicleStep,
    vehicleCompletionLoading,
    // Step 6
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
    handleContinueToStep6,
    completeLoading,
    // Global
    emissionStatus,
    setEmissionStatus,
    stepError,
    setStepError,
    handleBack,
    handleEmitPolicy,
    policyData,
    handleDownloadPdf,
    shopcartId,
    clientId,
    needsCompletion,
  };
}
