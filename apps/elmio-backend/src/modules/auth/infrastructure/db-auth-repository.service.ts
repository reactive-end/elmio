import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import type { User } from '../domain/user';
import type { AuthRepositoryPort } from '../domain/ports/auth-repository.port';
import { UserEntity } from './entities/user.entity';

/**
 * Implementacion en base de datos PostgreSQL del repositorio de autenticacion usando TypeORM.
 */
@Injectable()
export class DbAuthRepositoryService implements AuthRepositoryPort {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private toDomain(entity: UserEntity): User {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      passwordHash: entity.passwordHash,
      role: entity.role,
      owner: entity.owner,
      createdAt: entity.createdAt,
      requirePasswordChange: entity.requirePasswordChange,
    };
  }

  private toPersistence(domain: User): UserEntity {
    const entity = new UserEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.email = domain.email;
    entity.passwordHash = domain.passwordHash;
    entity.role = domain.role;
    entity.owner = domain.owner;
    entity.createdAt = domain.createdAt;
    entity.requirePasswordChange = domain.requirePasswordChange;
    return entity;
  }

  /**
   * Busca un usuario por su email o telefono de forma transparente.
   * Si no contiene '@', realiza busquedas en las tablas de empresas o perfiles de persona
   * para resolver el telefono limpio al email correspondiente en base de datos.
   */
  async findByEmail(email: string): Promise<User | null> {
    let resolvedEmail = email.trim().toLowerCase();

    // Si no contiene '@', asumimos que es un telefono
    if (!resolvedEmail.includes('@')) {
      const cleanInputPhone = resolvedEmail.replace(/\D/g, '');
      if (cleanInputPhone.length > 0) {
        try {
          // Buscamos en empresas usando query directo para evitar acoplamientos circulares de modulo
          const enterprises: Array<{ email: string }> = await this.dataSource.query(
            `SELECT email FROM enterprises WHERE regexp_replace(phone, '\\D', '', 'g') = $1 LIMIT 1`,
            [cleanInputPhone],
          );

          if (enterprises && enterprises.length > 0) {
            resolvedEmail = enterprises[0].email.toLowerCase();
          } else {
            // Buscamos en perfiles de persona (colaboradores/clientes)
            const profiles: Array<{ email: string }> = await this.dataSource.query(
              `SELECT email FROM person_profiles WHERE regexp_replace(phone, '\\D', '', 'g') = $1 LIMIT 1`,
              [cleanInputPhone],
            );
            if (profiles && profiles.length > 0) {
              resolvedEmail = profiles[0].email.toLowerCase();
            }
          }
        } catch {
          // En caso de que las tablas no existan todavia en el primer arranque, ignoramos el fallo silenciosamente
        }
      }
    }

    const userEntity = await this.repo.findOne({ where: { email: resolvedEmail } });
    return userEntity ? this.toDomain(userEntity) : null;
  }

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.repo.findOne({ where: { id } });
    return userEntity ? this.toDomain(userEntity) : null;
  }

  async create(user: User): Promise<User> {
    const entity = this.toPersistence(user);
    await this.repo.save(entity);
    return user;
  }
}
