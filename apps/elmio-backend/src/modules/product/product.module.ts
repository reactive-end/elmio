import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateProductUseCase } from './application/create-product.use-case';
import { UpdateProductUseCase } from './application/update-product.use-case';
import {
  ListProductsUseCase,
  GetProductByIdUseCase,
  DeleteProductUseCase,
} from './application/list-products.use-case';
import { PRODUCT_REPOSITORY_PORT } from './domain/ports/product-repository.port';
import { FileProductRepositoryService } from './infrastructure/file-product-repository.service';
import { ProductController } from './presentation/http/product.controller';

/**
 * Modulo de productos: CRUD del catalogo con soporte para
 * ventanas/acciones, listas de precios de terceros y cuotas.
 */
@Module({
  imports: [AuthModule],
  controllers: [ProductController],
  providers: [
    CreateProductUseCase,
    UpdateProductUseCase,
    ListProductsUseCase,
    GetProductByIdUseCase,
    DeleteProductUseCase,
    FileProductRepositoryService,
    {
      provide: PRODUCT_REPOSITORY_PORT,
      useExisting: FileProductRepositoryService,
    },
  ],
})
export class ProductModule {}
