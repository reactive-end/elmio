import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ContractFile, ContractWithFiles } from '../domain/enterprise';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';
import { DocumentStorageService } from '../infrastructure/document-storage.service';
import type { ArchivoSubido } from '../../gallery/domain/gallery-image';

/**
 * Gestiona contratos empresariales y sus archivos asociados.
 */
@Injectable()
export class ManageContractsUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
    private readonly documentStorage: DocumentStorageService,
  ) {}

  /**
   * Lista los contratos de una empresa con sus archivos.
   */
  async list(enterpriseId: string): Promise<ContractWithFiles[]> {
    const contracts =
      await this.repository.findContractsByEnterprise(enterpriseId);
    return Promise.all(
      contracts.map(async (contract) => ({
        ...contract,
        files: await this.repository.findContractFilesByContract(contract.id),
      })),
    );
  }

  /**
   * Crea un contrato con uno o varios archivos.
   */
  async create(
    enterpriseId: string,
    name: string,
    files: ArchivoSubido[],
  ): Promise<ContractWithFiles> {
    const enterprise = await this.repository.findEnterpriseById(enterpriseId);
    if (!enterprise) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    const cleanName = name.trim();
    if (!cleanName) {
      throw new BadRequestException('El nombre del contrato es obligatorio.');
    }

    if (files.length === 0) {
      throw new BadRequestException(
        'Debes subir al menos un archivo de contrato.',
      );
    }

    const createdAt = new Date().toISOString();
    const contract = await this.repository.saveContract({
      id: randomUUID(),
      enterpriseId,
      name: cleanName,
      createdAt,
    });

    const savedFiles = await this.saveFiles(
      contract.id,
      enterprise.taxId,
      files,
    );

    return {
      ...contract,
      files: savedFiles,
    };
  }

  /**
   * Actualiza el nombre del contrato y/o agrega nuevos archivos.
   */
  async update(
    contractId: string,
    name?: string,
    files: ArchivoSubido[] = [],
  ): Promise<ContractWithFiles> {
    const contract = await this.repository.findContractById(contractId);
    if (!contract) {
      throw new NotFoundException('Contrato no encontrado.');
    }

    const enterprise = await this.repository.findEnterpriseById(
      contract.enterpriseId,
    );
    if (!enterprise) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    if (typeof name === 'string') {
      const cleanName = name.trim();
      if (!cleanName) {
        throw new BadRequestException('El nombre del contrato es obligatorio.');
      }
      contract.name = cleanName;
      await this.repository.saveContract(contract);
    }

    if (files.length > 0) {
      await this.saveFiles(contract.id, enterprise.taxId, files);
    }

    return {
      ...contract,
      files: await this.repository.findContractFilesByContract(contract.id),
    };
  }

  /**
   * Elimina un contrato completo y sus archivos físicos.
   */
  async remove(contractId: string): Promise<void> {
    const contract = await this.repository.findContractById(contractId);
    if (!contract) {
      throw new NotFoundException('Contrato no encontrado.');
    }

    const enterprise = await this.repository.findEnterpriseById(
      contract.enterpriseId,
    );
    if (!enterprise) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    const files = await this.repository.findContractFilesByContract(
      contract.id,
    );
    for (const file of files) {
      await this.documentStorage.deleteDocument(
        enterprise.taxId,
        file.fileName,
        'contracts',
      );
      await this.repository.deleteContractFile(file.id);
    }

    await this.repository.deleteContract(contract.id);
  }

  /**
   * Elimina un archivo puntual del contrato.
   */
  async removeFile(contractId: string, fileId: string): Promise<void> {
    const contract = await this.repository.findContractById(contractId);
    if (!contract) {
      throw new NotFoundException('Contrato no encontrado.');
    }

    const enterprise = await this.repository.findEnterpriseById(
      contract.enterpriseId,
    );
    if (!enterprise) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    const file = await this.repository.findContractFileById(fileId);
    if (!file || file.contractId !== contract.id) {
      throw new NotFoundException('Archivo de contrato no encontrado.');
    }

    await this.documentStorage.deleteDocument(
      enterprise.taxId,
      file.fileName,
      'contracts',
    );
    await this.repository.deleteContractFile(file.id);
  }

  private async saveFiles(
    contractId: string,
    taxId: string,
    files: ArchivoSubido[],
  ): Promise<ContractFile[]> {
    const createdAt = new Date().toISOString();
    const savedFiles = await Promise.all(
      files.map(async (file) => ({
        id: randomUUID(),
        contractId,
        fileName: await this.documentStorage.save(
          taxId,
          file.originalname,
          file.buffer,
          file.mimetype,
          'contracts',
        ),
        originalName: file.originalname,
        mimeType: file.mimetype,
        createdAt,
      })),
    );

    return this.repository.saveContractFiles(savedFiles);
  }
}
