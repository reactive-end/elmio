'use client'

import { useEffect, useState } from 'react'
import { 
  Plus, 
  Upload, 
  X, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  File,
  Download,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { FormField } from '@/components/molecules/FormField/FormField'
import { enterpriseService, type Enterprise } from '@/src/services/empresa.service'

interface ExistingFile {
  id: string
  originalName: string
  mimeType: string
  fileName: string
}

interface ContractModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, files: File[]) => Promise<void> | void
  submitting: boolean
  initialName?: string
  existingFiles?: ExistingFile[]
  onRemoveExistingFile?: (fileId: string) => Promise<void> | void
  enterprise: Enterprise | null
  mode: 'create' | 'edit'
}

export function ContractModal({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  initialName = '',
  existingFiles = [],
  onRemoveExistingFile,
  enterprise,
  mode,
}: ContractModalProps) {
  const [name, setName] = useState('')
  const [files, setFiles] = useState<File[]>([])

  // Sincronizar estados al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setName(mode === 'edit' ? initialName : '')
      setFiles([])
    }
  }, [isOpen, initialName, mode])

  if (!isOpen) return null

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (mode === 'create' && files.length === 0) return

    await onSubmit(name, files)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Obtiene el icono y color de fondo según el tipo MIME del archivo
  const getFileSpecs = (mimeType: string) => {
    const mime = mimeType.toLowerCase()
    if (mime.includes('pdf')) {
      return {
        Icon: FileText,
        colorClass: 'text-red-500 bg-red-50 border border-red-100',
        label: 'PDF',
      }
    }
    if (
      mime.includes('excel') || 
      mime.includes('sheet') || 
      mime.includes('spreadsheet') || 
      mime.includes('csv') || 
      mime.includes('xls')
    ) {
      return {
        Icon: FileSpreadsheet,
        colorClass: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
        label: 'Excel',
      }
    }
    if (mime.includes('image') || mime.includes('png') || mime.includes('jpg') || mime.includes('jpeg')) {
      return {
        Icon: FileImage,
        colorClass: 'text-blue-500 bg-blue-50 border border-blue-100',
        label: 'Imagen',
      }
    }
    return {
      Icon: File,
      colorClass: 'text-slate-500 bg-slate-50 border border-slate-100',
      label: 'Doc',
    }
  }

  // Helper para formatear el tamaño de bytes del archivo a un formato legible (KB, MB)
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md transition-all duration-300 animate-fadeIn">
      <div 
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 transform scale-100 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary border border-secondary/5">
              {mode === 'create' ? (
                <Plus className="h-5 w-5" strokeWidth={1.5} />
              ) : (
                <Upload className="h-5 w-5" strokeWidth={1.5} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-body">
                {mode === 'create' ? 'Crear Nuevo Contrato' : 'Editar Contrato'}
              </h3>
              <p className="text-xs text-body-muted">
                {mode === 'create'
                  ? 'Define el nombre y sube los documentos asociados.'
                  : 'Modifica el nombre o gestiona los archivos del contrato.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-body-muted transition-colors hover:bg-gray-100 hover:text-body"
            disabled={submitting}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Formulario / Contenido Principal Desplazable */}
        <form onSubmit={(e) => void handleFormSubmit(e)} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Campo 1: Nombre del contrato */}
          <FormField label="Nombre del contrato" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Contrato marco de servicios 2026"
              disabled={submitting}
              required
            />
          </FormField>

          {/* Campo 2: AGREGAR NUEVOS ARCHIVOS (Arriba en la UI) */}
          <div className={`${mode === 'edit' ? 'border-t border-gray-50 pt-5' : ''}`}>
            <FormField 
              label={mode === 'create' ? 'Archivos adjuntos' : 'Agregar más archivos'} 
              required={mode === 'create'}
            >
              <div className="flex flex-col gap-3">
                <label className="flex min-h-12 cursor-pointer items-center justify-between rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-body transition-all hover:border-secondary hover:bg-secondary/5 focus-within:ring-2 focus-within:ring-secondary/20">
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-body-muted animate-pulse" strokeWidth={1.5} />
                    <span className="font-semibold text-body-muted">
                      {files.length > 0
                        ? `${files.length} archivo(s) para agregar`
                        : 'Selecciona uno o varios archivos'}
                    </span>
                  </div>
                  <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-body border border-gray-200 transition-colors hover:bg-gray-200">
                    Examinar
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </label>

                {/* Vista previa de NUEVOS archivos seleccionados */}
                {files.length > 0 && (
                  <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/30 p-3 max-h-48 overflow-y-auto">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.14em] text-body-muted px-0.5">
                      Nuevos archivos seleccionados ({files.length})
                    </h5>
                    
                    {files.map((file, idx) => {
                      const { Icon, colorClass, label } = getFileSpecs(file.type)
                      
                      return (
                        <div
                          key={`${file.name}-${idx}`}
                          className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm transition-all duration-200 hover:border-gray-200"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${colorClass}`}>
                              <Icon className="h-4 w-4" strokeWidth={1.5} />
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-body leading-tight" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-[10px] text-body-muted mt-0.5 leading-none">
                                {label} • {file.name.split('.').pop()?.toUpperCase() ?? 'FILE'} • {formatBytes(file.size)}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                            disabled={submitting}
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </FormField>
          </div>

          {/* Campo 3: ARCHIVOS EXISTENTES (Viejos) - Abajo en la UI */}
          {mode === 'edit' && (
            <div className="border-t border-gray-50 pt-5">
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-body-muted mb-3">
                Archivos cargados previamente ({existingFiles.length})
              </h4>
              
              {existingFiles.length > 0 ? (
                <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/20 p-3 max-h-48 overflow-y-auto">
                  {existingFiles.map((file) => {
                    const { Icon, colorClass, label } = getFileSpecs(file.mimeType)
                    
                    return (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm transition-all duration-200 hover:border-gray-200"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${colorClass}`}>
                            <Icon className="h-4 w-4" strokeWidth={1.5} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-body leading-tight" title={file.originalName}>
                              {file.originalName}
                            </p>
                            <p className="text-[10px] text-body-muted mt-0.5 leading-none">
                              {label} • {file.originalName.split('.').pop()?.toUpperCase() ?? 'DOC'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          <a
                            href={enterprise ? enterpriseService.getContractDownloadUrl(enterprise.taxId, file.fileName) : '#'}
                            target="_blank"
                            rel="noreferrer"
                            title="Descargar archivo"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/5 text-secondary hover:bg-secondary/15 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </a>
                          {onRemoveExistingFile && (
                            <button
                              type="button"
                              onClick={() => void onRemoveExistingFile(file.id)}
                              title="Eliminar archivo"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-50/50 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                              disabled={submitting}
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-body-muted italic py-1 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                  Este contrato no cuenta con archivos previamente cargados.
                </p>
              )}
            </div>
          )}

          {/* Acciones del Modal */}
          <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-100 pt-5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              disabled={!name.trim() || (mode === 'create' && files.length === 0)}
            >
              {mode === 'create' ? 'Crear Contrato' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
