'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  CreditCard,
  Percent,
  Lock,
  Shield,
  Eye,
  Calendar,
} from 'lucide-react'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Button } from '@/components/atoms/Button/Button'
import { enterpriseService, type Transaction, type LoanRequest } from '@/src/services/empresa.service'

const STATUS_BADGE: Record<
  Transaction['status'],
  { bg: string; text: string; icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  pending: { bg: 'bg-amber-50 text-amber-700 border-amber-100', text: 'text-amber-700', icon: Clock, label: 'Pendiente de Pago' },
  paid: { bg: 'bg-green-50 text-green-700 border-green-100', text: 'text-green-700', icon: CheckCircle2, label: 'Pagado' },
  failed: { bg: 'bg-red-50 text-red-700 border-red-100', text: 'text-red-700', icon: XCircle, label: 'Rechazado' },
}

const FILTERS: { value: Transaction['status'] | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendiente de Pago' },
  { value: 'paid', label: 'Pagadas' },
  { value: 'failed', label: 'Rechazadas' },
]

export default function CollaboratorPurchasesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [requests, setRequests] = useState<LoanRequest[]>([])
  const [activeTab, setActiveTab] = useState<'products' | 'insurances'>('products')
  const [filterStatus, setFilterStatus] = useState<Transaction['status'] | 'all'>('all')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [txs, reqs] = await Promise.all([
          enterpriseService.listMyTransactions(),
          enterpriseService.listMyRequests(),
        ])
        setTransactions(txs)
        setRequests(reqs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar tus compras.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  // Filtrar y cruzar las transacciones de compra de marketplace con el estado de su solicitud de beneficio (Aprobación Estricta)
  const { approvedPurchases, approvedInsurances, pendingRequestsCount, deniedRequestsCount } = useMemo(() => {
    const marketplaceTxs = transactions.filter(
      (t) => t.kind === 'charge' && t.concept.startsWith('Compra marketplace:'),
    )

    const approvedProds: Transaction[] = []
    const approvedSegs: Transaction[] = []
    let pendingCount = 0
    let deniedCount = 0

    for (const tx of marketplaceTxs) {
      const associatedReq = requests.find((r) => r.id === tx.id)
      
      if (associatedReq) {
        if (associatedReq.status === 'approved') {
          const conceptLower = tx.concept.toLowerCase()
          const isSeg = conceptLower.includes('seguro') || conceptLower.includes('póliza') || conceptLower.includes('poliza')
          
          if (isSeg) {
            approvedSegs.push(tx)
          } else {
            approvedProds.push(tx)
          }
        } else if (associatedReq.status === 'pending') {
          pendingCount++
        } else if (associatedReq.status === 'denied') {
          deniedCount++
        }
      }
    }

    return {
      approvedPurchases: approvedProds,
      approvedInsurances: approvedSegs,
      pendingRequestsCount: pendingCount,
      deniedRequestsCount: deniedCount,
    }
  }, [transactions, requests])

  const currentList = activeTab === 'products' ? approvedPurchases : approvedInsurances

  const filteredItems = useMemo(() => {
    return filterStatus === 'all'
      ? currentList
      : currentList.filter((p) => p.status === filterStatus)
  }, [filterStatus, currentList])

  // Métricas del dashboard de colaborador consolidado
  const metrics = useMemo(() => {
    const allApproved = [...approvedPurchases, ...approvedInsurances]
    const totalAmount = allApproved.reduce((sum, p) => sum + p.amount, 0)
    const paidAmount = allApproved.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
    const pendingAmount = allApproved.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)

    return { totalAmount, paidAmount, pendingAmount }
  }, [approvedPurchases, approvedInsurances])

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(n)

  const fmtDate = (dStr: string) => {
    try {
      const date = new Date(dStr)
      return new Intl.DateTimeFormat('es-VE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    } catch {
      return dStr
    }
  }

  // Extrae el nombre del producto eliminando el prefijo
  const getProductName = (concept: string) => {
    const prefix = 'Compra marketplace: '
    if (concept.startsWith(prefix)) {
      return concept.slice(prefix.length)
    }
    return concept
  }



  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-body tracking-tight">Mis Compras</h1>
          <p className="mt-0.5 text-sm text-body-muted">
            Consulta los productos y seguros que has adquirido en el Marketplace que ya poseen visto bueno de tu empresa.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/collaborator/shop')}
          className="flex items-center gap-2 border border-gray-150 hover:bg-gray-50/50"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a la Tienda
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}
      {successMessage && <Alert type="success" message={successMessage} />}

      {/* Tarjetas de Resumen Premium */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardResumen
          title="Compras Aprobadas"
          value={fmt(metrics.totalAmount)}
          description={`${approvedPurchases.length + approvedInsurances.length} ítems en total`}
          icon={ShoppingBag}
          bgIcon="bg-secondary/10"
          colorIcon="text-secondary"
        />
        <CardResumen
          title="Monto Liquidado"
          value={fmt(metrics.paidAmount)}
          description="Pagado mediante deducciones"
          icon={CheckCircle2}
          bgIcon="bg-green-50"
          colorIcon="text-green-600"
        />
        <CardResumen
          title="Saldo por Pagar"
          value={fmt(metrics.pendingAmount)}
          description="Descontándose en cuotas"
          icon={Clock}
          bgIcon="bg-amber-50"
          colorIcon="text-amber-600"
        />
        <CardResumen
          title="Pendientes de Aprobación"
          value={String(pendingRequestsCount)}
          description="Esperando visto bueno del Admin"
          icon={Lock}
          bgIcon="bg-blue-50"
          colorIcon="text-blue-600"
        />
      </div>

      {/* Selector de Pestañas (Tabs) Premium */}
      <div className="flex border-b border-gray-100">
        <button
          type="button"
          onClick={() => {
            setActiveTab('products')
            setFilterStatus('all')
          }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'products'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-body-muted hover:text-body hover:border-gray-200'
          }`}
        >
          <ShoppingBag className="h-4 w-4" /> Mis Productos ({approvedPurchases.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('insurances')
            setFilterStatus('all')
          }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'insurances'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-body-muted hover:text-body hover:border-gray-200'
          }`}
        >
          <Shield className="h-4 w-4" /> Mis Seguros ({approvedInsurances.length})
        </button>
      </div>

      {/* Listado y Tabla */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm shadow-black/3">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-body">
            {activeTab === 'products' ? (
              <ShoppingBag className="h-5 w-5 text-secondary" strokeWidth={1.5} />
            ) : (
              <Shield className="h-5 w-5 text-secondary" strokeWidth={1.5} />
            )}
            {activeTab === 'products' ? 'Productos de Beneficio Aprobados' : 'Seguros de Beneficio Aprobados'}
          </h2>
          
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="h-4 w-4 text-body-muted" strokeWidth={1.5} />
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setFilterStatus(filter.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  filterStatus === filter.value
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-body-muted hover:bg-gray-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            {activeTab === 'products' ? (
              <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-gray-300" strokeWidth={1.5} />
            ) : (
              <Shield className="mx-auto mb-4 h-12 w-12 text-gray-300" strokeWidth={1.5} />
            )}
            <h3 className="text-base font-medium text-body">
              {activeTab === 'products' ? 'No se encontraron productos aprobados' : 'No se encontraron seguros aprobados'}
            </h3>
            <p className="mt-1 text-sm text-body-muted max-w-xs">
              {filterStatus === 'all'
                ? pendingRequestsCount > 0
                  ? `Tienes ${pendingRequestsCount} compra(s) registrada(s) que están a la espera de la aprobación del administrador.`
                  : activeTab === 'products'
                  ? 'Aún no has registrado compras de productos en el Marketplace.'
                  : 'Aún no has adquirido pólizas de seguros en la plataforma.'
                : 'Ningún ítem aprobado coincide con el estado seleccionado.'}
            </p>
            {filterStatus === 'all' && (
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard/collaborator/shop')}
                className="mt-5"
              >
                Explorar Marketplace
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-body-muted">
                    {activeTab === 'products' ? 'Producto Adquirido' : 'Seguro / Póliza de Salud'}
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-body-muted">
                    Fecha de Aprobación
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-body-muted">
                    Monto de Beneficio
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-body-muted">
                    Estado de Pago
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-body-muted">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => {
                  const badge = STATUS_BADGE[item.status]
                  const Icon = badge.icon
                  return (
                    <tr key={item.id} className="group hover:bg-gray-50/30 transition-all">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/5 text-secondary group-hover:bg-secondary/10 transition-colors">
                            {activeTab === 'products' ? (
                              <ShoppingBag className="h-4 w-4" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-body block group-hover:text-secondary transition-colors">
                              {getProductName(item.concept)}
                            </span>
                            <span className="text-[11px] text-body-muted font-mono block mt-0.5">
                              ID: {item.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-body-muted">
                        {fmtDate(item.date)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-bold text-body font-mono">
                          {fmt(item.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${badge.bg}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {badge.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (activeTab === 'insurances') {
                              router.push(`/dashboard/collaborator/purchases/insurance/${item.id}/quotes`)
                            } else {
                              router.push(`/dashboard/collaborator/purchases/product/${item.id}/quotes`)
                            }
                          }}
                          className="flex items-center gap-1.5 mx-auto border border-gray-100 hover:bg-secondary/5 hover:text-secondary py-1.5 px-3 text-xs cursor-pointer rounded-lg"
                        >
                          <Eye className="h-3.5 w-3.5" /> Ver Cuotas
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


    </div>
  )
}

interface CardResumenProps {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  bgIcon: string
  colorIcon: string
}

function CardResumen({ title, value, description, icon: Icon, bgIcon, colorIcon }: CardResumenProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-black/3 transition-all hover:shadow-md hover:shadow-black/5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-body-muted">
          {title}
        </span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgIcon}`}>
          <Icon className={`h-5 w-5 ${colorIcon}`} />
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold tracking-tight text-body font-mono">{value}</h3>
        <p className="mt-1 text-xs text-body-muted">{description}</p>
      </div>
    </div>
  )
}
