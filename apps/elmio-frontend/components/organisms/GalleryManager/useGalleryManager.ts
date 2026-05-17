'use client'

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import {
  deleteGalleryImage,
  listGalleryImages,
  uploadGalleryImages,
} from '@/services/gallery/gallery.service'
import type {
  GalleryAlertState,
  GalleryImageItem,
  UseGalleryManagerReturn,
} from './GalleryManager.d'

const ADMIN_TENANT_DIRECTORY = 'elmio'

/**
 * Hook que administra la biblioteca de imagenes del dashboard.
 * Soporta carga individual y masiva, busqueda, preview y sincronizacion con la API.
 * @returns API de estado y acciones para el modulo de galeria del admin.
 */
export function useGalleryManager(): UseGalleryManagerReturn {
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [alert, setAlert] = useState<GalleryAlertState | null>(null)
  const [images, setImages] = useState<GalleryImageItem[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const singleInputRef = useRef<HTMLInputElement>(null)
  const bulkInputRef = useRef<HTMLInputElement>(null)
  const deferredSearch = useDeferredValue(search)

  const tenantDirectory = ADMIN_TENANT_DIRECTORY

  /**
   * Consulta al backend la biblioteca de imagenes del tenant actual.
   * @returns Promesa resuelta cuando el dashboard refleja el estado del servidor.
   */
  const loadImages = useCallback(async (): Promise<void> => {
    try {
      const nextImages = await listGalleryImages(tenantDirectory)
      setImages(nextImages)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar la galeria.'
      setAlert({ type: 'error', message })
    } finally {
      setIsLoading(false)
    }
  }, [tenantDirectory])

  useEffect(() => {
    let isActive = true

    const initializeImages = async () => {
      try {
        const nextImages = await listGalleryImages(tenantDirectory)

        if (!isActive) return

        setImages(nextImages)
      } catch (error) {
        if (!isActive) return

        const message = error instanceof Error ? error.message : 'No se pudo cargar la galeria.'
        setAlert({ type: 'error', message })
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void initializeImages()

    return () => {
      isActive = false
    }
  }, [tenantDirectory])

  const filteredImages = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase()

    if (!normalizedSearch) return images

    return images.filter((image) =>
      [image.name, image.storagePath, image.tenantDirectory].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      ),
    )
  }, [deferredSearch, images])

  const selectedImage = useMemo(
    () => images.find((image) => image.id === selectedImageId) ?? null,
    [images, selectedImageId],
  )

  const processUpload = async (fileList: FileList | null): Promise<void> => {
    if (!fileList || fileList.length === 0) return

    const candidateFiles = Array.from(fileList)
    const imageFiles = candidateFiles.filter((file) => file.type.startsWith('image/'))
    const skippedFilesCount = candidateFiles.length - imageFiles.length

    if (imageFiles.length === 0) {
      setAlert({
        type: 'warning',
        message: 'Solo se permiten archivos de imagen en la galeria del dashboard.',
      })
      return
    }

    setIsUploading(true)

    try {
      await uploadGalleryImages(tenantDirectory, imageFiles)
      await loadImages()

      const successMessage =
        imageFiles.length === 1
          ? `Se cargo 1 imagen en ${tenantDirectory}.`
          : `Se cargaron ${imageFiles.length} imagenes en ${tenantDirectory}.`

      const skippedMessage =
        skippedFilesCount > 0
          ? ` ${skippedFilesCount} archivo(s) fueron omitidos por no ser imagenes.`
          : ''

      setAlert({ type: 'success', message: `${successMessage}${skippedMessage}` })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron guardar las imagenes.'
      setAlert({ type: 'error', message })
    } finally {
      setIsUploading(false)

      if (singleInputRef.current) singleInputRef.current.value = ''
      if (bulkInputRef.current) bulkInputRef.current.value = ''
    }
  }

  /**
   * Maneja la carga individual desde el input oculto y la envía al backend.
   * @param event Evento del selector individual de archivos.
   * @returns Promesa resuelta al terminar la carga.
   */
  const handleSingleUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    await processUpload(event.target.files)
  }

  /**
   * Maneja la carga masiva desde el input oculto y la envía al backend.
   * @param event Evento del selector multiple de archivos.
   * @returns Promesa resuelta al terminar la carga.
   */
  const handleBulkUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    await processUpload(event.target.files)
  }

  /**
   * Elimina una imagen de la galeria en servidor y actualiza la seleccion actual.
   * @param imageId Identificador interno de la imagen a remover.
   * @returns Promesa resuelta al finalizar la eliminacion.
   */
  const removeImage = async (imageId: string): Promise<void> => {
    try {
      await deleteGalleryImage(tenantDirectory, imageId)

      if (selectedImageId === imageId) {
        setSelectedImageId(null)
      }

      await loadImages()
      setAlert({ type: 'success', message: 'La imagen fue eliminada de la galeria.' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar la imagen.'
      setAlert({ type: 'error', message })
    }
  }

  return {
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
    openSingleUpload: () => singleInputRef.current?.click(),
    openBulkUpload: () => bulkInputRef.current?.click(),
    handleSingleUpload,
    handleBulkUpload,
    openPreview: setSelectedImageId,
    closePreview: () => setSelectedImageId(null),
    removeImage,
  }
}
