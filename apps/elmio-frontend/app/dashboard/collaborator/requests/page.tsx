'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileCheck, Clock, CheckCircle2, XCircle, Filter, Eye, ArrowRight } from 'lucide-react'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { useEmployeeRequests } from '@/src/hooks/pages/useEmployeeRequests'
import type { LoanRequest } from '@/src/services/empresa.service'
import { productService } from '@/src/services/product.service'
import { Button } from '@/components/atoms/Button/Button'

const STATUS_BADGE: Record<
  LoanRequest['status'],
  { bg: string; text: string; icon: any; label: string }
> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock, label: 'Pendiente' },
  company_approved: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock, label: 'Por Finanzas' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2, label: 'Aprobada' },
  acquired: { bg: 'bg-purple-50', text: 'text-purple-700', icon: FileCheck, label: 'Adquirido' },
  disbursed: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2, label: 'Desembolsado' },
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

export default function CollaboratorRequestsPage() {
  const {
    loading,
    error,
    filterStatus,
    setFilterStatus,
    filteredRequests,
    counters,
    selectedRequest,
    setSelectedRequest,
  } = useEmployeeRequests()
  const [denialReason] = useState('')
  const [redirectingId, setRedirectingId] = useState<string | null>(null)
  const router = useRouter()

  const handleCompleteAcquisition = async (request: LoanRequest) => {
    try {
      setRedirectingId(request.id)
      const products = await productService.list()
      const prefix = 'Compra marketplace: '
      const description = request.description || ''
      const productName = description.startsWith(prefix) ? description.slice(prefix.length).trim() : description.trim()

      const matchedProduct = products.find(
        (p) => p.name.trim().toLowerCase() === productName.toLowerCase()
      )

      if (!matchedProduct) {
        router.push('/dashboard/collaborator/shop')
        return
      }

      const schemeId = matchedProduct.financingSchemes?.[0]?.id || 'default'
      router.push(
        `/dashboard/enterprise/shop/checkout?product=${matchedProduct.id}&scheme=${schemeId}&requestId=${request.id}`
      )
    } catch (err) {
      console.error(err)
      alert('No se pudo completar la adquisición en este momento.')
    } finally {
      setRedirectingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-body">Solicitudes</h1>
        <p className="mt-0.5 text-sm text-body-muted">
          Revisa el historial y estado de tus solicitudes registradas.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-3 gap-4">
        <CounterCard
          value={counters.pending}
          label="Pendientes"
          icon={Clock}
          bg="bg-amber-50"
          color="text-amber-600"
        />
        <CounterCard
          value={counters.approved}
          label="Aprobadas"
          icon={CheckCircle2}
          bg="bg-green-50"
          color="text-green-600"
        />
        <CounterCard
          value={counters.denied}
          label="Denegadas"
          icon={XCircle}
          bg="bg-red-50"
          color="text-red-600"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm shadow-black/3">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-body">
            <FileCheck className="h-5 w-5 text-secondary" strokeWidth={1.5} /> Historial
          </h2>
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-body-muted" strokeWidth={1.5} />
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setFilterStatus(filter.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${filterStatus === filter.value ? 'bg-secondary text-white shadow-sm' : 'text-body-muted hover:bg-gray-100'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-sm font-medium text-body-muted">
            Sin solicitudes
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-body-muted">
                    Tipo
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase text-body-muted">
                    Monto
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-medium uppercase text-body-muted">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-medium uppercase text-body-muted">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const badge = STATUS_BADGE[request.status]
                  const Icon = badge.icon
                  return (
                    <tr key={request.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 text-body-muted">{TYPE_LABELS[request.type]}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-body">
                        {fmt(request.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${badge.bg} ${badge.text}`}
                          >
                            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                            {badge.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(request)}
                            className="rounded-lg p-1.5 hover:bg-gray-100"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4 text-body-muted" strokeWidth={1.5} />
                          </button>
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

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedRequest(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-body">Detalle de solicitud</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-body-muted">Tipo</span>
                <span className="text-body">{TYPE_LABELS[selectedRequest.type]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-muted">Monto</span>
                <span className="font-semibold text-body">{fmt(selectedRequest.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-muted">Estado</span>
                <span className={`${STATUS_BADGE[selectedRequest.status].text} font-medium`}>
                  {STATUS_BADGE[selectedRequest.status].label}
                </span>
              </div>
              <p className="border-t border-gray-100 pt-2 text-sm text-body-muted">
                {selectedRequest.description || 'Sin descripcion.'}
              </p>
              {selectedRequest.denialReason && (
                <p className="text-sm text-red-600">
                  <strong>Motivo de rechazo:</strong> {selectedRequest.denialReason}
                </p>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-body hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CounterCard({
  value,
  label,
  icon: Icon,
  bg,
  color,
}: {
  value: number
  label: string
  icon: typeof Clock
  bg: string
  color: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm shadow-black/3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-2xl font-bold text-body">{value}</p>
        <p className="text-xs text-body-muted">{label}</p>
      </div>
    </div>
  )
}
