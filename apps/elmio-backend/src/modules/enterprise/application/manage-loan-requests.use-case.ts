import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { LoanRequest } from '../domain/enterprise';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';

/**
 * Gestiona la resolucion de solicitudes de prestamo.
 */
@Injectable()
export class ManageLoanRequestsUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
  ) {}

  /**
   * Lista solicitudes de una empresa.
   * @param enterpriseId ID de la empresa.
   * @param status Filtro por estado (opcional).
   * @returns Lista de solicitudes.
   */
  async list(
    enterpriseId: string,
    status?: LoanRequest['status'],
  ): Promise<LoanRequest[]> {
    return this.repository.findRequestsByEnterprise(enterpriseId, status);
  }

  /**
   * Lista solicitudes de un colaborador.
   * @param collaboratorId ID del colaborador.
   * @param status Filtro por estado (opcional).
   * @returns Lista de solicitudes del colaborador.
   */
  async listByCollaborator(
    collaboratorId: string,
    status?: LoanRequest['status'],
  ): Promise<LoanRequest[]> {
    return this.repository.findRequestsByCollaborator(collaboratorId, status);
  }

  /**
   * Aprueba o deniega una solicitud.
   * @param requestId ID de la solicitud.
   * @param decision Aprobada o denegada.
   * @param denialReason Motivo del rechazo (solo para denegadas).
   * @returns Solicitud actualizada.
   */
  async resolve(
    requestId: string,
    decision: 'approved' | 'denied',
    denialReason?: string,
  ): Promise<LoanRequest> {
    const request = await this.repository.findRequestById(requestId);

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada.');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(
        'Solo se pueden resolver solicitudes pendientes.',
      );
    }

    request.status = decision;
    request.denialReason =
      decision === 'denied' ? (denialReason ?? null) : null;
    request.updatedAt = new Date().toISOString();

    return this.repository.saveRequest(request);
  }
}
