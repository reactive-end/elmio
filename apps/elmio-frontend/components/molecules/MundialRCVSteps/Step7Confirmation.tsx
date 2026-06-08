/**
 * @fileoverview Componente de Paso 7: Confirmación de emisión de pólizas de La Mundial.
 * @description Muestra el resultado exitoso de la emisión síncrona.
 * @module components/molecules/MundialRCVSteps/Step7Confirmation
 */

'use client'

import { CheckCircle2, FileDown } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'

interface Step7ConfirmationProps {
  policyData: Array<{ policyId: string; number: string; pdfUrl?: string }>
  onDownloadPdf: (pdfUrl: string) => void
  onClose: () => void
}

export function Step7Confirmation({ policyData, onDownloadPdf, onClose }: Step7ConfirmationProps) {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex flex-col items-center text-center gap-4 py-6">
        <div className="p-4 bg-green-50 rounded-full">
          <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-body">¡Póliza Emitida Exitosamente!</h2>
          <p className="text-sm text-body-muted mt-1 max-w-md">
            Su póliza RCV ha sido procesada y emitida síncronamente por La Mundial de Seguros. Puede descargar el contrato oficial a continuación.
          </p>
        </div>
      </div>

      {policyData && policyData.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-body">Pólizas emitidas</h3>
          {policyData.map((policy, index) => (
            <div
              key={policy.policyId || index}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50"
            >
              <div>
                <p className="text-sm font-bold text-body">
                  Póliza #{policy.number || policy.policyId}
                </p>
                <p className="text-xs text-body-muted">RCV La Mundial de Seguros</p>
              </div>
              <div className="flex items-center gap-3">
                {policy.pdfUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onDownloadPdf(policy.pdfUrl!)}
                    className="flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 hover:bg-secondary/5"
                  >
                    <FileDown className="h-4 w-4" strokeWidth={1.5} />
                    Descargar PDF
                  </Button>
                )}
                <div className="text-xs text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                  Activa
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center pt-4">
        <Button type="button" onClick={onClose} className="px-8 font-bold">
          Finalizar
        </Button>
      </div>
    </div>
  )
}
