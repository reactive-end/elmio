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
  Shield,
  Eye,
  Calendar,
} from 'lucide-react'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Button } from '@/components/atoms/Button/Button'
import { enterpriseService, type Transaction } from '@/src/services/empresa.service'

const STATUS_BADGE: Record<
  Transaction['status'],
  { bg: string; text: string; icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  pending: { bg: 'bg-amber-50 text-amber-700 border-amber-100', text: 'text-amber-700', icon: Clock, label: 'Pendiente' },
  paid: { bg: 'bg-green-50 text-green-700 border-green-100', text: 'text-green-700', icon: CheckCircle2, label: 'Pagado' },
  failed: { bg: 'bg-red-50 text-red-700 border-red-100', text: 'text-red-700', icon: XCircle, label: 'Fallido' },
}

const FILTERS: { value: Transaction['status'] | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'paid', label: 'Pagadas' },
  { value: 'failed', label: 'Fallidas' },
]

interface PolicyCuotaSimulada {
  number: number
  amount: number
  dueDate: string
  status: 'paid' | 'pending' | 'failed'
}

export default function EnterprisePurchasesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [purchases, setPurchases] = useState<Transaction[]>([])
  const [insurances, setInsurances] = useState<Transaction[]>([])
  const [activeTab, setActiveTab] = useState<'products' | 'insurances'>('products')
  const [filterStatus, setFilterStatus] = useState<Transaction['status'] | 'all'>('all')

  // Estado del modal de cuotas
  const [selectedInsurance, setSelectedInsurance] = useState<Transaction | null>(null)
  const [cuotas, setCuotas] = useState<PolicyCuotaSimulada[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const enterprise = await enterpriseService.getMe()
        const txs = await enterpriseService.listTransactions(enterprise.id)
        
        // Filtrar transacciones de cargo que corresponden a compras de marketplace
        const marketplaceCharges = txs.filter(
          (t) => t.kind === 'charge' && t.concept.startsWith('Compra marketplace:'),
        )

        // Separar entre Seguros y Productos
        const segs = marketplaceCharges.filter((t) => {
          const conceptLower = t.concept.toLowerCase()
          return conceptLower.includes('seguro') || conceptLower.includes('póliza') || conceptLower.includes('poliza')
        })

        const prods = marketplaceCharges.filter((t) => {
          const conceptLower = t.concept.toLowerCase()
          return !conceptLower.includes('seguro') && !conceptLower.includes('póliza') && !conceptLower.includes('poliza')
        })

        setInsurances(segs)
        setPurchases(prods)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar las compras.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const currentList = activeTab === 'products' ? purchases : insurances

  const filteredItems = useMemo(() => {
    return filterStatus === 'all'
      ? currentList
      : currentList.filter((p) => p.status === filterStatus)
  }, [filterStatus, currentList])

  // Métricas del dashboard de compras consolidado
  const metrics = useMemo(() => {
    const allItems = [...purchases, ...insurances]
    const totalCount = allItems.length
    const totalAmount = allItems.reduce((sum, p) => sum + p.amount, 0)
    const paidAmount = allItems.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
    const pendingAmount = allItems.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)

    return { totalCount, totalAmount, paidAmount, pendingAmount }
  }, [purchases, insurances])

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

  // Genera cuotas simuladas para una póliza de seguro
  const handleOpenCuotas = (insurance: Transaction) => {
    setSelectedInsurance(insurance)
    const numCuotas = 6 // Por defecto dividimos la póliza de seguro en 6 cuotas
    const totalAmount = insurance.amount
    const cuotaAmount = Math.round((totalAmount / numCuotas) * 100) / 100
    
    const baseDate = new Date(insurance.date)
    const items: PolicyCuotaSimulada[] = []

    for (let i = 1; i <= numCuotas; i++) {
      const dueDate = new Date(baseDate)
      dueDate.setMonth(baseDate.getMonth() + i)
      
      let status: PolicyCuotaSimulada['status'] = 'pending'
      if (insurance.status === 'paid') {
        status = 'paid'
      } else if (insurance.status === 'failed') {
        status = 'failed'
      } else {
        // Si está pendiente, consideramos que las primeras 2 cuotas ya se pagaron
        status = i <= 2 ? 'paid' : 'pending'
      }

      items.push({
        number: i,
        amount: i === numCuotas ? totalAmount - cuotaAmount * (numCuotas - 1) : cuotaAmount,
        dueDate: dueDate.toISOString(),
        status,
      })
    }

    setCuotas(items)
  }

  const handleSimularPagoCuota = (cuotaNumber: number) => {
    setCuotas((prev) =>
      prev.map((c) => (c.number === cuotaNumber ? { ...c, status: 'paid' as const } : c)),
    )
    setSuccessMessage(`¡Cuota N° ${cuotaNumber} abonada de forma simulada con éxito!`)
    setTimeout(() => setSuccessMessage(null), 3500)
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
            Gestiona e inspecciona tus productos y pólizas de seguro adquiridas en el Marketplace.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/enterprise/shop')}
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
          title="Total Comprado"
          value={fmt(metrics.totalAmount)}
          description={`${metrics.totalCount} ítems adquiridos`}
          icon={ShoppingBag}
          bgIcon="bg-secondary/10"
          colorIcon="text-secondary"
        />
        <CardResumen
          title="Total Pagado"
          value={fmt(metrics.paidAmount)}
          description="Transacciones liquidadas"
          icon={CheckCircle2}
          bgIcon="bg-green-50"
          colorIcon="text-green-600"
        />
        <CardResumen
          title="Total Pendiente"
          value={fmt(metrics.pendingAmount)}
          description="Cuotas o saldos en deuda"
          icon={Clock}
          bgIcon="bg-amber-50"
          colorIcon="text-amber-600"
        />
        <CardResumen
          title="Porcentaje de Pago"
          value={metrics.totalAmount > 0 ? `${Math.round((metrics.paidAmount / metrics.totalAmount) * 100)}%` : '0%'}
          description="Progreso de liquidación"
          icon={Percent}
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
          <ShoppingBag className="h-4 w-4" /> Productos Marketplace ({purchases.length})
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
          <Shield className="h-4 w-4" /> Seguros y Pólizas ({insurances.length})
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
            {activeTab === 'products' ? 'Productos Adquiridos' : 'Pólizas de Seguro en Cuotas'}
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
              {activeTab === 'products' ? 'No se encontraron productos' : 'No se encontraron seguros'}
            </h3>
            <p className="mt-1 text-sm text-body-muted max-w-xs">
              {filterStatus === 'all'
                ? activeTab === 'products'
                  ? 'Aún no has registrado compras de productos en el Marketplace.'
                  : 'Aún no posees seguros contratados en la plataforma.'
                : 'Ningún ítem coincide con el estado seleccionado.'}
            </p>
            {filterStatus === 'all' && (
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard/enterprise/shop')}
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
                    {activeTab === 'products' ? 'Producto' : 'Seguro / Póliza'}
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-body-muted">
                    Fecha de Compra
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-body-muted">
                    Monto Total
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-body-muted">
                    Estado
                  </th>
                  {activeTab === 'insurances' && (
                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-body-muted">
                      Acción
                    </th>
                  )}
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
                      {activeTab === 'insurances' && (
                        <td className="px-5 py-4 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenCuotas(item)}
                            className="flex items-center gap-1.5 mx-auto border border-gray-100 hover:bg-secondary/5 hover:text-secondary py-1.5 px-3 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> Ver Cuotas
                          </Button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Premium de Cuotas de Seguros */}
      {selectedInsurance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedInsurance(null)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-gray-150 bg-white p-6 shadow-2xl transition-all">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Plan de Financiamiento</span>
                  <h3 className="text-xl font-bold text-body mt-0.5">
                    {getProductName(selectedInsurance.concept)}
                  </h3>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedInsurance(null)} className="h-8 py-0">
                Cerrar
              </Button>
            </div>

            {/* Resumen de la Póliza */}
            <div className="grid grid-cols-3 gap-4 my-5 rounded-2xl bg-gray-50 p-4 text-sm">
              <div>
                <span className="text-[11px] text-body-muted block">Monto de la Póliza</span>
                <span className="font-bold text-body font-mono text-base">{fmt(selectedInsurance.amount)}</span>
              </div>
              <div>
                <span className="text-[11px] text-body-muted block">Frecuencia de Pago</span>
                <span className="font-semibold text-body">Mensual</span>
              </div>
              <div>
                <span className="text-[11px] text-body-muted block">Estado General</span>
                <span className={`font-semibold inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-xs ${
                  selectedInsurance.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {selectedInsurance.status === 'paid' ? 'Liquidado' : 'Con saldo en cuotas'}
                </span>
              </div>
            </div>

            {/* Listado de Cuotas */}
            <div className="max-h-[35vh] overflow-y-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 text-xs font-semibold text-body-muted uppercase">
                    <th className="px-4 py-2.5 text-center">N° Cuota</th>
                    <th className="px-4 py-2.5 text-right">Monto</th>
                    <th className="px-4 py-2.5 text-left">Vencimiento</th>
                    <th className="px-4 py-2.5 text-center">Estado</th>
                    <th className="px-4 py-2.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cuotas.map((cuota) => (
                    <tr key={cuota.number} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-center font-semibold text-body-muted">
                        {cuota.number} de {cuotas.length}
                      </td>
                      <td className="px-4 py-3 text-right font-bold font-mono text-body">
                        {fmt(cuota.amount)}
                      </td>
                      <td className="px-4 py-3 text-left text-body-muted">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(new Date(cuota.dueDate))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          cuota.status === 'paid'
                            ? 'bg-green-50 text-green-700'
                            : cuota.status === 'failed'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {cuota.status === 'paid' ? 'Pagado' : cuota.status === 'failed' ? 'Fallido' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {cuota.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => handleSimularPagoCuota(cuota.number)}
                            className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-white shadow hover:bg-secondary/90 transition-colors"
                          >
                            Pagar cuota
                          </button>
                        ) : (
                          <span className="text-xs text-body-muted font-medium">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedInsurance(null)} variant="primary">
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
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
