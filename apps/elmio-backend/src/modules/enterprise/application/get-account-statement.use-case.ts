import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { LoanSummary, Transaction } from '../domain/enterprise';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';
import { EnterpriseInterestConfigEntity } from '../../enterprise-interest-config/infrastructure/entities/enterprise-interest-config.entity';

/**
 * Obtiene el estado de cuenta de la empresa basado en los prestamos
 * de sus empleados mas la comision de servicio configurada por Admin.
 */
@Injectable()
export class GetAccountStatementUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
    @InjectRepository(EnterpriseInterestConfigEntity)
    private readonly interestConfigRepo: Repository<EnterpriseInterestConfigEntity>,
  ) {}

  /**
   * Calcula el resumen de deuda de la empresa.
   * @param enterpriseId ID de la empresa.
   * @returns Resumen con totales, comision y saldo.
   */
  async getLoanSummary(enterpriseId: string): Promise<LoanSummary> {
    const enterprise = await this.repository.findEnterpriseById(enterpriseId);
    if (!enterprise) throw new NotFoundException('Empresa no encontrada.');

    const requests = await this.repository.findRequestsByEnterprise(
      enterpriseId,
      'approved',
    );
    const transactions =
      await this.repository.findTransactionsByEnterprise(enterpriseId);
    const config = await this.repository.getPlatformConfig();

    const totalLoans = requests.length;
    const totalLoanAmount = requests.reduce((sum, r) => sum + r.amount, 0);
    const serviceFeePercent = config.serviceFeePercent;
    const serviceFeeAmount =
      Math.round(totalLoanAmount * (serviceFeePercent / 100) * 100) / 100;
    const totalCharges = transactions
      .filter(
        (t) => (t.kind ?? 'payment') === 'charge' && t.status !== 'failed',
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebt = totalLoanAmount + serviceFeeAmount + totalCharges;
    const totalPaid = transactions
      .filter((t) => t.status === 'paid' && (t.kind ?? 'payment') === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalDebt - totalPaid;

    const interestConfig = await this.interestConfigRepo.findOne({
      where: { enterpriseId },
    });

    return {
      totalLoans,
      totalLoanAmount,
      serviceFeePercent,
      serviceFeeAmount,
      totalDebt,
      totalPaid,
      balance,
      interestType: interestConfig?.interestType ?? 'none',
      interestRate: interestConfig ? Number(interestConfig.interestRate) : 0,
      interestIsActive: interestConfig?.isActive ?? false,
    };
  }

  /**
   * Lista las transacciones de la empresa.
   * @param enterpriseId ID de la empresa.
   * @returns Lista de transacciones.
   */
  async getTransactions(enterpriseId: string): Promise<Transaction[]> {
    return this.repository.findTransactionsByEnterprise(enterpriseId);
  }

  /**
   * Calcula el resumen de deuda de un colaborador.
   * @param collaboratorId ID del colaborador.
   * @returns Resumen con totales, comision y saldo del colaborador.
   */
  async getCollaboratorSummary(collaboratorId: string): Promise<LoanSummary> {
    const collaborator =
      await this.repository.findCollaboratorById(collaboratorId);
    if (!collaborator)
      throw new NotFoundException('Colaborador no encontrado.');

    const requests = await this.repository.findRequestsByCollaborator(
      collaboratorId,
      'approved',
    );
    const transactions =
      await this.repository.findTransactionsByCollaborator(collaboratorId);
    const config = await this.repository.getPlatformConfig();

    const totalLoans = requests.length;
    const totalLoanAmount = requests.reduce((sum, r) => sum + r.amount, 0);
    const serviceFeePercent = config.serviceFeePercent;
    const serviceFeeAmount =
      Math.round(totalLoanAmount * (serviceFeePercent / 100) * 100) / 100;
    const totalCharges = transactions
      .filter(
        (t) => (t.kind ?? 'payment') === 'charge' && t.status !== 'failed',
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebt = totalLoanAmount + serviceFeeAmount + totalCharges;
    const totalPaid = transactions
      .filter((t) => t.status === 'paid' && (t.kind ?? 'payment') === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalDebt - totalPaid;

    const interestConfig = collaborator.enterpriseId
      ? await this.interestConfigRepo.findOne({
          where: { enterpriseId: collaborator.enterpriseId },
        })
      : null;

    return {
      totalLoans,
      totalLoanAmount,
      serviceFeePercent,
      serviceFeeAmount,
      totalDebt,
      totalPaid,
      balance,
      interestType: interestConfig?.interestType ?? 'none',
      interestRate: interestConfig ? Number(interestConfig.interestRate) : 0,
      interestIsActive: interestConfig?.isActive ?? false,
    };
  }

  /**
   * Lista las transacciones de un colaborador.
   * @param collaboratorId ID del colaborador.
   * @returns Lista de movimientos del colaborador.
   */
  async getCollaboratorTransactions(
    collaboratorId: string,
  ): Promise<Transaction[]> {
    return this.repository.findTransactionsByCollaborator(collaboratorId);
  }
}
