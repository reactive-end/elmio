'use client'

import { Building2, FileText, UserCheck, Users, Landmark, Upload, ChevronRight, Check, SkipForward, Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { Alert } from '@/components/atoms/Alert/Alert'
import { FormField } from '@/components/molecules/FormField/FormField'
import { StepIndicator } from '@/components/molecules/StepIndicator/StepIndicator'
import { useOnboarding } from '@/src/hooks/pages/useOnboarding'
import type { CollaboratorInput, Shareholder } from '@/src/services/empresa.service'
import { useState, useRef, useEffect } from 'react'
import { PhoneInput } from '@/components/molecules/PhoneInput/PhoneInput'
import CedulaInput from '@/components/molecules/CedulaInput/CedulaInput'
import { usePhoneFormat } from '@/src/utils/usePhoneFormat'
import type { CountryCode, OperatorPrefix } from '@/components/molecules/PhoneInput/PhoneInput.d'
import type { CedulaValue } from '@/components/molecules/CedulaInput/CedulaInput.d'
import * as XLSX from 'xlsx'

const STEPS = [
  { id: 0, title: 'Empresa' },
  { id: 1, title: 'Documentos' },
  { id: 2, title: 'Representante' },
  { id: 3, title: 'Accionistas' },
  { id: 4, title: 'Cuentas' },
  { id: 5, title: 'Nomina' },
]

const STEP_KEYS = ['company-data', 'legal-docs', 'legal-rep', 'shareholders', 'bank-accounts', 'payroll'] as const
const STEP_MAP: Record<string, number> = Object.fromEntries(STEP_KEYS.map((k, i) => [k, i]))
const STEP_ICONS = [Building2, FileText, UserCheck, Users, Landmark, Upload]

const BANCOS = [
  { value: 'banesco', label: 'Banesco' },
  { value: 'mercantil', label: 'Mercantil' },
  { value: 'provincial', label: 'Provincial' },
  { value: 'venezuela', label: 'Venezuela' },
  { value: 'bnc', label: 'BNC' },
  { value: 'bod', label: 'BOD' },
  { value: 'bicentenario', label: 'Bicentenario' },
  { value: 'tesoro', label: 'Banco del Tesoro' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'fondo-comun', label: 'Fondo Comun' },
]

const SECTORES = [
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'salud', label: 'Salud' },
  { value: 'educacion', label: 'Educacion' },
  { value: 'comercio', label: 'Comercio' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'construccion', label: 'Construccion' },
  { value: 'manufactura', label: 'Manufactura' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'gobierno', label: 'Gobierno' },
  { value: 'otro', label: 'Otro' },
]

