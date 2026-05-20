import {
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
import {
  ListCategoriesUseCase,
  GetCategoryByIdUseCase,
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
} from '../../application/category.use-cases';
import type { Category } from '../../domain/category';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

/**
 * Controlador HTTP del modulo de categorias de productos.
 * Expone CRUD completo protegido por autenticacion.
 */
@Controller('categories')
@UseGuards(AuthGuard)
export class CategoryController {
  constructor(
    private readonly listCategories: ListCategoriesUseCase,
    private readonly getCategoryById: GetCategoryByIdUseCase,
    private readonly createCategory: CreateCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
  ) {}

  /** GET /api/categories - Lista todas las categorias de productos. */
  @Get()
  async list(): Promise<Category[]> {
    return this.listCategories.execute();
  }

  /** GET /api/categories/:id - Obtiene una categoria especifica. */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<Category> {
    return this.getCategoryById.execute(id);
  }

  /** POST /api/categories - Crea una nueva categoria. */
  @Post()
  async create(@Body() body: CreateCategoryDto): Promise<Category> {
    return this.createCategory.execute(body);
  }

  /** PUT /api/categories/:id - Modifica una categoria existente. */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
  ): Promise<Category> {
    return this.updateCategory.execute(id, body);
  }

  /** DELETE /api/categories/:id - Elimina una categoria. */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: true }> {
    await this.deleteCategory.execute(id);
    return { success: true };
  }
}
