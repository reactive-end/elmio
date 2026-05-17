import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Enterprise } from '../domain/enterprise';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';

/**
 * Marca el onboarding de la empresa como completado.
 */
@Injectable()
export class CompleteOnboardingUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
  ) {}

  async execute(enterpriseId: string): Promise<Enterprise> {
    const enterprise = await this.repository.findEnterpriseById(enterpriseId);

    if (!enterprise) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    enterprise.onboardingCompleted = true;

    return this.repository.saveEnterprise(enterprise);
  }
}
