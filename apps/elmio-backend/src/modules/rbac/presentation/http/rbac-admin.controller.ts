import { createHmac } from 'node:crypto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  NotFoundException,
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

import { RbacGroup } from '@/modules/auth/presentation/guards/rbac-group.decorator';

@ApiTags('RBAC')
@Controller('rbac')
@UseGuards(AuthGuard, RolesGuard)
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
  @Roles(UserRole.ADMIN)
  @RbacGroup('config-rbac')
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
  @Roles(UserRole.ADMIN)
  @RbacGroup('config-rbac')
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
  @Roles(UserRole.ADMIN)
  @RbacGroup('config-rbac')
  async getUser(@Param('id') id: string) {
    return this.manageUsers.findById(id);
  }

  /** POST /api/rbac/users - Crea un usuario de cualquier rol. */
  @Post('users')
  @Roles(UserRole.ADMIN)
  @RbacGroup('config-rbac')
  async createUser(@Body() body: CreateUserInput & { password?: string }) {
    const passwordHash = this.hashPassword(body.password || 'elmio2024');
    return this.manageUsers.create({ ...body, passwordHash });
  }

  /** PUT /api/rbac/users/:id */
  @Put('users/:id')
  @Roles(UserRole.ADMIN)
  @RbacGroup('config-rbac')
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserInput) {
    return this.manageUsers.update(id, body);
  }

  /** DELETE /api/rbac/users/:id - Soft-delete (isActive = false). */
  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @RbacGroup('config-rbac')
  async deleteUser(@Param('id') id: string) {
    await this.manageUsers.deactivate(id);
  }

  /** GET /api/rbac/roles - Devuelve el listado de roles (sistema + dinamicos). */
  @Get('roles')
  @Roles(UserRole.ADMIN)
  @RbacGroup('config-rbac')
  async listRoles() {
    return this.managePermissions.getRolesList();
  }

  /** POST /api/rbac/roles - Crea un rol dinamico. */
  @Post('roles')
  @Roles(UserRole.ADMIN)
  @RbacGroup('config-rbac')
  async createRole(@Body() body: { name: string }) {
    return this.managePermissions.createCustomRole(body.name);
  }

  /** DELETE /api/rbac/roles/:key - Elimina un rol dinamico. */
  @Delete('roles/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @RbacGroup('config-rbac')
  async deleteRole(@Param('key') key: string) {
    await this.managePermissions.deleteCustomRole(key);
  }

  /** GET /api/rbac/users/:id/permissions - Obtiene los permisos resueltos de un usuario especifico. */
  @Get('users/:id/permissions')
  @Roles(UserRole.ADMIN)
  @RbacGroup('config-rbac')
  async getUserPermissions(@Param('id') id: string) {
    const user = await this.manageUsers.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    return this.managePermissions.getDetailedUserPermissions(
      user.id,
      user.role,
    );
  }

  /** PUT /api/rbac/users/:id/permissions - Modifica los overrides de permisos de un usuario especifico. */
  @Put('users/:id/permissions')
  @Roles(UserRole.ADMIN)
  @RbacGroup('config-rbac')
  async saveUserPermissions(
    @Param('id') id: string,
    @Body()
    body: { permissions: Array<{ groupKey: string; visible: boolean }> },
  ) {
    const user = await this.manageUsers.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    return this.managePermissions.saveUserOverrides(user.id, body.permissions);
  }

  private hashPassword(password: string): string {
    return createHmac('sha256', 'elmio-secret-key')
      .update(password)
      .digest('hex');
  }
}
