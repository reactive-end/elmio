'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  enterpriseService,
  type Enterprise,
  type LoanSummary,
  type Transaction,
} from '@/src/services/empresa.service'

interface UseAccountStatementReturn {
  enterprise: Enterprise | null
  loanSummary: LoanSummary | null
  transactions: Transaction[]
  loading: boolean
  error: string | null
  filtroEstado: Transaction['status'] | 'all'
  setFiltroEstado: (status: Transaction['status'] | 'all') => void
  transactionsFiltradas: Transaction[]
}

/**
 * Hook que gestiona la logica del estado de cuenta empresarial.
 * Carga empresa, resumen de prestamos y transacciones.
 * @returns Estado de cuenta, filtros y resumen de deuda.
 */
export function useAccountStatement(): UseAccountStatementReturn {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [loanSummary, setLoanSummary] = useState<LoanSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<Transaction['status'] | 'all'>('all')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const emp = await enterpriseService.getMe()
      setEnterprise(emp)

      const [summary, txs] = await Promise.all([
        enterpriseService.getLoanSummary(emp.id),
        enterpriseService.listTransactions(emp.id),
      ])

      setLoanSummary(summary)
      setTransactions(txs)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  const transactionsFiltradas = useMemo(() => {
    return filtroEstado === 'all'
      ? transactions
      : transactions.filter((t) => t.status === filtroEstado)
  }, [filtroEstado, transactions])

  return {
    enterprise,
    loanSummary,
    transactions,
    loading,
    error,
    filtroEstado,
    setFiltroEstado,
    transactionsFiltradas,
  }
}
