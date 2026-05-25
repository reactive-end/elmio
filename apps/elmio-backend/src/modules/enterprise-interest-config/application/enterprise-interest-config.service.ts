import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnterpriseEntity } from '../../enterprise/infrastructure/entities/enterprise.entity';
import { EnterpriseInterestConfigEntity } from '../infrastructure/entities/enterprise-interest-config.entity';
import { UpdateEnterpriseInterestConfigDto } from '../presentation/http/dto/enterprise-interest-config.dto';

type EnterpriseInterestConfigItem = {
  enterpriseId: string;
  companyName: string;
  taxId: string;
  sector: string;
  interestType: 'none' | 'percentage' | 'fixed';
  interestRate: number;
  isActive: boolean;
  updatedAt: string | null;
};

/**
 * Servicio de administracion de la tasa global por empresa.
 */
@Injectable()
export class EnterpriseInterestConfigService {
  constructor(
    @InjectRepository(EnterpriseEntity)
    private readonly enterpriseRepository: Repository<EnterpriseEntity>,
    @InjectRepository(EnterpriseInterestConfigEntity)
    private readonly configRepository: Repository<EnterpriseInterestConfigEntity>,
  ) {}

  /**
   * Lista empresas con su configuracion actual de interes.
   */
  async list(): Promise<EnterpriseInterestConfigItem[]> {
    const enterprises = await this.enterpriseRepository.find({
      order: { companyName: 'ASC' },
    });
    const configs = await this.configRepository.find();
    const configsByEnterpriseId = new Map(
      configs.map((config) => [config.enterpriseId, config]),
    );

    return enterprises.map((enterprise) => {
      const config = configsByEnterpriseId.get(enterprise.id);

      return {
        enterpriseId: enterprise.id,
        companyName: enterprise.companyName,
        taxId: enterprise.taxId,
        sector: enterprise.sector ?? '',
        interestType: config?.interestType ?? 'none',
        interestRate: config ? Number(config.interestRate) : 0,
        isActive: config?.isActive ?? false,
        updatedAt: config?.updatedAt ? config.updatedAt.toISOString() : null,
      };
    });
  }

  /**
   * Obtiene la configuracion de interes de una empresa.
   */
  async getByEnterpriseId(
    enterpriseId: string,
  ): Promise<EnterpriseInterestConfigItem> {
    const enterprise = await this.enterpriseRepository.findOne({
      where: { id: enterpriseId },
    });

    if (!enterprise) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    const config = await this.configRepository.findOne({
      where: { enterpriseId },
    });

    return {
      enterpriseId: enterprise.id,
      companyName: enterprise.companyName,
      taxId: enterprise.taxId,
      sector: enterprise.sector ?? '',
      interestType: config?.interestType ?? 'none',
      interestRate: config ? Number(config.interestRate) : 0,
      isActive: config?.isActive ?? false,
      updatedAt: config?.updatedAt ? config.updatedAt.toISOString() : null,
    };
  }

  /**
   * Crea o actualiza la configuracion global de interes de una empresa.
   */
  async upsert(
    enterpriseId: string,
    dto: UpdateEnterpriseInterestConfigDto,
  ): Promise<EnterpriseInterestConfigItem> {
    const enterprise = await this.enterpriseRepository.findOne({
      where: { id: enterpriseId },
    });

    if (!enterprise) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    const existing = await this.configRepository.findOne({
      where: { enterpriseId },
    });

    const config = existing ?? this.configRepository.create({ enterpriseId });
    config.interestType = dto.interestType;
    config.interestRate = dto.interestRate;
    config.isActive = dto.isActive;

    await this.configRepository.save(config);
    return this.getByEnterpriseId(enterpriseId);
  }
}
