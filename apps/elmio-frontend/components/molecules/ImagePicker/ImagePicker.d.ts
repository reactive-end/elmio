import type { GalleryServiceImage } from '@/services/gallery/gallery.service'

export interface ImagePickerProps {
  label: string
  value: string
  onChange: (value: string) => void
  tenantDirectory?: string
}

export interface UseImagePickerReturn {
  search: string
  isLoading: boolean
  isOpen: boolean
  images: GalleryServiceImage[]
  filteredImages: GalleryServiceImage[]
  selectedImage: GalleryServiceImage | null
  setSearch: (value: string) => void
  openPicker: () => Promise<void>
  closePicker: () => void
}
