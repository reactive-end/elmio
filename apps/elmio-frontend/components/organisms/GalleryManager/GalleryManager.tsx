'use client'

import Image from 'next/image'
import {
  Eye,
  FolderTree,
  ImageIcon,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { useGalleryManager } from './useGalleryManager'
import type { GalleryImageItem, GalleryManagerProps } from './GalleryManager.d'

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function GalleryCard({
  image,
  onPreview,
}: {
  image: GalleryImageItem
  onPreview: (imageId: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onPreview(image.id)}
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={image.previewUrl}
          alt={image.name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/65 via-black/15 to-transparent px-4 py-3 text-white">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
            {formatFileSize(image.size)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
            <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
            Ver
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div>
          <p className="truncate text-sm font-semibold text-body">{image.name}</p>
          <p className="mt-1 truncate text-xs text-gray-400">{image.storagePath}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{image.mimeType}</span>
          <span>{formatDate(image.createdAt)}</span>
        </div>
      </div>
    </button>
  )
}

/**
 * Organismo que administra la galeria del dashboard de admin.
 * Permite cargar imagenes, buscarlas y revisarlas antes de integrarlas con el bucket real.
 */
export function GalleryManager({ className = '' }: GalleryManagerProps) {
  const {
    tenantDirectory,
    search,
    isLoading,
    isUploading,
    alert,
    images,
    filteredImages,
    selectedImage,
    singleInputRef,
    bulkInputRef,
    setSearch,
    setAlert,
    openSingleUpload,
    openBulkUpload,
    handleSingleUpload,
    handleBulkUpload,
    openPreview,
    closePreview,
    removeImage,
  } = useGalleryManager()

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={singleInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleSingleUpload(event)
        }}
      />
      <input
        ref={bulkInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleBulkUpload(event)
        }}
      />

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/8 px-3 py-1 text-xs font-semibold text-secondary">
            <FolderTree className="h-3.5 w-3.5" strokeWidth={1.5} />
            Directorio activo: {tenantDirectory}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-body">Galeria de imagenes</h1>
            <p className="mt-1 text-sm text-gray-500">
              Carga recursos individuales o lotes completos para el tenant administrador.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="ghost" onClick={openSingleUpload} disabled={isUploading}>
            <ImageIcon className="h-4 w-4" strokeWidth={1.5} />
            Cargar una imagen
          </Button>
          <Button type="button" onClick={openBulkUpload} disabled={isUploading} isLoading={isUploading}>
            <Upload className="h-4 w-4" strokeWidth={1.5} />
            Carga masiva
          </Button>
        </div>
      </div>

      {alert && (
        <div className="mb-6">
          <Alert type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-body">Biblioteca del tenant {tenantDirectory}</p>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Gestiona las imagenes activas del administrador y reutilizalas dentro del marketplace.
              </p>
            </div>
            <div className="rounded-2xl bg-surface-muted px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Imagenes</p>
              <p className="mt-1 text-2xl font-semibold text-body">{images.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-body-secondary">Buscar en la galeria</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre, directorio o ruta"
              className="pl-10"
            />
          </div>
          <p className="mt-3 text-xs text-gray-400">
            {filteredImages.length} resultado(s) visibles de {images.length} imagen(es).
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-body">Carga rapida</p>
            <p className="mt-1 text-sm text-gray-500">
              Usa carga individual para assets puntuales o carga masiva para bibliotecas completas.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="ghost" onClick={openSingleUpload} disabled={isUploading}>
              Seleccion individual
            </Button>
            <Button type="button" onClick={openBulkUpload} disabled={isUploading}>
              Seleccion multiple
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="text-center">
            <p className="text-sm font-medium text-body">Cargando galeria...</p>
            <p className="mt-1 text-sm text-gray-400">Consultando imagenes registradas en el servidor.</p>
          </div>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white px-6 text-center shadow-sm">
          <div className="mb-4 rounded-2xl bg-secondary/8 p-4 text-secondary">
            <ImageIcon className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-semibold text-body">No hay imagenes para mostrar</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
            {images.length === 0
              ? 'Carga la primera imagen para empezar a construir la biblioteca del tenant elmio.'
              : 'No hay coincidencias para la busqueda actual. Ajusta el termino y vuelve a intentar.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredImages.map((image) => (
            <GalleryCard key={image.id} image={image} onPreview={openPreview} />
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
          <div className="relative flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid lg:grid-cols-[minmax(0,1.3fr)_400px]">
            <button
              type="button"
              onClick={closePreview}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/65"
              aria-label="Cerrar vista previa"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <div className="min-h-[320px] bg-gray-950/95 p-4 lg:p-6">
              <div className="flex h-full items-center justify-center overflow-hidden rounded-[1.5rem] bg-black/20">
                <Image
                  src={selectedImage.previewUrl}
                  alt={selectedImage.name}
                  width={1600}
                  height={1200}
                  unoptimized
                  className="max-h-[72vh] w-full object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col overflow-y-auto p-6 lg:p-7">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Vista previa
                </p>
                <h2 className="mt-2 text-xl font-semibold text-body">{selectedImage.name}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Recurso disponible en la galeria del tenant administrador.
                </p>
              </div>

              <dl className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50/80 p-5">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Directorio</dt>
                  <dd className="mt-1 text-sm font-medium text-body">{selectedImage.tenantDirectory}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Ruta</dt>
                  <dd className="mt-1 break-all text-sm text-body">{selectedImage.storagePath}</dd>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Peso</dt>
                    <dd className="mt-1 text-sm text-body">{formatFileSize(selectedImage.size)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Formato</dt>
                    <dd className="mt-1 text-sm text-body">{selectedImage.mimeType}</dd>
                  </div>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Fecha de carga</dt>
                  <dd className="mt-1 text-sm text-body">{formatDate(selectedImage.createdAt)}</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button type="button" fullWidth variant="ghost" onClick={closePreview}>
                  Cerrar preview
                </Button>
                <Button
                  type="button"
                  fullWidth
                  className="bg-red-500 hover:bg-red-600 focus:ring-red-300"
                  onClick={() => {
                    void removeImage(selectedImage.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  Eliminar imagen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
