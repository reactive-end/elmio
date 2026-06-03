import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermissionEntity } from '@/modules/rbac/infrastructure/entities/role-permission.entity';
import { UserEntity } from '@/modules/auth/infrastructure/entities/user.entity';
import { DbRbacRepositoryService } from '@/modules/rbac/infrastructure/db-rbac-repository.service';
import { RBAC_REPOSITORY_PORT } from '@/modules/rbac/domain/ports/rbac-repository.port';
import { ManagePermissionsUseCase } from '@/modules/rbac/application/manage-permissions.use-case';
import { ManageUsersUseCase } from '@/modules/rbac/application/manage-users.use-case';
import { RbacAdminController } from '@/modules/rbac/presentation/http/rbac-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RolePermissionEntity, UserEntity])],
  controllers: [RbacAdminController],
  providers: [
    { provide: RBAC_REPOSITORY_PORT, useClass: DbRbacRepositoryService },
    ManagePermissionsUseCase,
    ManageUsersUseCase,
  ],
  exports: [RBAC_REPOSITORY_PORT],
})
export class RbacModule {}