export default function OnboardingEnterprisePage() {
  const ob = useOnboarding()
  const currentStepNum = STEP_MAP[ob.step]
  const completedSteps = Array.from({ length: currentStepNum }, (_, i) => i)

  // --- Manejo y sincronización de RIF ---
  const [taxLetter, setTaxLetter] = useState('J')
  const [taxDigits, setTaxDigits] = useState('')

  useEffect(() => {
    if (ob.companyData.taxId) {
      const parts = ob.companyData.taxId.split('-')
      if (parts.length >= 2) {
        setTaxLetter(parts[0] || 'J')
        setTaxDigits(parts.slice(1).join('-'))
      } else {
        setTaxLetter(ob.companyData.taxId[0] || 'J')
        setTaxDigits(ob.companyData.taxId.slice(1))
      }
    }
  }, [ob.companyData.taxId])

  useEffect(() => {
    if (taxLetter && taxDigits) {
      const fullTaxId = `${taxLetter}-${taxDigits}`.trim()
      if (fullTaxId !== ob.companyData.taxId) {
        ob.setCompanyData({ ...ob.companyData, taxId: fullTaxId })
      }
    }
  }, [taxLetter, taxDigits])

  // --- Manejo y sincronización de Teléfono de la empresa ---
  const [companyCountryCode, setCompanyCountryCode] = useState<CountryCode>({
    code: 'VE',
    dial: '+58',
    flag: '🇻🇪',
    name: 'Venezuela',
  })
  const [companyOperatorPrefix, setCompanyOperatorPrefix] = useState<OperatorPrefix>('412')
  const { displayValue: companyPhoneDisplay, rawDigits: companyPhoneRaw, handleChange: handleCompanyPhoneChange } = usePhoneFormat()

  // Sincronizar el teléfono que viene de la base de datos al montar/cambiar
  useEffect(() => {
    if (ob.companyData.phone) {
      const phoneStr = ob.companyData.phone
      if (phoneStr.startsWith('+58')) {
        const rest = phoneStr.substring(3)
        const prefix = rest.substring(0, 3) as OperatorPrefix
        const num = rest.substring(3)
        
        setCompanyCountryCode({
          code: 'VE',
          dial: '+58',
          flag: '🇻🇪',
          name: 'Venezuela',
        })
        if (['412', '422', '414', '424', '416', '426'].includes(prefix)) {
          setCompanyOperatorPrefix(prefix)
        }
        
        // Simular evento para actualizar el rawDigits del hook
        const input = document.createElement('input')
        input.value = num
        handleCompanyPhoneChange({ target: input } as any)
      }
    }
  }, [ob.companyData.phone])

  // Actualizar ob.companyData.phone al cambiar partes
  useEffect(() => {
    if (companyPhoneRaw) {
      const fullPhone = `${companyCountryCode.dial}${companyOperatorPrefix}${companyPhoneRaw}`
      if (fullPhone !== ob.companyData.phone) {
        ob.setCompanyData({ ...ob.companyData, phone: fullPhone })
      }
    }
  }, [companyCountryCode, companyOperatorPrefix, companyPhoneRaw])

  const parseCedula = (val: string): CedulaValue => {
    if (!val) return { letter: 'V', digits: '' }
    const match = val.match(/^([VEG])(\d+)$/i)
    if (match) {
      return { letter: match[1]?.toUpperCase() as CedulaValue['letter'], digits: match[2] || '' }
    }
    return { letter: 'V', digits: val.replace(/\D/g, '') }
  }

  const repCedula = parseCedula(ob.legalRep.legalRepDocumentId)
  const mgrCedula = parseCedula(ob.legalRep.accountManagerDocumentId)

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 to-surface-muted flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary/10 mb-4">
            <Building2 className="w-8 h-8 text-secondary" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-body">Configura tu empresa</h1>
          <p className="text-sm text-body-muted mt-1">Completa la informacion para comenzar a operar en ElMio.</p>
        </div>

        <StepIndicator steps={STEPS} currentStep={currentStepNum} completedSteps={completedSteps} stepIcons={STEP_ICONS} onStepClick={() => {}} />

        <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 p-6 sm:p-8">
          {ob.error && <Alert type="error" message={ob.error} />}

          {/* Paso 1: Datos generales */}
          {ob.step === 'company-data' && (
            <form onSubmit={(e) => { e.preventDefault(); void ob.submitCompanyData() }} className="flex flex-col gap-5">
              <SectionHeader title="Datos de la empresa" subtitle="Ingresa la informacion general de tu empresa." />
              <FormField label="Razon Social" required><Input placeholder="Mi Empresa C.A." value={ob.companyData.companyName} onChange={(e) => ob.setCompanyData({ ...ob.companyData, companyName: e.target.value })} required /></FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="RIF" required>
                  <div className="flex gap-2 w-full">
                    <select
                      value={taxLetter}
                      onChange={(e) => setTaxLetter(e.target.value)}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-body transition-all duration-200 outline-none focus:border-border-focus focus:ring-2 focus:ring-ring/20 w-20 flex-shrink-0 appearance-none"
                    >
                      <option value="J">J</option>
                      <option value="G">G</option>
                      <option value="V">V</option>
                      <option value="E">E</option>
                    </select>
                    <Input
                      placeholder="12345678-2"
                      value={taxDigits}
                      onChange={(e) => setTaxDigits(e.target.value)}
                      required
                    />
                  </div>
                </FormField>
                <FormField label="Sector" required><Select options={SECTORES} placeholder="Seleccionar sector" value={ob.companyData.sector} onChange={(v) => ob.setCompanyData({ ...ob.companyData, sector: v })} /></FormField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Correo corporativo" required><Input type="email" placeholder="info@empresa.com" value={ob.companyData.email} onChange={(e) => ob.setCompanyData({ ...ob.companyData, email: e.target.value })} required /></FormField>
                <FormField label="Telefono de la empresa" required>
                  <PhoneInput
                    displayValue={companyPhoneDisplay}
                    onChange={handleCompanyPhoneChange}
                    countryCode={companyCountryCode}
                    onCountryCodeChange={setCompanyCountryCode}
                    operatorPrefix={companyOperatorPrefix}
                    onOperatorPrefixChange={setCompanyOperatorPrefix}
                  />
                </FormField>
              </div>
              <FormField label="Numero de empleados" required><Input type="number" placeholder="50" min="1" value={ob.companyData.employeeCount || ''} onChange={(e) => ob.setCompanyData({ ...ob.companyData, employeeCount: parseInt(e.target.value) || 0 })} required /></FormField>
              <Button type="submit" isLoading={ob.loading} fullWidth className="mt-2">Continuar <ChevronRight className="w-4 h-4" strokeWidth={2} /></Button>
            </form>
          )}

          {/* Paso 2: Documentos legales (Totalmente Opcional) */}
          {ob.step === 'legal-docs' && (
            <form onSubmit={(e) => { e.preventDefault(); void ob.submitLegalDocs() }} className="flex flex-col gap-5">
              <SectionHeader title="Documentos legales (Opcional)" subtitle="Sube los documentos de tu empresa si los tienes disponibles. Puedes continuar sin subir ninguno." />
              <FileUploader
                label="Foto del RIF vigente"
                multiple
                url={ob.legalDocs.taxIdPhoto}
                uploading={!!ob.uploading.taxIdPhoto}
                onUpload={(files) => {
                  Array.from(files).forEach(file => {
                    void ob.uploadDocFile(file, 'taxIdPhoto')
                  })
                }}
                onClear={() => ob.setLegalDocs({ ...ob.legalDocs, taxIdPhoto: [] })}
              />
              <FileUploader
                label="Foto del Acta Constitutiva"
                multiple
                url={ob.legalDocs.constitutiveActPhoto}
                uploading={!!ob.uploading.constitutiveActPhoto}
                onUpload={(files) => {
                  Array.from(files).forEach(file => {
                    void ob.uploadDocFile(file, 'constitutiveActPhoto')
                  })
                }}
                onClear={() => ob.setLegalDocs({ ...ob.legalDocs, constitutiveActPhoto: [] })}
              />
              <FileUploader
                label="Foto de la ultima Asamblea"
                multiple
                url={ob.legalDocs.lastAssemblyPhoto}
                uploading={!!ob.uploading.lastAssemblyPhoto}
                onUpload={(files) => {
                  Array.from(files).forEach(file => {
                    void ob.uploadDocFile(file, 'lastAssemblyPhoto')
                  })
                }}
                onClear={() => ob.setLegalDocs({ ...ob.legalDocs, lastAssemblyPhoto: [] })}
              />
              <FileUploader
                label="Foto de Recibo de servicio"
                multiple
                url={ob.legalDocs.serviceReceiptPhoto}
                uploading={!!ob.uploading.serviceReceiptPhoto}
                onUpload={(files) => {
                  Array.from(files).forEach(file => {
                    void ob.uploadDocFile(file, 'serviceReceiptPhoto')
                  })
                }}
                onClear={() => ob.setLegalDocs({ ...ob.legalDocs, serviceReceiptPhoto: [] })}
              />
              <FileUploader
                label="Estado de cuenta de los ultimos 3 meses"
                multiple
                url={ob.legalDocs.bankStatementsPhotos}
                uploading={!!ob.uploading.bankStatementsPhotos}
                onUpload={(files) => void ob.uploadMultipleDocs(files, 'bankStatementsPhotos')}
                onClear={() => ob.setLegalDocs({ ...ob.legalDocs, bankStatementsPhotos: [] })}
              />
              <FileUploader
                label="Referencia Bancaria"
                multiple
                url={ob.legalDocs.bankReferencePhotos}
                uploading={!!ob.uploading.bankReferencePhotos}
                onUpload={(files) => void ob.uploadMultipleDocs(files, 'bankReferencePhotos')}
                onClear={() => ob.setLegalDocs({ ...ob.legalDocs, bankReferencePhotos: [] })}
              />
              <Button
                type="submit"
                isLoading={ob.loading}
                fullWidth
                className="mt-2"
              >
                Continuar <ChevronRight className="w-4 h-4" strokeWidth={2} />
              </Button>
            </form>
          )}

          {/* Paso 3: Representante legal + encargado + web/redes */}
          {ob.step === 'legal-rep' && (
            <form onSubmit={(e) => { e.preventDefault(); void ob.submitLegalRep() }} className="flex flex-col gap-6">
              <SectionHeader title="Representante Legal" subtitle="Datos del representante legal y encargado de cuenta." />
              
              <div className="space-y-5">
                {/* Bloque Representante Legal */}
                <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/30 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                      <UserCheck className="w-5 h-5 text-secondary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-body">Representante Legal</h3>
                      <p className="text-xs text-body-muted">Ingresa la cédula de identidad y su soporte fotográfico legible.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <FormField label="Cedula del Representante Legal" required>
                      <CedulaInput
                        value={repCedula}
                        onChange={(val) => ob.setLegalRep({ ...ob.legalRep, legalRepDocumentId: `${val.letter}${val.digits}` })}
                      />
                    </FormField>
                    <FileUploader
                      label="Foto cédula Rep. Legal"
                      compact
                      url={ob.legalRep.legalRepDocumentPhoto}
                      uploading={!!ob.uploading.legalRepDocumentPhoto}
                      onUpload={(files) => {
                        const file = files[0]
                        if (file) void ob.uploadLegalRepFile(file, 'legalRepDocumentPhoto')
                      }}
                      onClear={() => ob.setLegalRep({ ...ob.legalRep, legalRepDocumentPhoto: '' })}
                    />
                  </div>
                </div>

                {/* Bloque Encargado de Cuenta */}
                <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/30 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-secondary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-body">Encargado de Cuenta</h3>
                      <p className="text-xs text-body-muted">Persona responsable de administrar el portal financiero y cuentas de la empresa.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <FormField label="Cedula del Encargado de Cuenta" required>
                      <CedulaInput
                        value={mgrCedula}
                        onChange={(val) => ob.setLegalRep({ ...ob.legalRep, accountManagerDocumentId: `${val.letter}${val.digits}` })}
                      />
                    </FormField>
                    <FileUploader
                      label="Foto cédula Encargado"
                      compact
                      url={ob.legalRep.accountManagerDocumentPhoto}
                      uploading={!!ob.uploading.accountManagerDocumentPhoto}
                      onUpload={(files) => {
                        const file = files[0]
                        if (file) void ob.uploadLegalRepFile(file, 'accountManagerDocumentPhoto')
                      }}
                      onClear={() => ob.setLegalRep({ ...ob.legalRep, accountManagerDocumentPhoto: '' })}
                    />
                  </div>
                </div>
              </div>
              <hr className="border-gray-100" />
              <p className="text-sm font-medium text-body-muted">Presencia digital (opcional)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Pagina web"><Input placeholder="https://miempresa.com" value={ob.legalRep.website} onChange={(e) => ob.setLegalRep({ ...ob.legalRep, website: e.target.value })} /></FormField>
                <FormField label="Ubicacion Google Maps"><Input placeholder="Link de Google Maps" value={ob.legalRep.headquartersLocation} onChange={(e) => ob.setLegalRep({ ...ob.legalRep, headquartersLocation: e.target.value })} /></FormField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Instagram"><Input placeholder="@miempresa" value={ob.legalRep.socialMediaInstagram} onChange={(e) => ob.setLegalRep({ ...ob.legalRep, socialMediaInstagram: e.target.value })} /></FormField>
                <FormField label="Facebook"><Input placeholder="facebook.com/miempresa" value={ob.legalRep.socialMediaFacebook} onChange={(e) => ob.setLegalRep({ ...ob.legalRep, socialMediaFacebook: e.target.value })} /></FormField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="LinkedIn"><Input placeholder="linkedin.com/company/miempresa" value={ob.legalRep.socialMediaLinkedin} onChange={(e) => ob.setLegalRep({ ...ob.legalRep, socialMediaLinkedin: e.target.value })} /></FormField>
                <FormField label="TikTok"><Input placeholder="@miempresa" value={ob.legalRep.socialMediaTiktok} onChange={(e) => ob.setLegalRep({ ...ob.legalRep, socialMediaTiktok: e.target.value })} /></FormField>
              </div>
              <Button
                type="submit"
                isLoading={ob.loading}
                disabled={
                  !ob.legalRep.legalRepDocumentId ||
                  !ob.legalRep.accountManagerDocumentId
                }
                fullWidth
                className="mt-2"
              >
                Continuar <ChevronRight className="w-4 h-4" strokeWidth={2} />
              </Button>
            </form>
          )}

          {/* Paso 4: Accionistas (100% Opcional) */}
          {ob.step === 'shareholders' && (
            <form onSubmit={(e) => { e.preventDefault(); void ob.submitShareholders() }} className="flex flex-col gap-5">
              <SectionHeader title="Accionistas (Opcional)" subtitle="Registra los datos de cada accionista de la empresa. Puedes continuar sin ingresar accionistas." />
              <FormField label="Número de accionistas">
                <Input type="number" min="1" max="20" value={ob.shareholderCount} onChange={(e) => {
                  const n = Math.max(1, parseInt(e.target.value) || 1)
                  ob.setShareholderCount(n)
                  const current = [...ob.shareholders]
                  while (current.length < n) current.push({ name: '', lastName: '', documentId: '', documentPhoto: '', phone: '', email: '' })
                  ob.setShareholders(current.slice(0, n))
                }} />
              </FormField>
              {ob.shareholders.map((sh, idx) => (
                <ShareholderFields
                  key={idx}
                  index={idx}
                  shareholder={sh}
                  uploading={!!ob.uploading.shareholders?.[idx]}
                  onUploadPhoto={(file) => void ob.uploadShareholderFile(file, idx)}
                  onChange={(updated) => {
                    const copy = [...ob.shareholders]
                    copy[idx] = updated
                    ob.setShareholders(copy)
                  }}
                />
              ))}
              <Button
                type="submit"
                isLoading={ob.loading}
                fullWidth
                className="mt-2"
              >
                Continuar <ChevronRight className="w-4 h-4" strokeWidth={2} />
              </Button>
            </form>
          )}

          {/* Paso 5: Cuentas bancarias (100% Opcional) */}
          {ob.step === 'bank-accounts' && (
            <form onSubmit={(e) => { e.preventDefault(); void ob.submitBankAccounts() }} className="flex flex-col gap-5">
              <SectionHeader title="Cuentas bancarias (Opcional)" subtitle="Registra hasta 3 cuentas bancarias de la empresa. Puedes continuar sin ingresar cuentas." />
              {ob.bankAccounts.map((acc, idx) => (
                <div key={idx} className="p-5 border border-gray-100 rounded-2xl bg-gray-50/20 space-y-4 shadow-sm shadow-black/2">
                  <div className="flex items-center justify-between border-b border-gray-100/50 pb-2">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-secondary" strokeWidth={1.5} />
                      <p className="text-sm font-semibold text-body">Cuenta {idx + 1}</p>
                    </div>
                    {ob.bankAccounts.length > 1 && (
                      <button type="button" onClick={() => ob.setBankAccounts(ob.bankAccounts.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {/* Fila 1: Banco, Tipo y Número de Cuenta */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField label="Banco"><Select options={BANCOS} placeholder="Seleccionar" value={acc.bank} onChange={(v) => { const c = [...ob.bankAccounts]; c[idx] = { ...acc, bank: v }; ob.setBankAccounts(c) }} /></FormField>
                      <FormField label="Tipo"><Select options={[{ value: 'checking', label: 'Corriente' }, { value: 'savings', label: 'Ahorro' }]} value={acc.accountType} onChange={(v) => { const c = [...ob.bankAccounts]; c[idx] = { ...acc, accountType: v as 'checking' | 'savings' }; ob.setBankAccounts(c) }} /></FormField>
                      <FormField label="Número de cuenta"><Input placeholder="01340000000000000000" value={acc.accountNumber} onChange={(e) => { const c = [...ob.bankAccounts]; c[idx] = { ...acc, accountNumber: e.target.value }; ob.setBankAccounts(c) }} /></FormField>
                    </div>
                    
                    {/* Fila 2: Teléfono Asociado */}
                    <div className="grid grid-cols-1 gap-4">
                      <FormField label="Teléfono asociado">
                        {(() => {
                          let dial = '+58'
                          let code = 'VE'
                          let prefix: OperatorPrefix = '414'
                          let num = ''

                          const rawPhone = acc.phone || ''
                          if (rawPhone.startsWith('+58')) {
                            const rest = rawPhone.substring(3)
                            const prf = rest.substring(0, 3) as OperatorPrefix
                            num = rest.substring(3)
                            if (['412', '422', '414', '424', '416', '426'].includes(prf)) {
                              prefix = prf
                            }
                          } else if (rawPhone.startsWith('0')) {
                            const prf = rawPhone.substring(1, 4) as OperatorPrefix
                            num = rawPhone.substring(4)
                            if (['412', '422', '414', '424', '416', '426'].includes(prf)) {
                              prefix = prf
                            }
                          } else if (rawPhone.length > 7) {
                            const prf = rawPhone.substring(0, 3) as OperatorPrefix
                            num = rawPhone.substring(3)
                            if (['412', '422', '414', '424', '416', '426'].includes(prf)) {
                              prefix = prf
                            }
                          } else {
                            num = rawPhone
                          }

                          const cleanNum = num.replace(/\D/g, '').substring(0, 7)
                          const displayVal = cleanNum.length > 3 ? `${cleanNum.substring(0, 3)} ${cleanNum.substring(3, 7)}` : cleanNum

                          return (
                            <PhoneInput
                              displayValue={displayVal}
                              onChange={(e) => {
                                const valDigits = e.target.value.replace(/\D/g, '').substring(0, 7)
                                const c = [...ob.bankAccounts]
                                c[idx] = { ...acc, phone: `${dial}${prefix}${valDigits}` }
                                ob.setBankAccounts(c)
                              }}
                              countryCode={{ code, dial, flag: '🇻🇪', name: 'Venezuela' }}
                              onCountryCodeChange={() => {}}
                              operatorPrefix={prefix}
                              onOperatorPrefixChange={(newPrefix) => {
                                const c = [...ob.bankAccounts]
                                c[idx] = { ...acc, phone: `${dial}${newPrefix}${cleanNum}` }
                                ob.setBankAccounts(c)
                              }}
                            />
                          )
                        })()}
                      </FormField>
                    </div>
                  </div>
                </div>
              ))}
              {ob.bankAccounts.length < 3 && (
                <button type="button" onClick={() => ob.setBankAccounts([...ob.bankAccounts, { accountNumber: '', accountType: 'checking', bank: '', phone: '' }])} className="flex items-center gap-2 text-sm text-secondary hover:text-secondary-dark font-medium w-fit mt-1">
                  <Plus className="w-4 h-4" /> Agregar otra cuenta
                </button>
              )}
              <Button
                type="submit"
                isLoading={ob.loading}
                fullWidth
                className="mt-2"
              >
                Continuar <ChevronRight className="w-4 h-4" strokeWidth={2} />
              </Button>
            </form>
          )}

          {/* Paso 6: Nomina */}
          {ob.step === 'payroll' && (
            <PayrollStep loading={ob.loading} payrollItems={ob.payrollItems} setPayrollItems={ob.setPayrollItems} submitPayroll={ob.submitPayroll} skipPayroll={ob.skipPayroll} />
          )}
        </div>
      </div>
    </div>
  )
}

interface ShareholderFieldsProps {
  index: number
  shareholder: Shareholder
  uploading: boolean
  onUploadPhoto: (file: File) => void
  onChange: (s: Shareholder) => void
}

function ShareholderFields({
  index,
  shareholder,
  uploading,
  onUploadPhoto,
  onChange,
}: ShareholderFieldsProps) {
  const upd = (field: keyof Shareholder, value: any) => onChange({ ...shareholder, [field]: value })
  return (
    <div className="p-5 border border-gray-100 rounded-2xl bg-gray-50/20 space-y-4 shadow-sm shadow-black/2">
      <div className="flex items-center gap-2 border-b border-gray-100/50 pb-2">
        <Users className="w-4 h-4 text-secondary" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-body">Accionista {index + 1}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nombre"><Input placeholder="Juan" value={shareholder.name} onChange={(e) => upd('name', e.target.value)} /></FormField>
        <FormField label="Apellido"><Input placeholder="Perez" value={shareholder.lastName} onChange={(e) => upd('lastName', e.target.value)} /></FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <FormField label="Cédula">
          <CedulaInput
            value={(() => {
              if (!shareholder.documentId) return { letter: 'V', digits: '' }
              const match = shareholder.documentId.match(/^([VEG])(\d+)$/i)
              if (match) {
                return { letter: match[1]?.toUpperCase() as CedulaValue['letter'], digits: match[2] || '' }
              }
              return { letter: 'V', digits: shareholder.documentId.replace(/\D/g, '') }
            })()}
            onChange={(val) => upd('documentId', `${val.letter}${val.digits}`)}
          />
        </FormField>
        <FileUploader
          label="Foto cédula"
          compact
          url={shareholder.documentPhoto}
          uploading={uploading}
          onUpload={(files) => {
            const file = files[0]
            if (file) void onUploadPhoto(file)
          }}
          onClear={() => upd('documentPhoto', '')}
        />
      </div>
      <div className="grid grid-cols-1 gap-4">
        <FormField label="Teléfono">
          {(() => {
            let dial = '+58'
            let code = 'VE'
            let prefix: OperatorPrefix = '414'
            let num = ''

            const rawPhone = shareholder.phone || ''
            if (rawPhone.startsWith('+58')) {
              const rest = rawPhone.substring(3)
              const prf = rest.substring(0, 3) as OperatorPrefix
              num = rest.substring(3)
              if (['412', '422', '414', '424', '416', '426'].includes(prf)) {
                prefix = prf
              }
            } else if (rawPhone.startsWith('0')) {
              const prf = rawPhone.substring(1, 4) as OperatorPrefix
              num = rawPhone.substring(4)
              if (['412', '422', '414', '424', '416', '426'].includes(prf)) {
                prefix = prf
              }
            } else if (rawPhone.length > 7) {
              const prf = rawPhone.substring(0, 3) as OperatorPrefix
              num = rawPhone.substring(3)
              if (['412', '422', '414', '424', '416', '426'].includes(prf)) {
                prefix = prf
              }
            } else {
              num = rawPhone
            }

            const cleanNum = num.replace(/\D/g, '').substring(0, 7)
            const displayVal = cleanNum.length > 3 ? `${cleanNum.substring(0, 3)} ${cleanNum.substring(3, 7)}` : cleanNum

            return (
              <PhoneInput
                displayValue={displayVal}
                onChange={(e) => {
                  const valDigits = e.target.value.replace(/\D/g, '').substring(0, 7)
                  upd('phone', `${dial}${prefix}${valDigits}`)
                }}
                countryCode={{ code, dial, flag: '🇻🇪', name: 'Venezuela' }}
                onCountryCodeChange={() => {}}
                operatorPrefix={prefix}
                onOperatorPrefixChange={(newPrefix) => {
                  upd('phone', `${dial}${newPrefix}${cleanNum}`)
                }}
              />
            )
          })()}
        </FormField>
        <FormField label="Correo"><Input type="email" placeholder="accionista@email.com" value={shareholder.email} onChange={(e) => upd('email', e.target.value)} /></FormField>
      </div>
    </div>
  )
}

function PayrollStep({ loading, payrollItems, setPayrollItems, submitPayroll, skipPayroll }: { loading: boolean; payrollItems: CollaboratorInput[]; setPayrollItems: (i: CollaboratorInput[]) => void; submitPayroll: () => Promise<void>; skipPayroll: () => Promise<void> }) {
  const [dragActive, setDragActive] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setParseError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) return

        // Leer el archivo con SheetJS (soporta array para xlsx/xls y texto para csv)
        const workbook = XLSX.read(data, { type: 'array', cellDates: false })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) throw new Error('El archivo no contiene hojas legibles.')

        const sheet = workbook.Sheets[sheetName]
        if (!sheet) throw new Error('La hoja de cálculo está vacía.')

        // Convertir hoja a JSON
        const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' })
        if (rawRows.length === 0) throw new Error('El archivo no contiene filas de datos de nómina.')

        // Función helper para normalizar fechas de Excel seriales o strings
        const parseDateVal = (val: any): string => {
          if (!val) return ''
          if (typeof val === 'number') {
            try {
              const utc_days = Math.floor(val - 25569);
              const utc_value = utc_days * 86400;
              const date_info = new Date(utc_value * 1000);
              const yyyy = date_info.getUTCFullYear();
              let mm: string | number = date_info.getUTCMonth() + 1;
              let dd: string | number = date_info.getUTCDate();
              if (mm < 10) mm = `0${mm}`;
              if (dd < 10) dd = `0${dd}`;
              return `${yyyy}-${mm}-${dd}`;
            } catch {
              return String(val);
            }
          }
          return String(val).trim();
        }

        const mappedRows: CollaboratorInput[] = []
        for (let idx = 0; idx < rawRows.length; idx++) {
          const row = rawRows[idx]

          // Extraer campos buscando tanto nombres en español de nomina.xlsx como claves de DTO en inglés
          const docType = (row['Tipo Documento'] ?? row['documentType'] ?? '').toString().trim()
          const docId = (row['Cédula / Documento'] ?? row['documentId'] ?? '').toString().trim()
          const name = (row['Nombres'] ?? row['name'] ?? '').toString().trim()
          const lastName = (row['Apellidos'] ?? row['lastName'] ?? '').toString().trim()
          const email = (row['Correo Electrónico'] ?? row['email'] ?? '').toString().trim()
          const phone = (row['Teléfono'] ?? row['phone'] ?? '').toString().trim()

          // Si es una fila totalmente vacía o de totales (sin Cédula, Nombres ni Correo),
          // la omitimos silenciosamente (ej: filas de totales o vacías al final de nomina.xlsx)
          if (!docId && !name && !email) {
            continue
          }

          if (!docType || !docId || !name || !email) {
            throw new Error(`Fila ${idx + 2} inválida: Los campos Tipo Documento, Cédula, Nombres y Correo son requeridos.`)
          }

          const birthDate = parseDateVal(row['Fecha de Nacimiento'] ?? row['birthDate'])
          const gender = (row['Género'] ?? row['gender'] ?? '').toString().trim()
          const civilStatus = (row['Estado Civil'] ?? row['civilStatus'] ?? '').toString().trim()
          const address = (row['Dirección'] ?? row['address'] ?? '').toString().trim()
          const country = (row['País de Origen'] ?? row['countryOfOrigin'] ?? '').toString().trim()
          const dependents = parseInt(row['Cargas Familiares'] ?? row['familyDependents'] ?? 0) || 0
          const startDate = parseDateVal(row['Fecha de Ingreso'] ?? row['startDate'])
          const dept = (row['Departamento'] ?? row['department'] ?? '').toString().trim()
          const position = (row['Cargo'] ?? row['position'] ?? '').toString().trim()
          const salary = parseFloat(row['Salario Mensual ($)'] ?? row['baseSalary'] ?? 0) || 0
          const loanLimit = parseFloat(row['Límite Mensual de Crédito ($)'] ?? row['maxLoanLimit'] ?? 0) || 0

          mappedRows.push({
            documentType: docType,
            documentId: docId,
            name: name,
            lastName: lastName,
            email: email,
            phone: phone,
            birthDate: birthDate,
            gender: gender,
            civilStatus: civilStatus,
            address: address,
            countryOfOrigin: country,
            familyDependents: dependents,
            startDate: startDate,
            department: dept,
            position: position,
            baseSalary: salary,
            maxLoanLimit: loanLimit,
          })
        }

        setPayrollItems(mappedRows)
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Error al leer el archivo de nómina.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Carga de nomina" subtitle="Sube un archivo CSV/Excel con los datos de tus colaboradores. Este paso es opcional." />
      {parseError && <Alert type="error" message={parseError} />}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file) }}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer ${dragActive ? 'border-secondary bg-secondary/5 scale-[1.01]' : 'border-gray-200 hover:border-secondary/40 hover:bg-gray-50'}`}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file) }} />
        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center"><Upload className="w-6 h-6 text-secondary" strokeWidth={1.5} /></div>
        <p className="text-sm text-body-secondary text-center"><span className="font-medium text-secondary">Haz clic o arrastra</span> un archivo Excel (XLSX/XLS) o CSV aquí</p>
        <p className="text-xs text-body-muted">Mapeo de columnas: Tipo Documento, Cédula / Documento, Nombres, Apellidos, Correo Electrónico, Teléfono, Fecha de Nacimiento, Género, Estado Civil, Dirección, País de Origen, Cargas Familiares, Fecha de Ingreso, Departamento, Cargo, Salario Mensual ($), Límite Mensual de Crédito ($)</p>
      </div>
      {payrollItems.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-body-secondary"><Check className="w-4 h-4 inline text-green-500 mr-1" strokeWidth={2} />{payrollItems.length} colaboradores detectados</p>
            <button type="button" onClick={() => setPayrollItems([])} className="text-xs text-red-500 hover:text-red-700 font-medium">Limpiar</button>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0"><tr><th className="px-3 py-2 text-left font-medium text-body-muted">Nombre</th><th className="px-3 py-2 text-left font-medium text-body-muted">Apellido</th><th className="px-3 py-2 text-left font-medium text-body-muted">Cedula</th><th className="px-3 py-2 text-left font-medium text-body-muted">Cargo</th><th className="px-3 py-2 text-right font-medium text-body-muted">Limite</th></tr></thead>
              <tbody>{payrollItems.map((item, idx) => (<tr key={idx} className="border-t border-gray-50"><td className="px-3 py-2 text-body">{item.name}</td><td className="px-3 py-2 text-body">{item.lastName}</td><td className="px-3 py-2 text-body-muted">{item.documentId}</td><td className="px-3 py-2 text-body-muted">{item.position}</td><td className="px-3 py-2 text-right text-body-muted">${item.maxLoanLimit}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        {payrollItems.length > 0 && (<Button type="button" isLoading={loading} fullWidth onClick={() => void submitPayroll()}>Subir nomina y finalizar <Check className="w-4 h-4" strokeWidth={2} /></Button>)}
        <Button type="button" variant="ghost" isLoading={loading} fullWidth onClick={() => void skipPayroll()}><SkipForward className="w-4 h-4" strokeWidth={1.5} /> Omitir por ahora</Button>
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-lg font-semibold text-body">{title}</h2>
      <p className="text-sm text-body-muted mt-0.5">{subtitle}</p>
    </div>
  )
}

interface FileUploaderProps {
  label: string
  required?: boolean
  accept?: string
  multiple?: boolean
  url: string | string[]
  uploading: boolean
  onUpload: (files: FileList) => void
  onClear: () => void
  compact?: boolean
}

function FileUploader({
  label,
  required = false,
  accept = 'image/*,.pdf',
  multiple = false,
  url,
  uploading,
  onUpload,
  onClear,
  compact = false
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const hasValue = multiple 
    ? Array.isArray(url) && url.length > 0 
    : typeof url === 'string' && url.length > 0

  return (
    <FormField label={label} required={required}>
      <div className="relative mt-1">
        {uploading ? (
          <div className={`flex items-center gap-3 border border-secondary bg-secondary/5 rounded-xl animate-pulse ${compact ? 'h-[46px] px-3.5' : 'p-4'}`}>
            <Loader2 className="w-5 h-5 text-secondary animate-spin" />
            <span className="text-sm font-medium text-secondary">Subiendo...</span>
          </div>
        ) : hasValue ? (
          <div className={`flex items-center justify-between border border-green-200 bg-green-50/50 rounded-xl ${compact ? 'h-[46px] px-3.5' : 'p-4'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col min-w-0">
                {!compact && (
                  <span className="text-xs font-semibold text-green-800">
                    {multiple ? 'Documentos cargados' : 'Documento cargado con éxito'}
                  </span>
                )}
                <span className="text-xs text-body font-medium truncate max-w-[120px] sm:max-w-[200px]">
                  {multiple 
                    ? `${(url as string[]).length} archivo(s)` 
                    : (url as string).split('/').pop()
                  }
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors shrink-0 px-2 py-1"
            >
              Reemplazar
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-3 border border-dashed border-gray-200 hover:border-secondary/40 hover:bg-gray-50/50 rounded-xl cursor-pointer transition-all duration-200 ${compact ? 'h-[46px] px-3.5' : 'p-4'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              className="hidden"
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  onUpload(files)
                }
              }}
            />
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Upload className="w-3.5 h-3.5 text-body-muted" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-secondary truncate">
                Subir foto
              </span>
              {!compact ? (
                <span className="text-[10px] text-body-muted truncate">PNG, JPG, JPEG o PDF</span>
              ) : (
                <span className="text-[10px] text-body-muted truncate">Haz clic para buscar</span>
              )}
            </div>
          </div>
        )}
      </div>
    </FormField>
  )
}

