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
import { alliesService } from '@/src/services/allies.service'

interface AlliedFormProps {
  readonly mode: 'create' | 'edit'
  readonly id?: string
}

export function AlliedForm({ mode, id }: AlliedFormProps) {
  const router = useRouter()
  const isEdit = mode === 'edit'

  const [loadingData, setLoadingData] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Campos de formulario
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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

    const fetchAllyData = async () => {
      try {
        setLoadingData(true)
        const ally = await alliesService.getById(id)
        setName(ally.name)
        setSlug(ally.slug || '')
        setEmail(ally.email || '')

        // Inicializar código de país del teléfono
        if (ally.countryCode) {
          const cleanDial = ally.countryCode.startsWith('+') ? ally.countryCode : `+${ally.countryCode}`
          setPhoneCountryCode({
            code: ally.countryCode === '58' ? 'VE' : 'US', // Mapeo básico
            dial: cleanDial,
            flag: ally.countryCode === '58' ? '🇻🇪' : '🇺🇸',
            name: ally.countryCode === '58' ? 'Venezuela' : 'United States',
          })
        }

        // Formatear Teléfono
        const cleanPhone = (ally.phone || '').replaceAll(/\D/g, '')
        const prefix = cleanPhone.slice(0, 3) as OperatorPrefix
        if (['412', '422', '414', '424', '416', '426'].includes(prefix)) {
          setPhoneOperatorPrefix(prefix)
          phoneFormat.setRawDigits(cleanPhone.slice(3))
        } else {
          phoneFormat.setRawDigits(cleanPhone)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar los datos del aliado.'
        setError(message)
      } finally {
        setLoadingData(false)
      }
    }
    void fetchAllyData()
  }, [id, isEdit])

  // Genera el slug automáticamente a partir del nombre completo (solo en modo creación)
  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEdit) {
      const generatedSlug = val
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres no alfanuméricos
        .replace(/\s+/g, '-') // Espacios a guiones
        .replace(/-+/g, '-') // Guiones múltiples a simple

      setSlug(generatedSlug)
    }
  }

  const handleSlugChange = (val: string) => {
    const cleanSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') // Solo letras, números y guiones
      .replace(/-+/g, '-') // Evitar guiones múltiples
    setSlug(cleanSlug)
  }

  const validateForm = async (): Promise<boolean> => {
    const errors: Record<string, boolean> = {}

    if (!name.trim()) errors.name = true
    if (!slug.trim()) errors.slug = true
    if (!phoneFormat.rawDigits || phoneFormat.rawDigits.length < 7) errors.phone = true
    if (!isEdit && (!password || password.length < 6)) errors.password = true

    // Validación de unicidad de slug proactiva en el cliente
    if (slug.trim()) {
      try {
        const list = await alliesService.list()
        const slugExists = list.some(
          (a) =>
            a.slug?.toLowerCase().trim() === slug.toLowerCase().trim() &&
            (!isEdit || a.id !== id)
        )
        if (slugExists) {
          setError('El slug del aliado ya está en uso por otro aliado.')
          errors.slug = true
        }
      } catch {
        // En caso de que falle la petición local, la API del backend igual validará al enviar
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
      slug: slug.trim(),
      countryCode: phoneCountryCode.dial.replace('+', ''), // Enviamos solo el número ej: '58'
      phone: `${phoneOperatorPrefix}${phoneFormat.rawDigits}`, // Prefijo operador + resto de dígitos
      email: email.trim() || undefined,
      password: password.trim() || undefined,
    }

    try {
      setSaving(true)
      if (isEdit && id) {
        await alliesService.update(id, payload)
        router.push('/dashboard/config/allies?success=updated')
        router.refresh()
      } else {
        await alliesService.create(payload)
        router.push('/dashboard/config/allies?success=created')
        router.refresh()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar el aliado.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[30vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-secondary border-t-transparent" />
        <span className="text-sm text-gray-500 font-medium">Cargando datos del aliado...</span>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div>
          <h1 className="text-xl font-semibold text-body leading-snug">
            {isEdit ? 'Detalles del perfil aliado' : 'Nuevo aliado de negocios'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isEdit
              ? 'Actualiza la información del perfil del aliado registrado.'
              : 'Registra un nuevo aliado y sus credenciales de acceso para la administración de marketplaces.'}
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} onDismiss={() => setError(null)} />
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre Completo */}
            <FormField label="Nombre completo del Aliado" required>
              <Input
                id="allied-form-name"
                type="text"
                placeholder="Ej. Alianza Global C.A."
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                hasError={validationErrors.name}
                required
              />
            </FormField>

            {/* Slug URL */}
            <FormField label="Slug (URL única de la tienda)" required>
              <div className="flex items-center gap-1.5 w-full">
                <span className="text-xs text-gray-400 font-mono select-none">/marketplace/</span>
                <Input
                  id="allied-form-slug"
                  type="text"
                  placeholder="ej. alianza-global"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  hasError={validationErrors.slug}
                  className="font-mono text-sm"
                  required
                />
              </div>
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
            <FormField label="Correo Electrónico (Opcional)">
              <Input
                id="allied-form-email"
                type="email"
                placeholder="correo@alianza.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
          </div>

          {/* Contraseña */}
          <FormField
            label={isEdit ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso'}
            required={!isEdit}
          >
            <div className="w-full space-y-1">
              <Input
                id="allied-form-password"
                type="password"
                placeholder={isEdit ? 'Dejar en blanco para conservar la actual' : 'Mínimo 6 caracteres'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hasError={validationErrors.password}
                required={!isEdit}
              />
              {isEdit && (
                <p className="text-[10px] text-gray-400 italic">
                  * Solo rellena este campo si deseas cambiar la contraseña de acceso del aliado.
                </p>
              )}
            </div>
          </FormField>

          <div className="flex gap-3 pt-4 border-t border-gray-50 justify-end">
            <Link href="/dashboard/config/allies">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>

            <Button type="submit" isLoading={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isEdit ? 'Guardar cambios' : 'Registrar Aliado'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
