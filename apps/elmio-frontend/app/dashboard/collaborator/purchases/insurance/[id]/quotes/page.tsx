'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft, Landmark, Calendar, Mail, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Button } from '@/components/atoms/Button/Button'
import { authService } from '@/src/services/auth.service'
import { enterpriseService, type Transaction } from '@/src/services/empresa.service'
import { mercantilService, type PaymentQuote } from '@/src/services/mercantil.service'

interface InsuranceQuotesPageProps {
  params: Promise<{
    id: string
  }>
}

export default function InsuranceQuotesPage({ params }: InsuranceQuotesPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const transactionId = resolvedParams.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [quotes, setQuotes] = useState<PaymentQuote[]>([])

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

        // 1. Cargar Transacciones del colaborador
        const txs = await enterpriseService.listMyTransactions()
        const tx = txs.find((t) => t.id === transactionId)
        if (!tx) {
          throw new Error('Transacción de seguro no encontrada.')
        }
        setTransaction(tx)

        // 2. Obtener el perfil para saber el correo
        const profile = await enterpriseService.getMyProfile()
        if (!profile.email) {
          throw new Error('Tu perfil no posee un correo electrónico asociado para buscar las pólizas.')
        }

        const conceptLower = tx.concept.toLowerCase()
        const isRCV = conceptLower.includes('rcv')

        if (isRCV) {
          // Si es un seguro RCV (La Mundial o Mercantil), es de pago único anual (1 cuota)
          setQuotes([
            {
              id: 'rcv-anual',
              quote: '1 de 1',
              amount: tx.amount,
              expirationDate: new Date(new Date(tx.date).setFullYear(new Date(tx.date).getFullYear() + 1)).toISOString(),
              agreement: 'ANUAL',
              receipt: '—',
              isPaid: tx.status === 'paid',
              receiptStatus: tx.status,
              quoteStatus: tx.status,
            } as any
          ])
          setLoading(false)
          return
        }

        // 3. Buscar la orden de seguros del colaborador por su correo
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
        const searchRes = await fetch(
          `${apiBase}/mercantil/storage/clients/search?email=${encodeURIComponent(profile.email)}`,
          {
            headers: {
              ...authService.getAuthHeaders(),
            },
          }
        )

        if (!searchRes.ok) {
          throw new Error('Error al buscar tu póliza de seguro en la base de datos.')
        }

        const clientSearchResult = (await searchRes.json()) as {
          items: Array<{ shopcartId: string; firstName: string; lastName: string }>
        }

        const userOrders = clientSearchResult.items || []
        if (userOrders.length === 0) {
          // Si no se encuentran cuotas en base de datos, mostramos un error elegante
          setQuotes([])
          return
        }

        // Tomar el primer shopcartId coincidente
        const shopcartId = userOrders[0].shopcartId

        // 4. Buscar cuotas reales por el shopcartId
        const fetchedQuotes = await mercantilService.getQuotesByShopcart(shopcartId)
        setQuotes(fetchedQuotes)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Error al cargar las cuotas del seguro.')
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
        <span className="text-sm font-semibold text-body-muted animate-pulse">Cargando cuotas reales de Mercantil...</span>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary shadow-sm shadow-secondary/5">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Desglose de Póliza</span>
            <h1 className="text-2xl font-bold tracking-tight text-body mt-0.5">
              {transaction ? getProductName(transaction.concept) : 'Seguro Mercantil'}
            </h1>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/collaborator/purchases')}
          className="flex items-center gap-2 border border-gray-150 hover:bg-gray-50/50 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a Compras
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {transaction && (
        <>
          {/* Tarjeta de Resumen Premium */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-body-muted uppercase block tracking-wider">Monto Total de Póliza</span>
              <span className="font-bold text-body font-mono text-xl">{fmt(transaction.amount)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-body-muted uppercase block tracking-wider">Frecuencia de Pago</span>
              <span className="font-semibold text-body block text-sm mt-0.5">Fraccionamiento Mensual</span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-body-muted uppercase block tracking-wider">Fecha Adquisición</span>
              <span className="font-medium text-body block text-xs mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {fmtDate(transaction.date)}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-body-muted uppercase block tracking-wider">Estado de Póliza</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mt-0.5 border ${
                transaction.status === 'paid'
                  ? 'bg-green-50 text-green-700 border-green-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {transaction.status === 'paid' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Totalmente Pago
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    Pagos Pendientes
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
                Cronograma Oficial de Amortización de Seguro
              </h2>
              <p className="text-xs text-body-muted mt-1">
                Las cuotas de tu seguro de salud o vehículo Mercantil se descuentan automáticamente bajo tu esquema acordado o de forma directa.
              </p>
            </div>

            {quotes.length === 0 ? (
              <div className="py-16 px-6 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-body">Sin cuotas estructuradas encontradas</h3>
                  <p className="text-xs text-body-muted max-w-sm mt-1 leading-relaxed">
                    Mercantil procesó y emitió tu póliza, pero no se ha estructurado un calendario de fraccionamiento local. Próximamente se sincronizará.
                  </p>
                </div>
              </div>
            ) : (
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
                        Convenio
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Recibo
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Estado Pago
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quotes.map((cuota, idx) => {
                      const isPaid = cuota.isPaid || cuota.receiptStatus?.toLowerCase() === 'paid' || cuota.quoteStatus?.toLowerCase() === 'paid'
                      return (
                        <tr key={cuota.id || idx} className="hover:bg-gray-50/20 transition-colors">
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-body-muted">
                              {cuota.quote || `${idx + 1} de ${quotes.length}`}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-body font-mono">
                              {fmt(cuota.amount ?? 0)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-left">
                            <span className="inline-flex items-center gap-1.5 text-body-muted font-medium">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {cuota.expirationDate ? fmtDate(cuota.expirationDate) : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs text-body-muted font-mono">
                              {cuota.agreement || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs text-body-muted font-mono">
                              {cuota.receipt || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              isPaid
                                ? 'bg-green-50 text-green-700 border border-green-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {isPaid ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Pagado
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 animate-pulse" />
                                  Pendiente
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
