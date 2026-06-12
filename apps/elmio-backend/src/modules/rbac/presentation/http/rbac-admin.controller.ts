import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@/modules/auth/presentation/guards/auth.guard';
import { RolesGuard } from '@/modules/auth/presentation/guards/roles.guard';
import { Roles } from '@/modules/auth/presentation/guards/roles.decorator';
import { UserRole } from '@/modules/auth/domain/user';
import { ManagePermissionsUseCase } from '@/modules/rbac/application/manage-permissions.use-case';
import {
  ManageUsersUseCase,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/modules/rbac/application/manage-users.use-case';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('RBAC')
@Controller('rbac')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RbacAdminController {
  constructor(
    private readonly managePermissions: ManagePermissionsUseCase,
    private readonly manageUsers: ManageUsersUseCase,
  ) {}

  /** GET /api/rbac/permissions - Devuelve visibilidad de sidebar por rol. */
  @Get('permissions')
  async getPermissions() {
    return this.managePermissions.getAll();
  }

  /** PUT /api/rbac/permissions - Guarda visibilidad de sidebar para un rol. */
  @Put('permissions')
  async savePermissions(
    @Body()
    body: {
      role: string;
      permissions: Array<{ groupKey: string; visible: boolean }>;
    },
  ) {
    return this.managePermissions.save(body);
  }

  /** GET /api/rbac/users?role=FINANCE&page=1&perPage=20&search=...&includeInactive=false */
  @Get('users')
  async listUsers(
    @Query('role') role: string,
    @Query('page') page: string,
    @Query('perPage') perPage: string,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.manageUsers.list({
      role: role || '',
      page: Number(page) || 1,
      perPage: Number(perPage) || 20,
      search,
      includeInactive: includeInactive === 'true',
    });
  }

  /** GET /api/rbac/users/:id */
  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.manageUsers.findById(id);
  }

  /** POST /api/rbac/users - Crea un usuario de cualquier rol. */
  @Post('users')
  async createUser(@Body() body: CreateUserInput & { password?: string }) {
    const passwordHash = this.hashPassword(body.password || 'elmio2024');
    return this.manageUsers.create({ ...body, passwordHash });
  }

  /** PUT /api/rbac/users/:id */
  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserInput) {
    return this.manageUsers.update(id, body);
  }

  /** DELETE /api/rbac/users/:id - Soft-delete (isActive = false). */
  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    await this.manageUsers.deactivate(id);
  }

  private hashPassword(password: string): string {
    const crypto = require('node:crypto');
    return crypto
      .createHmac('sha256', 'elmio-secret-key')
      .update(password)
      .digest('hex');
  }
}
