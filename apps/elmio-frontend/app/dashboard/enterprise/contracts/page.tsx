'use client'

import { useMemo, useState } from 'react'
import { Download, FileText, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { FormField } from '@/components/molecules/FormField/FormField'
import { useContracts } from '@/src/hooks/pages/useContracts'
import { enterpriseService } from '@/src/services/empresa.service'

/**
 * Pantalla de contratos empresariales con soporte de multiples archivos por contrato.
 * Permite crear, renombrar, agregar archivos, descargar y eliminar contratos o archivos.
 * @returns Vista CRUD de contratos para la empresa autenticada.
 */
export default function EnterpriseContractsPage() {
  const { enterprise, contracts, loading, submitting, error, successMsg, createContract, updateContract, removeContract, removeContractFile } = useContracts()
  const [newName, setNewName] = useState('')
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingFiles, setEditingFiles] = useState<File[]>([])

  const totalFiles = useMemo(
    () => contracts.reduce((sum, contract) => sum + contract.files.length, 0),
    [contracts],
  )

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const resetCreateForm = () => {
    setNewName('')
    setNewFiles([])
  }

  const startEditing = (contractId: string, name: string) => {
    setEditingId(contractId)
    setEditingName(name)
    setEditingFiles([])
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName('')
    setEditingFiles([])
  }

  const handleCreate = async () => {
    await createContract(newName, newFiles)
    resetCreateForm()
  }

  const handleUpdate = async (contractId: string) => {
    await updateContract(contractId, {
      name: editingName,
      files: editingFiles,
    })
    cancelEditing()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-body">Contratos</h1>
          <p className="text-sm text-body-muted">
            Gestiona contratos empresariales, agrega multiples archivos y manten su documentacion organizada.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm shadow-black/3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-body-muted">Contratos</p>
            <p className="mt-1 text-xl font-bold text-body">{contracts.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm shadow-black/3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-body-muted">Archivos</p>
            <p className="mt-1 text-xl font-bold text-body">{totalFiles}</p>
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-black/3">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Plus className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-body">Nuevo contrato</h2>
            <p className="text-sm text-body-muted">
              Crea un contrato con un nombre y uno o varios archivos adjuntos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <FormField label="Nombre del contrato" required>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Contrato marco 2026"
            />
          </FormField>

          <FormField label="Archivos" required>
            <label className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm text-body transition-all hover:border-border-focus hover:bg-gray-50">
              <span className="truncate pr-3 text-body-muted">
                {newFiles.length > 0
                  ? `${newFiles.length} archivo(s) seleccionado(s)`
                  : 'Selecciona uno o varios archivos'}
              </span>
              <Upload className="h-4 w-4 flex-shrink-0 text-body-muted" strokeWidth={1.5} />
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
              />
            </label>
          </FormField>

          <Button onClick={() => void handleCreate()} disabled={submitting}>
            Crear contrato
          </Button>
        </div>
      </section>

      {contracts.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm shadow-black/3">
          <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
          <p className="text-sm font-medium text-body-muted">No hay contratos registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {contracts.map((contract) => {
            const isEditing = editingId === contract.id

            return (
              <article
                key={contract.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-black/3"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-body-muted">
                      {enterprise?.companyName ?? 'Empresa'}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-body">{contract.name}</h2>
                    <p className="mt-1 text-sm text-body-muted">
                      {contract.files.length} archivo(s) asociado(s)
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="ghost" onClick={cancelEditing} disabled={submitting}>
                          Cancelar
                        </Button>
                        <Button onClick={() => void handleUpdate(contract.id)} disabled={submitting}>
                          Guardar cambios
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => startEditing(contract.id, contract.name)}
                          disabled={submitting}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.5} /> Editar
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => void removeContract(contract.id)}
                          disabled={submitting}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} /> Eliminar
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <FormField label="Nombre del contrato" required>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder="Nombre del contrato"
                      />
                    </FormField>

                    <FormField label="Agregar mas archivos">
                      <label className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-body transition-all hover:border-border-focus hover:bg-gray-50">
                        <span className="truncate pr-3 text-body-muted">
                          {editingFiles.length > 0
                            ? `${editingFiles.length} archivo(s) listo(s) para agregar`
                            : 'Selecciona mas archivos para este contrato'}
                        </span>
                        <Upload className="h-4 w-4 flex-shrink-0 text-body-muted" strokeWidth={1.5} />
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => setEditingFiles(Array.from(e.target.files ?? []))}
                        />
                      </label>
                    </FormField>
                  </div>
                )}

                <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 bg-gray-50 px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-body-muted">
                    <span>Archivo</span>
                    <span>Descarga</span>
                    <span>Accion</span>
                  </div>
                  {contract.files.map((file) => (
                    <div
                      key={file.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-body">{file.originalName}</p>
                        <p className="truncate text-xs text-body-muted">{file.mimeType}</p>
                      </div>

                      <a
                        href={enterprise ? enterpriseService.getContractDownloadUrl(enterprise.taxId, file.fileName) : '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-secondary transition-all hover:bg-secondary/5"
                      >
                        <Download className="h-4 w-4" strokeWidth={1.5} />
                        <span className="hidden sm:inline">Descargar</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => void removeContractFile(contract.id, file.id)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={submitting}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
