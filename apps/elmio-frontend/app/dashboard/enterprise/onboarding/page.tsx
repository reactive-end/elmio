'use client'

import { Building2, FileText, UserCheck, Users, Landmark, Upload, ChevronRight, Check, SkipForward, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { Alert } from '@/components/atoms/Alert/Alert'
import { FormField } from '@/components/molecules/FormField/FormField'
import { StepIndicator } from '@/components/molecules/StepIndicator/StepIndicator'
import { useOnboarding } from '@/src/hooks/pages/useOnboarding'
import type { CollaboratorInput, Shareholder } from '@/src/services/empresa.service'
import { useState, useRef } from 'react'

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
                <FormField label="RIF" required><Input placeholder="J-12345678-9" value={ob.companyData.taxId} onChange={(e) => ob.setCompanyData({ ...ob.companyData, taxId: e.target.value })} required /></FormField>
                <FormField label="Sector" required><Select options={SECTORES} placeholder="Seleccionar sector" value={ob.companyData.sector} onChange={(v) => ob.setCompanyData({ ...ob.companyData, sector: v })} /></FormField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Correo corporativo" required><Input type="email" placeholder="info@empresa.com" value={ob.companyData.email} onChange={(e) => ob.setCompanyData({ ...ob.companyData, email: e.target.value })} required /></FormField>
                <FormField label="Telefono de la empresa" required><Input placeholder="02121234567" value={ob.companyData.phone} onChange={(e) => ob.setCompanyData({ ...ob.companyData, phone: e.target.value })} required /></FormField>
              </div>
              <FormField label="Numero de empleados" required><Input type="number" placeholder="50" min="1" value={ob.companyData.employeeCount || ''} onChange={(e) => ob.setCompanyData({ ...ob.companyData, employeeCount: parseInt(e.target.value) || 0 })} required /></FormField>
              <Button type="submit" isLoading={ob.loading} fullWidth className="mt-2">Continuar <ChevronRight className="w-4 h-4" strokeWidth={2} /></Button>
            </form>
          )}

          {/* Paso 2: Documentos legales */}
          {ob.step === 'legal-docs' && (
            <form onSubmit={(e) => { e.preventDefault(); void ob.submitLegalDocs() }} className="flex flex-col gap-5">
              <SectionHeader title="Documentos legales" subtitle="Sube los documentos requeridos para la verificacion." />
              <FormField label="Foto del RIF vigente" required><Input type="file" accept="image/*,.pdf" onChange={() => ob.setLegalDocs({ ...ob.legalDocs, taxIdPhoto: 'uploaded' })} /></FormField>
              <FormField label="Foto del Acta Constitutiva" required><Input type="file" accept="image/*,.pdf" onChange={() => ob.setLegalDocs({ ...ob.legalDocs, constitutiveActPhoto: 'uploaded' })} /></FormField>
              <FormField label="Foto de la ultima Asamblea" required><Input type="file" accept="image/*,.pdf" onChange={() => ob.setLegalDocs({ ...ob.legalDocs, lastAssemblyPhoto: 'uploaded' })} /></FormField>
              <FormField label="Foto de Recibo de servicio" required><Input type="file" accept="image/*,.pdf" onChange={() => ob.setLegalDocs({ ...ob.legalDocs, serviceReceiptPhoto: 'uploaded' })} /></FormField>
              <FormField label="Estado de cuenta de los ultimos 3 meses" required><Input type="file" accept="image/*,.pdf" multiple onChange={() => ob.setLegalDocs({ ...ob.legalDocs, bankStatementsPhotos: ['uploaded'] })} /></FormField>
              <FormField label="Referencia Bancaria" required><Input type="file" accept="image/*,.pdf" multiple onChange={() => ob.setLegalDocs({ ...ob.legalDocs, bankReferencePhotos: ['uploaded'] })} /></FormField>
              <Button type="submit" isLoading={ob.loading} fullWidth className="mt-2">Continuar <ChevronRight className="w-4 h-4" strokeWidth={2} /></Button>
            </form>
          )}

          {/* Paso 3: Representante legal + encargado + web/redes */}
          {ob.step === 'legal-rep' && (
            <form onSubmit={(e) => { e.preventDefault(); void ob.submitLegalRep() }} className="flex flex-col gap-5">
              <SectionHeader title="Representante Legal" subtitle="Datos del representante legal y encargado de cuenta." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Cedula del Representante Legal" required><Input placeholder="V12345678" value={ob.legalRep.legalRepDocumentId} onChange={(e) => ob.setLegalRep({ ...ob.legalRep, legalRepDocumentId: e.target.value })} required /></FormField>
                <FormField label="Foto cedula Rep. Legal" required><Input type="file" accept="image/*,.pdf" onChange={() => ob.setLegalRep({ ...ob.legalRep, legalRepDocumentPhoto: 'uploaded' })} /></FormField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Cedula del Encargado de Cuenta" required><Input placeholder="V12345678" value={ob.legalRep.accountManagerDocumentId} onChange={(e) => ob.setLegalRep({ ...ob.legalRep, accountManagerDocumentId: e.target.value })} required /></FormField>
                <FormField label="Foto cedula Encargado" required><Input type="file" accept="image/*,.pdf" onChange={() => ob.setLegalRep({ ...ob.legalRep, accountManagerDocumentPhoto: 'uploaded' })} /></FormField>
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
              <Button type="submit" isLoading={ob.loading} fullWidth className="mt-2">Continuar <ChevronRight className="w-4 h-4" strokeWidth={2} /></Button>
            </form>
          )}

          {/* Paso 4: Accionistas */}
          {ob.step === 'shareholders' && (
            <form onSubmit={(e) => { e.preventDefault(); void ob.submitShareholders() }} className="flex flex-col gap-5">
              <SectionHeader title="Accionistas" subtitle="Registra los datos de cada accionista de la empresa." />
              <FormField label="Numero de accionistas" required>
                <Input type="number" min="1" max="20" value={ob.shareholderCount} onChange={(e) => {
                  const n = Math.max(1, parseInt(e.target.value) || 1)
                  ob.setShareholderCount(n)
                  const current = [...ob.shareholders]
                  while (current.length < n) current.push({ name: '', lastName: '', documentId: '', documentPhoto: '', phone: '', email: '' })
                  ob.setShareholders(current.slice(0, n))
                }} />
              </FormField>
              {ob.shareholders.map((sh, idx) => (
                <ShareholderFields key={idx} index={idx} shareholder={sh} onChange={(updated) => {
                  const copy = [...ob.shareholders]
                  copy[idx] = updated
                  ob.setShareholders(copy)
                }} />
              ))}
              <Button type="submit" isLoading={ob.loading} fullWidth className="mt-2">Continuar <ChevronRight className="w-4 h-4" strokeWidth={2} /></Button>
            </form>
          )}

          {/* Paso 5: Cuentas bancarias */}
          {ob.step === 'bank-accounts' && (
            <form onSubmit={(e) => { e.preventDefault(); void ob.submitBankAccounts() }} className="flex flex-col gap-5">
              <SectionHeader title="Cuentas bancarias" subtitle="Registra hasta 3 cuentas bancarias de la empresa." />
              {ob.bankAccounts.map((acc, idx) => (
                <div key={idx} className="p-4 border border-gray-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-body">Cuenta {idx + 1}</p>
                    {ob.bankAccounts.length > 1 && (
                      <button type="button" onClick={() => ob.setBankAccounts(ob.bankAccounts.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label="Banco" required><Select options={BANCOS} placeholder="Seleccionar" value={acc.bank} onChange={(v) => { const c = [...ob.bankAccounts]; c[idx] = { ...acc, bank: v }; ob.setBankAccounts(c) }} /></FormField>
                    <FormField label="Tipo" required><Select options={[{ value: 'checking', label: 'Corriente' }, { value: 'savings', label: 'Ahorro' }]} value={acc.accountType} onChange={(v) => { const c = [...ob.bankAccounts]; c[idx] = { ...acc, accountType: v as 'checking' | 'savings' }; ob.setBankAccounts(c) }} /></FormField>
                    <FormField label="Numero de cuenta" required><Input placeholder="01340000000000000000" value={acc.accountNumber} onChange={(e) => { const c = [...ob.bankAccounts]; c[idx] = { ...acc, accountNumber: e.target.value }; ob.setBankAccounts(c) }} required /></FormField>
                  </div>
                </div>
              ))}
              {ob.bankAccounts.length < 3 && (
                <button type="button" onClick={() => ob.setBankAccounts([...ob.bankAccounts, { accountNumber: '', accountType: 'checking', bank: '' }])} className="flex items-center gap-2 text-sm text-secondary hover:text-secondary-dark font-medium">
                  <Plus className="w-4 h-4" /> Agregar otra cuenta
                </button>
              )}
              <Button type="submit" isLoading={ob.loading} fullWidth className="mt-2">Continuar <ChevronRight className="w-4 h-4" strokeWidth={2} /></Button>
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

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-lg font-semibold text-body">{title}</h2>
      <p className="text-sm text-body-muted mt-0.5">{subtitle}</p>
    </div>
  )
}

function ShareholderFields({ index, shareholder, onChange }: { index: number; shareholder: Shareholder; onChange: (s: Shareholder) => void }) {
  const upd = (field: keyof Shareholder, value: string) => onChange({ ...shareholder, [field]: value })
  return (
    <div className="p-4 border border-gray-100 rounded-xl space-y-3">
      <p className="text-sm font-medium text-body">Accionista {index + 1}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Nombre" required><Input placeholder="Juan" value={shareholder.name} onChange={(e) => upd('name', e.target.value)} required /></FormField>
        <FormField label="Apellido" required><Input placeholder="Perez" value={shareholder.lastName} onChange={(e) => upd('lastName', e.target.value)} required /></FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Cedula" required><Input placeholder="V12345678" value={shareholder.documentId} onChange={(e) => upd('documentId', e.target.value)} required /></FormField>
        <FormField label="Foto cedula" required><Input type="file" accept="image/*,.pdf" onChange={() => upd('documentPhoto', 'uploaded')} /></FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Telefono" required><Input placeholder="04141234567" value={shareholder.phone} onChange={(e) => upd('phone', e.target.value)} required /></FormField>
        <FormField label="Correo" required><Input type="email" placeholder="accionista@email.com" value={shareholder.email} onChange={(e) => upd('email', e.target.value)} required /></FormField>
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
        const text = e.target?.result as string
        const lines = text.split('\n').filter((l) => l.trim().length > 0)
        if (lines.length < 2) { setParseError('El archivo debe tener al menos una fila de datos.'); return }
        const rows = lines.slice(1).map((line) => {
          const cols = line.split(',').map((c) => c.trim())
          if (cols.length < 17) throw new Error(`Fila invalida: se esperan 17 columnas, se encontraron ${cols.length}.`)
          return {
            documentType: cols[0], documentId: cols[1], name: cols[2], lastName: cols[3],
            email: cols[4], phone: cols[5], birthDate: cols[6], gender: cols[7],
            civilStatus: cols[8], address: cols[9], countryOfOrigin: cols[10],
            familyDependents: parseInt(cols[11]) || 0, startDate: cols[12],
            department: cols[13], position: cols[14],
            baseSalary: parseFloat(cols[15]) || 0, maxLoanLimit: parseFloat(cols[16]) || 0,
          } satisfies CollaboratorInput
        })
        setPayrollItems(rows)
      } catch (err) { setParseError(err instanceof Error ? err.message : 'Error al leer archivo.') }
    }
    reader.readAsText(file)
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
        <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file) }} />
        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center"><Upload className="w-6 h-6 text-secondary" strokeWidth={1.5} /></div>
        <p className="text-sm text-body-secondary text-center"><span className="font-medium text-secondary">Haz clic o arrastra</span> un archivo CSV aqui</p>
        <p className="text-xs text-body-muted">17 columnas: TipoDoc, Cedula, Nombres, Apellidos, Email, Telefono, FechaNac, Genero, EstadoCivil, Direccion, Pais, CargasFam, FechaIngreso, Depto, Cargo, Salario, LimiteCredito</p>
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
