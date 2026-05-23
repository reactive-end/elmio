'use client'

import { useState, Fragment } from 'react'
import { 
  Download, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  File, 
  Building2 
} from 'lucide-react'
import { enterpriseService, type Contract, type Enterprise } from '@/src/services/empresa.service'

interface ContractTableProps {
  contracts: Contract[]
  enterprise: Enterprise | null
  onEdit: (contract: Contract) => void
  onRemove: (contractId: string) => Promise<void> | void
  onRemoveFile: (contractId: string, fileId: string) => Promise<void> | void
  submitting: boolean
}

export function ContractTable({
  contracts,
  enterprise,
  onEdit,
  onRemove,
  onRemoveFile,
  submitting,
}: ContractTableProps) {
  // Estado para controlar qué filas de contratos están expandidas
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const toggleExpand = (contractId: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [contractId]: !prev[contractId],
    }))
  }

  // Obtiene el icono y color según el tipo MIME del archivo
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

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm shadow-black/3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          {/* Encabezado de la Tabla */}
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/75 text-xs font-semibold uppercase tracking-[0.14em] text-body-muted">
              <th className="px-6 py-4">Contrato</th>
              <th className="px-6 py-4">Empresa</th>
              <th className="px-6 py-4">Documentos</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>

          {/* Cuerpo de la Tabla */}
          <tbody className="divide-y divide-gray-100/80">
            {contracts.map((contract) => {
              const isExpanded = !!expandedIds[contract.id]
              
              return (
                <Fragment key={contract.id}>
                  {/* Fila Principal */}
                  <tr 
                    className={`transition-colors hover:bg-gray-50/50 ${
                      isExpanded ? 'bg-gray-50/30' : ''
                    }`}
                  >
                    {/* Columna Nombre del Contrato */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <button
                          type="button"
                          onClick={() => toggleExpand(contract.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 text-body-muted hover:border-gray-200 hover:text-body transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" strokeWidth={2} />
                          ) : (
                            <ChevronDown className="h-4 w-4" strokeWidth={2} />
                          )}
                        </button>
                        <div>
                          <p 
                            className="font-bold text-body hover:text-secondary cursor-pointer transition-colors"
                            onClick={() => toggleExpand(contract.id)}
                          >
                            {contract.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Columna Empresa */}
                    <td className="px-6 py-4 text-body-muted">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-body-muted/70" strokeWidth={1.5} />
                        <span className="font-medium text-xs">
                          {enterprise?.companyName ?? 'Empresa'}
                        </span>
                      </div>
                    </td>

                    {/* Columna Conteo de Documentos */}
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => toggleExpand(contract.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border transition-all ${
                          contract.files.length > 0 
                            ? 'bg-secondary/5 text-secondary border-secondary/10 hover:bg-secondary/10'
                            : 'bg-gray-50 text-body-muted border-gray-100'
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {contract.files.length} {contract.files.length === 1 ? 'archivo' : 'archivos'}
                      </button>
                    </td>

                    {/* Columna Acciones */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(contract)}
                          disabled={submitting}
                          title="Editar contrato"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white text-body-muted transition-all hover:border-secondary/20 hover:bg-secondary/5 hover:text-secondary disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => void onRemove(contract.id)}
                          disabled={submitting}
                          title="Eliminar contrato"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white text-body-muted transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Fila Expandible (Documentos) */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={4} className="bg-gray-50/40 px-6 py-4 border-t border-b border-gray-100/50">
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                          <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-body-muted mb-3">
                            Archivos asociados a este contrato
                          </h4>

                          {contract.files.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                              {contract.files.map((file) => {
                                const { Icon, colorClass, label } = getFileSpecs(file.mimeType)
                                return (
                                  <div
                                    key={file.id}
                                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/20 p-2.5 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50/50"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${colorClass}`}>
                                        <Icon className="h-4 w-4" strokeWidth={1.5} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-body leading-tight" title={file.originalName}>
                                          {file.originalName}
                                        </p>
                                        <p className="text-[9px] text-body-muted mt-0.5 leading-none">
                                          {label} • {file.originalName.split('.').pop()?.toUpperCase() ?? 'DOC'}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 pl-2">
                                      <a
                                        href={enterprise ? enterpriseService.getContractDownloadUrl(enterprise.taxId, file.fileName) : '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Descargar archivo"
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/5 text-secondary hover:bg-secondary/15 transition-colors"
                                      >
                                        <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => void onRemoveFile(contract.id, file.id)}
                                        title="Eliminar archivo"
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-50/50 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                                        disabled={submitting}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-body-muted italic py-1">
                              Este contrato no tiene archivos asociados.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
