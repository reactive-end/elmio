/**
 * @fileoverview Componente de Paso 3: Carga de Cédula (DNI).
 * @description Provee un área interactiva drag-and-drop para cargar digitalmente el documento de identidad.
 * @module components/molecules/MercantilSteps/Step3DniUpload
 */

'use client'

import { type DragEvent, type ChangeEvent, useRef } from 'react'
import { UploadCloud, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'

interface Step3DniUploadProps {
  /** Archivo DNI seleccionado activamente */
  idFile: File | null
  /** Función para actualizar el archivo seleccionado */
  setIdFile: (file: File | null) => void
  /** Estado de arrastre activo sobre la zona drag-and-drop */
  dragActive: boolean
  /** Función para actualizar el estado de arrastre */
  setDragActive: (active: boolean) => void
  /** Indicador de carga durante la subida */
  loading: boolean
  /** Mensaje de error si la subida falla */
  stepError: string
  /** Función para retroceder de paso */
  onBack: () => void
  /** Función para avanzar al paso 4 (completa subida) */
  onNext: () => Promise<void>
}

export function Step3DniUpload({
  idFile,
  setIdFile,
  dragActive,
  setDragActive,
  loading,
  stepError,
  onBack,
  onNext,
}: Step3DniUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setIdFile(file)
    }
  }

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIdFile(file)
    }
  }

  const removeFile = () => {
    setIdFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
          <UploadCloud className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-body">Cédula del Asegurado</h2>
          <p className="text-xs text-body-muted">
            Adjunte una foto legible o PDF de la cédula de identidad del asegurado para validar su
            suscripción.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {!idFile ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${
              dragActive
                ? 'border-secondary bg-secondary/5 scale-[0.99] shadow-inner'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 bg-white'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleSelect}
              accept="image/*,application/pdf"
              className="hidden"
            />
            <div className="p-4 bg-secondary/5 text-secondary rounded-full shadow-sm">
              <UploadCloud className="h-10 w-10 animate-pulse" strokeWidth={1} />
            </div>
            <div>
              <p className="text-sm font-semibold text-body">Arrastre o seleccione su archivo</p>
              <p className="text-xs text-body-muted mt-1">
                Formatos soportados: JPG, PNG o PDF. Máximo 10MB.
              </p>
            </div>
            <Button type="button" variant="ghost" className="mt-2">
              Buscar Archivo
            </Button>
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-100 bg-gray-50/40 p-5 flex items-center justify-between shadow-sm animate-scaleIn">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 bg-secondary/10 text-secondary rounded-2xl">
                <FileText className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-body truncate">{idFile.name}</p>
                <p className="text-xs text-body-muted mt-0.5">
                  {formatSize(idFile.size)} &bull; {idFile.type || 'Documento PDF'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Eliminar archivo"
            >
              <Trash2 className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        )}

        <div className="flex gap-3 border-t border-gray-100 pt-5 mt-4">
          <Button type="button" variant="ghost" fullWidth onClick={onBack}>
            Anterior
          </Button>
          <Button type="button" fullWidth disabled={!idFile} isLoading={loading} onClick={onNext}>
            Subir y continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
