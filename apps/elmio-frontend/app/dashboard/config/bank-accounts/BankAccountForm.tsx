'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { Alert } from '@/components/atoms/Alert/Alert'
import { FormField } from '@/components/molecules/FormField/FormField'
import CedulaInput from '@/components/molecules/CedulaInput/CedulaInput'
import { PhoneInput } from '@/components/molecules/PhoneInput/PhoneInput'
import { usePhoneFormat } from '@/src/utils/usePhoneFormat'
import type { CedulaValue, CedulaLetter } from '@/components/molecules/CedulaInput/CedulaInput.d'
import type { CountryCode, OperatorPrefix } from '@/components/molecules/PhoneInput/PhoneInput.d'
import {
  bankAccountsAdminService,
  BankItem,
  CurrencyItem,
  BankAccountTypeItem,
  SaveBankAccountInput,
} from '@/src/services/bank-accounts-admin.service'

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

interface BankAccountFormProps {
  readonly mode: 'create' | 'edit'
  readonly id?: string
}

export function BankAccountForm({ mode, id }: BankAccountFormProps) {
  const router = useRouter()
  const isEdit = mode === 'edit'

  const [loadingData, setLoadingData] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Catálogos desde backend
  const [banks, setBanks] = useState<BankItem[]>([])
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([])
  const [accountTypes, setAccountTypes] = useState<BankAccountTypeItem[]>([])

  // Campos de formulario
  const [bankId, setBankId] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  
  // Cédula usando componente CedulaInput
  const [cedulaValue, setCedulaValue] = useState<CedulaValue>({ letter: 'V', digits: '' })

  // Teléfono de Pago Móvil usando PhoneInput y hook usePhoneFormat
  const phoneFormat = usePhoneFormat()
  const [phoneCountryCode, setPhoneCountryCode] = useState<CountryCode>({
    code: 'VE',
    dial: '+58',
    flag: '🇻🇪',
    name: 'Venezuela',
  })
  const [phoneOperatorPrefix, setPhoneOperatorPrefix] = useState<OperatorPrefix>('412')

  // Teléfono de Validación usando PhoneInput y hook usePhoneFormat
  const validationPhoneFormat = usePhoneFormat()
  const [validationPhoneCountryCode, setValidationPhoneCountryCode] = useState<CountryCode>({
    code: 'VE',
    dial: '+58',
    flag: '🇻🇪',
    name: 'Venezuela',
  })
  const [validationPhoneOperatorPrefix, setValidationPhoneOperatorPrefix] = useState<OperatorPrefix>('412')

  const [businessName, setBusinessName] = useState('')
  const [accountTypeId, setAccountTypeId] = useState('')
  const [description, setDescription] = useState('')
  const [currencyId, setCurrencyId] = useState('')

  // Control de errores de validación visuales
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({})

  // Cargar catálogos iniciales
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [bs, currs, types] = await Promise.all([
          bankAccountsAdminService.listBanks(),
          bankAccountsAdminService.listCurrencies(),
          bankAccountsAdminService.listAccountTypes(),
        ])
        setBanks(bs)
        setCurrencies(currs)
        setAccountTypes(types)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar catálogos.'
        setError(message)
      }
    }
    void loadCatalogs()
  }, [])

  // Cargar datos a editar
  useEffect(() => {
    if (!isEdit || !id) return

    const fetchAccountData = async () => {
      try {
        setLoadingData(true)
        const account = await bankAccountsAdminService.getById(id)
        setBankId(account.bank.id)
        setAccountNumber(account.accountNumber)
        setBusinessName(account.businessName || '')
        setAccountTypeId(account.accountType.id)
        setDescription(account.description)
        setCurrencyId(account.currency.id)

        // Inicializar Cédula
        const cleanDocNum = (account.documentNumber || '').replaceAll(/\D/g, '')
        const cleanLetter = (account.documentType || 'V').toUpperCase() as CedulaLetter
        setCedulaValue({ letter: cleanLetter, digits: cleanDocNum })

        // Formatear Teléfono Pago Móvil
        const cleanPhone = (account.phoneNumber || '').replaceAll(/\D/g, '')
        if (cleanPhone.startsWith('58')) {
          const rest = cleanPhone.slice(2)
          const prefix = rest.slice(0, 3) as OperatorPrefix
          if (['412', '422', '414', '424', '416', '426'].includes(prefix)) {
            setPhoneOperatorPrefix(prefix)
            phoneFormat.setRawDigits(rest.slice(3, 10))
          } else {
            phoneFormat.setRawDigits(rest)
          }
        } else if (cleanPhone.startsWith('0')) {
          const prefix = cleanPhone.slice(1, 4) as OperatorPrefix
          if (['412', '422', '414', '424', '416', '426'].includes(prefix)) {
            setPhoneOperatorPrefix(prefix)
            phoneFormat.setRawDigits(cleanPhone.slice(4, 11))
          } else {
            phoneFormat.setRawDigits(cleanPhone)
          }
        } else {
          phoneFormat.setRawDigits(cleanPhone)
        }

        // Formatear Teléfono de Validación
        const cleanValPhone = (account.phoneValidationNumber || '').replaceAll(/\D/g, '')
        if (cleanValPhone.startsWith('58')) {
          const rest = cleanValPhone.slice(2)
          const prefix = rest.slice(0, 3) as OperatorPrefix
          if (['412', '422', '414', '424', '416', '426'].includes(prefix)) {
            setValidationPhoneOperatorPrefix(prefix)
            validationPhoneFormat.setRawDigits(rest.slice(3, 10))
          } else {
            validationPhoneFormat.setRawDigits(rest)
          }
        } else if (cleanValPhone.startsWith('0')) {
          const prefix = cleanValPhone.slice(1, 4) as OperatorPrefix
          if (['412', '422', '414', '424', '416', '426'].includes(prefix)) {
            setValidationPhoneOperatorPrefix(prefix)
            validationPhoneFormat.setRawDigits(cleanValPhone.slice(4, 11))
          } else {
            validationPhoneFormat.setRawDigits(cleanValPhone)
          }
        } else {
          validationPhoneFormat.setRawDigits(cleanValPhone)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar los datos de la cuenta.'
        setError(message)
      } finally {
        setLoadingData(false)
      }
    }
    void fetchAccountData()
  }, [id, isEdit])

  const validateForm = (): boolean => {
    const errors: Record<string, boolean> = {}

    if (!bankId) errors.bankId = true
    if (!accountNumber || accountNumber.length < 20) errors.accountNumber = true
    if (!cedulaValue.digits) errors.documentNumber = true
    if (!phoneFormat.rawDigits || phoneFormat.rawDigits.length < 7) errors.phoneNumber = true
    if (!accountTypeId) errors.accountTypeId = true
    if (!currencyId) errors.currencyId = true

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      setError('Por favor, completa correctamente todos los campos requeridos.')
      return
    }

    const phoneNumber = `${phoneCountryCode.dial}${phoneOperatorPrefix}${phoneFormat.rawDigits}`
    const phoneValidationNumber = validationPhoneFormat.rawDigits
      ? `${validationPhoneCountryCode.dial}${validationPhoneOperatorPrefix}${validationPhoneFormat.rawDigits}`
      : ''

    const payload: SaveBankAccountInput = {
      bankId,
      accountNumber,
      documentType: cedulaValue.letter,
      documentNumber: cedulaValue.digits.replaceAll(/\D/g, ''),
      phoneNumber,
      phoneValidationNumber: phoneValidationNumber || undefined,
      businessName: businessName || undefined,
      accountTypeId,
      description,
      currencyId,
    }

    try {
      setSaving(true)
      if (isEdit && id) {
        await bankAccountsAdminService.update(id, payload)
        router.push('/dashboard/config/bank-accounts?success=updated')
        router.refresh()
      } else {
        await bankAccountsAdminService.create(payload)
        router.push('/dashboard/config/bank-accounts?success=created')
        router.refresh()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar la cuenta bancaria.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[30vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-secondary border-t-transparent" />
        <span className="text-sm text-gray-500 font-medium">Cargando datos de la cuenta...</span>
      </div>
    )
  }

  // Emparejar los 26 bancos venezolanos con sus IDs UUID correspondientes cargados desde base de datos
  const bankOptions = VENEZUELAN_BANKS.map((vb) => {
    const dbBank = banks.find((b) => b.bankCode === vb.code)
    return {
      value: dbBank ? dbBank.id : vb.code,
      label: vb.label,
    }
  })

  return (
    <div className="w-full">
      <div className="flex flex-col gap-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div>
          <h1 className="text-xl font-semibold text-body leading-snug">
            {isEdit ? 'Detalles de la cuenta bancaria' : 'Nueva cuenta bancaria corporativa'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isEdit
              ? 'Actualiza los datos de la cuenta bancaria corporativa registrada.'
              : 'Registra una nueva cuenta corporativa para conciliar y procesar operaciones de cobro.'}
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} onDismiss={() => setError(null)} />
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Banco */}
            <FormField label="Banco" required>
              <Select
                value={bankId}
                onChange={setBankId}
                placeholder="Selecciona un banco"
                options={bankOptions}
                hasError={validationErrors.bankId}
              />
            </FormField>

            {/* Número de cuenta */}
            <FormField label="Número de cuenta (20 dígitos)" required>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="01380000000000000000"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replaceAll(/\D/g, '').slice(0, 20))}
                maxLength={20}
                hasError={validationErrors.accountNumber}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cédula usando CedulaInput */}
            <FormField label="Documento de Identidad (Titular)" required>
              <CedulaInput
                value={cedulaValue}
                onChange={setCedulaValue}
                allowedLetters={['V', 'E', 'J', 'G', 'P'] as any}
              />
            </FormField>

            {/* Teléfono Pago Móvil usando PhoneInput y hook usePhoneFormat */}
            <FormField label="Teléfono (Pago móvil)" required>
              <PhoneInput
                displayValue={phoneFormat.displayValue}
                onChange={phoneFormat.handleChange}
                countryCode={phoneCountryCode}
                onCountryCodeChange={setPhoneCountryCode}
                operatorPrefix={phoneOperatorPrefix}
                onOperatorPrefixChange={setPhoneOperatorPrefix}
                hasError={validationErrors.phoneNumber}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono de Validación opcional usando PhoneInput y hook usePhoneFormat */}
            <FormField label="Teléfono de validación (opcional)">
              <PhoneInput
                displayValue={validationPhoneFormat.displayValue}
                onChange={validationPhoneFormat.handleChange}
                countryCode={validationPhoneCountryCode}
                onCountryCodeChange={setValidationPhoneCountryCode}
                operatorPrefix={validationPhoneOperatorPrefix}
                onOperatorPrefixChange={setValidationPhoneOperatorPrefix}
              />
            </FormField>

            {/* Tipo de Cuenta */}
            <FormField label="Tipo de cuenta bancaria" required>
              <Select
                value={accountTypeId}
                onChange={setAccountTypeId}
                placeholder="Selecciona tipo de cuenta"
                options={accountTypes.map((t) => ({ value: t.id, label: t.accountType }))}
                hasError={validationErrors.accountTypeId}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Moneda */}
            <FormField label="Moneda" required>
              <Select
                value={currencyId}
                onChange={setCurrencyId}
                placeholder="Selecciona una moneda"
                options={currencies.map((c) => ({ value: c.id, label: `${c.code} — ${c.name} (${c.symbol})` }))}
                hasError={validationErrors.currencyId}
              />
            </FormField>

            {/* Razón Social */}
            <FormField label="Titular de la cuenta / Razón social (opcional)">
              <Input
                type="text"
                placeholder="Ej. Inversiones ElMio C.A."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </FormField>
          </div>

          {/* Descripción */}
          <FormField label="Descripción / Alias (opcional)">
            <Input
              type="text"
              placeholder="Ej. Cuenta Recaudadora Principal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              hasError={validationErrors.description}
            />
          </FormField>

          <div className="flex gap-3 pt-4 border-t border-gray-50 justify-end">
            <Link href="/dashboard/config/bank-accounts">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>

            <Button type="submit" isLoading={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isEdit ? 'Guardar cambios' : 'Registrar cuenta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
