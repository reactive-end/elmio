'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  Info,
  DollarSign,
  User,
  Sparkles,
  PartyPopper,
} from 'lucide-react'
import { authService } from '@/src/services/auth.service'
import { enterpriseService, type PersonProfile, type Enterprise } from '@/src/services/empresa.service'
import { productService, type Product, type FinancingScheme } from '@/src/services/product.service'
import { r4PaymentService } from '@/src/services/r4-payment.service'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { FormField } from '@/components/molecules/FormField/FormField'
import { LoginForm } from '@/components/organisms/LoginForm/LoginForm'
import { StepIndicator } from '@/components/molecules/StepIndicator/StepIndicator'
import CedulaInput from '@/components/molecules/CedulaInput/CedulaInput'
import { PhoneInput } from '@/components/molecules/PhoneInput/PhoneInput'
import { usePhoneFormat } from '@/src/utils/usePhoneFormat'
import type { CedulaValue, CedulaLetter } from '@/components/molecules/CedulaInput/CedulaInput.d'
import type { CountryCode, OperatorPrefix } from '@/components/molecules/PhoneInput/PhoneInput.d'

const VENEZUELAN_BANKS = [
  { code: '0102', label: 'Banco de Venezuela (0102)' },
  { code: '0104', label: 'Banco Venezolano de Crédito (0104)' },
  { code: '0105', label: 'Banco Mercantil (0105)' },
  { code: '0108', label: 'Banco Provincial (0108)' },
  { code: '0114', label: 'Bancaribe (0114)' },
  { code: '0115', label: 'Banco Exterior (0115)' },
  { code: '0128', label: 'Banco Caroní (0128)' },
  { code: '0134', label: 'Banesco (0134)' },
  { code: '0137', label: 'Banco Sofitasa (0137)' },
  { code: '0138', label: 'Banco Plaza (0138)' },
  { code: '0146', label: 'Bangente (0146)' },
  { code: '0151', label: 'Banco Fondo Común (0151)' },
  { code: '0156', label: '100% Banco (0156)' },
  { code: '0157', label: 'DelSur (0157)' },
  { code: '0163', label: 'Banco del Tesoro (0163)' },
  { code: '0166', label: 'Banco Agrícola de Venezuela (0166)' },
  { code: '0168', label: 'Bancrecer (0168)' },
  { code: '0169', label: 'Banco R4 (0169)' },
  { code: '0171', label: 'Banco Activo (0171)' },
  { code: '0172', label: 'Bancamiga (0172)' },
  { code: '0173', label: 'Banco Internacional de Desarrollo (0173)' },
  { code: '0174', label: 'Banplus (0174)' },
  { code: '0175', label: 'Banco Digital de los Trabajadores / Bicentenario (0175)' },
  { code: '0177', label: 'Banfanb (0177)' },
  { code: '0178', label: 'N58 Banco Digital (0178)' },
  { code: '0191', label: 'Banco Nacional de Crédito (0191)' },
]

