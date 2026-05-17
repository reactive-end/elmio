import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { LoanSummary, Transaction } from '../domain/enterprise';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';

/**
 * Obtiene el estado de cuenta de la empresa basado en los prestamos
 * de sus empleados mas la comision de servicio configurada por Admin.
 */
@Injectable()
export class GetAccountStatementUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
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
    const totalDebt = totalLoanAmount + serviceFeeAmount;
    const totalPaid = transactions
      .filter((t) => t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalDebt - totalPaid;

    return {
      totalLoans,
      totalLoanAmount,
      serviceFeePercent,
      serviceFeeAmount,
      totalDebt,
      totalPaid,
      balance,
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
}
