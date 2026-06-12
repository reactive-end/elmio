'use client'

import {
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Wallet,
  Package,
  Shield,
  Landmark,
  TrendingUp,
} from 'lucide-react'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { useEmployeeAccountStatement } from '@/src/hooks/pages/useEmployeeAccountStatement'
import type { Transaction } from '@/src/services/empresa.service'

const STATUS_STYLES: Record<
  Transaction['status'],
  { bg: string; text: string; icon: typeof CheckCircle2 }
> = {
  paid: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2 },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  failed: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
}

const FILTERS: { value: Transaction['status'] | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'paid', label: 'Pagados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'failed', label: 'Fallidos' },
]

export default function CollaboratorAccountStatementPage() {
  const {
    loading,
    error,
    profile,
    loanSummary,
    transactionsFiltradas,
    productBenefitsSummary,
    insuranceBenefitsSummary,
    filtroEstado,
    setFiltroEstado,
    benefitedRequestsCount,
    remainingMonthlyLimit,
  } = useEmployeeAccountStatement()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto mt-12 max-w-2xl">
        <Alert type="error" message={error} />
      </div>
    )
  }

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
          <p className="mt-0.5 text-sm text-body-muted">
            Consulta tus beneficios en efectivo, compras y movimientos registrados.
          </p>
        </div>
        {loanSummary && (
          <div className="flex items-center gap-2.5 bg-secondary/5 border border-secondary/15 rounded-2xl px-4 py-2.5 w-fit">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider select-none">
              Tasa de Interés:
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
            label="Beneficio Efectivo"
            value={fmt(loanSummary.totalLoanAmount)}
            sub={`${loanSummary.totalLoans} beneficios`}
            icon={TrendingUp}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <KpiCard
            label="Beneficio Seguros"
            value={fmt(insuranceBenefitsSummary.totalAmount)}
            sub={`${insuranceBenefitsSummary.totalCount} beneficios registrados`}
            icon={Shield}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-700"
          />
          <KpiCard
            label="Beneficio Productos"
            value={fmt(productBenefitsSummary.totalAmount)}
            sub={`${productBenefitsSummary.totalCount} compras registradas`}
            icon={Package}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-700"
          />
          <KpiCard
            label="Disponible del mes"
            value={fmt(remainingMonthlyLimit)}
            sub={`Limite mensual: ${fmt(profile?.maxLoanLimit ?? 0)}`}
            icon={Landmark}
            iconBg="bg-violet-50"
            iconColor="text-violet-700"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm shadow-black/3">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-body">
            <DollarSign className="h-5 w-5 text-secondary" strokeWidth={1.5} /> Movimientos
          </h2>
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-body-muted" strokeWidth={1.5} />
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setFiltroEstado(filter.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${filtroEstado === filter.value ? 'bg-secondary text-white shadow-sm' : 'text-body-muted hover:bg-gray-100'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {transactionsFiltradas.length === 0 ? (
          <div className="py-16 text-center text-sm font-medium text-body-muted">
            Sin movimientos
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-body-muted">
                    Fecha
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-body-muted">
                    Concepto
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase text-body-muted">
                    Monto
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-medium uppercase text-body-muted">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactionsFiltradas.map((transaction) => {
                  const style = STATUS_STYLES[transaction.status]
                  const Icon = style.icon
                  return (
                    <tr
                      key={transaction.id}
                      className="border-t border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-5 py-3.5 text-body-muted">
                        {new Date(transaction.date).toLocaleDateString('es-VE')}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-body">{transaction.concept}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-body">
                        {fmt(transaction.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
                          >
                            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                            {transaction.status === 'paid'
                              ? 'Pagado'
                              : transaction.status === 'pending'
                                ? 'Pendiente'
                                : 'Fallido'}
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
    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm shadow-black/3">
      <div className="mb-2 flex items-center gap-2">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.5} />
        </div>
        <span className="text-xs font-medium leading-tight text-body-muted">{label}</span>
      </div>
      <p className="text-base font-bold leading-tight text-body">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] leading-tight text-body-muted">{sub}</p>}
    </div>
  )
}
