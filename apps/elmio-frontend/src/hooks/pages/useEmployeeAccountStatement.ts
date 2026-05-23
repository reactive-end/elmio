'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  enterpriseService,
  type LoanRequest,
  type LoanSummary,
  type PersonProfile,
  type Transaction,
} from '@/src/services/empresa.service'

interface UseEmployeeAccountStatementReturn {
  loading: boolean
  error: string | null
  profile: PersonProfile | null
  loanSummary: LoanSummary | null
  transactionsFiltradas: Transaction[]
  productBenefitsSummary: {
    totalAmount: number
    totalCount: number
  }
  insuranceBenefitsSummary: {
    totalAmount: number
    totalCount: number
  }
  filtroEstado: Transaction['status'] | 'all'
  setFiltroEstado: (status: Transaction['status'] | 'all') => void
  benefitedRequestsCount: number
  remainingMonthlyLimit: number
}

/**
 * Hook que carga el estado de cuenta y movimientos del colaborador autenticado.
 * @returns Resumen, movimientos filtrados y contador de beneficios aprobados.
 */
export function useEmployeeAccountStatement(): UseEmployeeAccountStatementReturn {
  const [profile, setProfile] = useState<PersonProfile | null>(null)
  const [loanSummary, setLoanSummary] = useState<LoanSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [approvedRequests, setApprovedRequests] = useState<LoanRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<Transaction['status'] | 'all'>('all')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [myProfile, summary, txs, requests] = await Promise.all([
          enterpriseService.getMyProfile(),
          enterpriseService.getMyLoanSummary(),
          enterpriseService.listMyTransactions(),
          enterpriseService.listMyRequests('approved'),
        ])
        setProfile(myProfile)
        setLoanSummary(summary)
        setTransactions(txs)
        setApprovedRequests(requests)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const transactionsFiltradas = useMemo(() => {
    return filtroEstado === 'all'
      ? transactions
      : transactions.filter((transaction) => transaction.status === filtroEstado)
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

  const remainingMonthlyLimit = useMemo(() => {
    if (!profile) return 0

    const now = new Date()
    const currentMonthApprovedAmount = approvedRequests.reduce((sum, request) => {
      const createdAt = new Date(request.createdAt)
      const sameMonth =
        createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth()

      return sameMonth ? sum + request.amount : sum
    }, 0)

    return Math.max(0, profile.maxLoanLimit - currentMonthApprovedAmount)
  }, [approvedRequests, profile])

  return {
    profile,
    loading,
    error,
    loanSummary,
    transactionsFiltradas,
    productBenefitsSummary,
    insuranceBenefitsSummary,
    filtroEstado,
    setFiltroEstado,
    benefitedRequestsCount: approvedRequests.length,
    remainingMonthlyLimit,
  }
}
