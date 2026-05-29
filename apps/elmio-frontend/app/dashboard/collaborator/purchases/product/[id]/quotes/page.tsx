'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, ArrowLeft, Landmark, Calendar, CheckCircle2, Clock, Percent } from 'lucide-react'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Button } from '@/components/atoms/Button/Button'
import { enterpriseService, type Transaction } from '@/src/services/empresa.service'
import { productService } from '@/src/services/product.service'

interface ProductQuotesPageProps {
  params: Promise<{
    id: string
  }>
}

interface ProductCuotaSimulada {
  number: number
  amount: number
  dueDate: string
  status: 'paid' | 'pending' | 'failed'
}

export default function ProductQuotesPage({ params }: ProductQuotesPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const transactionId = resolvedParams.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [quotes, setQuotes] = useState<ProductCuotaSimulada[]>([])

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(n)

  const fmtDate = (dStr: string) => {
    try {
      const date = new Date(dStr)
      return new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(date)
    } catch {
      return dStr
    }
  }

  const getProductName = (concept: string) => {
    const prefix = 'Compra marketplace: '
    if (concept.startsWith(prefix)) {
      return concept.slice(prefix.length)
    }
    return concept
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Cargar transacciones del colaborador
        const txs = await enterpriseService.listMyTransactions()
        const tx = txs.find((t) => t.id === transactionId)
        if (!tx) {
          throw new Error('Transacción de compra no encontrada.')
        }
        setTransaction(tx)

        // 2. Extraer nombre de producto e intentar buscar la configuración de cuotas real
        const productName = getProductName(tx.concept)
        let numCuotas = 6 // Por defecto 6 cuotas de financiamiento para préstamos
        
        try {
          const products = await productService.list()
          const matchedProduct = products.find(
            (p) => p.name.trim().toLowerCase() === productName.toLowerCase()
          )

          if (matchedProduct && matchedProduct.financingSchemes && matchedProduct.financingSchemes.length > 0) {
            const maxQ = matchedProduct.financingSchemes[0].maxQuotas
            if (maxQ && maxQ > 1) {
              numCuotas = maxQ
            }
          }
        } catch {
          // Ignorar fallas al consultar spec de producto, mantener default de 6 cuotas
        }

        // 3. Generar cronograma de amortización amortizado
        const totalAmount = tx.amount
        const cuotaAmount = Math.round((totalAmount / numCuotas) * 100) / 100
        const baseDate = new Date(tx.date)
        const items: ProductCuotaSimulada[] = []

        for (let i = 1; i <= numCuotas; i++) {
          const dueDate = new Date(baseDate)
          dueDate.setMonth(baseDate.getMonth() + i)

          let status: ProductCuotaSimulada['status'] = 'pending'
          if (tx.status === 'paid') {
            status = 'paid'
          } else if (tx.status === 'failed') {
            status = 'failed'
          } else {
            // Emulación: Las cuotas cuyas fechas de vencimiento ya pasaron se consideran cobradas/pagadas
            const now = new Date()
            status = dueDate < now ? 'paid' : 'pending'
          }

          items.push({
            number: i,
            amount: i === numCuotas ? totalAmount - cuotaAmount * (numCuotas - 1) : cuotaAmount,
            dueDate: dueDate.toISOString(),
            status,
          })
        }

        setQuotes(items)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Error al estructurar el plan de cuotas.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [transactionId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-sm font-semibold text-body-muted animate-pulse">Estructurando plan de cuotas de financiamiento...</span>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary shadow-sm shadow-secondary/5">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Desglose de Financiamiento</span>
            <h1 className="text-2xl font-bold tracking-tight text-body mt-0.5">
              {transaction ? getProductName(transaction.concept) : 'Producto de Beneficio'}
            </h1>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/collaborator/purchases')}
          className="flex items-center gap-2 border border-gray-150 hover:bg-gray-50/50 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a Mis Compras
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {transaction && (
        <>
          {/* Tarjeta de Resumen Premium */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-body-muted uppercase block tracking-wider">Monto Financiado</span>
              <span className="font-bold text-body font-mono text-xl">{fmt(transaction.amount)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-body-muted uppercase block tracking-wider">Tipo de Financiamiento</span>
              <span className="font-semibold text-body block text-sm mt-0.5 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-secondary" />
                Deducciones de Nómina
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-body-muted uppercase block tracking-wider">Fecha de Emisión</span>
              <span className="font-medium text-body block text-xs mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {fmtDate(transaction.date)}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-body-muted uppercase block tracking-wider">Estado Financiamiento</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mt-0.5 border ${
                transaction.status === 'paid'
                  ? 'bg-green-50 text-green-700 border-green-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {transaction.status === 'paid' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Liquidado Completo
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    Cuotas Pendientes
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Tabla de Amortización */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 p-5">
              <h2 className="text-base font-bold text-body flex items-center gap-2">
                <Landmark className="w-4 h-4 text-secondary" />
                Cronograma de Amortización Mensual
              </h2>
              <p className="text-xs text-body-muted mt-1">
                Visualiza el calendario detallado de los cobros mensuales programados para tu préstamo o adquisición.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      N° Cuota
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Monto Cuota
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Fecha Vencimiento
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Estado Pago
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotes.map((cuota) => (
                    <tr key={cuota.number} className="hover:bg-gray-50/20 transition-colors">
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-body-muted">
                          Cuota {cuota.number} de {quotes.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-body font-mono">
                          {fmt(cuota.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <span className="inline-flex items-center gap-1.5 text-body-muted font-medium">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {fmtDate(cuota.dueDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          cuota.status === 'paid'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {cuota.status === 'paid' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Pagado
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 animate-pulse" />
                              Pendiente
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
