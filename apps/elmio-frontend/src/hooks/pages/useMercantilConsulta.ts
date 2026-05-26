/**
 * @fileoverview Hook personalizado para gestionar el estado y la lógica de negocio de la consulta de Mercantil.
 * @description Centraliza el estado del asistente de 5 pasos, validación de datos, flujo de emisión directa y polling.
 * @module hooks/pages/useMercantilConsulta
 */

'use client';

import { useState, useEffect, useMemo, useRef, useCallback, type FormEvent } from 'react';
import {
  mercantilService,
  type MercantilGender,
  type MercantilPlan,
  type MercantilProduct,
  type MercantilCategoryResult,
  type Country,
  type CountryLocations,
  type ShopcartSummary,
  type BucketUploadResult,
} from '@/src/services/mercantil.service';
import { authService } from '@/src/services/auth.service';

export const ALLOWED_PRODUCT_SLUGS = ['personalAccidents', 'life', 'funerary'] as const;
export type AllowedProductSlug = (typeof ALLOWED_PRODUCT_SLUGS)[number];

export const PRODUCT_PDFS: Record<AllowedProductSlug, { particulares: string; generales: string }> = {
  life: {
    particulares: '/mercantil/condiciones/SM.824 Pól.Seg.Mas.Vida -Vida Vit.Merc.-Cond.Part.pdf',
    generales: '/mercantil/condiciones/SM.823 Pól.Seg.Mas.Vida -Vida Vit.Merc.-Cond.Gen.pdf',
  },
  personalAccidents: {
    particulares: '/mercantil/condiciones/SM.828 Pól.Seg. Mas. Accid.Pers.-Prot. Vit.Merc.-Cond.Part.pdf',
    generales: '/mercantil/condiciones/SM.827 Pól.Seg. Mas. Accid.Pers.-Prot. Vit.Merc.-Cond.Gen.pdf',
  },
  funerary: {
    particulares: '/mercantil/condiciones/SM.832 Pól.Seg. Mas.Serv. Funer.-Tranq. Vit.Merc.-Cond.Part - copia.pdf',
    generales: '/mercantil/condiciones/SM.831 Pól.Seg. Mas.Serv. Funer.-Tranq. Vit.Merc.-Cond.Gen - copia.pdf',
  },
};

export const TERMS_PDF = '/mercantil/condiciones/TÉRMINOS Y POLÍTICAS VENEZUELA.pdf';

export const HEALTH_DISCLOSURE_TEXT = `¿Qué es gozar de buena salud?
Se refiere a que el asegurado (titular y adicionales) no padezcan, haya padecido, tenga secuelas o complicaciones de algunas o varias de las siguientes enfermedades: Cáncer, Lupus Eritematoso Sistémico, Artritis Reumatoidea, Enfermedades Pulmonares, Asma Bronquial, Enfermedades Cardiovasculares, Accidente Cerebro Vascular, Tromboembolismo Pulmonar, Cirrosis hepática, Esclerosis Múltiples, Esclerosis Lateral Amiotrófica, Enfermedad de Parkinson, Diabetes Mellitus, VIH/Sida, Insuficiencia Renal Crónica, Enfermedad de Crohn, Fibrosis quística, Enfermedad de Alzheimer, Epilepsias, Trasplante de órganos mayores, Obesidad.

En caso de falsedades y reticencias de mala fe por parte del Tomador, del Asegurado o del Beneficiario en la reclamación del siniestro, serán causa de nulidad absoluta del contrato y exonerarán del pago de la indemnización al Asegurador. Asimismo, cualquier patología conocida debe ser notificada a la aseguradora a través del formulario trámites de solicitudes de productos vitales que se encuentra en nuestra página web.`;

export type PaymentFrequency = 'yearly' | 'biannual' | 'quarterly' | 'monthly';

export const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  yearly: 'Anual',
  biannual: 'Semestral',
  quarterly: 'Trimestral',
  monthly: 'Mensual',
};

export const FREQUENCY_DIVISORS: Record<PaymentFrequency, number> = {
  yearly: 1,
  biannual: 2,
  quarterly: 4,
  monthly: 12,
};

export const FREQUENCY_API_MAP: Record<PaymentFrequency, string> = {
  yearly: 'yearly',
  biannual: 'biannual',
  quarterly: 'quarterly',
  monthly: 'monthly',
};

