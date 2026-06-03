import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not, IsNull } from 'typeorm';
import type { RbacRepositoryPort } from '@/modules/rbac/domain/ports/rbac-repository.port';
import type { RolePermission } from '@/modules/rbac/domain/role-permission';
import { RolePermissionEntity } from '@/modules/rbac/infrastructure/entities/role-permission.entity';
import { UserEntity } from '@/modules/auth/infrastructure/entities/user.entity';

@Injectable()
export class DbRbacRepositoryService implements RbacRepositoryPort {
  constructor(
    @InjectRepository(RolePermissionEntity)
    private readonly permRepo: Repository<RolePermissionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
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
  }): Promise<{ items: UserEntity[]; total: number }> {
    const { role, page, perPage, search, includeInactive } = params;
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = { role };

    if (!includeInactive) {
      where.isActive = true;
    }

    if (search) {
      const [items, total] = await this.userRepo.findAndCount({
        where: [
          { ...where, name: ILike(`%${search}%`) },
          { ...where, email: ILike(`%${search}%`) },
          { ...where, slug: ILike(`%${search}%`) },
          { ...where, phone: ILike(`%${search}%`) },
        ],
        skip,
        take: perPage,
        order: { createdAt: 'DESC' },
      });
      return { items, total };
    }

    const [items, total] = await this.userRepo.findAndCount({
      where: where as Record<string, unknown>,
      skip,
      take: perPage,
      order: { createdAt: 'DESC' },
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

  async updateUser(
    id: string,
    data: Partial<UserEntity>,
  ): Promise<UserEntity> {
    await this.userRepo.update(id, data as Record<string, unknown>);
    const updated = await this.userRepo.findOne({ where: { id } });
    if (!updated) {
      throw new Error('Usuario no encontrado después de actualizar.');
    }
    return updated;
  }

  async deactivateUser(id: string): Promise<void> {
    await this.userRepo.update(id, { isActive: false } as Record<string, unknown>);
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
