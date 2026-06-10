'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Landmark,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  RefreshCw,
  Eye,
  Shield,
  ShoppingBag,
} from 'lucide-react'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Button } from '@/components/atoms/Button/Button'
import { FormField } from '@/components/molecules/FormField/FormField'
import { Input } from '@/components/atoms/Input/Input'
import { enterpriseService, type FinancePurchaseResponse } from '@/src/services/empresa.service'

export default function FinancePurchasesPage() {
  const router = useRouter()
  const [purchases, setPurchases] = useState<FinancePurchaseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingTxs, setProcessingTxs] = useState<Record<string, boolean>>({})
  
  // Filtros y búsquedas
  const [searchCedula, setSearchCedula] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'insurance' | 'product'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all')

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await enterpriseService.listAllPurchases()
      setPurchases(data)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Error al cargar el historial global de compras.')
    } finally {
      setLoading(false)
    }
  }

  const handleNotifyInsurance = async (transactionId: string) => {
    if (processingTxs[transactionId]) return
    setProcessingTxs((prev) => ({ ...prev, [transactionId]: true }))
    setError(null)
    try {
      await enterpriseService.notifyInsurancePayment(transactionId)
      await loadData()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Error al notificar pago de seguro.')
    } finally {
      setProcessingTxs((prev) => ({ ...prev, [transactionId]: false }))
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(n)

  // Filtrado reactivo en el cliente
  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      // 1. Filtro por cédula (búsqueda parcial insensible a mayúsculas/minúsculas)
      const cedulaMatch = item.collaborator.documentId
        .toLowerCase()
        .includes(searchCedula.trim().toLowerCase())

      // 2. Filtro por tipo (seguro o producto)
      const typeMatch = filterType === 'all' || item.type === filterType

      // 3. Filtro por estado del plan (liquidado vs pendiente)
      const isPaid = item.pendingQuotes === 0
      const statusMatch =
        filterStatus === 'all' ||
        (filterStatus === 'paid' && isPaid) ||
        (filterStatus === 'pending' && !isPaid)

      return cedulaMatch && typeMatch && statusMatch
    })
  }, [purchases, searchCedula, filterType, filterStatus])

  // Métricas superiores globales calculadas reactivamente a partir de la lista filtrada
  const metrics = useMemo(() => {
    const totalFinanced = filteredPurchases.reduce((sum, item) => sum + item.amount, 0)
    const totalPending = filteredPurchases.reduce((sum, item) => sum + item.pendingAmount, 0)
    const totalPaid = Math.max(0, totalFinanced - totalPending)

    return { totalFinanced, totalPending, totalPaid }
  }, [filteredPurchases])

  const getProductName = (concept: string) => {
    const prefix = 'Compra marketplace: '
    if (concept.startsWith(prefix)) {
      return concept.slice(prefix.length)
    }
    return concept
  }

  return (
    <div className="w-full flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Encabezado Premium */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="text-secondary w-6 h-6 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-body">Control de Compras y Amortizaciones</h1>
          </div>
          <p className="text-xs text-body-muted mt-1 leading-relaxed">
            Monitorea el plan de amortización de préstamos, adquisición de productos y seguros de todos los colaboradores del sistema.
          </p>
        </div>
        <Button
          onClick={() => void loadData()}
          variant="ghost"
          className="flex items-center gap-2 text-xs font-semibold cursor-pointer shrink-0 border border-gray-200"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Tarjetas de Métricas Consolidadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-black/3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-body-muted">
              Total Financiado
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-body font-mono">
              {fmt(metrics.totalFinanced)}
            </h3>
            <p className="mt-1 text-xs text-body-muted">Capital otorgado en el marketplace</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-black/3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-body-muted">
              Total Cobrado / Liquidado
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-body font-mono">
              {fmt(metrics.totalPaid)}
            </h3>
            <p className="mt-1 text-xs text-body-muted">Cuotas ya descontadas de nómina</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-black/3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-body-muted">
              Saldo Pendiente por Cobrar
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-body font-mono">
              {fmt(metrics.totalPending)}
            </h3>
            <p className="mt-1 text-xs text-body-muted">Por amortizar en cuotas futuras</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Buscador Dinámico de Cédula */}
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchCedula}
            onChange={(e) => setSearchCedula(e.target.value)}
            placeholder="Buscar por Cédula del colaborador..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl outline-none"
          />
        </div>

        {/* selectores de filtro */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 outline-none bg-white font-medium text-body-muted focus:border-secondary"
            >
              <option value="all">Todos los Tipos</option>
              <option value="product">Préstamos / Productos</option>
              <option value="insurance">Seguros Mercantil</option>
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 outline-none bg-white font-medium text-body-muted focus:border-secondary"
          >
            <option value="all">Todos los Estados</option>
            <option value="pending">Con Cuotas Pendientes</option>
            <option value="paid">Totalmente Liquidado</option>
          </select>
        </div>
      </div>

      {/* Tabla de Compras */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <span className="text-sm font-medium text-body-muted">Cargando compras y amortizaciones...</span>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-body">Sin Coincidencias</h3>
              <p className="text-xs text-body-muted max-w-xs mt-1 leading-relaxed mx-auto">
                No se encontraron compras ni planes de cuotas que coincidan con la búsqueda o filtros aplicados.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Colaborador</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Concepto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Monto Financiado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Plan Cuotas</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Saldo Pendiente</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPurchases.map((item) => {
                  const isPaid = item.pendingQuotes === 0
                  return (
                    <tr key={item.transactionId} className="hover:bg-gray-50/20 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-xs text-body block">{item.collaborator.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono block mt-0.5">CI: {item.collaborator.documentId}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-body-muted">
                        {item.enterprise.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {item.type === 'insurance' ? (
                            <Shield className="w-3.5 h-3.5 text-secondary shrink-0" />
                          ) : (
                            <ShoppingBag className="w-3.5 h-3.5 text-secondary shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-body line-clamp-1 max-w-[200px]" title={getProductName(item.concept)}>
                            {getProductName(item.concept)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-xs text-body font-mono block">{fmt(item.amount)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-semibold text-body block font-mono">
                          {item.paidQuotes} / {item.totalQuotes} pagadas
                        </span>
                        <span className={`inline-flex items-center gap-0.5 mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                          isPaid
                            ? 'bg-green-50 text-green-700 border-green-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {isPaid ? 'Liquidado' : `${item.pendingQuotes} pendientes`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold text-xs font-mono block ${isPaid ? 'text-green-600' : 'text-body'}`}>
                          {fmt(item.pendingAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              if (item.type === 'insurance') {
                                router.push(`/dashboard/collaborator/purchases/insurance/${item.transactionId}/quotes`)
                              } else {
                                router.push(`/dashboard/collaborator/purchases/product/${item.transactionId}/quotes`)
                              }
                            }}
                            className="flex items-center gap-1.5 border border-gray-150 hover:bg-secondary/5 hover:text-secondary py-1.5 px-3 text-[10px] cursor-pointer rounded-lg font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Auditar Plan
                          </Button>
                          {item.type === 'insurance' && !isPaid && (
                            <Button
                              onClick={() => void handleNotifyInsurance(item.transactionId)}
                              disabled={processingTxs[item.transactionId]}
                              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white py-1.5 px-3 text-[10px] cursor-pointer rounded-lg font-semibold border-none disabled:bg-gray-200 disabled:text-gray-400"
                            >
                              {processingTxs[item.transactionId] ? (
                                <Spinner size="sm" />
                              ) : (
                                <Shield className="w-3.5 h-3.5" />
                              )}
                              {processingTxs[item.transactionId] ? 'Notificando...' : 'Notificar Aseguradora'}
                            </Button>
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
    </div>
  )
}
