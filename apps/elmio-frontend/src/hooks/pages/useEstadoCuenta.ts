'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  enterpriseService,
  type Enterprise,
  type LoanSummary,
  type LoanRequest,
  type Transaction,
} from '@/src/services/empresa.service'

interface UseAccountStatementReturn {
  enterprise: Enterprise | null
  loanSummary: LoanSummary | null
  transactions: Transaction[]
  benefitedCollaboratorsCount: number
  productBenefitsSummary: {
    totalAmount: number
    totalCount: number
  }
  insuranceBenefitsSummary: {
    totalAmount: number
    totalCount: number
  }
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
  const [approvedRequests, setApprovedRequests] = useState<LoanRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<Transaction['status'] | 'all'>('all')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const emp = await enterpriseService.getMe()
      setEnterprise(emp)

      const [summary, txs, approvedBenefitRequests] = await Promise.all([
        enterpriseService.getLoanSummary(emp.id),
        enterpriseService.listTransactions(emp.id),
        enterpriseService.listRequests(emp.id, 'approved'),
      ])

      setLoanSummary(summary)
      setTransactions(txs)
      setApprovedRequests(approvedBenefitRequests)
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

  const { productBenefitsSummary, insuranceBenefitsSummary } = useMemo(() => {
    const insuranceCharges = transactions.filter((transaction) => {
      const concept = transaction.concept.toLowerCase()
      return transaction.kind === 'charge' && concept.includes('seguro')
    })

    const productCharges = transactions.filter((transaction) => {
      const concept = transaction.concept.toLowerCase()
      return transaction.kind === 'charge' && !concept.includes('seguro')
    })

    return {
      productBenefitsSummary: {
        totalAmount: productCharges.reduce((sum, transaction) => sum + transaction.amount, 0),
        totalCount: productCharges.length,
      },
      insuranceBenefitsSummary: {
        totalAmount: insuranceCharges.reduce((sum, transaction) => sum + transaction.amount, 0),
        totalCount: insuranceCharges.length,
      },
    }
  }, [transactions])

  const benefitedCollaboratorsCount = useMemo(() => {
    return new Set(approvedRequests.map((request) => request.collaboratorId)).size
  }, [approvedRequests])

  return {
    enterprise,
    loanSummary,
    transactions,
    benefitedCollaboratorsCount,
    productBenefitsSummary,
    insuranceBenefitsSummary,
    loading,
    error,
    filtroEstado,
    setFiltroEstado,
    transactionsFiltradas,
  }
}
