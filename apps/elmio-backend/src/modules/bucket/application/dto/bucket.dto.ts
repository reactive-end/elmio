/**
 * @fileoverview Data Transfer Objects para el módulo de bucket
 * @description Define los objetos de transferencia de datos para las operaciones
 * de archivos en Google Cloud Storage
 * @module bucket/application/dto
 */

import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para subir un archivo al bucket
 * @class UploadFileDto
 */
export class UploadFileDto {
  @ApiProperty({
    description: 'Nombre identificador del archivo (sin extensión)',
    example: 'banner-principal',
  })
  @IsString()
  fileName: string;

  @ApiPropertyOptional({
    description: 'Carpeta destino dentro del bucket',
    example: 'banners',
  })
  @IsOptional()
  @IsString()
  folder?: string;
}

/**
 * DTO de respuesta para un archivo del bucket
 * @class BucketFileResponseDto
 */
export class BucketFileResponseDto {
  @ApiProperty({
    description: 'Nombre del archivo',
    example: 'banner-principal.jpg',
  })
  name: string;

  @ApiProperty({
    description: 'Ruta completa en el bucket',
    example: 'banners/banner-principal.jpg',
  })
  path: string;

  @ApiProperty({
    description: 'URL pública del archivo',
    example:
      'https://storage.googleapis.com/my-bucket/banners/banner-principal.jpg',
  })
  publicUrl: string;

  @ApiProperty({ description: 'Tamaño del archivo en bytes', example: 102400 })
  size: number;

  @ApiProperty({ description: 'Tipo MIME del archivo', example: 'image/jpeg' })
  contentType: string;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2026-02-10T22:00:00.000Z',
  })
  updatedAt: string;

  @ApiProperty({ description: 'Carpeta del archivo', example: 'banners' })
  folder: string;
}

/**
 * DTO de respuesta para un archivo subido exitosamente
 * @class UploadFileResponseDto
 */
export class UploadFileResponseDto {
  @ApiProperty({
    description: 'Nombre identificador del archivo',
    example: 'banner-principal',
  })
  fileName: string;

  @ApiProperty({
    description: 'Nombre original del archivo',
    example: 'mi-imagen.jpg',
  })
  originalName: string;

  @ApiProperty({
    description: 'Ruta completa en el bucket',
    example: 'banners/banner-principal.jpg',
  })
  path: string;

  @ApiProperty({
    description: 'URL pública del archivo',
    example:
      'https://storage.googleapis.com/my-bucket/banners/banner-principal.jpg',
  })
  publicUrl: string;

  @ApiProperty({ description: 'Tamaño del archivo en bytes', example: 102400 })
  size: number;

  @ApiProperty({ description: 'Tipo MIME del archivo', example: 'image/jpeg' })
  contentType: string;

  @ApiProperty({ description: 'Carpeta destino', example: 'banners' })
  folder: string;
}

export class MoveFolderDto {
  @ApiProperty({
    description: 'Prefijo origen',
    example: 'marketplace/productos/COD-001',
  })
  @IsString()
  from: string;

  @ApiProperty({
    description: 'Prefijo destino',
    example: 'marketplace/productos/COD-002',
  })
  @IsString()
  to: string;
}
