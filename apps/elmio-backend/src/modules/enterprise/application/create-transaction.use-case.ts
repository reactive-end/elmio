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
   * @param enterpriseId ID de la empresa.
   * @param input Datos del movimiento a registrar.
   * @returns Transaccion persistida.
   */
  async execute(
    enterpriseId: string,
    input: CreateTransactionInput,
  ): Promise<Transaction> {
    const enterprise = await this.repository.findEnterpriseById(enterpriseId);
    if (!enterprise) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    const concept = input.concept.trim();
    if (!concept) {
      throw new BadRequestException('El concepto es obligatorio.');
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero.');
    }

    let collaboratorId: string | null = null;
    if (input.collaboratorId) {
      const collaborator = await this.repository.findCollaboratorById(
        input.collaboratorId,
      );
      if (!collaborator || collaborator.enterpriseId !== enterpriseId) {
        throw new BadRequestException(
          'El colaborador indicado no pertenece a la empresa.',
        );
      }
      collaboratorId = collaborator.id;
    }

    return this.repository.saveTransaction({
      id: randomUUID(),
      enterpriseId,
      collaboratorId,
      kind: input.kind ?? 'payment',
      concept,
      amount: Math.round(input.amount * 100) / 100,
      status: input.status ?? 'pending',
      date: new Date().toISOString(),
    });
  }
}
