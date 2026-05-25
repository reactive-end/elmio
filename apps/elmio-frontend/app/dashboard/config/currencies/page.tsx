'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Pencil, Trash2, Lock, RefreshCw, DollarSign } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/atoms/Alert/Alert'
import { bankAccountsAdminService, CurrencyItem } from '@/src/services/bank-accounts-admin.service'

export default function CurrenciesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const successParam = searchParams.get('success')
    if (successParam === 'created') setSuccess('Moneda registrada correctamente.')
    if (successParam === 'updated') setSuccess('Moneda actualizada correctamente.')
  }, [searchParams])

  const loadCurrencies = async () => {
    try {
      setLoading(true)
      const list = await bankAccountsAdminService.listCurrencies()
      setCurrencies(list)
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar monedas.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCurrencies()
  }, [])

  const handleDelete = async (currency: CurrencyItem) => {
    if (currency.code === 'USD' || currency.code === 'VES') {
      return // Protegidas
    }

    if (!confirm(`¿Estás completamente seguro de eliminar la moneda "${currency.name} (${currency.symbol})"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      setDeletingId(currency.id)
      await bankAccountsAdminService.deleteCurrency(currency.id)
      setCurrencies((prev) => prev.filter((c) => c.id !== currency.id))
      setSuccess(`Moneda "${currency.name}" eliminada exitosamente.`)
      setError(null)
      router.replace('/dashboard/config/currencies')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar moneda.'
      setError(message)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-secondary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-body mb-1">Monedas del Sistema</h1>
          <p className="text-sm text-gray-500">
            Administra las monedas disponibles para cuentas bancarias, cobros y operaciones financieras ({currencies.length} registradas)
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => void loadCurrencies()}
            className="flex items-center gap-1.5 py-1!"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
            Actualizar
          </Button>

          <Link href="/dashboard/config/currencies/new">
            <Button className="flex items-center py-1!">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Agregar Moneda
            </Button>
          </Link>
        </div>
      </div>

      {success && (
        <Alert type="success" message={success} onDismiss={() => setSuccess(null)} />
      )}

      {error && (
        <Alert type="error" message={error} onDismiss={() => setError(null)} />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {currencies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
              <DollarSign className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-body-muted">No hay monedas registradas</p>
            <p className="text-xs text-body-muted mt-1">Registra tu primera moneda personalizada para comenzar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Nombre de la Moneda
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Código ISO
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Símbolo
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Tasa de Cambio (VES)
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Estado
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Protección
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((currency) => {
                  const isProtected = currency.code === 'USD' || currency.code === 'VES'
                  const isVes = currency.code === 'VES'

                  return (
                    <tr
                      key={currency.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center rounded-xl bg-secondary/10 text-secondary font-semibold text-sm h-8 w-8 select-none">
                            {currency.symbol}
                          </span>
                          <span className="text-sm font-medium text-body">{currency.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs font-mono font-bold text-gray-600 bg-gray-100 rounded-md px-2 py-0.5 tracking-wider">
                          {currency.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {currency.symbol}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-slate-600">
                          {Number(currency.exchangeRate).toFixed(4)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5 ${
                            currency.isActive
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              currency.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          {currency.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isProtected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-600 rounded-full px-2.5 py-0.5 border border-blue-100/50">
                            <Lock className="h-3 w-3" strokeWidth={1.5} />
                            Primordial
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Personalizada</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isVes ? (
                            <button
                              type="button"
                              disabled
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 cursor-not-allowed"
                              title="Bolívares está blindada y no se puede editar"
                            >
                              <Pencil className="w-4 h-4 text-gray-300" strokeWidth={1.5} />
                            </button>
                          ) : (
                            <Link
                              href={`/dashboard/config/currencies/${currency.id}`}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors"
                              title={
                                currency.code === 'USD'
                                  ? 'Editar tasa de cambio'
                                  : 'Editar'
                              }
                            >
                              <Pencil className="w-4 h-4" strokeWidth={1.5} />
                            </Link>
                          )}

                          <button
                            type="button"
                            disabled={isProtected || deletingId === currency.id}
                            onClick={() => void handleDelete(currency)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}
                            title={
                              isProtected
                                ? 'Esta moneda primordial no se puede eliminar'
                                : 'Eliminar'
                            }
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
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
    </div>
  )
}
