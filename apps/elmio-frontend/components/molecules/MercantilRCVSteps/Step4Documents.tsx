/**
 * @fileoverview Componente de Paso 4: Carga de Documentos.
 * @description Provee áreas drag-and-drop para cargar cédula y título de propiedad del vehículo.
 * @module components/molecules/MercantilRCVSteps/Step4Documents
 */

'use client';

import { UploadCloud, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';

interface Step4DocumentsProps {
  idFile: File | null;
  setIdFile: (file: File | null) => void;
  vehiclePropertyFile: File | null;
  setVehiclePropertyFile: (file: File | null) => void;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  dragActiveProperty: boolean;
  setDragActiveProperty: (active: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  propertyFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileDrop: (e: React.DragEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePropertyFileDrop: (e: React.DragEvent) => void;
  handlePropertyFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  onBack: () => void;
  onNext: () => Promise<void>;
}

export function Step4Documents({
  idFile,
  setIdFile,
  vehiclePropertyFile,
  setVehiclePropertyFile,
  dragActive,
  setDragActive,
  dragActiveProperty,
  setDragActiveProperty,
  fileInputRef,
  propertyFileInputRef,
  handleFileDrop,
  handleFileSelect,
  handlePropertyFileDrop,
  handlePropertyFileSelect,
  loading,
  onBack,
  onNext,
}: Step4DocumentsProps) {
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderDropZone = (
    label: string,
    file: File | null,
    setFile: (f: File | null) => void,
    isDragActive: boolean,
    setIsDragActive: (v: boolean) => void,
    onDrop: (e: React.DragEvent) => void,
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void,
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) => {
    if (file) {
      return (
        <div className="rounded-3xl border border-gray-100 bg-gray-50/40 p-5 flex items-center justify-between shadow-sm animate-scaleIn">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-secondary/10 text-secondary rounded-2xl">
              <FileText className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-body truncate">{file.name}</p>
              <p className="text-xs text-body-muted mt-0.5">
                {formatSize(file.size)} &bull; {file.type || 'Documento PDF'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Eliminar archivo"
          >
            <Trash2 className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      );
    }

    return (
      <div
        onDragEnter={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${
          isDragActive
            ? 'border-secondary bg-secondary/5 scale-[0.99] shadow-inner'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 bg-white'
        }`}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={onSelect}
          accept="image/*,application/pdf"
          className="hidden"
        />
        <div className="p-4 bg-secondary/5 text-secondary rounded-full shadow-sm">
          <UploadCloud className="h-10 w-10 animate-pulse" strokeWidth={1} />
        </div>
        <div>
          <p className="text-sm font-semibold text-body">{label}</p>
          <p className="text-xs text-body-muted mt-1">Arrastre o seleccione archivo (JPG, PNG o PDF. Máx 10MB)</p>
        </div>
        <Button type="button" variant="ghost" className="mt-2">
          Buscar Archivo
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <UploadCloud className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Documentos</h2>
          <p className="text-xs text-body-muted">Adjunte la cédula del asegurado y el título de propiedad del vehículo.</p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {renderDropZone(
          'Cédula de Identidad del Asegurado',
          idFile,
          setIdFile,
          dragActive,
          setDragActive,
          handleFileDrop,
          handleFileSelect,
          fileInputRef,
        )}
        {renderDropZone(
          'Título de Propiedad del Vehículo',
          vehiclePropertyFile,
          setVehiclePropertyFile,
          dragActiveProperty,
          setDragActiveProperty,
          handlePropertyFileDrop,
          handlePropertyFileSelect,
          propertyFileInputRef,
        )}
      </div>

      <div className="flex gap-3 border-t border-gray-100 pt-5 mt-4">
        <Button type="button" variant="ghost" fullWidth onClick={onBack}>
          Anterior
        </Button>
        <Button
          type="button"
          fullWidth
          disabled={!idFile || !vehiclePropertyFile}
          isLoading={loading}
          onClick={onNext}
        >
          Subir y continuar
        </Button>
      </div>
    </div>
  );
}
