'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Alert } from '@/components/atoms/Alert/Alert'
import { FormField } from '@/components/molecules/FormField/FormField'
import { PhoneInput } from '@/components/molecules/PhoneInput/PhoneInput'
import { usePhoneFormat } from '@/src/utils/usePhoneFormat'
import type { CountryCode, OperatorPrefix } from '@/components/molecules/PhoneInput/PhoneInput.d'
import { financeUsersService } from '@/src/services/finance-users.service'

interface FinanceUserFormProps {
  readonly mode: 'create' | 'edit'
  readonly id?: string
}

export function FinanceUserForm({ mode, id }: FinanceUserFormProps) {
  const router = useRouter()
  const isEdit = mode === 'edit'

  const [loadingData, setLoadingData] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Campos de formulario
  const [name, setName] = useState('')
  const [cedula, setCedula] = useState('')
  const [email, setEmail] = useState('')

  // Teléfono usando PhoneInput y hook usePhoneFormat
  const phoneFormat = usePhoneFormat()
  const [phoneCountryCode, setPhoneCountryCode] = useState<CountryCode>({
    code: 'VE',
    dial: '+58',
    flag: '🇻🇪',
    name: 'Venezuela',
  })
  const [phoneOperatorPrefix, setPhoneOperatorPrefix] = useState<OperatorPrefix>('412')

  // Control de errores de validación visuales
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({})

  // Cargar datos a editar si aplica
  useEffect(() => {
    if (!isEdit || !id) return

    const fetchUserData = async () => {
      try {
        setLoadingData(true)
        const user = await financeUsersService.getById(id)
        setName(user.name)
        setCedula(user.slug || '')
        setEmail(user.email || '')

        // Inicializar código de país del teléfono
        if (user.countryCode) {
          const cleanDial = user.countryCode.startsWith('+') ? user.countryCode : `+${user.countryCode}`
          setPhoneCountryCode({
            code: user.countryCode === '58' ? 'VE' : 'US',
            dial: cleanDial,
            flag: user.countryCode === '58' ? '🇻🇪' : '🇺🇸',
            name: user.countryCode === '58' ? 'Venezuela' : 'United States',
          })
        }

        // Formatear Teléfono
        const cleanPhone = (user.phone || '').replaceAll(/\D/g, '')
        const prefix = cleanPhone.slice(0, 3) as OperatorPrefix
        if (['412', '422', '414', '424', '416', '426'].includes(prefix)) {
          setPhoneOperatorPrefix(prefix)
          phoneFormat.setRawDigits(cleanPhone.slice(3))
        } else {
          phoneFormat.setRawDigits(cleanPhone)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar los datos del usuario de finanzas.'
        setError(message)
      } finally {
        setLoadingData(false)
      }
    }
    void fetchUserData()
  }, [id, isEdit])

  const validateForm = async (): Promise<boolean> => {
    const errors: Record<string, boolean> = {}

    if (!name.trim()) errors.name = true
    if (!cedula.trim()) errors.cedula = true
    if (!phoneFormat.rawDigits || phoneFormat.rawDigits.length < 7) errors.phone = true
    if (!email.trim() || !email.includes('@')) errors.email = true

    // Validación de unicidad de cédula proactiva en el cliente
    if (cedula.trim()) {
      try {
        const list = await financeUsersService.list()
        const cedulaExists = list.some(
          (u) =>
            u.slug?.toLowerCase().trim() === cedula.toLowerCase().trim() &&
            (!isEdit || u.id !== id)
        )
        if (cedulaExists) {
          setError('La cédula ingresada ya está registrada por otro usuario.')
          errors.cedula = true
        }
      } catch {
        // Ignorar fallas al consultar localmente
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const isValid = await validateForm()
    if (!isValid) {
      if (!error) {
        setError('Por favor, completa correctamente todos los campos requeridos.')
      }
      return
    }

    const payload = {
      name: name.trim(),
      cedula: cedula.trim(),
      countryCode: phoneCountryCode.dial.replace('+', ''), // Enviamos solo el número ej: '58'
      phone: `${phoneOperatorPrefix}${phoneFormat.rawDigits}`, // Prefijo operador + resto de dígitos
      email: email.trim(),
    }

    try {
      setSaving(true)
      if (isEdit && id) {
        await financeUsersService.update(id, payload)
        router.push('/dashboard/config/finance-users?success=updated')
        router.refresh()
      } else {
        await financeUsersService.create(payload)
        router.push('/dashboard/config/finance-users?success=created')
        router.refresh()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar el usuario de finanzas.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[30vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-secondary border-t-transparent" />
        <span className="text-sm text-gray-500 font-medium">Cargando datos del usuario...</span>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div>
          <h1 className="text-xl font-semibold text-body leading-snug">
            {isEdit ? 'Detalles del usuario de finanzas' : 'Nuevo usuario de finanzas'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isEdit
              ? 'Actualiza la información del analista de finanzas registrado.'
              : 'Registra un nuevo analista de finanzas. Su cédula será su contraseña de acceso inicial.'}
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} onDismiss={() => setError(null)} />
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre Completo */}
            <FormField label="Nombre completo del Usuario" required>
              <Input
                id="finance-form-name"
                type="text"
                placeholder="Ej. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                hasError={validationErrors.name}
                required
              />
            </FormField>

            {/* Cédula */}
            <FormField label="Cédula de Identidad" required>
              <Input
                id="finance-form-cedula"
                type="text"
                placeholder="Ej. 12345678"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                hasError={validationErrors.cedula}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono con PhoneInput */}
            <FormField label="Teléfono de Contacto" required>
              <PhoneInput
                displayValue={phoneFormat.displayValue}
                onChange={phoneFormat.handleChange}
                countryCode={phoneCountryCode}
                onCountryCodeChange={setPhoneCountryCode}
                operatorPrefix={phoneOperatorPrefix}
                onOperatorPrefixChange={setPhoneOperatorPrefix}
                hasError={validationErrors.phone}
              />
            </FormField>

            {/* Correo Electrónico */}
            <FormField label="Correo Electrónico" required>
              <Input
                id="finance-form-email"
                type="email"
                placeholder="correo@finanzas.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                hasError={validationErrors.email}
                required
              />
            </FormField>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-50 justify-end">
            <Link href="/dashboard/config/finance-users">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>

            <Button type="submit" isLoading={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isEdit ? 'Guardar cambios' : 'Registrar Usuario'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
