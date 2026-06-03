import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Transaction } from '../domain/enterprise';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';

interface CreateTransactionInput {
  collaboratorId?: string | null;
  kind?: 'payment' | 'charge';
  concept: string;
  amount: number;
  status?: 'paid' | 'pending' | 'failed';
  date?: string;
  productId?: string | null;
}

/**
 * Registra un movimiento manual en el estado de cuenta de una empresa.
 */
@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
  ) {}

  /**
   * Crea una transaccion para la empresa indicada.
   * @param enterpriseId ID de la empresa (puede ser null para administradores o personas naturales directas).
   * @param input Datos del movimiento a registrar.
   * @returns Transaccion persistida.
   */
  async execute(
    enterpriseId: string | null,
    input: CreateTransactionInput,
  ): Promise<Transaction> {
    if (enterpriseId) {
      const enterprise = await this.repository.findEnterpriseById(enterpriseId);
      if (!enterprise) {
        throw new NotFoundException('Empresa no encontrada.');
      }
    }

    const concept = input.concept.trim();
    if (!concept) {
      throw new BadRequestException('El concepto es obligatorio.');
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero.');
    }

    let collaboratorId: string | null = null;
    let collaboratorName = '';
    if (input.collaboratorId) {
      const collaborator = await this.repository.findCollaboratorById(
        input.collaboratorId,
      );
      if (!collaborator || (enterpriseId && collaborator.enterpriseId !== enterpriseId)) {
        throw new BadRequestException(
          'El colaborador indicado no pertenece a la empresa especificada.',
        );
      }
      collaboratorId = collaborator.id;
      collaboratorName = `${collaborator.name} ${collaborator.lastName}`.trim();
    }

    const transactionId = randomUUID();
    const isMarketplacePurchase = collaboratorId && input.kind === 'charge' && concept.startsWith('Compra marketplace:');

    const savedTx = await this.repository.saveTransaction({
      id: transactionId,
      enterpriseId,
      collaboratorId,
      kind: input.kind ?? 'payment',
      concept,
      amount: Math.round(input.amount * 100) / 100,
      status: input.status ?? 'pending',
      date: input.date ?? new Date().toISOString(),
    });

    if (isMarketplacePurchase && collaboratorId && enterpriseId) {
      try {
        await this.repository.saveRequest({
          id: transactionId,
          enterpriseId,
          collaboratorId,
          collaboratorName,
          type: 'loan',
          amount: Math.round(input.amount * 100) / 100,
          description: concept,
          status: 'pending',
          denialReason: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          productId: input.productId ?? null,
        });
      } catch (err) {
        // Ignorar o loggear si falla la creación de la solicitud asociada para no romper la compra
      }
    }

    return savedTx;
  }
}
