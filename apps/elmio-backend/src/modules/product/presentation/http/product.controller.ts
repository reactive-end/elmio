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
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
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
  ) {}

  /** GET /api/products - Lista todos los productos. */
  @UseGuards(AuthGuard)
  @Get()
  async list(): Promise<Product[]> {
    return this.listProducts.execute();
  }

  /** GET /api/products/:id - Obtiene un producto por ID. */
  @UseGuards(AuthGuard)
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

    await this.deleteProduct.execute(id);
    return { success: true };
  }
}
