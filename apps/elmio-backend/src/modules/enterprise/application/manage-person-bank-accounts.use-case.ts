import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PersonBankAccount } from '../domain/person-bank-account';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';

/**
 * DTO para crear/actualizar una cuenta bancaria de persona.
 */
export interface CreatePersonBankAccountDto {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  phoneNumber: string;
  documentId: string;
  documentPhoto?: string | null;
  isPrimary?: boolean;
}

/**
 * Gestiona las cuentas bancarias de personas naturales y colaboradores.
 */
@Injectable()
export class ManagePersonBankAccountsUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
  ) {}

  /**
   * Lista las cuentas bancarias de un perfil.
   * @param personProfileId ID del perfil de persona.
   * @returns Lista de cuentas bancarias.
   */
  async listByPersonProfile(
    personProfileId: string,
  ): Promise<PersonBankAccount[]> {
    return this.repository.findBankAccountsByPersonProfileId(personProfileId);
  }

  /**
   * Crea una nueva cuenta bancaria para un perfil.
   * @param personProfileId ID del perfil.
   * @param dto Datos de la cuenta.
   * @returns Cuenta creada.
   */
  async create(
    personProfileId: string,
    dto: CreatePersonBankAccountDto,
  ): Promise<PersonBankAccount> {
    const existingAccounts =
      await this.repository.findBankAccountsByPersonProfileId(personProfileId);

    // Si es la primera cuenta, forzar como primaria
    const isPrimary =
      existingAccounts.length === 0 ? true : (dto.isPrimary ?? false);

    // Si la nueva cuenta es primaria, desmarcar las demás
    if (isPrimary) {
      for (const acc of existingAccounts) {
        if (acc.isPrimary) {
          acc.isPrimary = false;
          await this.repository.saveBankAccount(acc);
        }
      }
    }

    const newAccount: PersonBankAccount = {
      id: randomUUID(),
      personProfileId,
      bankCode: dto.bankCode,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      phoneNumber: dto.phoneNumber,
      documentId: dto.documentId,
      documentPhoto: dto.documentPhoto ?? null,
      isPrimary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.repository.saveBankAccount(newAccount);
  }

  /**
   * Actualiza una cuenta bancaria existente.
   * @param accountId ID de la cuenta.
   * @param personProfileId ID del perfil (para validar propiedad).
   * @param dto Datos a actualizar.
   * @returns Cuenta actualizada.
   */
  async update(
    accountId: string,
    personProfileId: string,
    dto: Partial<CreatePersonBankAccountDto>,
  ): Promise<PersonBankAccount> {
    const account = await this.repository.findBankAccountById(accountId);
    if (!account || account.personProfileId !== personProfileId) {
      throw new NotFoundException('Cuenta bancaria no encontrada.');
    }

    if (dto.bankCode !== undefined) account.bankCode = dto.bankCode;
    if (dto.bankName !== undefined) account.bankName = dto.bankName;
    if (dto.accountNumber !== undefined)
      account.accountNumber = dto.accountNumber;
    if (dto.phoneNumber !== undefined) account.phoneNumber = dto.phoneNumber;
    if (dto.documentId !== undefined) account.documentId = dto.documentId;
    if (dto.documentPhoto !== undefined)
      account.documentPhoto = dto.documentPhoto ?? null;

    // Manejar cambio de cuenta primaria
    if (dto.isPrimary === true && !account.isPrimary) {
      const existingAccounts =
        await this.repository.findBankAccountsByPersonProfileId(
          personProfileId,
        );
      for (const acc of existingAccounts) {
        if (acc.id !== accountId && acc.isPrimary) {
          acc.isPrimary = false;
          await this.repository.saveBankAccount(acc);
        }
      }
      account.isPrimary = true;
    }

    account.updatedAt = new Date().toISOString();
    return this.repository.saveBankAccount(account);
  }

  /**
   * Elimina una cuenta bancaria.
   * @param accountId ID de la cuenta.
   * @param personProfileId ID del perfil (para validar propiedad).
   */
  async delete(accountId: string, personProfileId: string): Promise<void> {
    const account = await this.repository.findBankAccountById(accountId);
    if (!account || account.personProfileId !== personProfileId) {
      throw new NotFoundException('Cuenta bancaria no encontrada.');
    }

    await this.repository.deleteBankAccount(accountId);
  }
}
