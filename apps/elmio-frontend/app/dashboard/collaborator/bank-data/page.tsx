'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Landmark, Save, Loader2, Check, Eye, Trash2, Upload, AlertCircle } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { FormField } from '@/components/molecules/FormField/FormField'
import { Input } from '@/components/atoms/Input/Input'
import { Alert } from '@/components/atoms/Alert/Alert'
import CedulaInput from '@/components/molecules/CedulaInput/CedulaInput'
import { PhoneInput } from '@/components/molecules/PhoneInput/PhoneInput'
import { usePhoneFormat } from '@/src/utils/usePhoneFormat'
import { enterpriseService } from '@/src/services/empresa.service'
import type { CedulaValue } from '@/components/molecules/CedulaInput/CedulaInput.d'
import type { CountryCode, OperatorPrefix } from '@/components/molecules/PhoneInput/PhoneInput.d'

const VENEZUELAN_BANKS = [
  { value: '0102', label: 'Banco de Venezuela (0102)' },
  { value: '0104', label: 'Banco Venezolano de Credito (0104)' },
  { value: '0105', label: 'Banco Mercantil (0105)' },
  { value: '0108', label: 'Banco Provincial (0108)' },
  { value: '0114', label: 'Bancaribe (0114)' },
  { value: '0115', label: 'Banco Exterior (0115)' },
  { value: '0128', label: 'Banco Caroni (0128)' },
  { value: '0134', label: 'Banesco (0134)' },
  { value: '0137', label: 'Banco Sofitasa (0137)' },
  { value: '0138', label: 'Banco Plaza (0138)' },
  { value: '0146', label: 'Bangente (0146)' },
  { value: '0151', label: 'Banco Fondo Comun (0151)' },
  { value: '0156', label: '100% Banco (0156)' },
  { value: '0157', label: 'DelSur (0157)' },
  { value: '0163', label: 'Banco del Tesoro (0163)' },
  { value: '0166', label: 'Banco Agricola de Venezuela (0166)' },
  { value: '0168', label: 'Bancrecer (0168)' },
  { value: '0169', label: 'R4 (0169)' },
  { value: '0171', label: 'Banco Activo (0171)' },
  { value: '0172', label: 'Bancamiga (0172)' },
  { value: '0173', label: 'Banco Internacional de Desarrollo (0173)' },
  { value: '0174', label: 'Banplus (0174)' },
  { value: '0175', label: 'Banco Digital de los Trabajadores / Bicentenario (0175)' },
  { value: '0177', label: 'Banfanb (0177)' },
  { value: '0178', label: 'N58 Banco Digital (0178)' },
  { value: '0191', label: 'Banco Nacional de Credito (0191)' },
]

function parseCedula(val: string | undefined): CedulaValue {
  if (!val) return { letter: 'V', digits: '' }
  const match = val.match(/^([VEGJP])(\d+)$/i)
  if (match) {
    return { letter: match[1]!.toUpperCase() as CedulaValue['letter'], digits: match[2] || '' }
  }
  return { letter: 'V', digits: val.replace(/\D/g, '') }
}

function parsePhone(rawPhone: string | undefined): { prefix: OperatorPrefix; digits: string } {
  if (!rawPhone) return { prefix: '412', digits: '' }
  const clean = rawPhone.replace(/\D/g, '')
  if (clean.startsWith('58')) {
    const rest = clean.slice(2)
    const prefix = rest.slice(0, 3) as OperatorPrefix
    if (['412', '422', '414', '424', '416', '426'].includes(prefix)) {
      return { prefix, digits: rest.slice(3, 10) }
    }
    return { prefix: '412', digits: rest }
  }
  if (clean.startsWith('0')) {
    const prefix = clean.slice(1, 4) as OperatorPrefix
    if (['412', '422', '414', '424', '416', '426'].includes(prefix)) {
      return { prefix, digits: clean.slice(4, 11) }
    }
    return { prefix: '412', digits: clean }
  }
  return { prefix: '412', digits: clean }
}

