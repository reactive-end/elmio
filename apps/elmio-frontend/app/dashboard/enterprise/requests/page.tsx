'use client'

import { useState } from 'react'
import {
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Button } from '@/components/atoms/Button/Button'
import { useLoanRequests } from '@/src/hooks/pages/useSolicitudes'
import type { LoanRequest } from '@/src/services/empresa.service'

const STATUS_BADGE: Record<
  LoanRequest['status'],
  { bg: string; text: string; icon: typeof Clock; label: string }
> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock, label: 'Pendiente' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2, label: 'Aprobada' },
  denied: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle, label: 'Denegada' },
}

const TYPE_LABELS: Record<LoanRequest['type'], string> = {
  advance: 'Adelanto',
  loan: 'Beneficio en Efectivo',
  permission: 'Permiso',
  other: 'Otro',
}

const FILTERS: { value: LoanRequest['status'] | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'denied', label: 'Denegadas' },
]

export default function LoanRequestsPage() {
  const {
    loading,
    error,
    successMsg,
    filterStatus,
    setFilterStatus,
    filteredRequests,
    approve,
    deny,
    selectedRequest,
    setSelectedRequest,
    counters,
  } = useLoanRequests()
  const [denialReason, setDenialReason] = useState('')

  if (loading)
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-body">Solicitudes</h1>
        <p className="text-sm text-body-muted mt-0.5">
          Gestiona las solicitudes de beneficio en efectivo de tus colaboradores.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      {/* Counters */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm shadow-black/3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl font-bold text-body">{counters.pending}</p>
            <p className="text-xs text-body-muted">Pendientes</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm shadow-black/3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl font-bold text-body">{counters.approved}</p>
            <p className="text-xs text-body-muted">Aprobadas</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm shadow-black/3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl font-bold text-body">{counters.denied}</p>
            <p className="text-xs text-body-muted">Denegadas</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-black/3 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-body flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-secondary" strokeWidth={1.5} />
            Historial
          </h2>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-body-muted" strokeWidth={1.5} />
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilterStatus(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${filterStatus === f.value ? 'bg-secondary text-white shadow-sm' : 'text-body-muted hover:bg-gray-100'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <FileCheck className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-body-muted">Sin solicitudes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-body-muted uppercase">
                    Colaborador
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-body-muted uppercase">
                    Tipo
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-body-muted uppercase">
                    Monto
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
                {filteredRequests.map((r) => {
                  const badge = STATUS_BADGE[r.status]
                  const Ic = badge.icon
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-body font-medium">{r.collaboratorName}</td>
                      <td className="px-5 py-3.5 text-body-muted">{TYPE_LABELS[r.type]}</td>
                      <td className="px-5 py-3.5 text-body text-right font-semibold">
                        {fmt(r.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${badge.bg} ${badge.text}`}
                          >
                            <Ic className="w-3.5 h-3.5" strokeWidth={2} />
                            {badge.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(r)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Eye className="w-4 h-4 text-body-muted" strokeWidth={1.5} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedRequest(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <h3 className="text-lg font-semibold text-body mb-4">Detalle de solicitud</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-body-muted">Colaborador</span>
                <span className="text-body font-medium">{selectedRequest.collaboratorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-muted">Tipo</span>
                <span className="text-body">{TYPE_LABELS[selectedRequest.type]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-muted">Monto</span>
                <span className="text-body font-semibold">{fmt(selectedRequest.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-muted">Estado</span>
                <span className={`${STATUS_BADGE[selectedRequest.status].text} font-medium`}>
                  {STATUS_BADGE[selectedRequest.status].label}
                </span>
              </div>
              <p className="text-body-muted text-sm pt-2 border-t border-gray-100">
                {selectedRequest.description || 'Sin descripcion.'}
              </p>
              {selectedRequest.denialReason && (
                <p className="text-red-600 text-sm">
                  <strong>Motivo de rechazo:</strong> {selectedRequest.denialReason}
                </p>
              )}
            </div>
            {selectedRequest.status === 'pending' && (
              <div className="mt-5 space-y-3">
                <textarea
                  placeholder="Motivo del rechazo (opcional)"
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-border-focus focus:ring-2 focus:ring-ring/20 transition-all resize-none"
                  rows={2}
                />
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => {
                      void deny(selectedRequest.id, denialReason)
                      setDenialReason('')
                    }}
                  >
                    <ThumbsDown className="w-4 h-4" strokeWidth={1.5} />
                    Denegar
                  </Button>
                  <Button fullWidth onClick={() => void approve(selectedRequest.id)}>
                    <ThumbsUp className="w-4 h-4" strokeWidth={1.5} />
                    Aprobar
                  </Button>
                </div>
              </div>
            )}
            {selectedRequest.status !== 'pending' && (
              <div className="mt-5">
                <Button variant="ghost" fullWidth onClick={() => setSelectedRequest(null)}>
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
