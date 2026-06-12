'use client'

import {
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Filter,
  Package,
  Shield,
  Wallet,
} from 'lucide-react'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { useAccountStatement } from '@/src/hooks/pages/useEstadoCuenta'
import type { Transaction } from '@/src/services/empresa.service'

const STATUS_STYLES: Record<
  Transaction['status'],
  { bg: string; text: string; icon: typeof CheckCircle2 }
> = {
  paid: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2 },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  failed: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
}

const STATUS_LABELS: Record<Transaction['status'], string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  failed: 'Fallido',
}
const FILTERS: { value: Transaction['status'] | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'paid', label: 'Pagados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'failed', label: 'Fallidos' },
]

export default function AccountStatementPage() {
  const {
    loading,
    error,
    loanSummary,
    benefitedCollaboratorsCount,
    productBenefitsSummary,
    insuranceBenefitsSummary,
    filtroEstado,
    setFiltroEstado,
    transactionsFiltradas,
  } = useAccountStatement()

  if (loading)
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  if (error)
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Alert type="error" message={error} />
      </div>
    )

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(n)

  const getInterestText = (summary: typeof loanSummary) => {
    if (!summary || !summary.interestIsActive || summary.interestType === 'none') {
      return 'Sin definir'
    }
    if (summary.interestType === 'percentage') {
      return `${summary.interestRate}%`
    }
    if (summary.interestType === 'fixed') {
      return `${summary.interestRate} USD Fijo`
    }
    return 'Sin definir'
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100/50 pb-5">
        <div>
          <h1 className="text-xl font-bold text-body">Estado de cuenta</h1>
          <p className="text-sm text-body-muted mt-0.5">
            Resumen de deuda por beneficios en efectivo de colaboradores.
          </p>
        </div>
        {loanSummary && (
          <div className="flex items-center gap-2.5 bg-secondary/5 border border-secondary/15 rounded-2xl px-4 py-2.5 w-fit">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider select-none">
              Tasa de Interés Activa:
            </span>
            <span
              className={`text-sm font-bold ${loanSummary.interestIsActive && loanSummary.interestType !== 'none' ? 'text-secondary' : 'text-gray-400'}`}
            >
              {getInterestText(loanSummary)}
            </span>
          </div>
        )}
      </div>

      {loanSummary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={TrendingUp}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            label="Beneficio Efectivo"
            value={fmt(loanSummary.totalLoanAmount)}
            sub={`${loanSummary.totalLoans} beneficios`}
          />
          <KpiCard
            icon={Shield}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-700"
            label="Beneficio Seguros"
            value={fmt(insuranceBenefitsSummary.totalAmount)}
            sub={`${insuranceBenefitsSummary.totalCount} beneficios registrados`}
          />
          <KpiCard
            icon={Package}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-700"
            label="Beneficio Productos"
            value={fmt(productBenefitsSummary.totalAmount)}
            sub={`${productBenefitsSummary.totalCount} compras registradas`}
          />
          <KpiCard
            icon={Wallet}
            iconBg="bg-secondary/10"
            iconColor="text-secondary"
            label="Total"
            value={fmt(
              loanSummary.totalLoanAmount +
                insuranceBenefitsSummary.totalAmount +
                productBenefitsSummary.totalAmount,
            )}
            sub="Suma de los 3 beneficios"
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-black/3 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-body flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-secondary" strokeWidth={1.5} />
            Movimientos
          </h2>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-body-muted" strokeWidth={1.5} />
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFiltroEstado(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${filtroEstado === f.value ? 'bg-secondary text-white shadow-sm' : 'text-body-muted hover:bg-gray-100'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {transactionsFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <DollarSign className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-body-muted">Sin movimientos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-body-muted uppercase">
                    Fecha
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-body-muted uppercase">
                    Concepto
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-body-muted uppercase">
                    Monto
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-body-muted uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactionsFiltradas.map((tx) => {
                  const s = STATUS_STYLES[tx.status]
                  const Ic = s.icon
                  return (
                    <tr
                      key={tx.id}
                      className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-body-muted">
                        {new Date(tx.date).toLocaleDateString('es-VE')}
                      </td>
                      <td className="px-5 py-3.5 text-body font-medium">{tx.concept}</td>
                      <td className="px-5 py-3.5 text-body text-right font-semibold">
                        {fmt(tx.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${s.bg} ${s.text}`}
                          >
                            <Ic className="w-3.5 h-3.5" strokeWidth={2} />
                            {STATUS_LABELS[tx.status]}
                          </span>
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

function KpiCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: typeof DollarSign
  iconBg: string
  iconColor: string
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm shadow-black/3">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.5} />
        </div>
        <span className="text-xs text-body-muted font-medium leading-tight">{label}</span>
      </div>
      <p className="text-base font-bold text-body leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-body-muted mt-0.5 leading-tight">{sub}</p>}
    </div>
  )
}