export default function BankDataPage() {
  const router = useRouter()
  const [accountId, setAccountId] = useState<string | null>(null)
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [documentPhoto, setDocumentPhoto] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [cedulaValue, setCedulaValue] = useState<CedulaValue>({ letter: 'V', digits: '' })

  const phoneFormat = usePhoneFormat()
  const [phoneCountryCode, setPhoneCountryCode] = useState<CountryCode>({
    code: 'VE',
    dial: '+58',
    flag: '🇻🇪',
    name: 'Venezuela',
  })
  const [phoneOperatorPrefix, setPhoneOperatorPrefix] = useState<OperatorPrefix>('412')

  useEffect(() => {
    const load = async () => {
      try {
        const accounts = await enterpriseService.listMyBankAccounts()
        if (accounts.length === 0) {
          setLoading(false)
          return
        }
        const acc = accounts[0]!
        setAccountId(acc.id)
        setBankCode(acc.bankCode)
        setAccountNumber(acc.accountNumber)

        const parsedCedula = parseCedula(acc.documentId)
        setCedulaValue(parsedCedula)

        const parsedPhone = parsePhone(acc.phoneNumber)
        setPhoneOperatorPrefix(parsedPhone.prefix)
        phoneFormat.setRawDigits(parsedPhone.digits)

        setDocumentPhoto(acc.documentPhoto)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos bancarios.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const handlePhotoChange = useCallback((files: FileList) => {
    const file = files[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDocumentPhoto(reader.result as string)
        setPhotoUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setError('Error al procesar la foto.')
      setPhotoUploading(false)
    }
  }, [])

  const handleClearPhoto = useCallback(() => {
    setDocumentPhoto(null)
  }, [])

  const handlePreviewPhoto = useCallback(() => {
    if (documentPhoto) setPhotoPreviewUrl(documentPhoto)
  }, [documentPhoto])

  const validate = (): boolean => {
    const errors: Record<string, boolean> = {}
    if (!bankCode) errors.bankCode = true
    if (!accountNumber || accountNumber.length < 20) errors.accountNumber = true
    if (!cedulaValue.digits || cedulaValue.digits.length < 7) errors.cedula = true
    if (!phoneFormat.rawDigits || phoneFormat.rawDigits.length < 7) errors.phoneNumber = true
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || !accountId) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const selectedBank = VENEZUELAN_BANKS.find((b) => b.value === bankCode)
      const fullPhone = `${phoneCountryCode.dial}${phoneOperatorPrefix}${phoneFormat.rawDigits}`
      const cedulaFull = `${cedulaValue.letter}${cedulaValue.digits}`
      await enterpriseService.updateMyBankAccount(accountId, {
        bankCode,
        bankName: selectedBank?.label || bankCode,
        accountNumber,
        phoneNumber: fullPhone,
        documentId: cedulaFull,
        documentPhoto,
      })

      setSuccess('Datos bancarios actualizados correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar datos bancarios.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-secondary" />
      </div>
    )
  }

  if (!accountId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="w-10 h-10 text-gray-300" strokeWidth={1} />
        <h2 className="text-lg font-semibold text-body">Sin cuenta bancaria</h2>
        <p className="text-sm text-body-muted">No tienes una cuenta bancaria registrada.</p>
        <Button onClick={() => router.push('/dashboard/person/onboarding')}>
          Completar registro bancario
        </Button>
      </div>
    )
  }

  const selectClass = `w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-body transition-all duration-200 outline-none focus:border-border-focus focus:ring-2 focus:ring-ring/20 appearance-none ${validationErrors.bankCode ? '!border-red-300 !ring-red-500/20' : ''}`

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Landmark className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-body">Mis datos bancarios</h1>
          <p className="text-sm text-body-muted">Administra tu cuenta bancaria registrada.</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Banco" required>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className={selectClass}
              >
                <option value="">Selecciona un banco</option>
                {VENEZUELAN_BANKS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Numero de cuenta" required>
              <Input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 20))}
                placeholder="01380000000000000000"
                hasError={validationErrors.accountNumber}
              />
              <p className="text-xs text-gray-400 mt-1">Minimo 20 digitos</p>
            </FormField>
          </div>

          <FormField label="Cedula de identidad" required>
            <CedulaInput
              value={cedulaValue}
              onChange={setCedulaValue}
              allowedLetters={['V', 'E', 'J', 'G', 'P'] as any}
            />
          </FormField>

          <FormField label="Telefono" required>
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

          <FormField label="Foto de la cedula (opcional)">
            <div className="w-full">
              {photoUploading ? (
                <div className="flex items-center gap-3 border border-secondary bg-secondary/5 rounded-xl p-4 w-full animate-pulse">
                  <Loader2 className="w-5 h-5 text-secondary animate-spin" />
                  <span className="text-sm font-medium text-secondary">Subiendo...</span>
                </div>
              ) : documentPhoto ? (
                <div className="flex items-center justify-between border border-green-200 bg-green-50/50 rounded-xl p-4 w-full">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-semibold text-green-800">Foto cargada</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handlePreviewPhoto}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors cursor-pointer"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4 text-secondary" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors cursor-pointer"
                      title="Reemplazar"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 border border-dashed border-gray-200 hover:border-secondary/40 hover:bg-gray-50/50 rounded-xl cursor-pointer transition-all duration-200 p-4 w-full"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files
                      if (files && files.length > 0) handlePhotoChange(files)
                    }}
                  />
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Upload className="w-3.5 h-3.5 text-body-muted" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-secondary truncate">Subir foto</span>
                    <span className="text-[10px] text-body-muted truncate">PNG, JPG o JPEG</span>
                  </div>
                </div>
              )}
            </div>
          </FormField>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {photoPreviewUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setPhotoPreviewUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden bg-white rounded-2xl p-2 shadow-2xl flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreviewUrl}
              alt="Visualizacion de documento"
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => setPhotoPreviewUrl(null)}
              className="mt-4 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
