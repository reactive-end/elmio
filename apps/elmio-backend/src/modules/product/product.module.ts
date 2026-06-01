import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CreateProductUseCase } from './application/create-product.use-case';
import { UpdateProductUseCase } from './application/update-product.use-case';
import {
  ListProductsUseCase,
  GetProductByIdUseCase,
  DeleteProductUseCase,
} from './application/list-products.use-case';
import { PRODUCT_REPOSITORY_PORT } from './domain/ports/product-repository.port';
import { DbProductRepositoryService } from './infrastructure/db-product-repository.service';
import { ProductEntity } from './infrastructure/entities/product.entity';
import { ProductController } from './presentation/http/product.controller';

// Imports de Categoria
import { CATEGORY_REPOSITORY_PORT } from './domain/ports/category-repository.port';
import { DbCategoryRepositoryService } from './infrastructure/db-category-repository.service';
import { CategoryEntity } from './infrastructure/entities/category.entity';
import { CategoryController } from './presentation/http/category.controller';
import {
  ListCategoriesUseCase,
  GetCategoryByIdUseCase,
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
} from './application/category.use-cases';

/**
 * Modulo de productos: CRUD del catalogo con soporte para
 * ventanas/acciones, listas de precios de terceros, cuotas y categorias.
 */
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ProductEntity, CategoryEntity]),
  ],
  controllers: [ProductController, CategoryController],
  providers: [
    CreateProductUseCase,
    UpdateProductUseCase,
    ListProductsUseCase,
    GetProductByIdUseCase,
    DeleteProductUseCase,
    DbProductRepositoryService,
    {
      provide: PRODUCT_REPOSITORY_PORT,
      useClass: DbProductRepositoryService,
    },
    // Providers de Categoria
    ListCategoriesUseCase,
    GetCategoryByIdUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    DbCategoryRepositoryService,
    {
      provide: CATEGORY_REPOSITORY_PORT,
      useClass: DbCategoryRepositoryService,
    },
  ],
  exports: [PRODUCT_REPOSITORY_PORT],
})
export class ProductModule {}

