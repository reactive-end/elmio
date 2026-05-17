'use client'

import { useState, useRef } from 'react'
import { Users, UserPlus, Upload, Search, MoreHorizontal, Check, Ban, UserX } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { FormField } from '@/components/molecules/FormField/FormField'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { useCollaborators } from '@/src/hooks/pages/useColaboradores'
import type { CollaboratorInput, Collaborator } from '@/src/services/empresa.service'

const STATUS_BADGE: Record<Collaborator['status'], { bg: string; text: string; label: string }> = {
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
    createCollaborator,
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
      const text = e.target?.result as string
      const lines = text.split('\n').filter((l) => l.trim().length > 0)
      const rows: CollaboratorInput[] = lines.slice(1).map((line) => {
        const c = line.split(',').map((v) => v.trim())
        return {
          name: c[0] ?? '',
          lastName: c[1] ?? '',
          documentId: c[2] ?? '',
          email: c[3] ?? '',
          phone: c[4] ?? '',
          baseSalary: parseFloat(c[5]) || 0,
        }
      })
      void bulkUpload(rows)
    }
    reader.readAsText(file)
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
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleCSV(f)
            }}
          />
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" strokeWidth={1.5} />
            Cargar CSV
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <UserPlus className="w-4 h-4" strokeWidth={1.5} />
            Nuevo
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
                    Email
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
                      <td className="px-5 py-3.5 text-body-muted">{c.documentId}</td>
                      <td className="px-5 py-3.5 text-body-muted hidden md:table-cell">
                        {c.email}
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
                              {c.status !== 'active' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    void toggleStatus(c.id, 'active')
                                    setActionMenuId(null)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                                >
                                  <Check className="w-4 h-4" />
                                  Activar
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
                                  <Ban className="w-4 h-4" />
                                  Suspender
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
                                  <UserX className="w-4 h-4" />
                                  Dar de baja
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
        <AddCollaboratorModal onClose={() => setShowModal(false)} onSubmit={createCollaborator} />
      )}
    </div>
  )
}

function AddCollaboratorModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (d: CollaboratorInput) => Promise<void>
}) {
  const [form, setForm] = useState<CollaboratorInput>({
    name: '',
    lastName: '',
    documentId: '',
    email: '',
    phone: '',
    baseSalary: 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit(form)
    setSubmitting(false)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
        <h3 className="text-lg font-semibold text-body mb-5">Nuevo colaborador</h3>
        <form onSubmit={(e) => void handle(e)} className="flex flex-col gap-4">
          <FormField label="Nombre" required>
            <Input
              id="mc-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Apellido" required>
            <Input
              id="mc-last"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Cedula" required>
            <Input
              id="mc-doc"
              value={form.documentId}
              onChange={(e) => setForm({ ...form, documentId: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Email" required>
            <Input
              id="mc-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Telefono" required>
            <Input
              id="mc-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Salario Base" required>
            <Input
              id="mc-salary"
              type="number"
              min={0}
              step={0.01}
              value={form.baseSalary || ''}
              onChange={(e) => setForm({ ...form, baseSalary: parseFloat(e.target.value) || 0 })}
              required
            />
          </FormField>
          <div className="flex gap-3 mt-2">
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
