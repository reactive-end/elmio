'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, X, ShieldCheck, AlertCircle, RefreshCw, Landmark, MessageSquare, Send, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Input } from '@/components/atoms/Input/Input'
import { FormField } from '@/components/molecules/FormField/FormField'
import { enterpriseService, type LoanRequest } from '@/src/services/empresa.service'
import { ConfirmModal } from '@/components/molecules/ConfirmModal/ConfirmModal'

export default function FinanceRequestsPage() {
  const [requests, setRequests] = useState<LoanRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Estados para Modal de Rechazo
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [denialReason, setDenialReason] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)

  // Estados para Modal de Despacho
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false)
  const [disburseRequest, setDisburseRequest] = useState<LoanRequest | null>(null)
  const [disburseError, setDisburseError] = useState<string | null>(null)
  const [disburseProgress, setDisburseProgress] = useState(0)
  const [disburseAttempt, setDisburseAttempt] = useState(0)
  const [disburseStep, setDisburseStep] = useState<'idle' | 'pending_options' | 'crediting' | 'verifying' | 'success' | 'failed'>('idle')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isManualConfirmOpen, setIsManualConfirmOpen] = useState(false)

  // Estados para Modal de Vuelto (Pago Móvil)
  const [isVueltoModalOpen, setIsVueltoModalOpen] = useState(false)
  const [vueltoRequest, setVueltoRequest] = useState<LoanRequest | null>(null)
  const [vueltoError, setVueltoError] = useState<string | null>(null)
  const [vueltoReference, setVueltoReference] = useState<string | null>(null)
  const [vueltoStep, setVueltoStep] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle')

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadRequests = async () => {
    try {
      setIsLoading(true)
      setAlert(null)
      const data = await enterpriseService.listFinancePendingRequests()
      setRequests(data)
    } catch (err) {
      console.error(err)
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'No se pudieron cargar las solicitudes pendientes.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadRequests()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id)
      setAlert(null)
      await enterpriseService.resolveFinanceRequest(id, 'approved')
      setAlert({ type: 'success', message: 'Desembolso y prestamo autorizados con exito.' })
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al autorizar el desembolso.',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openDisburseModal = (req: LoanRequest) => {
    setDisburseRequest(req)
    setDisburseError(null)
    setDisburseProgress(0)
    setDisburseAttempt(0)
    setDisburseStep(req.hasPendingDisbursement ? 'pending_options' : 'idle')
    setIsConfirmOpen(false)
    setIsManualConfirmOpen(false)
    setIsDisburseModalOpen(true)
  }

  const handleDisburse = async (force?: boolean) => {
    if (!disburseRequest) return
    try {
      setActionLoading(disburseRequest.id)
      setDisburseError(null)
      setDisburseStep('crediting')
      setDisburseProgress(0)
      setDisburseAttempt(1)
      setIsConfirmOpen(false)

      // Fase 1: Llamada inicial a /disburse. R4 puede responder ACCP (exito
      // inmediato) o AC00 (pendiente, requiere verificacion).
      const result = await enterpriseService.disburseRequest(disburseRequest.id, force)

      if (result.status === 'disbursed') {
        if (progressRef.current) clearInterval(progressRef.current)
        setDisburseProgress(100)
        setDisburseStep('success')
        setActionLoading(null)
        await new Promise((r) => setTimeout(r, 1000))
        setAlert({ type: 'success', message: `Desembolso ejecutado con exito para ${disburseRequest.collaboratorName}.` })
        setRequests((prev) => prev.filter((r) => r.id !== disburseRequest.id))
        setIsDisburseModalOpen(false)
        return
      }

      // Fase 2: R4 respondio AC00. Esperar 120s (tiempo minimo de la transaccion)
      // y luego llamar a /disburse/verify hasta 3 veces, con 60s entre intentos.
      const FIRST_WAIT_MS = 120_000
      const RETRY_MS = 60_000
      const TOTAL_MS = FIRST_WAIT_MS + 2 * RETRY_MS
      const startTime = Date.now()
      progressRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        const pct = Math.min(99, Math.round((elapsed / TOTAL_MS) * 100))

        if (elapsed >= FIRST_WAIT_MS) {
          setDisburseStep('verifying')
          const retryAttempt = Math.floor((elapsed - FIRST_WAIT_MS) / RETRY_MS) + 1
          setDisburseAttempt(Math.min(3, retryAttempt))
        }

        setDisburseProgress(pct)
      }, 500)

      await new Promise((r) => setTimeout(r, FIRST_WAIT_MS))

      let lastR4Code: string | null = null

      for (let attempt = 1; attempt <= 3; attempt++) {
        if (attempt > 1) {
          await new Promise((r) => setTimeout(r, RETRY_MS))
        }
        setDisburseAttempt(attempt)

        const verifyResult = await enterpriseService.verifyDisburse(disburseRequest.id)

        if (verifyResult.status === 'disbursed') {
          if (progressRef.current) clearInterval(progressRef.current)
          setDisburseProgress(100)
          setDisburseStep('success')
          setActionLoading(null)
          await new Promise((r) => setTimeout(r, 1000))
          setAlert({ type: 'success', message: `Desembolso ejecutado con exito para ${disburseRequest.collaboratorName}.` })
          setRequests((prev) => prev.filter((r) => r.id !== disburseRequest.id))
          setIsDisburseModalOpen(false)
          return
        }

        lastR4Code = verifyResult.lastCode ?? null
      }

      throw new Error(
        `No hemos podido verificar el estado de esta transaccion, intenta luego.`
      )
    } catch (err) {
      if (progressRef.current) clearInterval(progressRef.current)
      setDisburseProgress(100)
      setDisburseStep('failed')
      setActionLoading(null)
      setDisburseError(err instanceof Error ? err.message : 'Error al desembolsar.')
      
      // Colocar la solicitud en standby localmente con hasPendingDisbursement = true
      setRequests((prev) =>
        prev.map((r) => (r.id === disburseRequest.id ? { ...r, hasPendingDisbursement: true } : r))
      )
    }
  }

  const handleVerifyOnly = async () => {
    if (!disburseRequest) return
    try {
      setActionLoading(disburseRequest.id)
      setDisburseError(null)
      setDisburseStep('verifying')
      setDisburseProgress(0)
      setDisburseAttempt(1)

      // Ejecutar hasta 3 intentos de consulta con verifyDisburse, con 60s entre intentos
      const RETRY_MS = 60_000
      const TOTAL_MS = 3 * RETRY_MS
      const startTime = Date.now()
      progressRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        const pct = Math.min(99, Math.round((elapsed / TOTAL_MS) * 100))
        setDisburseProgress(pct)
      }, 500)

      let lastR4Code: string | null = null

      for (let attempt = 1; attempt <= 3; attempt++) {
        if (attempt > 1) {
          await new Promise((r) => setTimeout(r, RETRY_MS))
        }
        setDisburseAttempt(attempt)

        const verifyResult = await enterpriseService.verifyDisburse(disburseRequest.id)

        if (verifyResult.status === 'disbursed') {
          if (progressRef.current) clearInterval(progressRef.current)
          setDisburseProgress(100)
          setDisburseStep('success')
          setActionLoading(null)
          await new Promise((r) => setTimeout(r, 1000))
          setAlert({ type: 'success', message: `Desembolso ejecutado con exito para ${disburseRequest.collaboratorName}.` })
          setRequests((prev) => prev.filter((r) => r.id !== disburseRequest.id))
          setIsDisburseModalOpen(false)
          return
        }

        lastR4Code = verifyResult.lastCode ?? null
      }

      throw new Error(
        `No hemos podido verificar el estado de esta transaccion, intenta luego.`
      )
    } catch (err) {
      if (progressRef.current) clearInterval(progressRef.current)
      setDisburseProgress(100)
      setDisburseStep('failed')
      setActionLoading(null)
      setDisburseError(err instanceof Error ? err.message : 'Error al verificar.')
    }
  }

  const handleCompleteManual = async () => {
    if (!disburseRequest) return
    try {
      setActionLoading(disburseRequest.id)
      setDisburseError(null)
      setIsManualConfirmOpen(false)

      await enterpriseService.completeManualDisburse(disburseRequest.id)

      setAlert({ type: 'success', message: `Desembolso conciliado manualmente con exito para ${disburseRequest.collaboratorName}.` })
      setRequests((prev) => prev.filter((r) => r.id !== disburseRequest.id))
      setIsDisburseModalOpen(false)
    } catch (err) {
      setDisburseError(err instanceof Error ? err.message : 'Error al conciliar manualmente.')
    } finally {
      setActionLoading(null)
    }
  }

  // Abrir modal de Vuelto (Pago Móvil)
  const openVueltoModal = (req: LoanRequest) => {
    setVueltoRequest(req)
    setVueltoError(null)
    setVueltoReference(null)
    setVueltoStep('idle')
    setIsVueltoModalOpen(true)
  }

  const handleVuelto = async () => {
    if (!vueltoRequest) return
    try {
      setActionLoading(vueltoRequest.id)
      setVueltoError(null)
      setVueltoStep('processing')

      const result = await enterpriseService.processVueltoRequest(vueltoRequest.id)

      if (result.status === 'disbursed') {
        setVueltoReference(result.reference || null)
        setVueltoStep('success')
        setActionLoading(null)
        await new Promise((r) => setTimeout(r, 1500))
        setAlert({ type: 'success', message: `Desembolso por Pago Movil exitoso para ${vueltoRequest.collaboratorName}.` })
        setRequests((prev) => prev.filter((r) => r.id !== vueltoRequest.id))
        setIsVueltoModalOpen(false)
        return
      }

      // Código de error (51 u otro)
      setVueltoStep('failed')
      setVueltoError(result.message || `Error en proceso de vuelto (codigo: ${result.code})`)
    } catch (err) {
      setVueltoStep('failed')
      setVueltoError(err instanceof Error ? err.message : 'Error al procesar vuelto.')
    } finally {
      setActionLoading(null)
    }
  }

  const openRejectModal = (id: string) => {
    setSelectedRequestId(id)
    setDenialReason('')
    setRejectError(null)
    setIsRejectModalOpen(true)
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequestId) return
    if (!denialReason.trim()) {
      setRejectError('Debes ingresar el motivo de rechazo obligatoriamente.')
      return
    }

    try {
      setActionLoading(selectedRequestId)
      setRejectError(null)
      await enterpriseService.resolveFinanceRequest(selectedRequestId, 'denied', denialReason.trim())
      setAlert({ type: 'success', message: 'Solicitud denegada y cancelada con exito.' })
      setRequests((prev) => prev.filter((r) => r.id !== selectedRequestId))
      setIsRejectModalOpen(false)
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'Error al rechazar la solicitud.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="text-secondary w-6 h-6 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-body">Mesa de Control y Finanzas</h1>
          </div>
          <p className="text-xs text-body-muted mt-1 leading-relaxed">
            Autoriza o deniega desembolsos interbancarios de capital en Bolivares para las solicitudes aprobadas previamente por las empresas.
          </p>
        </div>
        <Button
          onClick={() => void loadRequests()}
          variant="ghost"
          className="flex items-center gap-2 text-xs font-semibold cursor-pointer shrink-0 border border-gray-200"
          disabled={isLoading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {alert && (
        <Alert type={alert.type} message={alert.message} />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-secondary animate-spin" />
            <span className="text-sm font-medium text-body-muted">Cargando solicitudes de desembolso...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-body">Sin Solicitudes Pendientes</h3>
              <p className="text-xs text-body-muted max-w-sm mt-1 leading-relaxed mx-auto">
                Excelente. Todas las solicitudes aprobadas por las empresas han sido conciliadas y procesadas por tu mesa de control.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Colaborador</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo / Producto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Monto Solicitado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/20 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-sm text-body block">{req.collaboratorName}</span>
                      <span className="text-[10px] text-gray-400 font-normal">Solicitud ID: {req.id.slice(0, 8)}...</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium bg-secondary/10 text-secondary px-2.5 py-1 rounded-full capitalize">
                        {req.type === 'loan' ? 'Prestamo' : req.type === 'advance' ? 'Adelanto' : req.type}
                      </span>
                      <span className="text-xs text-body-muted block mt-1.5 line-clamp-1 max-w-xs">{req.description}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-sm text-body block">{`$${Number(req.amount).toFixed(2)} USD`}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5 capitalize">
                        <AlertCircle className="w-3 h-3" />
                        Por Finanzas
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {!req.requiresManualDisburse && !req.requiresR4Vuelto && (
                          <Button
                            onClick={() => void handleApprove(req.id)}
                            variant="primary"
                            className="bg-green-600 hover:bg-green-700 border-none px-3.5 py-2 flex items-center gap-1.5 text-xs text-white font-semibold cursor-pointer shadow-sm rounded-xl"
                            disabled={actionLoading !== null}
                            isLoading={actionLoading === req.id}
                          >
                            <Check className="w-3.5 h-3.5" />
                            Aprobar
                          </Button>
                        )}
                        {req.requiresManualDisburse && (
                          req.hasPendingDisbursement ? (
                            <Button
                              onClick={() => openDisburseModal(req)}
                              variant="primary"
                              className="bg-amber-500 hover:bg-amber-600 border-none px-3.5 py-2 flex items-center gap-1.5 text-xs text-white font-semibold cursor-pointer shadow-sm rounded-xl"
                              disabled={actionLoading !== null}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Verificar
                            </Button>
                          ) : (
                            <Button
                              onClick={() => openDisburseModal(req)}
                              variant="primary"
                              className="bg-blue-600 hover:bg-blue-700 border-none px-3.5 py-2 flex items-center gap-1.5 text-xs text-white font-semibold cursor-pointer shadow-sm rounded-xl"
                              disabled={actionLoading !== null}
                            >
                              <Send className="w-3.5 h-3.5" />
                              Despachar
                            </Button>
                          )
                        )}
                        {req.requiresR4Vuelto && (
                          <Button
                            onClick={() => openVueltoModal(req)}
                            variant="primary"
                            className="bg-blue-600 hover:bg-blue-700 border-none px-3.5 py-2 flex items-center gap-1.5 text-xs text-white font-semibold cursor-pointer shadow-sm rounded-xl"
                            disabled={actionLoading !== null}
                            isLoading={actionLoading === req.id}
                          >
                            <Send className="w-3.5 h-3.5" />
                            Despachar
                          </Button>
                        )}
                        <Button
                          onClick={() => openRejectModal(req.id)}
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50 px-3.5 py-2 flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-red-100 rounded-xl"
                          disabled={actionLoading !== null}
                        >
                          <X className="w-3.5 h-3.5" />
                          Rechazar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Rechazo */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 w-full max-w-md flex flex-col gap-4 animate-scale-up">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-red-500 w-5 h-5" />
                <h3 className="text-base font-bold text-body">Rechazar Solicitud de Desembolso</h3>
              </div>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {rejectError && <Alert type="error" message={rejectError} />}
            <form onSubmit={handleRejectSubmit} className="flex flex-col gap-4">
              <FormField label="Motivo del Rechazo de Fondos" required>
                <textarea value={denialReason} onChange={(e) => setDenialReason(e.target.value)} placeholder="Explica la razon..." className="w-full min-h-[100px] border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-2xl p-3 text-xs leading-relaxed outline-none" rows={4} />
              </FormField>
              <div className="flex gap-3 justify-end mt-2">
                <Button type="button" variant="ghost" onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2.5 text-xs font-semibold cursor-pointer border border-gray-100 rounded-xl">Cancelar</Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs border-none px-4 py-2.5 rounded-xl cursor-pointer" disabled={actionLoading !== null} isLoading={actionLoading !== null}>Confirmar Rechazo</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Despacho */}
      {isDisburseModalOpen && disburseRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 w-full max-w-lg flex flex-col gap-4 animate-scale-up">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                {disburseStep === 'success' ? (
                  <Check className="text-green-600 w-5 h-5" />
                ) : disburseStep === 'failed' ? (
                  <AlertCircle className="text-red-600 w-5 h-5" />
                ) : disburseStep === 'pending_options' ? (
                  <Clock className="text-amber-500 w-5 h-5" />
                ) : (
                  <Send className="text-blue-600 w-5 h-5" />
                )}
                <h3 className="text-base font-bold text-body">
                  {disburseStep === 'success'
                    ? 'Desembolso Completado'
                    : disburseStep === 'failed'
                    ? 'Desembolso Fallido'
                    : disburseStep === 'pending_options'
                    ? 'Verificación Pendiente'
                    : 'Despachar Desembolso'}
                </h3>
              </div>
              {(disburseStep === 'success' || disburseStep === 'failed' || disburseStep === 'pending_options') && (
                <button onClick={() => {
                  setDisburseStep('idle')
                  setDisburseError(null)
                  setDisburseProgress(0)
                  setDisburseAttempt(0)
                  setIsConfirmOpen(false)
                  setIsDisburseModalOpen(false)
                }} className="text-gray-400 hover:text-gray-600">✕</button>
              )}
            </div>

            {disburseError && <Alert type="error" message={disburseError} />}

            {/* Opciones cuando hay transacciones pendientes */}
            {disburseStep === 'pending_options' && (
              <div className="flex flex-col gap-4">
                <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in">
                  <div className="flex items-start gap-2.5">
                    <Clock className="text-amber-600 w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-800">Transacción en Proceso</h4>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Esta solicitud ya posee un proceso de desembolso interbancario diferido/pendiente en R4 que no pudo ser conciliado en los intentos iniciales.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-1 flex-wrap">
                    <Button
                      onClick={() => setIsManualConfirmOpen(true)}
                      variant="ghost"
                      className="px-3.5 py-2 text-xs font-semibold cursor-pointer border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl"
                      disabled={actionLoading !== null}
                    >
                      Completar Manualmente
                    </Button>
                    <Button
                      onClick={() => setIsConfirmOpen(true)}
                      variant="ghost"
                      className="px-3.5 py-2 text-xs font-semibold cursor-pointer border border-amber-200 text-amber-800 bg-white hover:bg-amber-50 rounded-xl"
                      disabled={actionLoading !== null}
                    >
                      Nuevo Despacho
                    </Button>
                    <Button
                      onClick={() => void handleVerifyOnly()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs border-none px-3.5 py-2 rounded-xl cursor-pointer flex items-center gap-1.5"
                      disabled={actionLoading !== null}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Verificar Estado
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Barra de progreso */}
            {disburseStep !== 'idle' && disburseStep !== 'pending_options' && disburseStep !== 'success' && disburseStep !== 'failed' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {disburseStep === 'crediting'
                      ? 'Enviando credito a R4...'
                      : `Verificando estado — intento ${disburseAttempt} de 3`}
                  </span>
                  <span className="text-gray-400 font-medium">{disburseProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-linear ${
                      disburseStep === 'verifying' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${disburseProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Informacion del desembolso */}
            <div className="flex flex-col gap-3 bg-gray-50 rounded-xl p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-body-muted">Beneficiario</span>
                <span className="font-semibold text-body">{disburseRequest.collaboratorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-muted">Concepto</span>
                <span className="font-semibold text-body">{disburseRequest.description}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-body-muted">Monto a desembolsar</span>
                <span className="font-bold text-lg text-body">{`$${Number(disburseRequest.amount).toFixed(2)} USD`}</span>
              </div>
              <p className="text-xs text-body-muted mt-1">Los datos bancarios del colaborador seran usados automaticamente para la transferencia via Credito Inmediato R4.</p>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              {disburseStep === 'failed' && (
                <Button
                  onClick={() => setIsManualConfirmOpen(true)}
                  variant="ghost"
                  className="px-4 py-2.5 text-xs font-semibold cursor-pointer border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl"
                  disabled={actionLoading !== null}
                >
                  Completar Manualmente
                </Button>
              )}
              {(disburseStep === 'idle' || disburseStep === 'failed') && (
                <Button type="button" variant="ghost" onClick={() => {
                  setDisburseStep('idle')
                  setDisburseError(null)
                  setDisburseProgress(0)
                  setDisburseAttempt(0)
                  setIsConfirmOpen(false)
                  setIsManualConfirmOpen(false)
                  setIsDisburseModalOpen(false)
                }} className="px-4 py-2.5 text-xs font-semibold cursor-pointer border border-gray-100 rounded-xl">
                  {disburseStep === 'failed' ? 'Cerrar' : 'Cancelar'}
                </Button>
              )}
              {disburseStep === 'success' ? (
                <Button onClick={() => setIsDisburseModalOpen(false)} className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs border-none px-4 py-2.5 rounded-xl cursor-pointer">
                  <Check className="w-3.5 h-3.5" /> Cerrar
                </Button>
              ) : (disburseStep !== 'failed' && disburseStep !== 'pending_options') && (
                <Button onClick={() => void handleDisburse()} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs border-none px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2" disabled={disburseStep !== 'idle'}>
                  {disburseStep !== 'idle' ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...</>
                  ) : (
                    <><Send className="w-3.5 h-3.5" /> Confirmar Despacho</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Doble Envío */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          setIsConfirmOpen(false)
          await handleDisburse(true)
        }}
        title="¿Iniciar nuevo despacho?"
        description="¡Advertencia! Al realizar esta acción, podría incurrir en un doble envío de fondos si la transferencia anterior ya fue procesada o liquidada de forma diferida por el banco. ¿Está seguro de que desea forzar un nuevo despacho de capital?"
        confirmText="Sí, forzar despacho"
        cancelText="Cancelar"
        isLoading={actionLoading === disburseRequest?.id}
      />

      {/* Modal de Confirmación de Conciliación Manual */}
      <ConfirmModal
        isOpen={isManualConfirmOpen}
        onClose={() => setIsManualConfirmOpen(false)}
        onConfirm={async () => {
          setIsManualConfirmOpen(false)
          await handleCompleteManual()
        }}
        title="¿Conciliar transacción manualmente?"
        description="¡Atención! Si completa esta transacción de forma manual en el sistema y los fondos no llegaron efectivamente a la cuenta del beneficiario, este deberá volver a realizar la solicitud y ya no se podrá verificar ni auditar esta transferencia interbancaria. ¿Está seguro de proceder?"
        confirmText="Sí, conciliar manualmente"
        cancelText="Cancelar"
        isLoading={actionLoading === disburseRequest?.id}
      />

      {/* Modal de Vuelto (Pago Móvil) */}
      {isVueltoModalOpen && vueltoRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 w-full max-w-md flex flex-col gap-4 animate-scale-up">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                {vueltoStep === 'success' ? (
                  <Check className="text-green-600 w-5 h-5" />
                ) : vueltoStep === 'failed' ? (
                  <AlertCircle className="text-red-600 w-5 h-5" />
                ) : (
                  <Send className="text-blue-600 w-5 h-5" />
                )}
                <h3 className="text-base font-bold text-body">
                  {vueltoStep === 'success'
                    ? 'Desembolso Exitoso'
                    : vueltoStep === 'failed'
                    ? 'Desembolso Fallido'
                    : 'Despacho por Pago Móvil'}
                </h3>
              </div>
              {(vueltoStep === 'success' || vueltoStep === 'failed') && (
                <button onClick={() => setIsVueltoModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              )}
            </div>

            {vueltoError && <Alert type="error" message={vueltoError} />}

            {/* Información del desembolso */}
            <div className="flex flex-col gap-3 bg-gray-50 rounded-xl p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-body-muted">Beneficiario</span>
                <span className="font-semibold text-body">{vueltoRequest.collaboratorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-muted">Concepto</span>
                <span className="font-semibold text-body">{vueltoRequest.description}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-body-muted">Monto a desembolsar</span>
                <span className="font-bold text-lg text-body">{`$${Number(vueltoRequest.amount).toFixed(2)} USD`}</span>
              </div>
            </div>

            {/* Referencia exitosa */}
            {vueltoStep === 'success' && vueltoReference && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                <p className="text-xs text-green-700 font-medium">Referencia del banco</p>
                <p className="text-lg font-bold text-green-800 mt-1">{vueltoReference}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-2">
              {vueltoStep === 'failed' && (
                <Button type="button" variant="ghost" onClick={() => setIsVueltoModalOpen(false)} className="px-4 py-2.5 text-xs font-semibold cursor-pointer border border-gray-100 rounded-xl">
                  Cerrar
                </Button>
              )}
              {vueltoStep === 'success' ? (
                <Button onClick={() => setIsVueltoModalOpen(false)} className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs border-none px-4 py-2.5 rounded-xl cursor-pointer">
                  <Check className="w-3.5 h-3.5" /> Cerrar
                </Button>
              ) : vueltoStep === 'idle' && (
                <Button onClick={() => void handleVuelto()} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs border-none px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2">
                  <Send className="w-3.5 h-3.5" /> Confirmar Despacho
                </Button>
              )}
              {vueltoStep === 'processing' && (
                <Button disabled className="bg-blue-600 text-white font-semibold text-xs border-none px-4 py-2.5 rounded-xl cursor-wait">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
