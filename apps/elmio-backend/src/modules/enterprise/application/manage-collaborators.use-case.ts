import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Collaborator } from '../domain/enterprise';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';

interface CollaboratorInput {
  name: string;
  lastName: string;
  documentId: string;
  email: string;
  phone: string;
  baseSalary: number;
}

/**
 * Gestiona la creacion individual y masiva de colaboradores.
 */
@Injectable()
export class ManageCollaboratorsUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
  ) {}

  /**
   * Crea un colaborador individual.
   * @param enterpriseId ID de la empresa.
   * @param input Datos del colaborador.
   * @returns Colaborador creado.
   */
  async createOne(
    enterpriseId: string,
    input: CollaboratorInput,
  ): Promise<Collaborator> {
    const enterprise = await this.repository.findEnterpriseById(enterpriseId);
    if (!enterprise) throw new NotFoundException('Empresa no encontrada.');

    const collaborator: Collaborator = {
      id: randomUUID(),
      enterpriseId,
      userId: '',
      name: input.name.trim(),
      lastName: input.lastName.trim(),
      documentId: input.documentId.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      baseSalary: input.baseSalary,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    return this.repository.saveCollaborator(collaborator);
  }

  /**
   * Carga masiva de colaboradores.
   * @param enterpriseId ID de la empresa.
   * @param inputs Lista de datos de colaboradores.
   * @returns Colaboradores creados.
   */
  async createBulk(
    enterpriseId: string,
    inputs: CollaboratorInput[],
  ): Promise<Collaborator[]> {
    const enterprise = await this.repository.findEnterpriseById(enterpriseId);
    if (!enterprise) throw new NotFoundException('Empresa no encontrada.');

    const now = new Date().toISOString();
    const collaborators: Collaborator[] = inputs.map((input) => ({
      id: randomUUID(),
      enterpriseId,
      userId: '',
      name: input.name.trim(),
      lastName: input.lastName.trim(),
      documentId: input.documentId.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      baseSalary: input.baseSalary,
      status: 'active' as const,
      createdAt: now,
    }));

    return this.repository.saveCollaborators(collaborators);
  }

  /**
   * Actualiza datos de un colaborador.
   * @param collaboratorId ID del colaborador.
   * @param updates Datos parciales a actualizar.
   * @returns Colaborador actualizado.
   */
  async update(
    collaboratorId: string,
    updates: Partial<CollaboratorInput & { status: Collaborator['status'] }>,
  ): Promise<Collaborator> {
    const collaborator =
      await this.repository.findCollaboratorById(collaboratorId);
    if (!collaborator)
      throw new NotFoundException('Colaborador no encontrado.');

    if (updates.name !== undefined) collaborator.name = updates.name.trim();
    if (updates.lastName !== undefined)
      collaborator.lastName = updates.lastName.trim();
    if (updates.documentId !== undefined)
      collaborator.documentId = updates.documentId.trim();
    if (updates.email !== undefined)
      collaborator.email = updates.email.trim().toLowerCase();
    if (updates.phone !== undefined) collaborator.phone = updates.phone.trim();
    if (updates.baseSalary !== undefined)
      collaborator.baseSalary = updates.baseSalary;
    if (updates.status !== undefined) collaborator.status = updates.status;

    return this.repository.saveCollaborator(collaborator);
  }

  /**
   * Lista los colaboradores de una empresa.
   * @param enterpriseId ID de la empresa.
   * @returns Lista de colaboradores.
   */
  async list(enterpriseId: string): Promise<Collaborator[]> {
    return this.repository.findCollaboratorsByEnterprise(enterpriseId);
  }
}
