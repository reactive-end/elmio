import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { RolePermissionEntity } from '@/modules/rbac/infrastructure/entities/role-permission.entity';
import { UserPermissionEntity } from '@/modules/rbac/infrastructure/entities/user-permission.entity';
import { CustomRoleEntity } from '@/modules/rbac/infrastructure/entities/custom-role.entity';
import { UserEntity } from '@/modules/auth/infrastructure/entities/user.entity';
import { PersonProfileEntity } from '@/modules/enterprise/infrastructure/entities/person-profile.entity';
import { EnterpriseEntity } from '@/modules/enterprise/infrastructure/entities/enterprise.entity';
import { DbRbacRepositoryService } from '@/modules/rbac/infrastructure/db-rbac-repository.service';
import { RBAC_REPOSITORY_PORT } from '@/modules/rbac/domain/ports/rbac-repository.port';
import { ManagePermissionsUseCase } from '@/modules/rbac/application/manage-permissions.use-case';
import { ManageUsersUseCase } from '@/modules/rbac/application/manage-users.use-case';
import { RbacAdminController } from '@/modules/rbac/presentation/http/rbac-admin.controller';
import { AuthModule } from '@/modules/auth/auth.module';
import { RbacGroupGuard } from './presentation/guards/rbac-group.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RolePermissionEntity,
      UserPermissionEntity,
      CustomRoleEntity,
      UserEntity,
      PersonProfileEntity,
      EnterpriseEntity,
    ]),
    AuthModule,
  ],
  controllers: [RbacAdminController],
  providers: [
    { provide: RBAC_REPOSITORY_PORT, useClass: DbRbacRepositoryService },
    ManagePermissionsUseCase,
    ManageUsersUseCase,
    RbacGroupGuard,
    { provide: APP_GUARD, useClass: RbacGroupGuard },
  ],
  exports: [RBAC_REPOSITORY_PORT, ManagePermissionsUseCase],
})
export class RbacModule {}
