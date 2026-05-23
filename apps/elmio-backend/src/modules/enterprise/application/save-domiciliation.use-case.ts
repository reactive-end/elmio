import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  Enterprise,
  SocialMediaLinks,
  Shareholder,
  BankAccount,
} from '../domain/enterprise';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';

/**
 * Input parcial para actualizar datos de la empresa.
 */
interface UpdateEnterpriseInput {
  companyName?: string;
  sector?: string;
  employeeCount?: number;
  phone?: string;
  email?: string;
  taxId?: string;
  website?: string;
  socialMedia?: SocialMediaLinks;
  headquartersLocation?: string;
  taxIdPhoto?: string;
  constitutiveActPhoto?: string;
  lastAssemblyPhoto?: string;
  serviceReceiptPhoto?: string;
  bankStatementsPhotos?: string[];
  bankReferencePhotos?: string[];
  legalRepDocumentId?: string;
  legalRepDocumentPhoto?: string;
  accountManagerDocumentId?: string;
  accountManagerDocumentPhoto?: string;
  shareholderCount?: number;
  shareholders?: Shareholder[];
  bankAccounts?: BankAccount[];
}

/**
 * Actualiza datos parciales de la empresa (documentos, accionistas, cuentas, etc.).
 */
@Injectable()
export class UpdateEnterpriseUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
  ) {}

  async execute(
    enterpriseId: string,
    input: UpdateEnterpriseInput,
  ): Promise<Enterprise> {
    const enterprise = await this.repository.findEnterpriseById(enterpriseId);

    if (!enterprise) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    // Merge only provided fields
    if (input.companyName !== undefined)
      enterprise.companyName = input.companyName;
    if (input.sector !== undefined) enterprise.sector = input.sector;
    if (input.employeeCount !== undefined)
      enterprise.employeeCount = input.employeeCount;
    if (input.phone !== undefined) enterprise.phone = input.phone;
    if (input.email !== undefined) enterprise.email = input.email;
    if (input.taxId !== undefined) enterprise.taxId = input.taxId;
    if (input.website !== undefined) enterprise.website = input.website;
    if (input.socialMedia !== undefined)
      enterprise.socialMedia = input.socialMedia;
    if (input.headquartersLocation !== undefined)
      enterprise.headquartersLocation = input.headquartersLocation;
    if (input.taxIdPhoto !== undefined)
      enterprise.taxIdPhoto = input.taxIdPhoto;
    if (input.constitutiveActPhoto !== undefined)
      enterprise.constitutiveActPhoto = input.constitutiveActPhoto;
    if (input.lastAssemblyPhoto !== undefined)
      enterprise.lastAssemblyPhoto = input.lastAssemblyPhoto;
    if (input.serviceReceiptPhoto !== undefined)
      enterprise.serviceReceiptPhoto = input.serviceReceiptPhoto;
    if (input.bankStatementsPhotos !== undefined)
      enterprise.bankStatementsPhotos = input.bankStatementsPhotos;
    if (input.bankReferencePhotos !== undefined)
      enterprise.bankReferencePhotos = input.bankReferencePhotos;
    if (input.legalRepDocumentId !== undefined)
      enterprise.legalRepDocumentId = input.legalRepDocumentId;
    if (input.legalRepDocumentPhoto !== undefined)
      enterprise.legalRepDocumentPhoto = input.legalRepDocumentPhoto;
    if (input.accountManagerDocumentId !== undefined)
      enterprise.accountManagerDocumentId = input.accountManagerDocumentId;
    if (input.accountManagerDocumentPhoto !== undefined)
      enterprise.accountManagerDocumentPhoto =
        input.accountManagerDocumentPhoto;
    if (input.shareholderCount !== undefined)
      enterprise.shareholderCount = input.shareholderCount;
    if (input.shareholders !== undefined)
      enterprise.shareholders = input.shareholders;
    if (input.bankAccounts !== undefined)
      enterprise.bankAccounts = input.bankAccounts;

    return this.repository.saveEnterprise(enterprise);
  }
}
