'use client'

import { useEffect, useMemo, useState } from 'react'
import { enterpriseService, type LoanRequest } from '@/src/services/empresa.service'

interface UseEmployeeRequestsReturn {
  loading: boolean
  error: string | null
  filterStatus: LoanRequest['status'] | 'all'
  setFilterStatus: (status: LoanRequest['status'] | 'all') => void
  filteredRequests: LoanRequest[]
  counters: {
    pending: number
    approved: number
    denied: number
  }
  selectedRequest: LoanRequest | null
  setSelectedRequest: (request: LoanRequest | null) => void
}

/**
 * Hook que carga las solicitudes del colaborador autenticado.
 * @returns Lista filtrada, contadores y seleccion actual.
 */
export function useEmployeeRequests(): UseEmployeeRequestsReturn {
  const [requests, setRequests] = useState<LoanRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<LoanRequest['status'] | 'all'>('all')
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        setRequests(await enterpriseService.listMyRequests())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const filteredRequests = useMemo(() => {
    return filterStatus === 'all'
      ? requests
      : requests.filter((request) => request.status === filterStatus)
  }, [filterStatus, requests])

  const counters = useMemo(() => {
    let pending = 0
    let approved = 0
    let denied = 0

    for (const request of requests) {
      if (request.status === 'pending') pending += 1
      if (request.status === 'approved') approved += 1
      if (request.status === 'denied') denied += 1
    }

    return { pending, approved, denied }
  }, [requests])

  return {
    loading,
    error,
    filterStatus,
    setFilterStatus,
    filteredRequests,
    counters,
    selectedRequest,
    setSelectedRequest,
  }
}
