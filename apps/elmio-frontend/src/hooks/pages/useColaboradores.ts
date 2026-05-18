'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  enterpriseService,
  type Enterprise,
  type PersonProfile,
  type CollaboratorInput,
} from '@/src/services/empresa.service'

interface UseCollaboratorsReturn {
  enterprise: Enterprise | null
  collaborators: PersonProfile[]
  loading: boolean
  error: string | null
  successMsg: string | null
  showModal: boolean
  setShowModal: (v: boolean) => void
  createCollaborator: (data: CollaboratorInput) => Promise<void>
  bulkUpload: (items: CollaboratorInput[]) => Promise<void>
  toggleStatus: (
    collaboratorId: string,
    newStatus: 'active' | 'suspended' | 'terminated',
  ) => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Hook que gestiona la logica de la pantalla de colaboradores.
 * @returns Estado, CRUD de colaboradores y feedback visual.
 */
export function useCollaborators(): UseCollaboratorsReturn {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [collaborators, setCollaborators] = useState<PersonProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const clearSuccess = () => {
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const emp = await enterpriseService.getMe()
      setEnterprise(emp)

      const cols = await enterpriseService.listCollaborators(emp.id)
      setCollaborators(cols)
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

  const createCollaborator = async (data: CollaboratorInput) => {
    if (!enterprise) return
    try {
      setError(null)
      await enterpriseService.createCollaborator(enterprise.id, data)
      setSuccessMsg('Colaborador creado exitosamente.')
      clearSuccess()
      setShowModal(false)
      await loadData()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al crear colaborador.'
      setError(msg)
    }
  }

  const bulkUpload = async (items: CollaboratorInput[]) => {
    if (!enterprise) return
    try {
      setError(null)
      const created = await enterpriseService.bulkUploadCollaborators(enterprise.id, items)
      setSuccessMsg(`${created.length} colaboradores cargados exitosamente.`)
      clearSuccess()
      await loadData()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error en la carga masiva.'
      setError(msg)
    }
  }

  const toggleStatus = async (
    collaboratorId: string,
    newStatus: 'active' | 'suspended' | 'terminated',
  ) => {
    if (!enterprise) return
    try {
      setError(null)
      await enterpriseService.updateCollaborator(enterprise.id, collaboratorId, {
        status: newStatus,
      })
      setSuccessMsg('Estado actualizado.')
      clearSuccess()
      await loadData()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al actualizar estado.'
      setError(msg)
    }
  }

  return {
    enterprise,
    collaborators,
    loading,
    error,
    successMsg,
    showModal,
    setShowModal,
    createCollaborator,
    bulkUpload,
    toggleStatus,
    refresh: loadData,
  }
}
