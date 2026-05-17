/**
 * Representa un recurso visual almacenado en la galeria de un tenant.
 */
export interface GalleryImage {
  id: string;
  tenantDirectory: string;
  name: string;
  mimeType: string;
  size: number;
  storagePath: string;
  fileName: string;
  createdAt: string;
}