const stepDefs = [
  { id: 1, title: 'Datos del Pagador', icon: User },
  { id: 2, title: 'Método y Pago', icon: CreditCard },
  { id: 3, title: 'Éxito', icon: CheckCircle2 },
]

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const productId = searchParams.get('product')
  const schemeId = searchParams.get('scheme')

  // Estados de sesión y autenticación
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [session, setSession] = useState<any>(null)

  // Estados de negocio
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedScheme, setSelectedScheme] = useState<FinancingScheme | null>(null)
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [profile, setProfile] = useState<PersonProfile | null>(null)

  // Estados de carga e interfaz por pasos
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<string>('')
  const [success, setSuccess] = useState(false)

  // Estados de la tasa BCV oficial
  const [exchangeRate, setExchangeRate] = useState(36.50)
  const [loadingRate, setLoadingRate] = useState(false)

  // Campos del formulario (Paso 1)
  const [cedulaValue, setCedulaValue] = useState<CedulaValue>({ letter: 'V', digits: '' })
  const phoneFormat = usePhoneFormat()
  const [phoneCountryCode, setPhoneCountryCode] = useState<CountryCode>({
    code: 'VE',
    dial: '+58',
    flag: '🇻🇪',
    name: 'Venezuela',
  })
  const [phoneOperatorPrefix, setPhoneOperatorPrefix] = useState<OperatorPrefix>('412')

  // Campos del formulario (Paso 2)
  const [selectedBank, setSelectedBank] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [authorizedDomiciliation, setAuthorizedDomiciliation] = useState(false)

  // Estados de OTP dinámico de R4
  const [otpValue, setOtpValue] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpFeedback, setOtpFeedback] = useState('')
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [paymentReference, setPaymentReference] = useState('')

  // Detectar y cargar sesión del usuario
  useEffect(() => {
    const currentSession = authService.getSession()
    if (currentSession) {
      setIsAuthenticated(true)
      setSession(currentSession)
    } else {
      setIsAuthenticated(false)
      setLoading(false)
    }
  }, [])

  // Cargar tasa de cambio oficial BCV desde Banco R4
  const loadExchangeRate = async () => {
    try {
      setLoadingRate(true)
      const todayStr = new Date().toISOString().split('T')[0]
      const res = await r4PaymentService.getExchangeRate({
        date: todayStr,
        currency: 'USD',
        companyAccountId: 'GLOBAL_R4_FALLBACK',
      })
      if (res && res.exchangeRate > 0) {
        setExchangeRate(res.exchangeRate)
      }
    } catch (err) {
      console.warn('Error consultando tasa BCV oficial en caliente, usando fallback.', err)
      // Mantenemos la tasa base de 36.50 como salvaguarda
      setExchangeRate(36.50)
    } finally {
      setLoadingRate(false)
    }
  }

  // Cargar información del producto y el perfil si está autenticado
  useEffect(() => {
    if (isAuthenticated === null || !isAuthenticated) return

    const loadCheckoutData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!productId) {
          throw new Error('Identificador de producto no suministrado en la URL.')
        }

        // Carga de tasa oficial paralela
        void loadExchangeRate()

        // Cargar producto
        const prod = await productService.getById(productId)
        setProduct(prod)

        // Resolver esquema
        let scheme = prod.financingSchemes?.find((s) => s.id === schemeId)
        if (!scheme && prod.financingSchemes && prod.financingSchemes.length > 0) {
          scheme = prod.financingSchemes[0]
        }
        setSelectedScheme(scheme || null)

        // Cargar perfil de persona para obtener el nombre del pagador pero NO pre-rellenar datos
        try {
          const prof = await enterpriseService.getMyProfile()
          setProfile(prof)
        } catch {
          // Ignorar si el usuario no tiene un perfil personal creado aún
        }

        // Cargar datos de empresa si el rol es empresa
        if (session?.role === 'COMPANY') {
          try {
            const ent = await enterpriseService.getMe()
            setEnterprise(ent)
          } catch {
            // Ignorar
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al inicializar el checkout.')
      } finally {
        setLoading(false)
      }
    }

    void loadCheckoutData()
  }, [isAuthenticated, productId, schemeId, session])

  // Formatear cuenta bancaria con números solamente y máximo de 20 dígitos
  const handleAccountNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 20)
    setAccountNumber(clean)
  }

  // Navegar al paso 2 con validación previa
  const handleGoToPaymentStep = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!cedulaValue.digits.trim()) {
      setError('Por favor ingresa tu número de cédula de identidad.')
      return
    }
    if (!phoneFormat.rawDigits.trim() || phoneFormat.rawDigits.length !== 7) {
      setError('Por favor ingresa un número de teléfono celular válido de 7 dígitos.')
      return
    }
    setError(null)
    setStep(2)
  }

  // Solicitar OTP dinámico real de C2P mediante R4
  const handleRequestOtp = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!cedulaValue.digits.trim() || !phoneFormat.rawDigits.trim()) {
      setError('Por favor completa primero los datos del Paso 1.')
      setStep(1)
      return
    }
    if (!selectedBank) {
      setError('Por favor selecciona tu banco de origen antes de solicitar la clave OTP.')
      return
    }

    setError(null)
    setIsRequestingOtp(true)
    setOtpFeedback('')

    const documentIdStr = `${cedulaValue.letter}${cedulaValue.digits}`
    const phoneStr = `0${phoneOperatorPrefix}${phoneFormat.rawDigits}`

    const isCash = selectedScheme?.paymentMode === 'cash'
    const initialPct = selectedScheme?.initialPayment ?? 0
    const initialAmountUsd = (originalPrice * initialPct) / 100
    const immediateAmountUsd = isCash ? originalPrice : initialAmountUsd

    // Monto exacto convertido a Bolívares para el OTP
    const immediateAmountBs = immediateAmountUsd * exchangeRate

    try {
      const res = await r4PaymentService.generateOtp({
        companyAccountId: 'GLOBAL_R4_FALLBACK',
        bankCode: selectedBank,
        amount: immediateAmountBs,
        phoneNumber: phoneStr,
        nationalId: documentIdStr,
      })

      if (res.success || res.code === '202') {
        setOtpSent(true)
        setOtpFeedback('¡Clave OTP/C2P solicitada! Tu banco te enviará un SMS con el código dinámico.')
      } else {
        throw new Error(res.message || 'El banco no autorizó el envío de OTP.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar OTP con Banco R4.')
    } finally {
      setIsRequestingOtp(false)
    }
  }

  // Confirmar la compra real y debitar con R4
  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !selectedScheme) return

    const documentIdStr = `${cedulaValue.letter}${cedulaValue.digits}`
    const phoneStr = `0${phoneOperatorPrefix}${phoneFormat.rawDigits}`

    // Validaciones del paso 2
    if (!selectedBank) {
      setError('Por favor selecciona tu banco de origen.')
      return
    }
    if (!accountNumber || accountNumber.length !== 20) {
      setError('El número de cuenta bancaria debe tener exactamente 20 dígitos.')
      return
    }

    const isCash = selectedScheme.paymentMode === 'cash'
    const hasInitial = selectedScheme.paymentMode === 'mixed' && selectedScheme.initialPayment > 0
    const needsImmediatePayment = isCash || hasInitial

    if (needsImmediatePayment && (!otpValue || otpValue.trim().length < 6)) {
      setError('Por favor ingresa la clave OTP / C2P que has recibido en tu celular.')
      return
    }

    const needsDomiciliation = selectedScheme.paymentMode === 'quota' || selectedScheme.paymentMode === 'mixed'
    if (needsDomiciliation && !authorizedDomiciliation) {
      setError('Debes autorizar expresamente la domiciliación de pagos periódicos para continuar.')
      return
    }

    setError(null)
    setIsProcessing(true)

    try {
      const initialAmountUsd = (originalPrice * initialPct) / 100
      const immediateAmountUsd = isCash ? originalPrice : initialAmountUsd

      // Monto en Bolívares calculado en el cliente bajo tasa BCV actual
      const immediateAmountBs = immediateAmountUsd * exchangeRate

      let referenceStr = 'REF-LOCAL'
      let transactionIdStr = `TRX-${Date.now()}`

      if (needsImmediatePayment) {
        setProcessingStep('Conectando de forma segura con Banco R4...')
        // 1. Debitar en caliente C2P mediante R4
        const immediateDebitRes = await r4PaymentService.immediateDebit({
          companyAccountId: 'GLOBAL_R4_FALLBACK',
          bankCode: selectedBank,
          amount: immediateAmountBs,
          phoneNumber: phoneStr,
          nationalId: documentIdStr,
          fullName: profile ? `${profile.name} ${profile.lastName}` : (enterprise?.companyName || 'Cliente ElMio'),
          otp: otpValue,
          concept: `Compra Marketplace R4: ${product.name} (Esquema: ${selectedScheme.name})`,
        })

        if (immediateDebitRes.code !== 'ACCP' && immediateDebitRes.code !== 'AC00') {
          throw new Error(immediateDebitRes.message || 'La operación de débito inmediato C2P fue rechazada por el banco.')
        }

        referenceStr = immediateDebitRes.reference || `REF-${Date.now().toString().slice(-6)}`
        transactionIdStr = immediateDebitRes.id || `TRX-${Date.now()}`
      }

      if (needsDomiciliation) {
        setProcessingStep('Registrando acuerdo de domiciliación de cuotas en R4...')
        // 2. Establecer acuerdo de domiciliación electrónica en R4
        const domiciliationRes = await r4PaymentService.directDebitAccount({
          companyAccountId: 'GLOBAL_R4_FALLBACK',
          documentId: documentIdStr,
          fullName: profile ? `${profile.name} ${profile.lastName}` : (enterprise?.companyName || 'Cliente ElMio'),
          accountNumber,
          amount: (quotaAmount * exchangeRate), // Monto en Bs. de cada cuota
          concept: `Cuota Domiciliada ElMio: ${product.name}`,
        })

        if (domiciliationRes.code !== '202') {
          throw new Error(domiciliationRes.message || 'No se pudo establecer el acuerdo de domiciliación en Banco R4.')
        }
      }

      setProcessingStep('Conciliando transacciones y finalizando compra...')
      // 3. Persistir datos bancarios en el perfil de ElMio
      await enterpriseService.updateMyProfile({
        documentId: documentIdStr,
        phone: phoneStr,
        debitCard: {
          bank: selectedBank,
          cardNumber: accountNumber,
          limit: null,
        },
      })

      // 4. Registrar la transacción en el backend de ElMio
      const isCompany = session?.role === 'COMPANY'
      const transactionConcept = `Compra Marketplace R4: ${product.name} (Esquema: ${selectedScheme.name}) - Ref: ${referenceStr}`

      if (isCompany && enterprise) {
        await enterpriseService.createTransaction(enterprise.id, {
          kind: 'charge',
          concept: transactionConcept,
          amount: originalPrice, // Monto base de compra
          status: 'paid',
        })
      } else {
        await enterpriseService.createMyTransaction({
          kind: 'charge',
          concept: transactionConcept,
          amount: originalPrice,
          status: 'paid',
        })
      }

      setPaymentReference(referenceStr)
      setSuccess(true)
      setStep(3) // Avanzar al Paso 3 de Éxito
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago con Banco R4.')
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(n)

  // Formatear a Bolívares usando la tasa BCV oficial
  const fmtBs = (n: number) =>
    new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(n * exchangeRate)

  const fmtVES = (n: number) =>
    new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(n)

  // Renderizar estado de no autenticado con LoginForm incorporado
  if (isAuthenticated === false) {
    return (
      <div className="flex min-h-[90vh] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <Lock className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-body">
              Acceso Seguro al Checkout
            </h2>
            <p className="mt-2 text-sm text-body-muted">
              Por favor inicia sesión con tu cuenta de ElMio para completar la compra de este producto de forma segura.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-black/5">
            <LoginForm onLoginSuccess={() => window.location.reload()} />
          </div>
        </div>
      </div>
    )
  }

  // Renderizar estados de carga generales
  if (loading || isAuthenticated === null) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-body-muted animate-pulse">
          Inicializando pasarela de facturación segura R4...
        </p>
      </div>
    )
  }

  // Pre-cálculos financieros
  const originalPrice = product?.priceLists[0]?.amount ?? 0
  const initialPct = selectedScheme?.initialPayment ?? 0
  const initialAmount = (originalPrice * initialPct) / 100
  const remainingAmount = originalPrice - initialAmount
  const quotaCount = selectedScheme?.maxQuotas ?? 1
  const quotaAmount = remainingAmount / quotaCount

  const isCash = selectedScheme?.paymentMode === 'cash'
  const needsImmediate = isCash || (selectedScheme?.paymentMode === 'mixed' && initialPct > 0)
  const immediateUsd = isCash ? originalPrice : initialAmount

  // Renderizar Paso 3: Éxito Genérico Premium (Estilo Mercantil)
  if (step === 3 && product && selectedScheme) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center bg-gray-50/50 p-6">
        <div className="w-full max-w-lg rounded-3xl border border-green-100 bg-white p-8 text-center shadow-2xl shadow-green-950/5 animate-in fade-in zoom-in-95 duration-350 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="p-4 bg-green-50 text-green-500 rounded-full shadow-md animate-bounce">
              <CheckCircle2 className="h-12 w-12" strokeWidth={1.5} />
            </div>
            <div className="absolute -top-2 -right-2 text-yellow-500 animate-pulse">
              <PartyPopper className="h-6 w-6" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-body">¡Felicidades!</h2>
            <p className="text-sm font-bold text-secondary mt-1">Suscripción y Pago Procesados</p>
            <p className="text-xs text-body-muted mt-2 leading-relaxed max-w-sm mx-auto">
              Tu transacción ha sido verificada, debitada y conciliada de conformidad. Los acuerdos financieros y cobros ya se encuentran activos de forma segura.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-gray-50 bg-gray-50/50 p-5 text-left space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block pl-0.5 border-b border-gray-150 pb-2">
              Resumen de Transacción (Banco R4)
            </span>
            <div className="flex justify-between text-xs text-body-muted">
              <span>Producto:</span>
              <span className="font-semibold text-body">{product.name}</span>
            </div>
            <div className="flex justify-between text-xs text-body-muted">
              <span>Esquema:</span>
              <span className="font-semibold text-body">{selectedScheme.name}</span>
            </div>
            <div className="flex justify-between text-xs text-body-muted">
              <span>Banco de Origen:</span>
              <span className="font-semibold text-body">
                {VENEZUELAN_BANKS.find((b) => b.code === selectedBank)?.label || selectedBank}
              </span>
            </div>
            <div className="flex justify-between text-xs text-body-muted">
              <span>Cuenta Debitada:</span>
              <span className="font-semibold text-body">**** **** **** {accountNumber.slice(-4)}</span>
            </div>
            <div className="flex justify-between text-xs text-body-muted">
              <span>Referencia Bancaria:</span>
              <span className="font-bold text-secondary">{paymentReference}</span>
            </div>
            <div className="flex justify-between text-xs text-body-muted">
              <span>Tasa de Cambio (BCV):</span>
              <span className="font-medium text-body">1 USD = {fmtVES(exchangeRate)} Bs.</span>
            </div>
            <hr className="border-gray-150" />
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-body">Monto Total USD:</span>
              <span className="font-extrabold text-body">{fmt(originalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-secondary">Monto Total VES:</span>
              <span className="font-black text-secondary text-base">{fmtBs(originalPrice)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.close()
              }
            }}
            className="py-3 font-bold gap-2"
          >
            Finalizar Proceso y Cerrar
          </Button>
        </div>
      </div>
    )
  }

  const completedSteps = Array.from({ length: step - 1 }, (_, i) => i + 1)

  return (
    <main className="min-h-screen bg-gray-50/50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (step === 2) {
                  setStep(1)
                } else {
                  router.back()
                }
              }}
              className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:bg-gray-50 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-body transition-transform group-hover:-translate-x-0.5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-body">Checkout Seguro de Pago</h1>
              <p className="text-xs text-body-muted">Pasarela gestionada mediante Banco R4 (0169)</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 border border-gray-200 shadow-sm text-xs font-semibold text-body-muted">
            <Lock className="h-3.5 w-3.5 text-secondary" />
            <span>Encriptación de Seguridad R4</span>
          </div>
        </header>

        {/* Indicador de Pasos del Asistente */}
        <div className="mb-8 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm shadow-black/2">
          <StepIndicator
            steps={stepDefs}
            currentStep={step}
            completedSteps={completedSteps}
            stepIcons={stepDefs.map((s) => s.icon)}
            onStepClick={() => {}}
          />
        </div>

        {error && <div className="mb-6"><Alert type="error" message={error} /></div>}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Columna Izquierda: Formulario Multi-Step */}
          <section className="lg:col-span-7">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-black/3">
              
              {/* PASO 1: Datos del Pagador */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-body">Paso 1: Identificación y Contacto</h2>
                      <p className="text-xs text-body-muted">Ingresa tus datos personales vinculados a tus cuentas bancarias</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <FormField label="Cédula de Identidad" required>
                      <CedulaInput
                        value={cedulaValue}
                        onChange={setCedulaValue}
                        allowedLetters={['V', 'E', 'G', 'J', 'P'] as any}
                      />
                    </FormField>

                    <FormField label="Teléfono Celular Asociado" required>
                      <PhoneInput
                        displayValue={phoneFormat.displayValue}
                        onChange={phoneFormat.handleChange}
                        countryCode={phoneCountryCode}
                        onCountryCodeChange={setPhoneCountryCode}
                        operatorPrefix={phoneOperatorPrefix}
                        onOperatorPrefixChange={setPhoneOperatorPrefix}
                      />
                    </FormField>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                    <Button
                      onClick={handleGoToPaymentStep}
                      className="px-6 py-2.5 font-bold gap-2"
                    >
                      Continuar al Pago <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* PASO 2: Método de Pago, Tasa BCV y OTP */}
              {step === 2 && (
                <form onSubmit={handleConfirmPurchase} className="space-y-5">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-body">Paso 2: Método y Autorización de Pago</h2>
                      <p className="text-xs text-body-muted">Establece tu banco, solicita tu OTP C2P y autoriza la domiciliación</p>
                    </div>
                  </div>

                  {/* Banner de Conversión Oficial BCV */}
                  <div className="rounded-2xl border border-secondary/15 bg-secondary/[0.02] p-4 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4.5 w-4.5 text-secondary shrink-0" />
                      <div className="text-[11px] text-body-muted">
                        <span className="font-bold text-body">Tasa Oficial de Cambio (BCV):</span>
                        <br />
                        Tasa obtenida en tiempo real mediante Banco R4
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {loadingRate ? (
                        <div className="flex items-center gap-1.5 text-secondary font-semibold">
                          <Spinner size="sm" />
                          <span>Obteniendo tasa...</span>
                        </div>
                      ) : (
                        <span className="text-sm font-extrabold text-secondary bg-white border border-secondary/10 px-3 py-1 rounded-xl shadow-sm">
                          1 USD = {fmtVES(exchangeRate)} Bs.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Banco de Origen" required>
                      <Select
                        value={selectedBank}
                        onChange={setSelectedBank}
                        options={[
                          { value: '', label: 'Selecciona tu banco...' },
                          ...VENEZUELAN_BANKS.map((b) => ({ value: b.code, label: b.label })),
                        ]}
                      />
                    </FormField>

                    <FormField label="Número de Cuenta (20 dígitos)" required>
                      <Input
                        placeholder="0102 0000 00 0000000000"
                        value={accountNumber}
                        onChange={(e) => handleAccountNumberChange(e.target.value)}
                      />
                    </FormField>
                  </div>

                  {/* Sección de Débito Inmediato (OTP) */}
                  {selectedScheme && needsImmediate && (
                    <div className="rounded-2xl border border-secondary/15 bg-secondary/[0.02] p-5 shadow-sm space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/10 text-secondary shrink-0">
                          <DollarSign className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-body">Débito Inmediato Requerido (C2P)</h3>
                          <p className="mt-0.5 text-xs text-body-muted leading-relaxed">
                            Para formalizar la adquisición, el banco de origen procesará un cobro interbancario inmediato por el monto de:
                          </p>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-xl font-black text-secondary">{fmtBs(immediateUsd)}</span>
                            <span className="text-xs text-body-muted">({fmt(immediateUsd)} USD)</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100/50 pt-4 flex flex-col sm:flex-row items-end gap-3">
                        <div className="flex-1 w-full">
                          <FormField label="Clave OTP / C2P de Autorización" required>
                            <div className="relative flex items-center">
                              <Input
                                placeholder={otpSent ? "Ingresa tu clave de 6 dígitos" : "Solicita tu OTP primero"}
                                value={otpValue}
                                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').substring(0, 8))}
                                disabled={!otpSent}
                                className="pr-20"
                              />
                              <span className="absolute right-3 text-[10px] font-bold text-body-muted">VES</span>
                            </div>
                          </FormField>
                        </div>
                        <div className="shrink-0 w-full sm:w-auto">
                          {isRequestingOtp ? (
                            <Button disabled className="w-full">
                              Solicitando...
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={handleRequestOtp}
                              variant={otpSent ? "ghost" : "primary"}
                              className="w-full"
                            >
                              {otpSent ? "Re-solicitar OTP" : "Solicitar OTP"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {otpFeedback && (
                        <p className="text-[11px] font-semibold text-green-600 animate-pulse bg-green-50 border border-green-100 rounded-xl px-3 py-1.5">
                          ✓ {otpFeedback}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Sección de Domiciliación de Cuotas */}
                  {selectedScheme && (selectedScheme.paymentMode === 'quota' || selectedScheme.paymentMode === 'mixed') && (
                    <div className="rounded-2xl border border-purple-100 bg-purple-50/20 p-5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shrink-0">
                          <ShieldCheck className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-body">Domiciliación de Cuotas Financieras</h3>
                          <p className="mt-0.5 text-xs text-body-muted">
                            Suscripción periódica recurrente a cuotas fijas:
                          </p>
                          <div className="mt-2 flex flex-wrap items-baseline gap-2 text-purple-800 font-extrabold text-base md:text-lg">
                            <span>{quotaCount} cuotas de {fmtBs(quotaAmount)}</span>
                            <span className="text-[11px] font-normal text-body-muted">
                              ({fmt(quotaAmount)} USD) / {selectedScheme.paymentPeriod === 'monthly' ? 'mes' : 'período'}
                            </span>
                          </div>

                          <label className="mt-4 flex items-start gap-2.5 cursor-pointer select-none group">
                            <input
                              type="checkbox"
                              className="mt-1 rounded border-gray-300 text-secondary focus:ring-secondary/20 h-4 w-4"
                              checked={authorizedDomiciliation}
                              onChange={(e) => setAuthorizedDomiciliation(e.target.checked)}
                            />
                            <span className="text-[11px] font-semibold text-body group-hover:text-secondary transition-colors leading-relaxed">
                              Autorizo expresamente a ElMio a domiciliar y debitar automáticamente de la cuenta de 20 dígitos suministrada las cuotas financieras periódicas calculadas.
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sección de Seguridad Bancaria */}
                  <div className="flex items-center gap-2 text-[11px] text-body-muted border-t border-gray-100 pt-4">
                    <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
                    <span>
                      Tus credenciales financieras y de contacto se encriptan bajo estrictos protocolos bancarios en R4. ElMio no almacena datos de claves privadas.
                    </span>
                  </div>

                  {/* Navegación y Procesamiento */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 mt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep(1)}
                      disabled={isProcessing}
                      className="px-6 py-2.5 font-bold gap-2 text-body-muted shrink-0 cursor-pointer"
                    >
                      Atrás
                    </Button>
                    
                    {isProcessing ? (
                      <div className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center flex items-center justify-center gap-3 shadow-inner">
                        <Spinner size="sm" />
                        <span className="text-xs font-bold text-secondary animate-pulse">
                          {processingStep || 'Procesando débito bancario R4...'}
                        </span>
                      </div>
                    ) : (
                      <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        className="py-2.5 font-bold shadow-lg shadow-secondary/10"
                      >
                        Confirmar y Pagar {fmtBs(immediateUsd)}
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* Columna Derecha: Resumen del Producto (Visualización Dual USD/VES) */}
          <section className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-black/3">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-body-muted mb-4">
                Resumen de Compra
              </h2>

              {product && selectedScheme && (
                <div className="space-y-4">
                  {/* Detalles del Producto */}
                  <div className="flex items-start gap-4">
                    {product.images && product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                         src={product.images[0]}
                         alt={product.name}
                         className="h-16 w-16 rounded-2xl object-cover border border-gray-100"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-150 text-gray-400">
                        <Building2 strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="flex-1">
                      <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-secondary">
                        {product.type}
                      </span>
                      <h3 className="font-bold text-body text-base mt-1 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-body-muted line-clamp-2 mt-0.5">
                        {product.description || 'Sin descripción.'}
                      </p>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Resumen del Plan */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-body-muted">
                      Modalidad Seleccionada
                    </p>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 border border-gray-100">
                      <div>
                        <span className="text-xs font-bold text-body block">
                          {selectedScheme.name}
                        </span>
                        <span className="text-[10px] text-body-muted block mt-0.5">
                          {selectedScheme.paymentMode === 'cash'
                            ? 'Pago Único de Contado'
                            : selectedScheme.paymentMode === 'quota'
                            ? 'Financiamiento en Cuotas'
                            : 'Financiamiento Mixto (Inicial + Cuotas)'}
                        </span>
                      </div>
                      <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-secondary">
                        {selectedScheme.paymentMode === 'cash' ? 'Contado' : 'Crédito'}
                      </span>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Precios y desglose financiero Dual USD / VES */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-body-muted gap-2">
                      <span>Precio Principal del Producto:</span>
                      <div className="text-right font-semibold text-body">
                        <div>{fmt(originalPrice)}</div>
                        <div className="text-[10px] text-body-muted font-normal">{fmtBs(originalPrice)}</div>
                      </div>
                    </div>

                    {selectedScheme.paymentMode === 'mixed' && initialPct > 0 && (
                      <div className="flex justify-between text-body-muted gap-2">
                        <span>Pago Inicial ({initialPct}%):</span>
                        <div className="text-right font-semibold text-body">
                          <div>{fmt(initialAmount)}</div>
                          <div className="text-[10px] text-body-muted font-normal">{fmtBs(initialAmount)}</div>
                        </div>
                      </div>
                    )}

                    {selectedScheme.paymentMode !== 'cash' && (
                      <div className="flex justify-between text-body-muted gap-2">
                        <span>Monto Financiado Restante:</span>
                        <div className="text-right font-semibold text-body">
                          <div>{fmt(remainingAmount)}</div>
                          <div className="text-[10px] text-body-muted font-normal">{fmtBs(remainingAmount)}</div>
                        </div>
                      </div>
                    )}

                    {selectedScheme.paymentMode !== 'cash' && (
                      <div className="flex justify-between text-body-muted gap-2 border-t border-dashed border-gray-100 pt-2">
                        <span>Distribución de Financiamiento:</span>
                        <div className="text-right font-bold text-purple-700">
                          <div>{quotaCount} cuotas de {fmt(quotaAmount)}</div>
                          <div className="text-[10px] text-purple-700 font-medium">Equiv. a {fmtBs(quotaAmount)} c/u</div>
                        </div>
                      </div>
                    )}

                    <hr className="border-gray-100 my-2" />

                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-bold text-body">Monto Total USD:</span>
                      <span className="font-black text-body text-base">{fmt(originalPrice)}</span>
                    </div>

                    <div className="flex justify-between items-baseline gap-2 border-t border-gray-100/50 pt-2">
                      <span className="font-bold text-secondary">Monto Total VES (Tasa BCV):</span>
                      <span className="font-black text-secondary text-base">{fmtBs(originalPrice)}</span>
                    </div>
                  </div>

                  {/* Beneficios */}
                  <div className="rounded-2xl bg-secondary/[0.02] border border-secondary/10 p-4 mt-6 text-xs text-body space-y-2">
                    <div className="flex items-center gap-2 font-bold text-secondary">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      <span>Beneficios de Compra</span>
                    </div>
                    <ul className="list-disc list-inside pl-1 text-[11px] text-body-muted space-y-1">
                      <li>Activación inmediata y procesamiento en Bolívares.</li>
                      <li>Historial consolidado en tu estado de cuenta.</li>
                      <li>Mandatos de domiciliación garantizados y seguros.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
