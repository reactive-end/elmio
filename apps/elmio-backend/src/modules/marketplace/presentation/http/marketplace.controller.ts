import {
  ForbiddenException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMarketplaceUseCase } from '../../application/create-marketplace.use-case';
import { DeleteMarketplaceUseCase } from '../../application/delete-marketplace.use-case';
import { GetMarketplaceByIdUseCase } from '../../application/get-marketplace-by-id.use-case';
import { GetMarketplaceBySlugUseCase } from '../../application/get-marketplace-by-slug.use-case';
import { ListMarketplacesUseCase } from '../../application/list-marketplaces.use-case';
import { UpdateMarketplaceUseCase } from '../../application/update-marketplace.use-case';
import type { Marketplace } from '../../domain/marketplace';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { CurrentUser } from '../../../auth/presentation/guards/current-user.decorator';
import type { UserSession } from '../../../auth/domain/user';
import { UserEntity } from '../../../auth/infrastructure/entities/user.entity';
import { CreateMarketplaceDto } from './dto/create-marketplace.dto';
import type { UpdateMarketplaceDto } from './dto/update-marketplace.dto';

/**
 * Controlador HTTP del modulo de marketplaces.
 * Expone CRUD completo para la configuracion de landings.
 */
@Controller('marketplaces')
export class MarketplaceController {
  constructor(
    private readonly listMarketplacesUseCase: ListMarketplacesUseCase,
    private readonly getMarketplaceBySlugUseCase: GetMarketplaceBySlugUseCase,
    private readonly getMarketplaceByIdUseCase: GetMarketplaceByIdUseCase,
    private readonly createMarketplaceUseCase: CreateMarketplaceUseCase,
    private readonly updateMarketplaceUseCase: UpdateMarketplaceUseCase,
    private readonly deleteMarketplaceUseCase: DeleteMarketplaceUseCase,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * Lista todos los marketplaces (requiere autenticacion).
   * `GET /api/marketplaces`
   * @returns Coleccion de marketplaces.
   */
  @UseGuards(AuthGuard)
  @Get()
  async list(@CurrentUser() session: UserSession): Promise<Marketplace[]> {
    if (session.role === 'ALLIED' || session.role === 'COMPANY') {
      return this.listMarketplacesUseCase.execute(session.owner);
    }
    return this.listMarketplacesUseCase.execute();
  }

  /**
   * Busca un marketplace por su slug (ruta publica, sin autenticacion).
   * `GET /api/marketplaces/slug/:slug`
   * @param slug Slug del marketplace.
   * @returns Configuracion completa del marketplace para renderizado publico.
   */
  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string): Promise<Marketplace> {
    return this.getMarketplaceBySlugUseCase.execute(slug);
  }

  /**
   * Busca un marketplace por su ID (requiere autenticacion).
   * `GET /api/marketplaces/:id`
   * @param id Identificador del marketplace.
   * @returns Configuracion completa del marketplace para el editor.
   */
  @UseGuards(AuthGuard)
  @Get(':id')
  async getById(
    @Param('id') id: string,
    @CurrentUser() session: UserSession,
  ): Promise<Marketplace> {
    const marketplace = await this.getMarketplaceByIdUseCase.execute(id);
    if (session.role === 'ALLIED' && marketplace.owner !== session.owner) {
      throw new ForbiddenException('No tienes permisos para acceder a este marketplace.');
    }
    return marketplace;
  }

  /**
   * Crea un nuevo marketplace (requiere autenticacion).
   * `POST /api/marketplaces`
   * @param body Datos basicos del nuevo marketplace.
   * @param session Sesion del usuario autenticado.
   * @returns Marketplace creado.
   */
  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() body: CreateMarketplaceDto,
    @CurrentUser() session: UserSession,
  ): Promise<Marketplace> {
    if (session.role === 'COMPANY') {
      throw new ForbiddenException(
        'Las empresas no pueden gestionar marketplaces desde el dashboard.',
      );
    }

    let slug = body.slug;

    if (session.role === 'ADMIN') {
      slug = 'elmio';
    } else if (session.role === 'ALLIED') {
      const ally = await this.userRepo.findOne({
        where: { id: session.userId },
      });
      if (!ally || !ally.slug) {
        throw new ForbiddenException(
          'El aliado no tiene un slug válido configurado en su perfil.',
        );
      }
      slug = ally.slug;
    } else {
      if (!slug) {
        throw new ForbiddenException(
          'No se puede determinar el slug del marketplace.',
        );
      }
    }

    return this.createMarketplaceUseCase.execute({
      ...body,
      slug: slug!,
      owner: body.owner || session.owner,
    });
  }

  /**
   * Actualiza la configuracion completa de un marketplace (requiere autenticacion).
   * `PUT /api/marketplaces/:id`
   * @param id Identificador del marketplace.
   * @param body Configuracion completa actualizada desde el editor.
   * @returns Marketplace actualizado.
   */
  @UseGuards(AuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateMarketplaceDto,
    @CurrentUser() session: UserSession,
  ): Promise<Marketplace> {
    if (session.role === 'COMPANY') {
      throw new ForbiddenException(
        'Las empresas no pueden gestionar marketplaces desde el dashboard.',
      );
    }

    if (session.role === 'ALLIED') {
      const existing = await this.getMarketplaceByIdUseCase.execute(id);
      if (existing.owner !== session.owner) {
        throw new ForbiddenException('No tienes permisos para modificar este marketplace.');
      }
    }

    const isAdmin = session.role === 'ADMIN';
    return this.updateMarketplaceUseCase.execute(id, body as any, isAdmin);
  }

  /**
   * Elimina un marketplace (requiere autenticacion).
   * `DELETE /api/marketplaces/:id`
   * @param id Identificador del marketplace.
   */
  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() session: UserSession,
  ): Promise<{ success: true }> {
    if (session.role === 'COMPANY') {
      throw new ForbiddenException(
        'Las empresas no pueden gestionar marketplaces desde el dashboard.',
      );
    }

    if (session.role === 'ALLIED') {
      const existing = await this.getMarketplaceByIdUseCase.execute(id);
      if (existing.owner !== session.owner) {
        throw new ForbiddenException('No tienes permisos para eliminar este marketplace.');
      }
    }

    await this.deleteMarketplaceUseCase.execute(id);
    return { success: true };
  }
}
