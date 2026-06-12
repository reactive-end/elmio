/**
 * @fileoverview Servicio de aplicación para gestionar archivos en Google Cloud Storage
 * @description Implementa los casos de uso para listar, subir y eliminar archivos
 * del bucket de Google Cloud Storage
 * @module bucket/application/services
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage, Bucket } from '@google-cloud/storage';
import {
  BucketFileResponseDto,
  UploadFileResponseDto,
} from '../dto/bucket.dto';

const HIDDEN_FOLDERS = ['mercantil-dni'];

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

/**
 * Servicio para gestionar archivos en Google Cloud Storage
 * @class BucketService
 * @description Proporciona operaciones de:
 * - Listar archivos del bucket
 * - Subir archivos al bucket
 * - Eliminar archivos del bucket
 * - Listar carpetas del bucket
 */
@Injectable()
export class BucketService {
  /** @private Logger de NestJS */
  private readonly logger = new Logger(BucketService.name);

  /** @private Instancia del cliente de Google Cloud Storage */
  private readonly storage: Storage;

  /** @private Instancia del bucket */
  private readonly bucket: Bucket;

  /** @private Nombre del bucket */
  private readonly bucketName: string;

  /**
   * Crea una instancia del servicio
   * @constructor
   * @param {ConfigService} configService - Servicio de configuración de NestJS
   */
  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.get<string>('GCS_PROJECT_ID');
    const keyFile = this.configService.get<string>('GCS_KEY_FILE');
    this.bucketName = this.configService.get<string>('GCS_BUCKET_NAME') || '';

    this.storage = new Storage({
      projectId,
      keyFilename: keyFile,
    });

