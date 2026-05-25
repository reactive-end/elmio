/**
 * @fileoverview Componente de Paso 7: Confirmación y descarga de pólizas.
 * @description Muestra el resultado exitoso de la emisión y permite descargar PDFs.
 * @module components/molecules/MercantilRCVSteps/Step7Confirmation
 */

'use client';

import { FileDown, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';

interface Step7ConfirmationProps {
  policyData: { policyId?: string; number?: string }[] | null;
  onDownloadPdf: (policyId: string) => Promise<void>;
  onClose: () => void;
}

export function Step7Confirmation({
  policyData,
  onDownloadPdf,
  onClose,
}: Step7ConfirmationProps) {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex flex-col items-center text-center gap-4 py-6">
        <div className="p-4 bg-green-50 rounded-full">
          <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-body">¡Póliza Emitida Exitosamente!</h2>
          <p className="text-sm text-body-muted mt-1 max-w-md">
            Su póliza RCV ha sido procesada y emitida por Mercantil Seguros. Puede descargar el certificado a continuación.
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
                <p className="text-xs text-body-muted">RCV Mercantil Seguros</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => policy.policyId && onDownloadPdf(policy.policyId)}
                className="flex items-center gap-2 text-sm"
              >
                <FileDown className="h-4 w-4" strokeWidth={1.5} />
                Descargar PDF
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center pt-4">
        <Button type="button" onClick={onClose}>
          Finalizar
        </Button>
      </div>
    </div>
  );
}
