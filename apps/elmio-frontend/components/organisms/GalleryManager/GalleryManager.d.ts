import type { ChangeEvent, RefObject } from 'react'

export interface GalleryManagerProps {
  className?: string
}

export interface GalleryImageItem {
  id: string
  name: string
  mimeType: string
  size: number
  createdAt: string
  tenantDirectory: string
  storagePath: string
  previewUrl: string
}

export interface GalleryAlertState {
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
}

export interface UseGalleryManagerReturn {
  tenantDirectory: string
  search: string
  isLoading: boolean
  isUploading: boolean
  alert: GalleryAlertState | null
  images: GalleryImageItem[]
  filteredImages: GalleryImageItem[]
  selectedImage: GalleryImageItem | null
  singleInputRef: RefObject<HTMLInputElement | null>
  bulkInputRef: RefObject<HTMLInputElement | null>
  setSearch: (value: string) => void
  setAlert: (value: GalleryAlertState | null) => void
  openSingleUpload: () => void
  openBulkUpload: () => void
  handleSingleUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  handleBulkUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  openPreview: (imageId: string) => void
  closePreview: () => void
  removeImage: (imageId: string) => Promise<void>
}