    this.bucket = this.storage.bucket(this.bucketName);
  }

  /**
   * Lista todos los archivos del bucket, opcionalmente filtrados por carpeta
   * @async
   * @param {string} [folder] - Prefijo de carpeta para filtrar archivos
   * @returns {Promise<BucketFileResponseDto[]>} Lista de archivos encontrados
   */
  async listFiles(folder?: string): Promise<BucketFileResponseDto[]> {
    try {
      const options: { prefix?: string; delimiter?: string } = {};

      const normalizedFolder = this.normalizeFolder(folder);

      if (normalizedFolder && this.isHiddenPath(normalizedFolder)) {
        return [];
      }

      if (normalizedFolder) {
        options.prefix = `${normalizedFolder}/`;
      }

      const [files] = await this.bucket.getFiles(options);

      return files
        .filter((file) => !file.name.endsWith('/'))
        .filter((file) => !this.isHiddenPath(file.name))
        .map((file) => this.mapFileToDto(file));
    } catch (error) {
      this.logger.error(
        `Error al listar archivos: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error al listar archivos: ${error.message}`,
      );
    }
  }

  /**
   * Lista las carpetas (prefijos) disponibles en el bucket
   * @async
   * @param {string} [parentFolder] - Carpeta padre para listar subcarpetas
   * @returns {Promise<string[]>} Lista de nombres de carpetas
   */
  async listFolders(parentFolder?: string): Promise<string[]> {
    try {
      const options: {
        prefix?: string;
        delimiter: string;
        autoPaginate: boolean;
      } = {
        delimiter: '/',
        autoPaginate: false,
      };

      const normalizedParent = this.normalizeFolder(parentFolder);

      if (normalizedParent && this.isHiddenPath(normalizedParent)) {
        return [];
      }

      if (normalizedParent) {
        options.prefix = `${normalizedParent}/`;
      }

      const [, , apiResponse] = await this.bucket.getFiles(options);
      const prefixes: string[] = (apiResponse as any)?.prefixes || [];

      return prefixes
        .map((p: string) => p.replace(/\/$/, ''))
        .filter((path) => !this.isHiddenPath(path));
    } catch (error) {
      this.logger.error(
        `Error al listar carpetas: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error al listar carpetas: ${error.message}`,
      );
    }
  }

  /**
   * Sube un archivo al bucket de Google Cloud Storage
   * @async
   * @param {MulterFile} file - Archivo a subir (buffer de multer)
   * @param {string} fileName - Nombre identificador del archivo
   * @param {string} [folder] - Carpeta destino dentro del bucket
   * @returns {Promise<UploadFileResponseDto>} Datos del archivo subido
   */
  async uploadFile(
    file: MulterFile,
    fileName: string,
    folder?: string,
  ): Promise<UploadFileResponseDto> {
    try {
      const extension = file.originalname.split('.').pop();
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const destination = folder
        ? `${folder}/${sanitizedName}.${extension}`
        : `${sanitizedName}.${extension}`;

      const blob = this.bucket.file(destination);
      const stream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      await new Promise<void>((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', resolve);
        stream.end(file.buffer);
      });

      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${destination}`;

      this.logger.log(`Archivo subido exitosamente: ${destination}`);

      return {
        fileName: sanitizedName,
        originalName: file.originalname,
        path: destination,
        publicUrl,
        size: file.size,
        contentType: file.mimetype,
        folder: folder || '',
      };
    } catch (error) {
      this.logger.error(
        `Error al subir archivo: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error al subir archivo: ${error.message}`,
      );
    }
  }

  /**
   * Elimina un archivo del bucket
   * @async
   * @param {string} filePath - Ruta completa del archivo en el bucket
   * @returns {Promise<boolean>} True si se eliminó correctamente
   * @throws {NotFoundException} Si el archivo no existe en el bucket
   * @throws {InternalServerErrorException} Si ocurre un error inesperado
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const file = this.bucket.file(filePath);
      const [exists] = await file.exists();

      if (!exists) {
        this.logger.warn(`Archivo no encontrado: ${filePath}`);
        throw new NotFoundException(
          `El archivo '${filePath}' no existe en el bucket`,
        );
      }

      await file.delete();
      this.logger.log(`Archivo eliminado: ${filePath}`);
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error al eliminar archivo: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error al eliminar el archivo: ${error.message}`,
      );
    }
  }

  /**
   * Mapea un archivo de GCS al DTO de respuesta
   * @private
   * @param {any} file - Objeto File de Google Cloud Storage
   * @returns {BucketFileResponseDto} DTO con los datos del archivo
   */
  private mapFileToDto(file: any): BucketFileResponseDto {
    const nameParts = file.name.split('/');
    const fullFileName = nameParts[nameParts.length - 1];
    const folder = nameParts.length > 1 ? nameParts.slice(0, -1).join('/') : '';

    return {
      name: fullFileName,
      path: file.name,
      publicUrl: `https://storage.googleapis.com/${this.bucketName}/${file.name}`,
      size: parseInt(file.metadata.size || '0', 10),
      contentType: file.metadata.contentType || '',
      updatedAt: file.metadata.updated || '',
      folder,
    };
  }

  async moveFolder(
    fromPath: string,
    toPath: string,
  ): Promise<{ moved: number }> {
    try {
      const fromPrefix = this.normalizeFolder(fromPath);
      const toPrefix = this.normalizeFolder(toPath);

      if (!fromPrefix || !toPrefix) {
        throw new InternalServerErrorException(
          'Las carpetas origen y destino son requeridas',
        );
      }

      if (fromPrefix === toPrefix) {
        return { moved: 0 };
      }

      const [files] = await this.bucket.getFiles({ prefix: `${fromPrefix}/` });
      const realFiles = files.filter((file) => !file.name.endsWith('/'));

      for (const file of realFiles) {
        const relativePath = file.name.slice(fromPrefix.length + 1);
        const destination = `${toPrefix}/${relativePath}`;
        await file.copy(this.bucket.file(destination));
      }

      for (const file of realFiles) {
        await file.delete();
      }

      return { moved: realFiles.length };
    } catch (error) {
      this.logger.error(
        `Error al mover carpeta: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error al mover carpeta: ${error.message}`,
      );
    }
  }

  private normalizeFolder(folder?: string): string {
    return (folder || '').trim().replace(/^\/+|\/+$/g, '');
  }

  private isHiddenPath(path: string): boolean {
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    return HIDDEN_FOLDERS.some(
      (folder) =>
        normalizedPath === folder || normalizedPath.startsWith(`${folder}/`),
    );
  }
}
