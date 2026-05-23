'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  enterpriseService,
  type Contract,
  type Enterprise,
} from '@/src/services/empresa.service'

interface UseContractsReturn {
  enterprise: Enterprise | null
  contracts: Contract[]
  loading: boolean
  submitting: boolean
  error: string | null
  successMsg: string | null
  refresh: () => Promise<void>
  createContract: (name: string, files: File[]) => Promise<void>
  updateContract: (contractId: string, data: { name?: string; files?: File[] }) => Promise<void>
  removeContract: (contractId: string) => Promise<void>
  removeContractFile: (contractId: string, fileId: string) => Promise<void>
}

/**
 * Hook que gestiona la pantalla de contratos empresariales.
 * Carga empresa, lista contratos y expone acciones CRUD para contratos y archivos.
 * @returns Estado de carga, feedback y operaciones de contratos para la empresa autenticada.
 */
export function useContracts(): UseContractsReturn {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const clearSuccess = () => {
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const currentEnterprise = await enterpriseService.getMe()
      setEnterprise(currentEnterprise)

      const currentContracts = await enterpriseService.listContracts(currentEnterprise.id)
      setContracts(currentContracts)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar contratos.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const createContract = async (name: string, files: File[]) => {
    if (!enterprise) return

    try {
      setSubmitting(true)
      setError(null)
      await enterpriseService.createContract(enterprise.id, name, files)
      setSuccessMsg('Contrato creado exitosamente.')
      clearSuccess()
      await loadData()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al crear contrato.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const updateContract = async (
    contractId: string,
    data: { name?: string; files?: File[] },
  ) => {
    if (!enterprise) return

    try {
      setSubmitting(true)
      setError(null)
      await enterpriseService.updateContract(enterprise.id, contractId, data)
      setSuccessMsg('Contrato actualizado exitosamente.')
      clearSuccess()
      await loadData()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al actualizar contrato.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const removeContract = async (contractId: string) => {
    if (!enterprise) return

    try {
      setSubmitting(true)
      setError(null)
      await enterpriseService.removeContract(enterprise.id, contractId)
      setSuccessMsg('Contrato eliminado exitosamente.')
      clearSuccess()
      await loadData()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al eliminar contrato.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const removeContractFile = async (contractId: string, fileId: string) => {
    if (!enterprise) return

    try {
      setSubmitting(true)
      setError(null)
      await enterpriseService.removeContractFile(enterprise.id, contractId, fileId)
      setSuccessMsg('Archivo eliminado exitosamente.')
      clearSuccess()
      await loadData()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al eliminar archivo.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    enterprise,
    contracts,
    loading,
    submitting,
    error,
    successMsg,
    refresh: loadData,
    createContract,
    updateContract,
    removeContract,
    removeContractFile,
  }
}
