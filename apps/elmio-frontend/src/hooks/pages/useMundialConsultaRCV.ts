/**
 * @fileoverview Hook de estado para el wizard de 7 pasos de La Mundial de Seguros RCV.
 * @description Maneja cascadas de vehículo (INMA), cotizaciones y emite síncronamente.
 * @module hooks/pages/useMundialConsultaRCV
 */

'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { mundialService } from '@/src/services/mundial.service'
import { authService } from '@/src/services/auth.service'

export interface InsuredData {
  firstName: string
  lastName: string
  docType: string
  docNumber: string
  email: string
  phoneCode: string
  phoneNumber: string
  birthDate: string
  genderId: string
}

export interface VehicleSelectOption {
  label: string
  value: string
}

export interface MundialPlan {
  id: string
  title: string
  assuredSum: number
  totalPrime: number
  description: string
}

export function useMundialConsultaRCV() {
  const [step, setStep] = useState(1)
  const TOTAL_STEPS = 7
  const waitingForLoginRef = useRef(false)

  // Paso 1: Asegurado
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
  })

  // Paso 2: Vehículo (Cascada INMA)
  const [year, setYear] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [version, setVersion] = useState('')

  const [years, setYears] = useState<string[]>([])
  const [brands, setBrands] = useState<VehicleSelectOption[]>([])
  const [models, setModels] = useState<VehicleSelectOption[]>([])
  const [versions, setVersions] = useState<VehicleSelectOption[]>([])
  const [useCategories, setUseCategories] = useState<Array<{ value: string; label: string }>>([])
  const [selectedUseCategory, setSelectedUseCategory] = useState('1') // Por defecto 1 (Particular)

  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadingVersions, setLoadingVersions] = useState(false)

  // Paso 3: Selección de Planes y Cotización
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [plans, setPlans] = useState<MundialPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState('RCVBAS')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Paso 4: Documentos
  const [idFile, setIdFile] = useState<File | null>(null)
  const [vehiclePropertyFile, setVehiclePropertyFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [dragActiveProperty, setDragActiveProperty] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const propertyFileInputRef = useRef<HTMLInputElement | null>(null)
  const dniBucketRef = useRef<any>(null)
  const vehiclePropertyBucketRef = useRef<any>(null)
  const [loadingDocuments, setLoadingDocuments] = useState(false)

  // Paso 5: Completar Vehículo
  const [vehicleColors, setVehicleColors] = useState<VehicleSelectOption[]>([])
  const [vehicleColorId, setVehicleColorId] = useState('BLANCO')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [vehicleChassisSerial, setVehicleChassisSerial] = useState('')
  const [vehicleEngineSerial, setVehicleEngineSerial] = useState('')
  const [loadingVehicleColors, setLoadingVehicleColors] = useState(false)

  // Paso 6: Completar Datos del Cliente
  const [states, setStates] = useState<Array<{ value: string; label: string }>>([])
  const [cities, setCities] = useState<Array<{ value: string; label: string }>>([])
  const [civilStates, setCivilStates] = useState<Array<{ value: string; label: string }>>([])
  const [genders, setGenders] = useState<Array<{ value: string; label: string }>>([])

  const [selectedStateId, setSelectedStateId] = useState('')
  const [selectedCityId, setSelectedCityId] = useState('')
  const [civilStateId, setCivilStateId] = useState('S')
  const [addressLine, setAddressLine] = useState('')
  const [postalCode, setPostalCode] = useState('')

  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [completeLoading, setCompleteLoading] = useState(false)

  // Globales
  const [stepError, setStepError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [emissionStatus, setEmissionStatus] = useState<'idle' | 'emitting' | 'completed' | 'error'>(
    'idle',
  )
  const [policyData, setPolicyData] = useState<
    Array<{ policyId: string; number: string; pdfUrl?: string }>
  >([])
  const [shopcartId] = useState(() => `mundial-${Math.random().toString(36).slice(2, 11)}`)

  // Inicializar Años
  useEffect(() => {
    const currentYear = new Date().getFullYear()
    setYears(Array.from({ length: 30 }, (_, i) => String(currentYear - i)))
  }, [])

  // Paso 1: Submit Asegurado
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!insured.firstName || !insured.lastName || !insured.docNumber || !insured.birthDate) {
      setErrorMessage('Completa todos los campos requeridos.')
      return
    }
    setErrorMessage('')
    setStep(2)
  }

  // Paso 2: Cascada selects de vehículo
  const handleYearChange = async (newYear: string) => {
    setYear(newYear)
    setBrand('')
    setModel('')
    setVersion('')
    setBrands([])
    setModels([])
    setVersions([])
    if (!newYear) return

    setLoadingBrands(true)
    setErrorMessage('')
    try {
      const data = await mundialService.getBrands(Number(newYear))
      setBrands(data.map((b) => ({ label: b.xmarca, value: b.cmarca })))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error consultando marcas')
    } finally {
      setLoadingBrands(false)
    }
  }

  const handleBrandChange = async (newBrand: string) => {
    setBrand(newBrand)
    setModel('')
    setVersion('')
    setModels([])
    setVersions([])
    if (!newBrand) return

    setLoadingModels(true)
    setErrorMessage('')
    try {
      const data = await mundialService.getModels(Number(year), newBrand)
      setModels(data.map((m) => ({ label: m.xmodelo, value: m.cmodelo })))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error consultando modelos')
    } finally {
      setLoadingModels(false)
    }
  }

  const handleModelChange = async (newModel: string) => {
    setModel(newModel)
    setVersion('')
    setVersions([])
    if (!newModel) return

    setLoadingVersions(true)
    setErrorMessage('')
    try {
      const data = await mundialService.getVersions(Number(year), brand, newModel)
      setVersions(data.map((v) => ({ label: v.xversion, value: v.cversion })))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error consultando versiones')
    } finally {
      setLoadingVersions(false)
    }
  }

  const handleVersionChange = async (newVersion: string) => {
    setVersion(newVersion)
    if (!newVersion) return
    try {
      const cat = await mundialService.getCategoriasUso(Number(year), brand, model, newVersion)
      setUseCategories(
        cat.map((c) => ({ label: c.xcategoria_uso, value: String(c.ccategoria_uso) })),
      )
      if (cat.length > 0) {
        setSelectedUseCategory(String(cat[0].ccategoria_uso))
      }
    } catch {
      setUseCategories([{ label: 'PARTICULAR', value: '1' }])
      setSelectedUseCategory('1')
    }
  }

  const isVehicleFormValid = year !== '' && brand !== '' && model !== '' && version !== ''

  // Paso 2 Submit -> Obtener cotización dinámica del plan
  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isVehicleFormValid) return

    setLoadingPlans(true)
    setErrorMessage('')
    try {
      const quote = await mundialService.getCotizacionAuto({
        fano: Number(year),
        cmarca: brand,
        cmodelo: model,
        cversion: version,
        cplan: 'RCVBAS',
        ccategoria_uso: Number(selectedUseCategory),
      })

      // Emulamos el plan disponible RCV
      setPlans([
        {
          id: 'RCVBAS',
          title: 'Plan RCV Básico La Mundial',
          assuredSum: 2000,
          totalPrime: quote.mprimaext, // Prima devuelta por el API en USD
          description: 'Cubre Responsabilidad Civil de daños a personas y daños a cosas.',
        },
      ])
      setSelectedPlanId('RCVBAS')
      setStep(3)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cotizar plan')
    } finally {
      setLoadingPlans(false)
    }
  }

  // Paso 3 Submit -> Validar Sesión e ir a Documentos
  const handleContinueToStep4 = async () => {
    setStepError('')

    // Validar si existe sesión (como en Mercantil)
    const session = authService.getSession()
    if (!session) {
      waitingForLoginRef.current = true
      if (typeof window !== 'undefined') {
        window.parent.postMessage(
          { source: 'mercantil-consulta-auth-required', type: 'login-required' },
          window.location.origin,
        )
      }
      return
    }

    setStep(4)
  }

  // Paso 4 Documentos Handlers
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) setIdFile(file)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setIdFile(file)
  }, [])

  const handlePropertyFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActiveProperty(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf'))
      setVehiclePropertyFile(file)
  }, [])

  const handlePropertyFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setVehiclePropertyFile(file)
  }, [])

  const handleContinueToStep5 = async () => {
    if (!vehiclePropertyFile || !idFile) {
      setStepError('Cargue todos los documentos obligatorios.')
      return
    }
    setStepError('')
    setLoadingDocuments(true)
    try {
      dniBucketRef.current = await mundialService.uploadDniToBucket(
        idFile,
        `${insured.docType}${insured.docNumber}-${shopcartId}`,
      )
      vehiclePropertyBucketRef.current = await mundialService.uploadVehiclePropertyToBucket(
        vehiclePropertyFile,
        `property-${insured.docType}${insured.docNumber}-${shopcartId}`,
      )
      setStep(5)
    } catch (error) {
      setStepError(error instanceof Error ? error.message : 'Error subiendo los documentos')
    } finally {
      setLoadingDocuments(false)
    }
  }

  // Paso 5: Completar Vehículo
  const isVehicleCompletionValid =
    vehicleColorId !== '' &&
    vehiclePlate.length >= 6 &&
    vehiclePlate.length <= 7 &&
    vehicleChassisSerial.length === 17 &&
    vehicleEngineSerial.length === 18

  const handleCompleteVehicleStep = async () => {
    if (!isVehicleCompletionValid) {
      setStepError('Complete todos los campos obligatorios del vehículo.')
      return
    }
    setStepError('')

    // Pre-cargar catálogos del Paso 6 (Estados, etc.)
    setLoadingStates(true)
    try {
      const statesList = await mundialService.getStates()
      setStates(statesList.map((s) => ({ label: s.xestado, value: String(s.cestado) })))

      const civList = await mundialService.getValrepList('EDOCIVIL')
      setCivilStates(civList.map((c) => ({ label: c.xestado_civil || '', value: c.iestado_civil || '' })))

      const sexList = await mundialService.getValrepList('SEXO')
      setGenders(sexList.map((g) => ({ label: g.xsexo || '', value: g.isexo || '' })))
    } catch {
      // Usar fallbacks estáticos en caso de error
      setStates([{ label: 'DISTRITO CAPITAL', value: '1' }])
      setCivilStates([
        { label: 'Soltero', value: 'S' },
        { label: 'Casado', value: 'C' },
      ])
      setGenders([
        { label: 'Masculino', value: 'M' },
        { label: 'Femenino', value: 'F' },
      ])
    } finally {
      setLoadingStates(false)
    }

    setStep(6)
  }

  // Cargar colores del vehículo en paso 5
  useEffect(() => {
    if (step === 5 && vehicleColors.length === 0) {
      setLoadingVehicleColors(true)
      mundialService.getVehicleColors()
        .then((colors) => {
          setVehicleColors(colors.map((c) => ({ label: c.name, value: c.id })))
          if (colors.length > 0 && !vehicleColorId) {
            setVehicleColorId(colors[0].id)
          }
        })
        .catch((err) => console.error('Error cargando colores:', err))
        .finally(() => setLoadingVehicleColors(false))
    }
  }, [step, vehicleColors.length, vehicleColorId])

  // Carga de Ciudades en Cascada del Paso 6
  const handleStateChange = async (newStateId: string) => {
    setSelectedStateId(newStateId)
    setSelectedCityId('')
    setCities([])
    if (!newStateId) return

    setLoadingCities(true)
    try {
      const citiesList = await mundialService.getCities(Number(newStateId))
      setCities(citiesList.map((c) => ({ label: c.xciudad, value: String(c.cciudad) })))
    } catch {
      setCities([])
    } finally {
      setLoadingCities(false)
    }
  }

  // Paso 6: Validar y Pre-Emitir
  const handleContinueToStep6 = async () => {
    if (!selectedStateId || !selectedCityId || !addressLine) {
      setStepError('Complete todos los campos obligatorios.')
      return
    }
    setStepError('')
    setCompleteLoading(true)

    try {
      // 1. Llamar a validación pre-emisión del API de La Mundial
      await mundialService.validateEmissionAuto({
        plan: selectedPlanId,
        placa: vehiclePlate,
        serial_carroceria: vehicleChassisSerial,
        serial_motor: vehicleEngineSerial,
      })

      // 2. Si es válido, ejecutar la emisión final
      await handleEmitPolicy()
    } catch (error) {
      setStepError(
        error instanceof Error ? error.message : 'Error en la validación previa de emisión',
      )
    } finally {
      setCompleteLoading(false)
    }
  }

  // Paso 7: Emisión final
  const handleEmitPolicy = async () => {
    setEmissionStatus('emitting')
    setStepError('')
    try {
      const phoneDigits = `${insured.phoneCode}${insured.phoneNumber}`

      const payload = {
        cramo: 18, // Ramo RCV Automóvil por defecto
        plan: selectedPlanId,
        ifrecuencia: 'A',
        icedula_tomador: insured.docType,
        xrif_tomador: Number(insured.docNumber),
        xnombre_tomador: insured.firstName,
        xapellido_tomador: insured.lastName,
        xtelefono_tomador: phoneDigits,
        xcorreo_tomador: insured.email,
        isexo_tomador: insured.genderId,
        iestado_civil_tomador: civilStateId,
        fnac_tomador: new Date(insured.birthDate).toISOString(),
        cestado_tomador: Number(selectedStateId),
        cciudad_tomador: Number(selectedCityId),
        xdireccion_tomador: addressLine,
        icedula_titular: insured.docType,
        xrif_titular: Number(insured.docNumber),
        xnombre_titular: insured.firstName,
        xapellido_titular: insured.lastName,
        xtelefono_titular: phoneDigits,
        xcorreo_titular: insured.email,
        fnac_titular: new Date(insured.birthDate).toISOString(),
        cestado_titular: Number(selectedStateId),
        cciudad_titular: Number(selectedCityId),
        xdireccion_titular: addressLine,
        cmarca: brand,
        cmodelo: model,
        cversion: version,
        fano: Number(year),
        xcolor: vehicleColorId,
        xplaca: vehiclePlate,
        xsercar: vehicleChassisSerial,
        xsermot: vehicleEngineSerial,
        ccategoria_uso: Number(selectedUseCategory),
        iplaca: 'N',
        fecha_emision: new Date().toISOString(),
        fdesde: new Date().toISOString(),
        fhasta: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        cusuario: Number(insured.docNumber),
      }

      const res = await mundialService.createEmissionAuto(shopcartId, payload)

      if (res?.status && res?.data?.cpoliza) {
        const findName = (options: VehicleSelectOption[], value: string) => {
          return options.find((o) => o.value === value)?.label || undefined
        }

        const brandName = findName(brands, brand)
        const modelName = findName(models, model)
        const versionName = findName(versions, version)
        const colorName = findName(vehicleColors, vehicleColorId)

        // Persistencia final local en base de datos
        await mundialService.finalizePersistence(shopcartId, {
          client: {
            firstName: insured.firstName,
            lastName: insured.lastName,
            email: insured.email,
            dniType: insured.docType,
            dniNumber: insured.docNumber,
            dniVenNationality: insured.docType,
            birthDate: insured.birthDate,
            genderId: insured.genderId,
            civilStateId,
            phone: { countryId: '29', areaCode: phoneDigits.slice(0, 3), number: phoneDigits.slice(3) },
            address: {
              countryId: '29',
              administrativeAreaId: selectedStateId,
              localityId: selectedCityId,
              address1: addressLine,
              postalCode,
            },
          },
          vehicle: {
            year,
            brandCode: brand,
            brandName,
            modelCode: model,
            modelName,
            versionCode: version,
            versionName,
            vehicleTypeId: '1',
            isArmored: false,
            plate: vehiclePlate,
            colorId: vehicleColorId,
            colorName,
            chassisSerial: vehicleChassisSerial,
            engineSerial: vehicleEngineSerial,
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
          ...(vehiclePropertyBucketRef.current?.path
            ? {
                vehiclePropertyDocument: {
                  path: vehiclePropertyBucketRef.current.path,
                  originalName: vehiclePropertyBucketRef.current.originalName,
                  contentType: vehiclePropertyBucketRef.current.contentType,
                },
              }
            : {}),
        })

        const pdfUrl = res.data.xrutapdf || res.data.rutapdf || res.data.pdf || res.data.pdfUrl || ''

        setPolicyData([{ policyId: res.data.cpoliza, number: res.data.cpoliza, pdfUrl }])
        setEmissionStatus('completed')
        setStep(7)
      } else {
        throw new Error(res?.data?.mensaje || 'Error desconocido al emitir la póliza.')
      }
    } catch (error) {
      setEmissionStatus('error')
      setStepError(error instanceof Error ? error.message : 'Error emitiendo póliza')
    }
  }

  const handleDownloadPdf = async (pdfUrl: string) => {
    if (!pdfUrl) return
    if (typeof window !== 'undefined') {
      window.open(pdfUrl, '_blank')
    }
  }

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1))
    setStepError('')
  }

  // Reanudar tras el inicio de sesión exitoso en la modal
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.source === 'marketplace-auth' && event.data?.type === 'login-success') {
        if (waitingForLoginRef.current) {
          waitingForLoginRef.current = false
          void handleContinueToStep4()
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [handleContinueToStep4])

  return {
    step,
    TOTAL_STEPS,
    setStep,
    // Step 1
    insured,
    setInsured,
    handleClientSubmit,
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
    years,
    brands,
    models,
    versions,
    loadingBrands,
    loadingModels,
    loadingVersions,
    handleYearChange,
    handleBrandChange,
    handleModelChange,
    handleVersionChange,
    isVehicleFormValid,
    handleVehicleSubmit,
    selectedUseCategory,
    // Step 3
    plans,
    selectedPlanId,
    setSelectedPlanId,
    termsAccepted,
    setTermsAccepted,
    handleContinueToStep4,
    loadingPlans,
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
    // Step 6
    states,
    cities,
    civilStates,
    genders,
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
    handleContinueToStep6,
    completeLoading,
    // Global
    emissionStatus,
    stepError,
    setStepError,
    handleBack,
    handleEmitPolicy,
    policyData,
    handleDownloadPdf,
    shopcartId,
  }
}
