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
import { DataSource } from 'typeorm';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { OptionalAuthGuard } from '../../../auth/presentation/guards/optional-auth.guard';
import { CurrentUser } from '../../../auth/presentation/guards/current-user.decorator';
import type { UserSession } from '../../../auth/domain/user';
import { CreateProductUseCase } from '../../application/create-product.use-case';
import { UpdateProductUseCase } from '../../application/update-product.use-case';
import {
  ListProductsUseCase,
  GetProductByIdUseCase,
  DeleteProductUseCase,
} from '../../application/list-products.use-case';
import type { Product } from '../../domain/product';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { MarketplaceEntity } from '../../../marketplace/infrastructure/entities/marketplace.entity';

/**
 * Controlador HTTP del modulo de productos.
 * Expone CRUD completo para el catalogo de productos.
 */
@Controller('products')
export class ProductController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProductById: GetProductByIdUseCase,
    private readonly deleteProduct: DeleteProductUseCase,
    private readonly dataSource: DataSource,
  ) {}

  /** GET /api/products - Lista todos los productos. */
  @UseGuards(OptionalAuthGuard)
  @Get()
  async list(@CurrentUser() session?: UserSession): Promise<Product[]> {
    const allProducts = await this.listProducts.execute();

    if (session && session.role === 'ALLIED') {
      const marketplaces = await this.dataSource
        .getRepository(MarketplaceEntity)
        .find({ where: { owner: session.owner } });
      const alliedMarketplaceIds = marketplaces.map((m) => m.id);

      return allProducts.filter(
        (p) =>
          p.marketplaceId && alliedMarketplaceIds.includes(p.marketplaceId),
      );
    }

    return allProducts;
  }

  /** GET /api/products/:id - Obtiene un producto por ID. */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<Product> {
    return this.getProductById.execute(id);
  }

  /** POST /api/products - Crea un nuevo producto. */
  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() body: CreateProductDto,
    @CurrentUser() session: UserSession,
  ): Promise<Product> {
    if (session.role === 'COMPANY') {
      throw new ForbiddenException(
        'Las empresas no pueden crear productos desde el dashboard.',
      );
    }

    if (session.role === 'ALLIED') {
      if (!body.marketplaceId) {
        throw new ForbiddenException(
          'Debes asociar el producto a uno de tus marketplaces.',
        );
      }
      const m = await this.dataSource
        .getRepository(MarketplaceEntity)
        .findOne({ where: { id: body.marketplaceId } });
      if (!m || m.owner !== session.owner) {
        throw new ForbiddenException(
          'No tienes permisos para agregar productos a este marketplace.',
        );
      }
    }

    return this.createProduct.execute(body);
  }

  /** PUT /api/products/:id - Actualiza un producto existente. */
  @UseGuards(AuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @CurrentUser() session: UserSession,
  ): Promise<Product> {
    if (session.role === 'COMPANY') {
      throw new ForbiddenException(
        'Las empresas no pueden gestionar productos desde el dashboard.',
      );
    }

    if (session.role === 'ALLIED') {
      const prod = await this.getProductById.execute(id);
      if (!prod.marketplaceId) {
        throw new ForbiddenException(
          'No tienes permisos para modificar este producto.',
        );
      }
      const m = await this.dataSource
        .getRepository(MarketplaceEntity)
        .findOne({ where: { id: prod.marketplaceId } });
      if (!m || m.owner !== session.owner) {
        throw new ForbiddenException(
          'No tienes permisos para modificar este producto.',
        );
      }
    }

    return this.updateProduct.execute(id, body);
  }

  /** DELETE /api/products/:id - Elimina un producto. */
  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() session: UserSession,
  ): Promise<{ success: true }> {
    if (session.role === 'COMPANY') {
      throw new ForbiddenException(
        'Las empresas no pueden eliminar productos desde el dashboard.',
      );
    }

    if (session.role === 'ALLIED') {
      const prod = await this.getProductById.execute(id);
      if (!prod.marketplaceId) {
        throw new ForbiddenException(
          'No tienes permisos para eliminar este producto.',
        );
      }
      const m = await this.dataSource
        .getRepository(MarketplaceEntity)
        .findOne({ where: { id: prod.marketplaceId } });
      if (!m || m.owner !== session.owner) {
        throw new ForbiddenException(
          'No tienes permisos para eliminar este producto.',
        );
      }
    }

    await this.deleteProduct.execute(id);
    return { success: true };
  }
}