export interface SelectedPlan {
  product: MercantilProduct;
  plan: MercantilPlan;
  frequency: PaymentFrequency;
}

export const PHONE_CODES = ['0412', '0422', '0414', '0424', '0426'] as const;
export type PhoneCode = (typeof PHONE_CODES)[number];

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

/**
 * Calcula la edad en años basándose en una fecha de nacimiento.
 * @param {string} birthDate - Fecha de nacimiento (YYYY-MM-DD).
 * @returns {number} Edad calculada.
 */
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

/**
 * Verifica si un plan es elegible según edad y género del asegurado.
 * @param {MercantilPlan} plan - Plan a verificar.
 * @param {number} age - Edad del asegurado.
 * @param {MercantilGender} gender - Género del asegurado.
 * @returns {boolean} True si es elegible.
 */
export function isPlanEligible(plan: MercantilPlan, age: number, gender: MercantilGender): boolean {
  if (!plan.rates || plan.rates.length === 0) return true;
  return plan.rates.some((rate) => {
    const minAge = typeof rate.minAge === 'number' ? rate.minAge : 0;
    const maxAge = typeof rate.maxAge === 'number' ? rate.maxAge : 120;
    const genderMatches = !rate.genderId || rate.genderId === gender;
    return genderMatches && age >= minAge && age <= maxAge;
  });
}

/**
 * Formatea un monto numérico a formato de divisa USD.
 * @param {number} value - Monto.
 * @returns {string} Divisa formateada.
 */
