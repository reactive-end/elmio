'use client'

import { useMemo, useState } from 'react'
import { FileText, Plus, Files, FolderArchive } from 'lucide-react'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Button } from '@/components/atoms/Button/Button'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { ConfirmModal } from '@/components/molecules/ConfirmModal/ConfirmModal'
import { useContracts } from '@/src/hooks/pages/useContracts'
import { ContractModal } from './components/ContractModal'
import { ContractTable } from './components/ContractTable'
import type { Contract } from '@/src/services/empresa.service'

/**
 * Pantalla de contratos empresariales optimizada y adaptada a tabla.
 * Permite gestionar contratos y archivos asociados con una interfaz limpia de Modal y Tabla Expandible.
 * @returns Vista CRUD de contratos para la empresa autenticada.
 */
export default function EnterpriseContractsPage() {
  const {
    enterprise,
    contracts,
    loading,
    submitting,
    error,
    successMsg,
    createContract,
    updateContract,
    removeContract,
    removeContractFile,
  } = useContracts()

  // Estados para controlar el modal de creación y edición
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

  // Estados para el modal de confirmación SweetAlert
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'contract' | 'file' | null>(null)
  const [contractIdToDelete, setContractIdToDelete] = useState<string | null>(null)
  const [fileIdToDelete, setFileIdToDelete] = useState<string | null>(null)
  const [borrando, setBorrando] = useState(false)

  const openDeleteContractConfirm = (contractId: string) => {
    setConfirmAction('contract')
    setContractIdToDelete(contractId)
    setFileIdToDelete(null)
    setIsConfirmOpen(true)
  }

  const openDeleteFileConfirm = (contractId: string, fileId: string) => {
    setConfirmAction('file')
    setContractIdToDelete(contractId)
    setFileIdToDelete(fileId)
    setIsConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!contractIdToDelete) return
    try {
      setBorrando(true)
      if (confirmAction === 'contract') {
        await removeContract(contractIdToDelete)
      } else if (confirmAction === 'file' && fileIdToDelete) {
        await removeContractFile(contractIdToDelete, fileIdToDelete)
        
        // Si el modal de edición del contrato está abierto y se está borrando un archivo del selectedContract, 
        // actualizamos reactivamente la lista de archivos visibles en el modal también
        if (selectedContract && selectedContract.id === contractIdToDelete) {
          setSelectedContract((prev) => {
            if (!prev) return null
            return {
              ...prev,
              files: prev.files.filter((f) => f.id !== fileIdToDelete),
            }
          })
        }
      }
      setIsConfirmOpen(false)
      setContractIdToDelete(null)
      setFileIdToDelete(null)
      setConfirmAction(null)
    } catch {
      // Los errores ya los maneja el hook useContracts
    } finally {
      setBorrando(false)
    }
  }

  const totalFiles = useMemo(
    () => contracts.reduce((sum, contract) => sum + contract.files.length, 0),
    [contracts],
  )

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedContract(null)
    setIsModalOpen(true)
  }

  const openEditModal = (contract: Contract) => {
    setModalMode('edit')
    setSelectedContract(contract)
    setIsModalOpen(true)
  }

  const handleModalSubmit = async (name: string, files: File[]) => {
    try {
      if (modalMode === 'create') {
        await createContract(name, files)
      } else if (modalMode === 'edit' && selectedContract) {
        await updateContract(selectedContract.id, {
          name,
          files: files.length > 0 ? files : undefined,
        })
      }
      setIsModalOpen(false)
      setSelectedContract(null)
    } catch {
      // Los errores ya los maneja el hook useContracts y los guarda en 'error'
    }
  }

  const handleRemoveExistingFile = (fileId: string) => {
    if (!selectedContract) return
    openDeleteFileConfirm(selectedContract.id, fileId)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Fila 1: Título principal y Botón "+ Nuevo Contrato" alineados */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-50 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-body tracking-tight">Contratos</h1>
          <p className="text-sm text-body-muted mt-1">
            Gestiona contratos empresariales, agrega múltiples archivos y mantén su documentación organizada.
          </p>
        </div>
        
        <Button onClick={openCreateModal} className="shadow-lg shadow-secondary/15 shrink-0 self-start sm:self-auto">
          <Plus className="h-4.5 w-4.5 mr-1.5" strokeWidth={2} /> Nuevo contrato
        </Button>
      </div>

      {/* Fila 2: Tarjetas de estadísticas (Cards) independientes con diseño premium */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Card Contratos */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-gray-100 bg-white p-4.5 shadow-sm shadow-black/3 transition-all duration-300 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/8 text-secondary">
            <FolderArchive className="h-5.5 w-5.5" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-body-muted">Contratos</p>
            <p className="text-xl font-extrabold text-body leading-none mt-1">{contracts.length}</p>
          </div>
        </div>

        {/* Card Archivos */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-gray-100 bg-white p-4.5 shadow-sm shadow-black/3 transition-all duration-300 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-50/50">
            <Files className="h-5.5 w-5.5" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-body-muted">Archivos</p>
            <p className="text-xl font-extrabold text-body leading-none mt-1">{totalFiles}</p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {error && <Alert type="error" message={error} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      {/* Listado de Contratos en Tabla Premium Expandible */}
      {contracts.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center shadow-sm shadow-black/3">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
            <FileText className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-body">No hay contratos registrados</h3>
          <p className="mt-1 text-sm text-body-muted max-w-sm mx-auto">
            Comienza subiendo tu primer contrato comercial o marco para organizar los documentos de tu empresa.
          </p>
          <Button onClick={openCreateModal} variant="ghost" className="mt-5 border border-gray-200">
            <Plus className="h-4.5 w-4.5 mr-1" strokeWidth={2} /> Crear el primero
          </Button>
        </div>
      ) : (
        <ContractTable
          contracts={contracts}
          enterprise={enterprise}
          onEdit={openEditModal}
          onRemove={openDeleteContractConfirm}
          onRemoveFile={openDeleteFileConfirm}
          submitting={submitting}
        />
      )}

      {/* Modal Reutilizable de Creación y Edición */}
      <ContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        submitting={submitting}
        initialName={selectedContract?.name ?? ''}
        existingFiles={selectedContract?.files ?? []}
        onRemoveExistingFile={handleRemoveExistingFile}
        enterprise={enterprise}
        mode={modalMode}
      />

      {/* Modal de Confirmación de Borrado estilo SweetAlert */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={borrando}
        title={confirmAction === 'contract' ? '¿Eliminar este contrato?' : '¿Eliminar este archivo?'}
        description={
          confirmAction === 'contract'
            ? 'Esta acción no se puede deshacer. Se eliminará el contrato y todos sus archivos asociados de forma permanente.'
            : 'Esta acción no se puede deshacer. Se eliminará el documento seleccionado del contrato.'
        }
      />
    </div>
  )
}
