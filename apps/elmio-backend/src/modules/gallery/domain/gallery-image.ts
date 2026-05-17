/**
 * Representa un archivo subido por HTTP multipart.
 * Reemplaza Express.Multer.File (no disponible en @types/express@5).
 */
export interface ArchivoSubido {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

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
