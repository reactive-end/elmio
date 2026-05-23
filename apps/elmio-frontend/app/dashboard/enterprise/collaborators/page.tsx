'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Users,
  UserPlus,
  Upload,
  Search,
  MoreHorizontal,
  Check,
  Ban,
  UserX,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { FormField } from '@/components/molecules/FormField/FormField'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { useCollaborators } from '@/src/hooks/pages/useColaboradores'
import type { CollaboratorInput, PersonProfile } from '@/src/services/empresa.service'

const STATUS_BADGE: Record<PersonProfile['status'], { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-50', text: 'text-green-700', label: 'Activo' },
  suspended: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Suspendido' },
  terminated: { bg: 'bg-red-50', text: 'text-red-700', label: 'Baja' },
}

export default function CollaboratorsPage() {
  const {
    collaborators,
    loading,
    error,
    successMsg,
    showModal,
    setShowModal,
    showEditModal,
    setShowEditModal,
    editingCollaborator,
    startEditing,
    createCollaborator,
    updateCollaborator,
    bulkUpload,
    toggleStatus,
  } = useCollaborators()
  const [search, setSearch] = useState('')
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = search.trim()
    ? collaborators.filter(
        (c) =>
          `${c.name} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          c.documentId.includes(search),
      )
    : collaborators

  const handleCSV = (file: File) => {
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

        const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' })
        if (rawRows.length === 0) throw new Error('El archivo no contiene filas de datos.')

        // Función helper para normalizar fechas de Excel seriales o strings
        const parseDateVal = (val: any): string => {
          if (!val) return ''
          if (typeof val === 'number') {
            try {
              const utc_days = Math.floor(val - 25569)
              const utc_value = utc_days * 86400
              const date_info = new Date(utc_value * 1000)
              const yyyy = date_info.getUTCFullYear()
              let mm: string | number = date_info.getUTCMonth() + 1
              let dd: string | number = date_info.getUTCDate()
              if (mm < 10) mm = `0${mm}`
              if (dd < 10) dd = `0${dd}`
              return `${yyyy}-${mm}-${dd}`
            } catch {
              return String(val)
            }
          }
          return String(val).trim()
        }

        const mappedRows: CollaboratorInput[] = []
        for (let idx = 0; idx < rawRows.length; idx++) {
          const row = rawRows[idx]

          const docType = (row['Tipo Documento'] ?? row['documentType'] ?? 'V').toString().trim()
          const docId = (row['Cédula / Documento'] ?? row['documentId'] ?? '').toString().trim()
          const name = (row['Nombres'] ?? row['name'] ?? '').toString().trim()
          const lastName = (row['Apellidos'] ?? row['lastName'] ?? '').toString().trim()
          const email = (row['Correo Electrónico'] ?? row['email'] ?? '').toString().trim()
          const phone = (row['Teléfono'] ?? row['phone'] ?? '').toString().trim()

          // Si es una fila totalmente vacía o de totales (sin Cédula, Nombres ni Correo), la omitimos silenciosamente
          if (!docId && !name && !email) {
            continue
          }

          if (!docType || !docId || !name || !email) {
            throw new Error(
              `Fila ${idx + 2} inválida: Los campos Tipo Documento, Cédula, Nombres y Correo son requeridos.`,
            )
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
          const loanLimit =
            parseFloat(row['Límite Mensual de Crédito ($)'] ?? row['maxLoanLimit'] ?? 0) || 0

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

        void bulkUpload(mappedRows)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al procesar el archivo.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-body">Colaboradores</h1>
          <p className="text-sm text-body-muted mt-0.5">
            Gestiona el personal de tu empresa ({collaborators.length} registrados).
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleCSV(f)
            }}
          />
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" strokeWidth={1.5} /> Cargar Excel / CSV
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <UserPlus className="w-4 h-4" strokeWidth={1.5} /> Nuevo
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-black/3 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Buscar por nombre o cedula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-body outline-none focus:border-border-focus focus:ring-2 focus:ring-ring/20 transition-all"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-body-muted">Sin colaboradores</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-body-muted uppercase">
                    Nombre
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-body-muted uppercase">
                    Cedula
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-body-muted uppercase hidden md:table-cell">
                    Cargo
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-body-muted uppercase hidden lg:table-cell">
                    Limite
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-body-muted uppercase">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-body-muted uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const badge = STATUS_BADGE[c.status]
                  return (
                    <tr
                      key={c.id}
                      className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-xs font-bold text-secondary">
                            {c.name[0]}
                            {c.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-body">
                              {c.name} {c.lastName}
                            </p>
                            <p className="text-xs text-body-muted md:hidden">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-body-muted">
                        {c.documentType}-{c.documentId}
                      </td>
                      <td className="px-5 py-3.5 text-body-muted hidden md:table-cell">
                        {c.position}
                      </td>
                      <td className="px-5 py-3.5 text-right text-body-muted hidden lg:table-cell">
                        ${c.maxLoanLimit.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setActionMenuId(actionMenuId === c.id ? null : c.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4 text-body-muted" strokeWidth={1.5} />
                          </button>
                          {actionMenuId === c.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                              <button
                                type="button"
                                onClick={() => {
                                  startEditing(c)
                                  setActionMenuId(null)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:bg-secondary/5"
                              >
                                <Pencil className="w-4 h-4" /> Editar
                              </button>
                              {c.status !== 'active' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    void toggleStatus(c.id, 'active')
                                    setActionMenuId(null)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                                >
                                  <Check className="w-4 h-4" /> Activar
                                </button>
                              )}
                              {c.status !== 'suspended' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    void toggleStatus(c.id, 'suspended')
                                    setActionMenuId(null)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
                                >
                                  <Ban className="w-4 h-4" /> Suspender
                                </button>
                              )}
                              {c.status !== 'terminated' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    void toggleStatus(c.id, 'terminated')
                                    setActionMenuId(null)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <UserX className="w-4 h-4" /> Dar de baja
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CollaboratorModal
          title="Nuevo colaborador"
          onClose={() => setShowModal(false)}
          onSubmit={createCollaborator}
        />
      )}
      {showEditModal && editingCollaborator && (
        <CollaboratorModal
          title="Editar colaborador"
          initialData={mapPersonProfileToCollaboratorInput(editingCollaborator)}
          onClose={() => {
            setShowEditModal(false)
          }}
          onSubmit={(data) => updateCollaborator(editingCollaborator.id, data)}
        />
      )}
    </div>
  )
}

const EMPTY_COLLABORATOR: CollaboratorInput = {
  documentType: 'V',
  documentId: '',
  name: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  gender: '',
  civilStatus: '',
  address: '',
  countryOfOrigin: 'Venezuela',
  familyDependents: 0,
  startDate: '',
  department: '',
  position: '',
  baseSalary: 0,
  maxLoanLimit: 0,
}

function mapPersonProfileToCollaboratorInput(profile: PersonProfile): CollaboratorInput {
  return {
    documentType: profile.documentType,
    documentId: profile.documentId,
    name: profile.name,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    birthDate: profile.birthDate,
    gender: profile.gender,
    civilStatus: profile.civilStatus,
    address: profile.address,
    countryOfOrigin: profile.countryOfOrigin,
    familyDependents: profile.familyDependents,
    startDate: profile.startDate,
    department: profile.department,
    position: profile.position,
    baseSalary: profile.baseSalary,
    maxLoanLimit: profile.maxLoanLimit,
  }
}

function CollaboratorModal({
  title,
  onClose,
  onSubmit,
  initialData,
}: {
  title: string
  onClose: () => void
  onSubmit: (d: CollaboratorInput) => Promise<void>
  initialData?: CollaboratorInput
}) {
  const [form, setForm] = useState<CollaboratorInput>(
    initialData ? { ...initialData } : { ...EMPTY_COLLABORATOR },
  )
  const [submitting, setSubmitting] = useState(false)
  const upd = <K extends keyof CollaboratorInput>(key: K, val: CollaboratorInput[K]) =>
    setForm((p) => ({ ...p, [key]: val }))

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit(form)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 z-10">
        <h3 className="text-lg font-semibold text-body mb-5">{title}</h3>
        <form onSubmit={(e) => void handle(e)} className="flex flex-col gap-4">
          <p className="text-xs font-medium text-body-muted uppercase tracking-wider">Identidad</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Tipo documento" required>
              <Select
                options={[
                  { value: 'V', label: 'V' },
                  { value: 'E', label: 'E' },
                  { value: 'J', label: 'J' },
                  { value: 'P', label: 'P' },
                ]}
                value={form.documentType}
                onChange={(v) => upd('documentType', v)}
              />
            </FormField>
            <FormField label="Cedula" required>
              <Input
                value={form.documentId}
                onChange={(e) => upd('documentId', e.target.value)}
                required
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Nombre" required>
              <Input value={form.name} onChange={(e) => upd('name', e.target.value)} required />
            </FormField>
            <FormField label="Apellido" required>
              <Input
                value={form.lastName}
                onChange={(e) => upd('lastName', e.target.value)}
                required
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Email" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => upd('email', e.target.value)}
                required
              />
            </FormField>
            <FormField label="Telefono" required>
              <Input value={form.phone} onChange={(e) => upd('phone', e.target.value)} required />
            </FormField>
          </div>

          <hr className="border-gray-100" />
          <p className="text-xs font-medium text-body-muted uppercase tracking-wider">
            Datos personales
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Fecha de nacimiento" required>
              <Input
                type="date"
                value={form.birthDate}
                onChange={(e) => upd('birthDate', e.target.value)}
                required
              />
            </FormField>
            <FormField label="Genero" required>
              <Select
                options={[
                  { value: 'Masculino', label: 'Masculino' },
                  { value: 'Femenino', label: 'Femenino' },
                  { value: 'Otro', label: 'Otro' },
                ]}
                value={form.gender}
                onChange={(v) => upd('gender', v)}
              />
            </FormField>
            <FormField label="Estado civil" required>
              <Select
                options={[
                  { value: 'Soltero/a', label: 'Soltero/a' },
                  { value: 'Casado/a', label: 'Casado/a' },
                  { value: 'Divorciado/a', label: 'Divorciado/a' },
                  { value: 'Viudo/a', label: 'Viudo/a' },
                ]}
                value={form.civilStatus}
                onChange={(v) => upd('civilStatus', v)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Direccion" required>
              <Input
                value={form.address}
                onChange={(e) => upd('address', e.target.value)}
                required
              />
            </FormField>
            <FormField label="Pais de origen" required>
              <Input
                value={form.countryOfOrigin}
                onChange={(e) => upd('countryOfOrigin', e.target.value)}
                required
              />
            </FormField>
          </div>
          <FormField label="Cargas familiares">
            <Input
              type="number"
              min={0}
              value={form.familyDependents || ''}
              onChange={(e) => upd('familyDependents', parseInt(e.target.value) || 0)}
            />
          </FormField>

          <hr className="border-gray-100" />
          <p className="text-xs font-medium text-body-muted uppercase tracking-wider">Empleo</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Departamento" required>
              <Input
                value={form.department}
                onChange={(e) => upd('department', e.target.value)}
                required
              />
            </FormField>
            <FormField label="Cargo" required>
              <Input
                value={form.position}
                onChange={(e) => upd('position', e.target.value)}
                required
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Fecha de ingreso" required>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => upd('startDate', e.target.value)}
                required
              />
            </FormField>
            <FormField label="Salario mensual ($)" required>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.baseSalary || ''}
                onChange={(e) => upd('baseSalary', parseFloat(e.target.value) || 0)}
                required
              />
            </FormField>
            <FormField label="Limite de credito ($)" required>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.maxLoanLimit || ''}
                onChange={(e) => upd('maxLoanLimit', parseFloat(e.target.value) || 0)}
                required
              />
            </FormField>
          </div>

          <div className="flex gap-3 mt-4">
            <Button type="button" variant="ghost" fullWidth onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={submitting} fullWidth>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
