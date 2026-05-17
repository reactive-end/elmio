'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  enterpriseService,
  type Enterprise,
  type LoanRequest,
} from '@/src/services/empresa.service'

interface UseLoanRequestsReturn {
  enterprise: Enterprise | null
  requests: LoanRequest[]
  loading: boolean
  error: string | null
  successMsg: string | null
  filterStatus: LoanRequest['status'] | 'all'
  setFilterStatus: (status: LoanRequest['status'] | 'all') => void
  filteredRequests: LoanRequest[]
  approve: (requestId: string) => Promise<void>
  deny: (requestId: string, reason?: string) => Promise<void>
  selectedRequest: LoanRequest | null
  setSelectedRequest: (r: LoanRequest | null) => void
  counters: {
    pending: number
    approved: number
    denied: number
  }
}

/**
 * Hook que gestiona la logica de la pantalla de solicitudes.
 * @returns Estado, filtros, acciones de aprobacion/denegacion y contadores.
 */
export function useLoanRequests(): UseLoanRequestsReturn {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [requests, setRequests] = useState<LoanRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<LoanRequest['status'] | 'all'>('all')
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null)

  const clearSuccess = () => {
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const emp = await enterpriseService.getMe()
      setEnterprise(emp)

      const reqs = await enterpriseService.listRequests(emp.id)
      setRequests(reqs)
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

  const filteredRequests = useMemo(() => {
    return filterStatus === 'all' ? requests : requests.filter((r) => r.status === filterStatus)
  }, [filterStatus, requests])

  const counters = useMemo(() => {
    let pending = 0,
      approved = 0,
      denied = 0
    for (const r of requests) {
      if (r.status === 'pending') pending++
      else if (r.status === 'approved') approved++
      else if (r.status === 'denied') denied++
    }
    return { pending, approved, denied }
  }, [requests])

  const approve = async (requestId: string) => {
    if (!enterprise) return
    try {
      setError(null)
      await enterpriseService.resolveRequest(enterprise.id, requestId, 'approved')
      setSuccessMsg('Solicitud aprobada exitosamente.')
      clearSuccess()
      setSelectedRequest(null)
      await loadData()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al aprobar solicitud.'
      setError(msg)
    }
  }

  const deny = async (requestId: string, reason?: string) => {
    if (!enterprise) return
    try {
      setError(null)
      await enterpriseService.resolveRequest(enterprise.id, requestId, 'denied', reason)
      setSuccessMsg('Solicitud denegada.')
      clearSuccess()
      setSelectedRequest(null)
      await loadData()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al denegar solicitud.'
      setError(msg)
    }
  }

  return {
    enterprise,
    requests,
    loading,
    error,
    successMsg,
    filterStatus,
    setFilterStatus,
    filteredRequests,
    approve,
    deny,
    selectedRequest,
    setSelectedRequest,
    counters,
  }
}
