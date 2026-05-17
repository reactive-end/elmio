import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DeleteGalleryImageUseCase } from '../../application/delete-gallery-image.use-case';
import { GetGalleryImageFileUseCase } from '../../application/get-gallery-image-file.use-case';
import { ListGalleryImagesUseCase } from '../../application/list-gallery-images.use-case';
import { UploadGalleryImagesUseCase } from '../../application/upload-gallery-images.use-case';
import { GalleryQueryDto } from './dto/gallery-query.dto';

interface GalleryImageResponseDto {
  id: string;
  tenantDirectory: string;
  name: string;
  mimeType: string;
  size: number;
  storagePath: string;
  createdAt: string;
  previewUrl: string;
}

interface GalleryDeleteResponseDto {
  success: true;
}

interface GalleryDomainImage {
  id: string;
  tenantDirectory: string;
  name: string;
  mimeType: string;
  size: number;
  storagePath: string;
  createdAt: string;
}

/**
 * Controlador HTTP de la galeria del dashboard admin.
 * Expone listado, carga, eliminacion y streaming de imagenes por tenant.
 */
@Controller('gallery')
export class GalleryController {
  constructor(
    private readonly listGalleryImagesUseCase: ListGalleryImagesUseCase,
    private readonly uploadGalleryImagesUseCase: UploadGalleryImagesUseCase,
    private readonly deleteGalleryImageUseCase: DeleteGalleryImageUseCase,
    private readonly getGalleryImageFileUseCase: GetGalleryImageFileUseCase,
  ) {}

  private resolveTenantDirectory(query: GalleryQueryDto): string {
    if (!query.tenant?.trim()) {
      throw new BadRequestException('Debes indicar el tenant de la galeria.');
    }

    return query.tenant.trim().toLowerCase();
  }

  private toResponseDto(
    image: GalleryDomainImage,
  ): GalleryImageResponseDto {
    return {
      ...image,
      previewUrl: `/api/gallery/${image.id}/file?tenant=${image.tenantDirectory}`,
    };
  }

  /**
   * Lista las imagenes disponibles para el tenant solicitado.
   * `GET /api/gallery?tenant=elmio`
   * @param query Tenant propietario de la biblioteca.
   * @returns Coleccion de imagenes con URL de preview.
   */
  @Get()
  async listGalleryImages(
    @Query() query: GalleryQueryDto,
  ): Promise<GalleryImageResponseDto[]> {
    const tenantDirectory = this.resolveTenantDirectory(query);
    const images = await this.listGalleryImagesUseCase.execute(tenantDirectory);

    return images.map((image) => this.toResponseDto(image));
  }

  /**
   * Carga una o varias imagenes para el tenant solicitado.
   * `POST /api/gallery/upload?tenant=elmio`
   * @param query Tenant propietario de la biblioteca.
   * @param files Archivos de imagen enviados como multipart.
   * @returns Imagenes persistidas con sus URLs de preview.
   */
  @UseInterceptors(FilesInterceptor('files'))
  @Post('upload')
  async uploadGalleryImages(
    @Query() query: GalleryQueryDto,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
  ): Promise<GalleryImageResponseDto[]> {
    const tenantDirectory = this.resolveTenantDirectory(query);
    const uploadedImages = await this.uploadGalleryImagesUseCase.execute({
      tenantDirectory,
      files: files ?? [],
    });

    return uploadedImages.map((image) => this.toResponseDto(image));
  }

  /**
   * Elimina una imagen especifica del tenant solicitado.
   * `DELETE /api/gallery/:imageId?tenant=elmio`
   * @param query Tenant propietario de la biblioteca.
   * @param imageId Identificador interno de la imagen.
   * @returns Confirmacion de eliminacion.
   */
  @Delete(':imageId')
  async deleteGalleryImage(
    @Query() query: GalleryQueryDto,
    @Param('imageId') imageId: string,
  ): Promise<GalleryDeleteResponseDto> {
    const tenantDirectory = this.resolveTenantDirectory(query);
    await this.deleteGalleryImageUseCase.execute(tenantDirectory, imageId);

    return { success: true };
  }

  /**
   * Sirve el archivo fisico de una imagen de galeria para su preview.
   * `GET /api/gallery/:imageId/file?tenant=elmio`
   * @param query Tenant propietario de la biblioteca.
   * @param imageId Identificador interno de la imagen.
   * @param response Respuesta HTTP express usada para enviar el archivo.
   * @returns Streaming del archivo solicitado.
   */
  @Get(':imageId/file')
  async getGalleryImageFile(
    @Query() query: GalleryQueryDto,
    @Param('imageId') imageId: string,
    @Res() response: Response,
  ): Promise<void> {
    const tenantDirectory = this.resolveTenantDirectory(query);
    const { image, absolutePath, publicUrl } = await this.getGalleryImageFileUseCase.execute(
      tenantDirectory,
      imageId,
    );

    if (publicUrl) {
      response.redirect(publicUrl);
      return;
    }

    if (!absolutePath) {
      throw new BadRequestException('No se pudo resolver el origen del archivo solicitado.');
    }

    response.type(image.mimeType);
    response.sendFile(absolutePath);
  }
}
