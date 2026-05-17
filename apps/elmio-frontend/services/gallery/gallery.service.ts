import { z } from 'zod'

const galleryImageSchema = z.object({
  id: z.string(),
  tenantDirectory: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number(),
  storagePath: z.string(),
  createdAt: z.string(),
  previewUrl: z.string(),
})

const galleryImagesSchema = z.array(galleryImageSchema)

export type GalleryServiceImage = z.infer<typeof galleryImageSchema>

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'
}

function toAbsolutePreviewUrl(previewUrl: string): string {
  if (previewUrl.startsWith('http://') || previewUrl.startsWith('https://')) {
    return previewUrl
  }

  return new URL(previewUrl, getApiBaseUrl()).toString()
}

function buildGalleryEndpoint(path: string, tenantDirectory: string): string {
  const url = new URL(`/api/gallery${path}`, getApiBaseUrl())
  url.searchParams.set('tenant', tenantDirectory)
  return url.toString()
}

/**
 * Obtiene la biblioteca de imagenes del tenant solicitado.
 * @param tenantDirectory Directorio reservado para el tenant actual.
 * @returns Imagenes disponibles para renderizar en el dashboard.
 */
export async function listGalleryImages(tenantDirectory: string): Promise<GalleryServiceImage[]> {
  const response = await fetch(buildGalleryEndpoint('', tenantDirectory), {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('No se pudo cargar la galeria desde el servidor.')
  }

  const payload: unknown = await response.json()
  return galleryImagesSchema
    .parse(payload)
    .map((image) => ({ ...image, previewUrl: toAbsolutePreviewUrl(image.previewUrl) }))
}

/**
 * Carga una o varias imagenes al tenant indicado usando multipart/form-data.
 * @param tenantDirectory Directorio reservado para el tenant actual.
 * @param files Imagenes seleccionadas por el administrador.
 * @returns Imagenes persistidas por el backend.
 */
export async function uploadGalleryImages(
  tenantDirectory: string,
  files: File[],
): Promise<GalleryServiceImage[]> {
  const formData = new FormData()

  for (const file of files) {
    formData.append('files', file)
  }

  const response = await fetch(buildGalleryEndpoint('/upload', tenantDirectory), {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'No se pudieron cargar las imagenes al servidor.')
  }

  const payload: unknown = await response.json()
  return galleryImagesSchema
    .parse(payload)
    .map((image) => ({ ...image, previewUrl: toAbsolutePreviewUrl(image.previewUrl) }))
}

/**
 * Elimina una imagen del tenant indicado.
 * @param tenantDirectory Directorio reservado para el tenant actual.
 * @param imageId Identificador interno de la imagen.
 * @returns Promesa resuelta cuando el backend confirma la eliminacion.
 */
export async function deleteGalleryImage(
  tenantDirectory: string,
  imageId: string,
): Promise<void> {
  const response = await fetch(buildGalleryEndpoint(`/${imageId}`, tenantDirectory), {
    method: 'DELETE',
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'No se pudo eliminar la imagen del servidor.')
  }
}
