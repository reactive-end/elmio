/**
 * @fileoverview Componente de Paso 5: Confirmación y Éxito de Póliza.
 * @description Muestra una pantalla de éxito, detalla las pólizas emitidas y provee descargas directas de PDFs.
 * @module components/molecules/MercantilSteps/Step5Confirmation
 */

'use client';

import { useState } from 'react';
import { PartyPopper, CheckCircle, FileDown, ArrowRight } from 'lucide-react';
import { Spinner } from '@/components/atoms/Spinner/Spinner';
import { Button } from '@/components/atoms/Button/Button';
import { mercantilService } from '@/src/services/mercantil.service';

interface PolicyItem {
  policyId?: string;
  number?: string;
}

interface Step5ConfirmationProps {
  /** ID del shopcart procesado */
  shopcartId: string;
  /** Listado de pólizas emitidas (ID y número de póliza) */
  policyData: PolicyItem[] | null;
  /** Función para cerrar el asistente y volver al dashboard o tienda */
  onClose: () => void;
}

export function Step5Confirmation({
  shopcartId,
  policyData,
  onClose,
}: Step5ConfirmationProps) {
  const [downloadingPolicyId, setDownloadingPolicyId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  /**
   * Obtiene y descarga el archivo PDF oficial de la póliza en Base64.
   * @async
   * @param {string} policyId - ID de la póliza en el servidor.
   * @param {string} policyNumber - Número identificativo para nombrar el archivo.
   */
  const handleDownloadPdf = async (policyId: string, policyNumber: string) => {
    setDownloadingPolicyId(policyId);
    setDownloadError(null);
    try {
      const res = await mercantilService.getPolicyPdf(shopcartId, policyId);
      if (!res.pdfBase64) {
        throw new Error('El servidor no retornó el contenido del PDF.');
      }

      // Convertir Base64 a Blob de forma segura
      const byteCharacters = atob(res.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Desencadenar descarga directa en navegador
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Poliza-Mercantil-${policyNumber || policyId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      setDownloadError('No fue posible descargar el archivo PDF. Intente de nuevo.');
    } finally {
      setDownloadingPolicyId(null);
    }
  };

  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto py-6 px-4 gap-6 animate-scaleIn">
      {/* Icono de Éxito Premium */}
      <div className="relative">
        <div className="p-4 bg-green-50 text-green-500 rounded-full shadow-md">
          <CheckCircle className="h-12 w-12 animate-pulse" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-2 -right-2 text-yellow-500 animate-bounce">
          <PartyPopper className="h-6 w-6" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-body">¡Felicidades!</h2>
        <p className="text-sm font-semibold text-secondary mt-1">Suscripción Procesada Exitosamente</p>
        <p className="text-xs text-body-muted mt-2 leading-relaxed">
          Su seguro con <span className="font-semibold text-body">Mercantil Seguros</span> ha sido emitido de conformidad. Ya se encuentra activo y protegido.
        </p>
      </div>

      {downloadError && (
        <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2 w-full">
          {downloadError}
        </div>
      )}

      {/* Lista de Pólizas Adquiridas */}
      {policyData && policyData.length > 0 && (
        <div className="flex flex-col gap-3 w-full border-t border-b border-gray-100 py-5 my-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-left block pl-1">
            Certificados Digitales Emitidos ({policyData.length})
          </span>
          <div className="flex flex-col gap-2">
            {policyData.map((policy) => {
              const num = policy.number || 'N/A';
              const id = policy.policyId || '';
              const isDownloading = downloadingPolicyId === id;
              return (
                <div key={id} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between shadow-sm">
                  <div className="text-left">
                    <p className="text-xs font-semibold text-body">Seguro de Personas</p>
                    <p className="text-[10px] text-body-muted mt-0.5">Póliza Nº: <span className="font-bold text-body">{num}</span></p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isDownloading || !id}
                    onClick={() => void handleDownloadPdf(id, num)}
                    className="h-8 py-0 text-xs gap-1.5"
                  >
                    {isDownloading ? (
                      <>
                        <Spinner size="sm" /> Descargando
                      </>
                    ) : (
                      <>
                        <FileDown className="h-3.5 w-3.5" /> Descargar PDF
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Button onClick={onClose} fullWidth className="mt-2">
        Finalizar Proceso <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
