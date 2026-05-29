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
} from 'lucide-react'
import { authService } from '@/src/services/auth.service'
import { enterpriseService, type PersonProfile, type Enterprise } from '@/src/services/empresa.service'
import { productService, type Product, type FinancingScheme } from '@/src/services/product.service'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { FormField } from '@/components/molecules/FormField/FormField'
import { LoginForm } from '@/components/organisms/LoginForm/LoginForm'
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
  { code: '0169', label: 'R4 (0169)' },
  { code: '0171', label: 'Banco Activo (0171)' },
  { code: '0172', label: 'Bancamiga (0172)' },
  { code: '0173', label: 'Banco Internacional de Desarrollo (0173)' },
  { code: '0174', label: 'Banplus (0174)' },
  { code: '0175', label: 'Banco Digital de los Trabajadores / Bicentenario (0175)' },
  { code: '0177', label: 'Banfanb (0177)' },
  { code: '0178', label: 'N58 Banco Digital (0178)' },
  { code: '0191', label: 'Banco Nacional de Crédito (0191)' },
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

  // Estados de carga e interfaz
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<string>('')
  const [success, setSuccess] = useState(false)

  // Campos del formulario
  const [cedulaValue, setCedulaValue] = useState<CedulaValue>({ letter: 'V', digits: '' })
  const phoneFormat = usePhoneFormat()
  const [phoneCountryCode, setPhoneCountryCode] = useState<CountryCode>({
    code: 'VE',
    dial: '+58',
    flag: '🇻🇪',
    name: 'Venezuela',
  })
  const [phoneOperatorPrefix, setPhoneOperatorPrefix] = useState<OperatorPrefix>('412')
  const [selectedBank, setSelectedBank] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [authorizedDomiciliation, setAuthorizedDomiciliation] = useState(false)

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

        // Cargar producto
        const prod = await productService.getById(productId)
        setProduct(prod)

        // Resolver esquema
        let scheme = prod.financingSchemes?.find((s) => s.id === schemeId)
        if (!scheme && prod.financingSchemes && prod.financingSchemes.length > 0) {
          scheme = prod.financingSchemes[0]
        }
        setSelectedScheme(scheme || null)

        // Cargar perfil de persona para pre-poblar datos
        try {
          const prof = await enterpriseService.getMyProfile()
          setProfile(prof)
          if (prof.documentId) {
            const match = prof.documentId.match(/^([VEJGP])(\d+)$/i)
            if (match) {
              setCedulaValue({ letter: match[1].toUpperCase() as CedulaLetter, digits: match[2] })
            } else {
              setCedulaValue({ letter: 'V', digits: prof.documentId.replace(/\D/g, '') })
            }
          }
          if (prof.phone) {
            const cleanPhone = prof.phone.replace(/^\+58|^0/, '')
            const prefix = cleanPhone.substring(0, 3) as OperatorPrefix
            const digits = cleanPhone.substring(3)
            if (['412', '422', '414', '424', '416', '426'].includes(prefix)) {
              setPhoneOperatorPrefix(prefix)
              phoneFormat.setRawDigits(digits)
            } else {
              phoneFormat.setRawDigits(cleanPhone)
            }
          }

          // Pre-cargar cuenta de banco debito guardada si existe
          if (prof.debitCard) {
            setSelectedBank(prof.debitCard.bank)
            setAccountNumber(prof.debitCard.cardNumber)
          }
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

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !selectedScheme) return

    const documentIdStr = `${cedulaValue.letter}${cedulaValue.digits}`
    const phoneStr = `0${phoneOperatorPrefix}${phoneFormat.rawDigits}`

    // Validaciones
    if (!cedulaValue.digits.trim()) {
      setError('Por favor ingresa tu número de cédula de identidad.')
      return
    }
    if (!phoneFormat.rawDigits.trim() || phoneFormat.rawDigits.length !== 7) {
      setError('Por favor ingresa un número de teléfono móvil de contacto válido (7 dígitos después del prefijo).')
      return
    }
    if (!selectedBank) {
      setError('Por favor selecciona tu banco de origen.')
      return
    }
    if (!accountNumber || accountNumber.length !== 20) {
      setError('El número de cuenta bancaria debe tener exactamente 20 dígitos.')
      return
    }

    const needsDomiciliation = selectedScheme.paymentMode === 'quota' || selectedScheme.paymentMode === 'mixed'
    if (needsDomiciliation && !authorizedDomiciliation) {
      setError('Debes autorizar la domiciliación de pagos para este esquema financiado.')
      return
    }

    setError(null)
    setIsProcessing(true)

    // Simular los pasos premium tipo Stripe
    try {
      const isCash = selectedScheme.paymentMode === 'cash'
      const hasInitial = selectedScheme.paymentMode === 'mixed' && selectedScheme.initialPayment > 0

      if (isCash || hasInitial) {
        setProcessingStep('Conectando de forma segura con la pasarela bancaria...')
        await new Promise((r) => setTimeout(r, 1200))
        setProcessingStep('Procesando débito inmediato en cuenta de origen...')
        await new Promise((r) => setTimeout(r, 1500))
      }

      if (needsDomiciliation) {
        setProcessingStep('Estableciendo acuerdo de domiciliación electrónica...')
        await new Promise((r) => setTimeout(r, 1000))
        setProcessingStep('Sincronizando cobro recurrente con tu banco de origen...')
        await new Promise((r) => setTimeout(r, 1200))
      }

      setProcessingStep('Guardando credenciales de pago seguras y finalizando compra...')
      await new Promise((r) => setTimeout(r, 800))

      // 1. Persistencia de datos bancarios en el perfil
      await enterpriseService.updateMyProfile({
        documentId: documentIdStr,
        phone: phoneStr,
        debitCard: {
          bank: selectedBank,
          cardNumber: accountNumber,
          limit: null,
        },
      })

      // 2. Registrar la transacción en el backend
      const amount = product.priceLists[0]?.amount ?? 0
      const isCompany = session?.role === 'COMPANY'

      if (isCompany && enterprise) {
        await enterpriseService.createTransaction(enterprise.id, {
          kind: 'charge',
          concept: `Compra Marketplace Stripe Checkout: ${product.name} (Esquema: ${selectedScheme.name})`,
          amount,
          status: 'paid', // Ya debitado o domiciliado de forma segura
        })
      } else {
        await enterpriseService.createMyTransaction({
          kind: 'charge',
          concept: `Compra Marketplace Stripe Checkout: ${product.name} (Esquema: ${selectedScheme.name})`,
          amount,
          status: 'paid',
        })
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago del checkout.')
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(n)

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

  // Renderizar estados de carga
  if (loading || isAuthenticated === null) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-body-muted animate-pulse">
          Inicializando pasarela de facturación segura...
        </p>
      </div>
    )
  }

  // Renderizar estado de éxito
  if (success && product && selectedScheme) {
    const isCash = selectedScheme.paymentMode === 'cash'
    const initialPct = selectedScheme.initialPayment ?? 0
    const originalPrice = product.priceLists[0]?.amount ?? 0
    const initialAmount = (originalPrice * initialPct) / 100

    return (
      <div className="flex min-h-[85vh] items-center justify-center bg-gray-50/50 p-6">
        <div className="w-full max-w-lg rounded-3xl border border-green-100 bg-white p-8 text-center shadow-xl shadow-green-900/5 animate-in fade-in zoom-in-95 duration-350">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-700">
            Transacción Exitosa
          </span>

          <h2 className="mt-4 text-2xl font-black text-body">¡Pago Procesado con Éxito!</h2>
          <p className="mt-2 text-sm text-body-muted">
            Tu compra ha sido verificada y registrada exitosamente en tu estado de cuenta de ElMio. Hemos establecido los contratos financieros correspondientes.
          </p>

          <div className="mt-6 rounded-2xl border border-gray-50 bg-gray-50/50 p-5 text-left space-y-3">
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
            <hr className="border-gray-100" />
            <div className="flex justify-between text-sm">
              <span className="font-medium text-body">Monto Total:</span>
              <span className="font-bold text-body">{fmt(originalPrice)}</span>
            </div>
            {selectedScheme.paymentMode !== 'cash' && (
              <div className="rounded-lg bg-secondary/5 p-2.5 text-[11px] text-secondary">
                {selectedScheme.paymentMode === 'mixed' && initialPct > 0 ? (
                  <p>
                    <strong>Débito Inicial:</strong> {fmt(initialAmount)} ({initialPct}%) procesado hoy.
                    <br />
                    <strong>Financiado:</strong> {selectedScheme.maxQuotas} cuotas domiciliadas restantes.
                  </p>
                ) : (
                  <p>
                    <strong>Domiciliación Activa:</strong> {selectedScheme.maxQuotas} cuotas de financiamiento sin inicial.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-4">
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.close()
                }
              }}
            >
              Cerrar esta pestaña
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Pre-cálculos del financiamiento
  const originalPrice = product?.priceLists[0]?.amount ?? 0
  const initialPct = selectedScheme?.initialPayment ?? 0
  const initialAmount = (originalPrice * initialPct) / 100
  const remainingAmount = originalPrice - initialAmount
  const quotaCount = selectedScheme?.maxQuotas ?? 1
  const quotaAmount = remainingAmount / quotaCount

  return (
    <main className="min-h-screen bg-gray-50/50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:bg-gray-50 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-body transition-transform group-hover:-translate-x-0.5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-body">Pasarela de Compra</h1>
              <p className="text-xs text-body-muted">Checkout seguro gestionado por ElMio</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 border border-gray-200 shadow-sm text-xs font-semibold text-body-muted">
            <Lock className="h-3.5 w-3.5 text-secondary" />
            <span>Encriptación SSL de 256 bits</span>
          </div>
        </header>

        {error && <div className="mb-6"><Alert type="error" message={error} /></div>}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Columna Izquierda: Formulario de Pago */}
          <section className="lg:col-span-7">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-black/3">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-body">Método de Débito Directo</h2>
                  <p className="text-xs text-body-muted">
                    Suscripción inmediata y domiciliación garantizada mediante cuenta nacional
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmPurchase} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Banco de Origen" required>
                    <Select
                      value={selectedBank}
                      onChange={setSelectedBank}
                      options={[
                        { value: '', label: 'Selecciona un banco...' },
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

                {/* Paso: Débito Inmediato (Cash o Inicial) */}
                {selectedScheme && (selectedScheme.paymentMode === 'cash' || (selectedScheme.paymentMode === 'mixed' && initialPct > 0)) && (
                  <div className="rounded-2xl border border-secondary/15 bg-secondary/[0.02] p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                        <DollarSign className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-body">Paso 1: Débito Inmediato</h3>
                        <p className="mt-1 text-xs text-body-muted">
                          Para autorizar la compra, se realizará un cobro inmediato en tu cuenta de origen por el monto de:
                        </p>
                        <p className="mt-2 text-xl font-extrabold text-body">
                          {selectedScheme.paymentMode === 'cash' ? fmt(originalPrice) : fmt(initialAmount)}
                        </p>
                        <p className="text-[10px] text-body-muted mt-1">
                          {selectedScheme.paymentMode === 'cash'
                            ? 'Representa el pago único de contado de este producto.'
                            : `Representa el cobro de la inicial equivalente al ${initialPct}% del precio total.`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paso: Domiciliación (Crédito o Mixto) */}
                {selectedScheme && (selectedScheme.paymentMode === 'quota' || selectedScheme.paymentMode === 'mixed') && (
                  <div className="rounded-2xl border border-purple-100 bg-purple-50/20 p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                        <ShieldCheck className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-body">Paso 2: Domiciliación de Cuotas</h3>
                        <p className="mt-1 text-xs text-body-muted">
                          Suscripción mensual autorizada de cuotas fijas recurrentes:
                        </p>
                        <div className="mt-2 flex items-baseline gap-1 text-purple-800 font-extrabold text-xl">
                          <span>{quotaCount} cuotas de {fmt(quotaAmount)}</span>
                          <span className="text-[11px] font-normal text-body-muted">
                            /{selectedScheme.paymentPeriod === 'monthly' ? 'mes' : 'período'}
                          </span>
                        </div>

                        <label className="mt-4 flex items-start gap-2.5 cursor-pointer select-none group">
                          <input
                            type="checkbox"
                            className="mt-1 rounded border-gray-300 text-secondary focus:ring-secondary/20 h-4 w-4"
                            checked={authorizedDomiciliation}
                            onChange={(e) => setAuthorizedDomiciliation(e.target.checked)}
                          />
                          <span className="text-[11px] font-medium text-body group-hover:text-secondary transition-colors">
                            Autorizo expresamente a ElMio a domiciliar y debitar automáticamente de la cuenta suministrada las cuotas financieras periódicas del plan.
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sección de Seguridad Stripe */}
                <div className="flex items-center gap-2 text-[11px] text-body-muted border-t border-gray-100 pt-4">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>
                    Tus credenciales financieras se transmiten y encriptan de forma segura bajo estrictos protocolos de la ley bancaria. ElMio no comparte tus datos de acceso bancario.
                  </span>
                </div>

                {/* Botón de Confirmación o Cargando */}
                {isProcessing ? (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center space-y-3 shadow-inner">
                    <Spinner size="md" className="mx-auto" />
                    <p className="text-xs font-semibold text-secondary animate-pulse">
                      {processingStep || 'Procesando checkout...'}
                    </p>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    className="py-3.5 font-bold shadow-lg shadow-secondary/10"
                  >
                    Confirmar y Pagar
                  </Button>
                )}
              </form>
            </div>
          </section>

          {/* Columna Derecha: Resumen del Producto */}
          <section className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-black/3">
              <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-body-muted mb-4">
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

                  {/* Precios y desglose financiero */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-body-muted">
                      <span>Precio Principal del Producto:</span>
                      <span className="font-semibold text-body">{fmt(originalPrice)}</span>
                    </div>

                    {selectedScheme.paymentMode === 'mixed' && initialPct > 0 && (
                      <div className="flex justify-between text-body-muted">
                        <span>Pago Inicial ({initialPct}%):</span>
                        <span className="font-semibold text-body">{fmt(initialAmount)}</span>
                      </div>
                    )}

                    {selectedScheme.paymentMode !== 'cash' && (
                      <div className="flex justify-between text-body-muted">
                        <span>Monto Financiado Restante:</span>
                        <span className="font-semibold text-body">{fmt(remainingAmount)}</span>
                      </div>
                    )}

                    {selectedScheme.paymentMode !== 'cash' && (
                      <div className="flex justify-between text-body-muted">
                        <span>Distribución de Financiamiento:</span>
                        <span className="font-bold text-purple-700">
                          {quotaCount} cuotas de {fmt(quotaAmount)}
                        </span>
                      </div>
                    )}

                    <hr className="border-gray-100 my-2" />

                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-body">Monto Total Estimado:</span>
                      <span className="font-black text-body text-base">{fmt(originalPrice)}</span>
                    </div>
                  </div>

                  {/* Beneficios */}
                  <div className="rounded-2xl bg-secondary/[0.02] border border-secondary/10 p-4 mt-6 text-xs text-body space-y-2">
                    <div className="flex items-center gap-2 font-bold text-secondary">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Beneficios de Compra</span>
                    </div>
                    <ul className="list-disc list-inside pl-1 text-[11px] text-body-muted space-y-1">
                      <li>Activación inmediata de tus servicios contratados.</li>
                      <li>Historial consolidado en tu estado de cuenta.</li>
                      <li>Descuentos aplicados directamente al saldo.</li>
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
