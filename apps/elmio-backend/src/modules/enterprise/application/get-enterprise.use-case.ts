import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Enterprise } from '../domain/enterprise';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';

/**
 * Obtiene o crea la empresa del usuario autenticado.
 */
@Injectable()
export class GetOrCreateEnterpriseUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
  ) {}

  async execute(
    userId: string,
    companyName: string,
    taxId: string,
  ): Promise<Enterprise> {
    const existing = await this.repository.findEnterpriseByUserId(userId);
    if (existing) return existing;

    const enterprise: Enterprise = {
      id: randomUUID(),
      userId,
      companyName: companyName.trim(),
      sector: '',
      employeeCount: 0,
      phone: '',
      email: '',
      taxId: taxId.trim(),
      website: '',
      socialMedia: null,
      headquartersLocation: '',
      taxIdPhoto: '',
      constitutiveActPhoto: '',
      lastAssemblyPhoto: '',
      serviceReceiptPhoto: '',
      bankStatementsPhotos: [],
      bankReferencePhotos: [],
      legalRepDocumentId: '',
      legalRepDocumentPhoto: '',
      accountManagerDocumentId: '',
      accountManagerDocumentPhoto: '',
      shareholderCount: 0,
      shareholders: [],
      bankAccounts: [],
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    };

    return this.repository.saveEnterprise(enterprise);
  }
}

/**
 * Obtiene la empresa del usuario autenticado.
 */
@Injectable()
export class GetEnterpriseUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
  ) {}

  async execute(userId: string): Promise<Enterprise | null> {
    return this.repository.findEnterpriseByUserId(userId);
  }
}
