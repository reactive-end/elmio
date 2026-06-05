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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { CurrentUser } from '../../../auth/presentation/guards/current-user.decorator';
import { UserRole, type UserSession } from '../../../auth/domain/user';
import { RbacGroup } from '../../../auth/presentation/guards/rbac-group.decorator';
import { DeleteGalleryImageUseCase } from '../../application/delete-gallery-image.use-case';
import { GetGalleryImageFileUseCase } from '../../application/get-gallery-image-file.use-case';
import { ListGalleryImagesUseCase } from '../../application/list-gallery-images.use-case';
import { UploadGalleryImagesUseCase } from '../../application/upload-gallery-images.use-case';
import { GalleryQueryDto } from './dto/gallery-query.dto';
import type { ArchivoSubido } from '../../domain/gallery-image';

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
 * Expone listado, carga, eliminacion y streaming de imagenes por tenant con politicas de aislamiento.
 */
@Controller('gallery')
export class GalleryController {
  constructor(
    private readonly listGalleryImagesUseCase: ListGalleryImagesUseCase,
    private readonly uploadGalleryImagesUseCase: UploadGalleryImagesUseCase,
    private readonly deleteGalleryImageUseCase: DeleteGalleryImageUseCase,
    private readonly getGalleryImageFileUseCase: GetGalleryImageFileUseCase,
  ) {}

  /**
   * Resuelve el tenant logico basado en la sesion y query.
   */
  private resolveTenant(session: UserSession, query: GalleryQueryDto): string {
    if (session.role === UserRole.ADMIN) {
      return query.tenant?.trim() ? query.tenant.trim().toLowerCase() : 'elmio';
    }

    if (!session.owner?.trim()) {
      throw new BadRequestException(
        'Sesion de aliado invalida, falta identificador de propietario.',
      );
    }

    return session.owner.trim().toLowerCase();
  }

  /**
   * Mapea un tenant a su ruta fisica en el bucket/disco.
   */
  private getPhysicalDirectory(tenant: string): string {
    const cleanTenant = tenant.trim().toLowerCase();
    if (cleanTenant === 'elmio') {
      return 'gallery/elmio';
    }
    return `gallery/${cleanTenant}/images`;
  }

  private toResponseDto(
    image: GalleryDomainImage,
    tenant: string,
  ): GalleryImageResponseDto {
    return {
      ...image,
      previewUrl: `/api/gallery/${image.id}/file?tenant=${tenant}`,
    };
  }

  /**
   * Lista las imagenes disponibles para el tenant solicitado.
   * `GET /api/gallery?tenant=elmio`
   * @param query Tenant solicitado en query (solo aplicable a admins).
   * @param session Sesion de usuario actual.
   * @returns Coleccion de imagenes con URL de preview.
   */
  @UseGuards(AuthGuard)
  @Get()
  @RbacGroup('gallery-library')
  async listGalleryImages(
    @Query() query: GalleryQueryDto,
    @CurrentUser() session: UserSession,
  ): Promise<GalleryImageResponseDto[]> {
    const tenant = this.resolveTenant(session, query);
    const physicalDirectory = this.getPhysicalDirectory(tenant);
    const images =
      await this.listGalleryImagesUseCase.execute(physicalDirectory);

    return images.map((image) => this.toResponseDto(image, tenant));
  }

  /**
   * Carga una o varias imagenes para el tenant solicitado.
   * `POST /api/gallery/upload?tenant=elmio`
   * @param query Tenant solicitado en query (solo aplicable a admins).
   * @param session Sesion de usuario actual.
   * @param files Archivos de imagen enviados como multipart.
   * @returns Imagenes persistidas con sus URLs de preview.
   */
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @Post('upload')
  @RbacGroup('gallery-library')
  async uploadGalleryImages(
    @Query() query: GalleryQueryDto,
    @CurrentUser() session: UserSession,
    @UploadedFiles() files: ArchivoSubido[] | undefined,
  ): Promise<GalleryImageResponseDto[]> {
    const tenant = this.resolveTenant(session, query);
    const physicalDirectory = this.getPhysicalDirectory(tenant);
    const uploadedImages = await this.uploadGalleryImagesUseCase.execute({
      tenantDirectory: physicalDirectory,
      files: files ?? [],
    });

    return uploadedImages.map((image) => this.toResponseDto(image, tenant));
  }

  /**
   * Elimina una imagen especifica del tenant solicitado.
   * `DELETE /api/gallery/:imageId?tenant=elmio`
   * @param query Tenant solicitado en query (solo aplicable a admins).
   * @param session Sesion de usuario actual.
   * @param imageId Identificador interno de la imagen.
   * @returns Confirmacion de eliminacion.
   */
  @UseGuards(AuthGuard)
  @Delete(':imageId')
  @RbacGroup('gallery-library')
  async deleteGalleryImage(
    @Query() query: GalleryQueryDto,
    @CurrentUser() session: UserSession,
    @Param('imageId') imageId: string,
  ): Promise<GalleryDeleteResponseDto> {
    const tenant = this.resolveTenant(session, query);
    const physicalDirectory = this.getPhysicalDirectory(tenant);
    await this.deleteGalleryImageUseCase.execute(physicalDirectory, imageId);

    return { success: true };
  }

  /**
   * Sirve el archivo fisico de una imagen de galeria para su preview.
   * Este endpoint es publico para permitir que los marketplaces y paginas puedan cargar las fotos.
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
    const tenant = query.tenant?.trim()
      ? query.tenant.trim().toLowerCase()
      : 'elmio';
    const physicalDirectory = this.getPhysicalDirectory(tenant);
    const { image, absolutePath, publicUrl } =
      await this.getGalleryImageFileUseCase.execute(physicalDirectory, imageId);

    if (publicUrl) {
      response.redirect(publicUrl);
      return;
    }

    if (!absolutePath) {
      throw new BadRequestException(
        'No se pudo resolver el origen del archivo solicitado.',
      );
    }

    response.type(image.mimeType);
    response.sendFile(absolutePath);
  }
}
