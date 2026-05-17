import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DomiciliationData, Enterprise } from '../domain/enterprise';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';

interface SaveDomiciliationInput {
  bank: string;
  accountType: 'checking' | 'savings';
  accountNumber: string;
  holderName: string;
  holderId: string;
  debitAuthorized: boolean;
}

/**
 * Guarda los datos de domiciliacion bancaria de la empresa.
 */
@Injectable()
export class SaveDomiciliationUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
  ) {}

  async execute(
    enterpriseId: string,
    input: SaveDomiciliationInput,
  ): Promise<Enterprise> {
    const enterprise = await this.repository.findEnterpriseById(enterpriseId);

    if (!enterprise) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    if (!input.debitAuthorized) {
      throw new BadRequestException('Debe autorizar el debito inmediato.');
    }

    const domiciliation: DomiciliationData = {
      bank: input.bank.trim(),
      accountType: input.accountType,
      accountNumber: input.accountNumber.trim(),
      holderName: input.holderName.trim(),
      holderId: input.holderId.trim(),
      debitAuthorized: true,
      authorizationDate: new Date().toISOString(),
    };

    enterprise.domiciliation = domiciliation;

    return this.repository.saveEnterprise(enterprise);
  }
}
