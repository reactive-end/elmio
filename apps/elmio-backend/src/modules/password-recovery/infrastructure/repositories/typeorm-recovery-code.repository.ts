import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import type { RecoveryCodeRepositoryPort } from '../../domain/ports/recovery-code-repository.port';
import type { RecoveryCode } from '../../domain/types/recovery-code';
import { RecoveryCodeEntity } from '../entities/recovery-code.entity';

/**
 * Implementacion TypeORM del puerto de repositorio de codigos de recuperacion.
 * Traduce entre la entidad de base de datos y el objeto de dominio.
 */
@Injectable()
export class TypeOrmRecoveryCodeRepository implements RecoveryCodeRepositoryPort {
  constructor(
    @InjectRepository(RecoveryCodeEntity)
    private readonly repo: Repository<RecoveryCodeEntity>,
  ) {}

  /**
   * Persiste un codigo de recuperacion en la base de datos.
   * @param code Codigo de recuperacion de dominio.
   * @returns Codigo de recuperacion guardado mapeado al dominio.
   */
  async save(code: RecoveryCode): Promise<RecoveryCode> {
    const entity = this.repo.create({
      id: code.id,
      userId: code.userId,
      codeHash: code.codeHash,
      expiresAt: code.expiresAt,
      used: code.used,
      createdAt: code.createdAt,
    });

    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  /**
   * Busca un codigo valido (no usado y no expirado) para un usuario dado.
   * @param userId ID del usuario.
   * @param codeHash Hash del codigo ingresado por el usuario.
   * @returns Codigo valido si existe, null si no se encuentra o esta expirado/usado.
   */
  async findValidCode(
    userId: string,
    codeHash: string,
  ): Promise<RecoveryCode | null> {
    const entity = await this.repo.findOne({
      where: {
        userId,
        codeHash,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Marca todos los codigos de un usuario como usados para invalidarlos.
   * @param userId ID del usuario cuyos codigos se invalidaran.
   */
  async invalidateAllForUser(userId: string): Promise<void> {
    await this.repo.update({ userId }, { used: true });
  }

  /**
   * Mapea una entidad TypeORM al objeto de dominio RecoveryCode.
   * @param entity Entidad de base de datos.
   * @returns Objeto de dominio.
   */
  private toDomain(entity: RecoveryCodeEntity): RecoveryCode {
    return {
      id: entity.id,
      userId: entity.userId,
      codeHash: entity.codeHash,
      expiresAt: entity.expiresAt,
      used: entity.used,
      createdAt: entity.createdAt,
    };
  }
}