export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function useMercantilConsulta(initialSlug: string | null = null) {
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [stepError, setStepError] = useState('');
  const waitingForLoginRef = useRef(false);

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  // Step 1: Datos del asegurado
  const [insured, setInsured] = useState<InsuredData>({
    firstName: '',
    lastName: '',
    docType: 'V',
    docNumber: '',
    email: '',
    phoneCode: '0412',
    phoneNumber: '',
    birthDate: '',
    genderId: 'M',
  });
  const [loading, setLoading] = useState(false);

  // Step 2: Planes
  const [categories, setCategories] = useState<MercantilCategoryResult[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<SelectedPlan[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [healthAccepted, setHealthAccepted] = useState(false);
  const [showHealthDisclosure, setShowHealthDisclosure] = useState(false);

  // Backend state
  const [clientId, setClientId] = useState<string | null>(null);
  const [needsCompletion, setNeedsCompletion] = useState<boolean | null>(null);
  const [shopcartId, setShopcartId] = useState<string | null>(null);
  const [salesChannelId, setSalesChannelId] = useState<string | null>(null);
  const [shopcartSummary, setShopcartSummary] = useState<ShopcartSummary | null>(null);
  const [emissionStatus, setEmissionStatus] = useState<'idle' | 'emitting' | 'polling' | 'completed' | 'error'>('idle');
  const [policyData, setPolicyData] = useState<{ policyId?: string; number?: string }[] | null>(null);

  // Step 3: Subir Cédula
  const [idFile, setIdFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const dniBucketRef = useRef<BucketUploadResult | null>(null);

  // Step 4: Completar datos (Geografía)
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryLocations, setCountryLocations] = useState<CountryLocations | null>(null);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedCountryOfBirthId, setSelectedCountryOfBirthId] = useState('');
  const [selectedAddressCountryId, setSelectedAddressCountryId] = useState('');
  const [selectedAdministrativeAreaId, setSelectedAdministrativeAreaId] = useState('');
  const [selectedSubAdministrativeAreaId, setSelectedSubAdministrativeAreaId] = useState('');
  const [selectedLocalityId, setSelectedLocalityId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [addressLine, setAddressLine] = useState('Gran Caracas');
  const [postalCode, setPostalCode] = useState('1080');
  const [civilStateId, setCivilStateId] = useState('');

  // Loading flags de transiciones
  const [step3Loading, setStep3Loading] = useState(false);
  const [step4Loading, setStep4Loading] = useState(false);
  const [step5Loading, setStep5Loading] = useState(false);

  const age = useMemo(() => (insured.birthDate ? calculateAge(insured.birthDate) : 0), [insured.birthDate]);
  const hasFuneraryPlan = useMemo(() => selectedPlans.some((p) => p.product.slug === 'funerary'), [selectedPlans]);

  const selectedSlug = useMemo<AllowedProductSlug | null>(() => {
    if (!initialSlug) return null;
    return ALLOWED_PRODUCT_SLUGS.includes(initialSlug as AllowedProductSlug)
      ? (initialSlug as AllowedProductSlug)
      : null;
  }, [initialSlug]);

  const hasInvalidSlug = useMemo(() => Boolean(initialSlug) && !selectedSlug, [initialSlug, selectedSlug]);

  const filteredCategories = useMemo(() => {
    if (!insured.birthDate) return categories;
    if (hasInvalidSlug) return [];
    return categories
      .map((cat) => ({
        ...cat,
        products: cat.products
          .filter((p) => (selectedSlug ? p.slug === selectedSlug : true))
          .map((p) => ({
            ...p,
            plans: (p.plans || []).filter((pl) => isPlanEligible(pl, age, insured.genderId)),
          }))
          .filter((p) => (p.plans || []).length > 0),
      }))
      .filter((cat) => cat.products.length > 0);
  }, [age, insured.birthDate, insured.genderId, categories, selectedSlug, hasInvalidSlug]);

  const totalEstimatedPrime = useMemo(() => {
    return selectedPlans.reduce((acc, item) => {
      const divisor = FREQUENCY_DIVISORS[item.frequency];
      return acc + (item.plan.totalPrime || 0) / divisor;
    }, 0);
  }, [selectedPlans]);

  // Cargar geografía en el paso 4
  useEffect(() => {
    if (step === 4 && countries.length === 0) {
      setLoadingCountries(true);
      mercantilService
        .getCountries()
        .then((data) => {
          setCountries(data);
          setSelectedAddressCountryId('29'); // Venezuela por defecto
        })
        .catch((err) => console.error('Error loading countries:', err))
        .finally(() => setLoadingCountries(false));
    }
  }, [step, countries.length]);

  // Cargar regiones al seleccionar país
  useEffect(() => {
    if (selectedAddressCountryId) {
      setLoadingLocations(true);
      setCountryLocations(null);
      mercantilService
        .getCountryLocations(selectedAddressCountryId)
        .then((data) => {
          setCountryLocations(data);
          // Autoseleccionar Distrito Capital -> Baruta -> Caracas -> No identificada si existen
          if (data.administrativeAreas) {
            const capital = data.administrativeAreas.find((a) =>
              a.name.toUpperCase().includes('DISTRITO CAPITAL')
            );
            if (capital) {
              setSelectedAdministrativeAreaId(capital.id);
              const baruta = capital.subAdministrativeAreas?.find((sa) =>
                sa.name.toUpperCase().includes('BARUTA')
              );
              if (baruta) {
                setSelectedSubAdministrativeAreaId(baruta.id);
                const noId = baruta.zones?.find((z) =>
                  z.name.toUpperCase().includes('NO IDENTIFICADA')
                );
                if (noId) setSelectedZoneId(noId.id);
              }
              const caracas = capital.localities?.find((l) =>
                l.name.toUpperCase().includes('CARACAS')
              );
              if (caracas) setSelectedLocalityId(caracas.id);
            }
          }
        })
        .catch((err) => console.error('Error al cargar geografía:', err))
        .finally(() => setLoadingLocations(false));
    }
  }, [selectedAddressCountryId]);

  // --- Paso 1: Búsqueda de planes ---
  const handleSearchPlans = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!insured.birthDate) {
      setErrorMessage('Debes seleccionar tu fecha de nacimiento.');
      return;
    }
    if (!insured.firstName || !insured.lastName || !insured.docNumber || !insured.phoneNumber) {
      setErrorMessage('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      try {
        const check = await mercantilService.checkClientExists({
          birthDate: insured.birthDate,
          dniType: 'VEN',
          dniNumber: insured.docNumber,
          dniVenNationality: 'V',
        });
        if (check.exists && check.clientId) {
          setClientId(check.clientId);
          setNeedsCompletion(check.needsCompletion ?? true);
        } else {
          setClientId(null);
          setNeedsCompletion(true);
        }
      } catch {
        // Ignorar fallos de verificación de cliente existente y continuar
        setClientId(null);
        setNeedsCompletion(true);
      }

      const res = await mercantilService.getTentativeClientPlans({
        birthDate: insured.birthDate,
        genderId: insured.genderId,
      });
      setCategories(res);
      setSelectedPlans([]);
      setTermsAccepted(false);
      setHealthAccepted(false);
      setStep(2);
    } catch {
      setErrorMessage('El servicio de Mercantil no está disponible en este momento. Inténtelo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // --- Paso 2: Selección de planes ---
  const togglePlan = (product: MercantilProduct, plan: MercantilPlan) => {
    setSelectedPlans((prev) => {
      const exists = prev.find((p) => p.product.id === product.id);
      if (exists?.plan.id === plan.id) {
        return prev.filter((p) => p.product.id !== product.id);
      }
      return [
        ...prev.filter((p) => p.product.id !== product.id),
        { product, plan, frequency: 'yearly' as PaymentFrequency },
      ];
    });
  };

  const updateFrequency = (productId: string, planId: string, frequency: PaymentFrequency) => {
    setSelectedPlans((prev) =>
      prev.map((p) => (p.product.id === productId && p.plan.id === planId ? { ...p, frequency } : p))
    );
  };

  // --- Emisión de Póliza ---
  const handleEmitPolicy = useCallback(async (customCartId?: string) => {
    const targetCartId = customCartId || shopcartId;
    if (!targetCartId || emissionStatus === 'emitting' || emissionStatus === 'polling') return;
    setEmissionStatus('emitting');
    setStepError('');
    setPolicyData(null);
    try {
      const selFrequency = selectedPlans.length > 0 ? selectedPlans[0].frequency : 'yearly';
      await mercantilService.emitShopcart(targetCartId, {
        paymentFrequency: FREQUENCY_API_MAP[selFrequency],
        sendEmailConfirmation: true,
        isHolderThePayee: true,
        holderAcceptedTermsAndConditions: true,
        isHolderNotPoliticallyExposed: true,
        holderEnjoysGoodHealth: true,
        holderAcceptsToLoadDniDocumentLater: false,
      });
      setEmissionStatus('polling');

      // Polling: 10 intentos cada 12 segundos (total 120 segundos)
      const maxAttempts = 10;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 12000));
        const status = await mercantilService.getEmissionStatus(targetCartId);
        if (status.status === 'emitted') {
          const summary = await mercantilService.getShopcartSummary(targetCartId);
          setShopcartSummary(summary);
          setPolicyData(summary.policies?.map((p) => ({ policyId: p.id, number: p.number })) || null);

          // Construir payload de finalización
          const persistencePayload = {
            client: {
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
                areaCode: insured.phoneCode,
                number: insured.phoneNumber,
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
            },
            ...(dniBucketRef.current?.path
              ? {
                  dniDocument: {
                    path: dniBucketRef.current.path,
                    originalName: dniBucketRef.current.originalName,
                    contentType: dniBucketRef.current.contentType,
                  },
                }
              : {}),
          };

          await mercantilService.finalizePersistence(targetCartId, persistencePayload);
          setEmissionStatus('completed');
          setStep(5); // La confirmación exitosa es ahora el Paso 5
          return;
        }
        if (status.status === 'error' || status.status === 'failed') {
          throw new Error('La emisión de la póliza fue rechazada por la aseguradora.');
        }
      }
      setEmissionStatus('error');
      setStepError('Tiempo de espera agotado al emitir la póliza. Por favor consulte más tarde.');
    } catch (err) {
      setEmissionStatus('error');
      setStepError(err instanceof Error ? err.message : 'Error en la suscripción y emisión de la póliza.');
    }
  }, [
    shopcartId,
    emissionStatus,
    selectedPlans,
    clientId,
    insured,
    selectedCountryOfBirthId,
    civilStateId,
    selectedAdministrativeAreaId,
    selectedSubAdministrativeAreaId,
    selectedLocalityId,
    selectedZoneId,
    postalCode,
    addressLine,
  ]);

  // Transición 2 -> 3 (Crear cliente/shopcart, subir productos) o directo a Emisión (modal)
  const handleContinueToStep3 = async () => {
    setStepError('');

    // Validar si existe sesión
    const session = authService.getSession();
    if (!session) {
      waitingForLoginRef.current = true;
      if (typeof window !== 'undefined') {
        window.parent.postMessage(
          { source: 'mercantil-consulta-auth-required', type: 'login-required' },
          window.location.origin
        );
      }
      return;
    }

    setStep3Loading(true);
    try {
      let currClientId = clientId;
      if (!currClientId) {
        const fullPhone = `${insured.phoneCode}${insured.phoneNumber}`;
        const newClient = await mercantilService.createClient({
          firstName: insured.firstName,
          lastName: insured.lastName,
          email: insured.email,
          birthDate: insured.birthDate,
          genderId: insured.genderId,
          dniType: 'VEN',
          dniNumber: insured.docNumber,
          dniVenNationality: 'V',
          phone: {
            countryId: '29',
            areaCode: fullPhone.slice(0, 3),
            number: fullPhone.slice(3),
          },
          address: { countryId: '29' },
        });
        currClientId = (newClient.id ?? newClient.clientId) as string;
        setClientId(currClientId);
      }

      let channelId = salesChannelId;
      if (!channelId) {
        const channels = await mercantilService.getSalesChannels();
        if (channels && channels.length > 0) {
          channelId = (channels[0].id ?? channels[0].code) as string;
          setSalesChannelId(channelId);
        }
      }

      const cart = await mercantilService.createShopcart({
        clientId: currClientId,
        salesChannelId: channelId,
      });
      const newCartId = (cart.id ?? cart.shopcartId) as string;
      setShopcartId(newCartId);

      const items = selectedPlans.map((p) => ({
        productId: p.product.id,
        planId: p.plan.id,
        paymentFrequency: p.frequency,
      }));
      await mercantilService.bulkLoadProducts(newCartId, items);

      if (needsCompletion === false) {
        // Disparar emisión de póliza directamente
        await handleEmitPolicy(newCartId);
      } else {
        setStep(3); // Carga de DNI
      }
    } catch {
      setStepError('Ocurrió un error al registrar sus planes. Intente de nuevo.');
    } finally {
      setStep3Loading(false);
    }
  };

  // --- Paso 3: Subida de Cédula/DNI ---
  const handleContinueToStep4 = async () => {
    if (!idFile || !shopcartId) return;
    setStepError('');
    setStep4Loading(true);
    try {
      const bucketResult = await mercantilService.uploadDniToBucket(
        idFile,
        `${insured.docType}${insured.docNumber}-${shopcartId}`
      );
      dniBucketRef.current = bucketResult;
      await mercantilService.uploadDni(shopcartId, idFile);
      setStep(4); // Completar Datos de Dirección
    } catch {
      setStepError('Error al cargar el documento de identidad. Intente de nuevo.');
    } finally {
      setStep4Loading(false);
    }
  };

  // --- Paso 4: Completar datos personales (Dirección) ---
  const handleCompleteClient = async () => {
    if (!clientId) {
      setStepError('ID de cliente no disponible.');
      return;
    }
    if (!selectedCountryOfBirthId || !civilStateId) {
      setStepError('Completa todos los campos obligatorios.');
      return;
    }

    setStep5Loading(true);
    setStepError('');
    try {
      const fullPhone = `${insured.phoneCode}${insured.phoneNumber}`;
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
        civilStateId: civilStateId,
        phone: {
          countryId: '29',
          areaCode: fullPhone.slice(0, 3),
          number: fullPhone.slice(3),
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

      // Disparar emisión de póliza de inmediato
      await handleEmitPolicy(shopcartId || undefined);
    } catch {
      setStepError('No se pudo actualizar los datos geográficos del cliente.');
    } finally {
      setStep5Loading(false);
    }
  };

  // Reanudar flujo de consulta tras el inicio de sesión exitoso en la modal
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.source === 'marketplace-auth' && event.data?.type === 'login-success') {
        if (waitingForLoginRef.current) {
          waitingForLoginRef.current = false;
          void handleContinueToStep3();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleContinueToStep3]);

  return {
    step,
    setStep,
    errorMessage,
    setErrorMessage,
    stepError,
    setStepError,
    insured,
    setInsured,
    loading,
    categories,
    selectedPlans,
    setSelectedPlans,
    termsAccepted,
    setTermsAccepted,
    healthAccepted,
    setHealthAccepted,
    showHealthDisclosure,
    setShowHealthDisclosure,
    clientId,
    needsCompletion,
    shopcartId,
    shopcartSummary,
    emissionStatus,
    policyData,
    idFile,
    setIdFile,
    dragActive,
    setDragActive,
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
    setAddressLine,
    postalCode,
    setPostalCode,
    step3Loading,
    step4Loading,
    step5Loading,
    age,
    hasFuneraryPlan,
    filteredCategories,
    totalEstimatedPrime,
    handleSearchPlans,
    togglePlan,
    updateFrequency,
    handleContinueToStep3,
    handleContinueToStep4,
    handleCompleteClient,
    handleEmitPolicy,
    handleBack,
  };
}
