/**
 * @fileoverview Controlador HTTP para gestionar archivos en Google Cloud Storage
 * @description Implementa los endpoints REST para listar, subir y eliminar archivos
 * del bucket de GCS
 * @module bucket/infrastructure/http/controllers
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BucketService, type MulterFile } from '../../../application/services/bucket.service';
import {
  BucketFileResponseDto,
  MoveFolderDto,
  UploadFileResponseDto,
} from '../../../application/dto/bucket.dto';

/**
 * Controlador para endpoints de gestión de archivos en el bucket
 * @class BucketController
 * @description Expone operaciones para listar, subir y eliminar archivos
 * en Google Cloud Storage mediante API REST
 */
@ApiTags('Bucket')
@ApiBearerAuth()
@Controller('api/v1/bucket')
export class BucketController {
  /**
   * Crea una instancia del controlador
   * @constructor
   * @param {BucketService} bucketService - Servicio de gestión de archivos
   */
  constructor(private readonly bucketService: BucketService) {}

  /**
   * Lista los archivos del bucket, opcionalmente filtrados por carpeta
   * @async
   * @param {string} [folder] - Carpeta para filtrar archivos
   * @returns {Promise<BucketFileResponseDto[]>} Lista de archivos
   */
  @Get('files')
  @ApiOperation({
    summary: 'Listar archivos del bucket',
    description: 'Obtiene todos los archivos del bucket de GCS, opcionalmente filtrados por carpeta',
  })
  @ApiQuery({
    name: 'folder',
    description: 'Carpeta para filtrar archivos',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de archivos',
    type: [BucketFileResponseDto],
  })
  async listFiles(
    @Query('folder') folder?: string,
  ): Promise<BucketFileResponseDto[]> {
    return this.bucketService.listFiles(folder);
  }

  /**
   * Lista las carpetas disponibles en el bucket
   * @async
   * @param {string} [parent] - Carpeta padre para listar subcarpetas
   * @returns {Promise<string[]>} Lista de nombres de carpetas
   */
  @Get('folders')
  @ApiOperation({
    summary: 'Listar carpetas del bucket',
    description: 'Obtiene las carpetas (prefijos) disponibles en el bucket',
  })
  @ApiQuery({
    name: 'parent',
    description: 'Carpeta padre para listar subcarpetas',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de carpetas',
    type: [String],
  })
  async listFolders(
    @Query('parent') parent?: string,
  ): Promise<string[]> {
    return this.bucketService.listFolders(parent);
  }

  /**
   * Sube un archivo al bucket de Google Cloud Storage
   * @async
   * @param {Express.Multer.File} file - Archivo a subir
   * @param {string} fileName - Nombre identificador del archivo
   * @param {string} [folder] - Carpeta destino
   * @returns {Promise<UploadFileResponseDto>} Datos del archivo subido
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];
      if (allowedMimes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new BadRequestException('Solo se permiten archivos de imagen (jpeg, png, gif, webp, svg)'), false);
      }
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir archivo al bucket',
    description: 'Sube una imagen al bucket de GCS con un nombre identificador y carpeta destino',
  })
  @ApiBody({
    description: 'Archivo de imagen con nombre y carpeta destino',
    schema: {
      type: 'object',
      required: ['file', 'fileName'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen a subir',
        },
        fileName: {
          type: 'string',
          description: 'Nombre identificador del archivo (sin extensión)',
          example: 'banner-principal',
        },
        folder: {
          type: 'string',
          description: 'Carpeta destino dentro del bucket',
          example: 'banners',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Archivo subido exitosamente',
    type: UploadFileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Archivo inválido o datos faltantes',
  })
  async uploadFile(
    @UploadedFile() file: MulterFile,
    @Body('fileName') fileName: string,
    @Body('folder') folder?: string,
  ): Promise<UploadFileResponseDto> {
    if (!file) {
      throw new BadRequestException('El archivo es requerido');
    }

    if (!fileName || fileName.trim().length === 0) {
      throw new BadRequestException('El nombre del archivo es requerido');
    }

    return this.bucketService.uploadFile(file, fileName.trim(), folder?.trim());
  }

  @Post('folders/move')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mover carpeta del bucket',
    description: 'Mueve todos los archivos de una carpeta/prefijo a otro dentro del bucket',
  })
  async moveFolder(
    @Body() dto: MoveFolderDto,
  ): Promise<{ moved: number }> {
    return this.bucketService.moveFolder(dto.from, dto.to);
  }

  /**
   * Elimina un archivo del bucket
   * @async
   * @param {string} path - Ruta completa del archivo en el bucket
   * @returns {Promise<{ deleted: boolean }>} Resultado de la eliminación
   */
  @Delete('files')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar archivo del bucket',
    description: 'Elimina un archivo del bucket de GCS por su ruta completa',
  })
  @ApiQuery({
    name: 'path',
    description: 'Ruta completa del archivo en el bucket',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Archivo eliminado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Archivo no encontrado',
  })
  async deleteFile(
    @Query('path') path: string,
  ): Promise<{ deleted: boolean }> {
    if (!path || path.trim().length === 0) {
      throw new BadRequestException('La ruta del archivo es requerida');
    }

    const deleted = await this.bucketService.deleteFile(path.trim());
    return { deleted };
  }
}
