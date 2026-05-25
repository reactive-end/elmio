import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeyCipher } from '../../payment-processor/infrastructure/persistence/api-key-cipher.util';
import { IntegrationApiKeyEntity } from '../infrastructure/entities/integration-api-key.entity';
import {
  CreateIntegrationApiKeyDto,
  UpdateIntegrationApiKeyDto,
} from '../presentation/http/dto/integration-api-key.dto';

type IntegrationApiKeyListItem = {
  id: string;
  bank: string;
  integration: string;
  environment: string | null;
  name: string;
  maskedValue: string;
  isActive: boolean;
  lastRotatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Servicio de administracion de API keys por banco e integracion.
 */
@Injectable()
export class IntegrationApiKeysService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(IntegrationApiKeyEntity)
    private readonly repository: Repository<IntegrationApiKeyEntity>,
  ) {}

  /**
   * Lista las API keys registradas sin exponer el valor real.
   */
  async list(): Promise<IntegrationApiKeyListItem[]> {
    const entities = await this.repository.find({
      order: {
        bank: 'ASC',
        integration: 'ASC',
        updatedAt: 'DESC',
      },
    });

    return entities.map((entity) => this.toListItem(entity));
  }

  /**
   * Crea una nueva API key cifrada.
   */
  async create(
    dto: CreateIntegrationApiKeyDto,
  ): Promise<IntegrationApiKeyListItem> {
    const bank = this.normalizeKeyPart(dto.bank);

    const entity = this.repository.create({
      bank,
      integration: this.resolveIntegrationForBank(bank),
      environment: this.normalizeOptionalKeyPart(dto.environment),
      name: dto.name.trim(),
      encryptedValue: ApiKeyCipher.encrypt(dto.value.trim()),
      isActive: dto.isActive ?? true,
      lastRotatedAt: new Date(),
    });

    if (entity.isActive) {
      await this.deactivateSiblings(
        entity.bank,
        entity.integration,
        entity.environment,
      );
    }

    const saved = await this.repository.save(entity);
    return this.toListItem(saved);
  }

  /**
   * Actualiza metadata o rota el valor cifrado de una API key.
   */
  async update(
    id: string,
    dto: UpdateIntegrationApiKeyDto,
  ): Promise<IntegrationApiKeyListItem> {
    const entity = await this.getEntity(id);

    entity.bank = dto.bank ? this.normalizeKeyPart(dto.bank) : entity.bank;
    entity.integration = this.resolveIntegrationForBank(entity.bank);
    entity.environment =
      dto.environment !== undefined
        ? this.normalizeOptionalKeyPart(dto.environment)
        : entity.environment;
    entity.name = dto.name ? dto.name.trim() : entity.name;

    if (dto.value !== undefined) {
      entity.encryptedValue = ApiKeyCipher.encrypt(dto.value.trim());
      entity.lastRotatedAt = new Date();
    }

    if (dto.isActive !== undefined) {
      entity.isActive = dto.isActive;
    }

    if (entity.isActive) {
      await this.deactivateSiblings(
        entity.bank,
        entity.integration,
        entity.environment,
        entity.id,
      );
    }

    const saved = await this.repository.save(entity);
    return this.toListItem(saved);
  }

  /**
   * Activa o desactiva una API key.
   */
  async toggleActive(
    id: string,
    isActive: boolean,
  ): Promise<IntegrationApiKeyListItem> {
    const entity = await this.getEntity(id);
    entity.isActive = isActive;

    if (isActive) {
      await this.deactivateSiblings(
        entity.bank,
        entity.integration,
        entity.environment,
        entity.id,
      );
    }

    const saved = await this.repository.save(entity);
    return this.toListItem(saved);
  }

  /**
   * Revela el valor real de una API key si la clave de revelado coincide.
   */
  async reveal(id: string, revealKey: string): Promise<{ value: string }> {
    const configuredRevealKey = this.configService
      .get<string>('INTEGRATION_API_KEYS_REVEAL_KEY', '')
      .trim();

    if (!configuredRevealKey) {
      throw new InternalServerErrorException(
        'No existe INTEGRATION_API_KEYS_REVEAL_KEY configurada.',
      );
    }

    if (configuredRevealKey !== revealKey.trim()) {
      throw new ForbiddenException('La clave de revelado es inválida.');
    }

    const entity = await this.getEntity(id);
    return { value: ApiKeyCipher.decryptIfEncrypted(entity.encryptedValue) };
  }

  /**
   * Obtiene la API key activa descifrada para un banco e integracion.
   */
  async getActivePlainValue(
    bank: string,
    integration: string,
    environment?: string | null,
  ): Promise<string | null> {
    const normalizedBank = this.normalizeKeyPart(bank);
    const normalizedIntegration = this.normalizeKeyPart(integration);
    const normalizedEnvironment = this.normalizeOptionalKeyPart(environment);

    const where = normalizedEnvironment
      ? {
          bank: normalizedBank,
          integration: normalizedIntegration,
          environment: normalizedEnvironment,
          isActive: true,
        }
      : {
          bank: normalizedBank,
          integration: normalizedIntegration,
          isActive: true,
        };

    const entity = await this.repository.findOne({
      where,
      order: {
        lastRotatedAt: 'DESC',
        updatedAt: 'DESC',
      },
    });

    if (!entity) {
      return null;
    }

    return ApiKeyCipher.decryptIfEncrypted(entity.encryptedValue);
  }

  private async getEntity(id: string): Promise<IntegrationApiKeyEntity> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('API key de integración no encontrada.');
    }

    return entity;
  }

  private async deactivateSiblings(
    bank: string,
    integration: string,
    environment: string | null,
    excludeId?: string,
  ): Promise<void> {
    const where = environment
      ? {
          bank,
          integration,
          environment,
          isActive: true,
        }
      : {
          bank,
          integration,
          isActive: true,
        };

    const siblings = await this.repository.find({
      where,
    });

    const entitiesToUpdate = siblings.filter(
      (entity) => entity.id !== excludeId,
    );
    if (entitiesToUpdate.length === 0) {
      return;
    }

    entitiesToUpdate.forEach((entity) => {
      entity.isActive = false;
    });

    await this.repository.save(entitiesToUpdate);
  }

  private normalizeKeyPart(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizeOptionalKeyPart(value?: string | null): string | null {
    if (!value || !value.trim()) {
      return null;
    }

    return this.normalizeKeyPart(value);
  }

  private resolveIntegrationForBank(bank: string): string {
    if (bank === 'mercantil') {
      return 'ally-api';
    }

    return 'default';
  }

  private toListItem(
    entity: IntegrationApiKeyEntity,
  ): IntegrationApiKeyListItem {
    const decryptedValue = ApiKeyCipher.decryptIfEncrypted(
      entity.encryptedValue,
    );

    return {
      id: entity.id,
      bank: entity.bank,
      integration: entity.integration,
      environment: entity.environment,
      name: entity.name,
      maskedValue: this.maskValue(decryptedValue),
      isActive: entity.isActive,
      lastRotatedAt: entity.lastRotatedAt
        ? entity.lastRotatedAt.toISOString()
        : null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private maskValue(value: string): string {
    const visibleSuffix = value.slice(-4);
    return `****${visibleSuffix}`;
  }
}
