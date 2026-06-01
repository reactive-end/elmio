'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, notFound } from 'next/navigation'
import { Plus, Pencil, Trash2, Landmark, DollarSign } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/atoms/Alert/Alert'
import { bankAccountsAdminService, BankAccountItem } from '@/src/services/bank-accounts-admin.service'

export default function BankAccountsPage() {
  notFound()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<BankAccountItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const successParam = searchParams.get('success')
    if (successParam === 'created') setSuccess('Cuenta bancaria registrada correctamente.')
    if (successParam === 'updated') setSuccess('Cuenta bancaria actualizada correctamente.')
  }, [searchParams])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const list = await bankAccountsAdminService.list()
      setAccounts(list)
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar cuentas bancarias.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchAccounts()
  }, [])

  const handleDelete = async (id: string, description: string) => {
    if (!confirm(`¿Estás seguro de eliminar la cuenta "${description}"?`)) return

    try {
      setDeletingId(id)
      await bankAccountsAdminService.delete(id)
      setAccounts((prev) => prev.filter((acc) => acc.id !== id))
      setSuccess('Cuenta bancaria eliminada correctamente.')
      setError(null)
      router.replace('/dashboard/config/bank-accounts')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar cuenta bancaria.'
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
          <h1 className="text-2xl font-semibold text-body mb-1">Cuentas bancarias</h1>
          <p className="text-sm text-gray-500">
            Gestiona las cuentas bancarias de la administración utilizadas para cobros y conciliaciones financieras ({accounts.length} registradas)
          </p>
        </div>

        <Link href="/dashboard/config/bank-accounts/new">
          <Button className="flex items-center gap-1.5 !py-2.5">
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Registrar cuenta
          </Button>
        </Link>
      </div>

      {success && (
        <Alert type="success" message={success || ''} onDismiss={() => setSuccess(null)} />
      )}

      {error && (
        <Alert type="error" message={error || ''} onDismiss={() => setError(null)} />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-scaleIn">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
              <Landmark className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-body-muted">No hay cuentas registradas</p>
            <p className="text-xs text-body-muted mt-1">Registra la primera cuenta bancaria de la administración para comenzar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/20">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Banco</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Número de Cuenta</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Titular</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Identificación</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Teléfono (Pago móvil)</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Moneda</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Tipo</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Descripción</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center rounded-lg bg-secondary/10 p-1.5 text-secondary shrink-0">
                          <Landmark className="h-4 w-4" strokeWidth={1.5} />
                        </span>
                        <div>
                          <span className="block text-sm font-semibold text-body leading-tight">{account.bank.bankName}</span>
                          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">Cód: {account.bank.bankCode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600 font-medium tracking-tight">
                      {account.accountNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{8})/, '$1-$2-$3-$4')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[150px] truncate" title={account.businessName || ''}>
                      {account.businessName || '—'}
                    </td>
                    <td className="px-6 py-4 font-medium text-xs text-gray-600">
                      {account.documentType}-{account.documentNumber}
                    </td>
                    <td className="px-6 py-4">
                      {account.phoneNumber ? (
                        <div>
                          <span className="text-sm text-gray-600 block">{account.phoneNumber}</span>
                          {account.phoneValidationNumber && (
                            <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Val: {account.phoneValidationNumber}</span>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md px-2 py-0.5 uppercase tracking-wide border border-slate-200/50">
                        {account.currency.code} ({account.currency.symbol})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium bg-gray-100 text-gray-500 rounded-md px-2 py-0.5 uppercase">
                        {account.accountType.accountType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 max-w-[150px] truncate" title={account.description}>
                      {account.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/config/bank-accounts/${account.id}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors"
                          title="Editar cuenta"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === account.id}
                          onClick={() => void handleDelete(account.id, account.description)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
