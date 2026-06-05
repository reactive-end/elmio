import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import type { RbacRepositoryPort } from '@/modules/rbac/domain/ports/rbac-repository.port';
import type { RolePermission } from '@/modules/rbac/domain/role-permission';
import type { UserPermission } from '@/modules/rbac/domain/user-permission';
import { RolePermissionEntity } from '@/modules/rbac/infrastructure/entities/role-permission.entity';
import { UserPermissionEntity } from '@/modules/rbac/infrastructure/entities/user-permission.entity';
import { CustomRoleEntity } from '@/modules/rbac/infrastructure/entities/custom-role.entity';
import { UserEntity } from '@/modules/auth/infrastructure/entities/user.entity';
import { PersonProfileEntity } from '@/modules/enterprise/infrastructure/entities/person-profile.entity';
import { EnterpriseEntity } from '@/modules/enterprise/infrastructure/entities/enterprise.entity';

export interface EnrichedUser extends UserEntity {
  profilePhone?: string | null;
  enterprisePhone?: string | null;
}

@Injectable()
export class DbRbacRepositoryService implements RbacRepositoryPort {
  constructor(
    @InjectRepository(RolePermissionEntity)
    private readonly permRepo: Repository<RolePermissionEntity>,
    @InjectRepository(UserPermissionEntity)
    private readonly userPermRepo: Repository<UserPermissionEntity>,
    @InjectRepository(CustomRoleEntity)
    private readonly customRoleRepo: Repository<CustomRoleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(PersonProfileEntity)
    private readonly profileRepo: Repository<PersonProfileEntity>,
    @InjectRepository(EnterpriseEntity)
    private readonly enterpriseRepo: Repository<EnterpriseEntity>,
  ) {}

  async findAllPermissions(): Promise<RolePermission[]> {
    const entities = await this.permRepo.find();
    return entities.map((e) => this.permToDomain(e));
  }

  async savePermission(permission: RolePermission): Promise<RolePermission> {
    const existing = await this.permRepo.findOne({
      where: { role: permission.role, groupKey: permission.groupKey },
    });

    if (existing) {
      existing.visible = permission.visible;
      const saved = await this.permRepo.save(existing);
      return this.permToDomain(saved);
    }

    const entity = new RolePermissionEntity();
    entity.role = permission.role;
    entity.groupKey = permission.groupKey;
    entity.visible = permission.visible;
    const saved = await this.permRepo.save(entity);
    return this.permToDomain(saved);
  }

  async savePermissions(
    role: string,
    permissions: Array<{ groupKey: string; visible: boolean }>,
  ): Promise<RolePermission[]> {
    const results: RolePermission[] = [];
    for (const perm of permissions) {
      const saved = await this.savePermission({
        id: '',
        role,
        groupKey: perm.groupKey,
        visible: perm.visible,
      });
      results.push(saved);
    }
    return results;
  }

  async listUsersByRole(params: {
    role: string;
    page: number;
    perPage: number;
    search?: string;
    includeInactive?: boolean;
  }): Promise<{ items: EnrichedUser[]; total: number }> {
    const { role, page, perPage, search, includeInactive } = params;
    const skip = (page - 1) * perPage;

    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndMapOne(
        'user.profile',
        PersonProfileEntity,
        'profile',
        'profile.userId = user.id',
      )
      .leftJoinAndMapOne(
        'user.enterprise',
        EnterpriseEntity,
        'enterprise',
        'enterprise.userId = user.id',
      )
      .where('user.role = :role', { role });

    if (!includeInactive) {
      qb.andWhere('user.isActive = :isActive', { isActive: true });
    }

    if (search) {
      qb.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.slug ILIKE :search OR user.phone ILIKE :search OR profile.phone ILIKE :search OR enterprise.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('user.createdAt', 'DESC').skip(skip).take(perPage);

    const [rawItems, total] = await qb.getManyAndCount();

    const items = rawItems.map((user) => {
      const raw = user as unknown as Record<string, unknown>;
      const profile = raw.profile as PersonProfileEntity | undefined;
      const enterprise = raw.enterprise as EnterpriseEntity | undefined;
      return {
        ...user,
        profilePhone: profile?.phone ?? null,
        enterprisePhone: enterprise?.phone ?? null,
      };
    });

    return { items, total };
  }

  async findUserById(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async createUser(data: Partial<UserEntity>): Promise<UserEntity> {
    const entity = this.userRepo.create(data);
    return this.userRepo.save(entity);
  }

  async updateUser(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    await this.userRepo.update(id, data);
    const updated = await this.userRepo.findOne({ where: { id } });
    if (!updated) {
      throw new Error('Usuario no encontrado después de actualizar.');
    }
    return updated;
  }

  async deactivateUser(id: string): Promise<void> {
    await this.userRepo.update(id, { isActive: false });
  }

  async findUserPermissions(userId: string): Promise<UserPermission[]> {
    const entities = await this.userPermRepo.find({ where: { userId } });
    return entities.map((e) => ({
      id: e.id,
      userId: e.userId,
      groupKey: e.groupKey,
      visible: e.visible,
    }));
  }

  async saveUserPermissions(
    userId: string,
    permissions: Array<{ groupKey: string; visible: boolean }>,
  ): Promise<UserPermission[]> {
    return this.userPermRepo.manager.transaction(async (manager) => {
      await manager.delete(UserPermissionEntity, { userId });

      const entities = permissions.map((p) => {
        const entity = new UserPermissionEntity();
        entity.userId = userId;
        entity.groupKey = p.groupKey;
        entity.visible = p.visible;
        return entity;
      });

      const saved = await manager.save(UserPermissionEntity, entities);
      return saved.map((e) => ({
        id: e.id,
        userId: e.userId,
        groupKey: e.groupKey,
        visible: e.visible,
      }));
    });
  }

  async findCustomRoles(): Promise<Array<{ key: string; name: string }>> {
    const entities = await this.customRoleRepo.find({ order: { name: 'ASC' } });
    return entities.map((e) => ({
      key: e.key,
      name: e.name,
    }));
  }

  async createCustomRole(
    key: string,
    name: string,
  ): Promise<{ key: string; name: string }> {
    const entity = new CustomRoleEntity();
    entity.key = key;
    entity.name = name;
    const saved = await this.customRoleRepo.save(entity);
    return {
      key: saved.key,
      name: saved.name,
    };
  }

  async deleteCustomRole(key: string): Promise<void> {
    await this.customRoleRepo.delete(key);
  }

  private permToDomain(entity: RolePermissionEntity): RolePermission {
    return {
      id: entity.id,
      role: entity.role,
      groupKey: entity.groupKey,
      visible: entity.visible,
    };
  }
}
