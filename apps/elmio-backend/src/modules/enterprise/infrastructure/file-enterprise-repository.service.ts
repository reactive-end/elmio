import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type {
  Enterprise,
  LoanRequest,
  Transaction,
  PlatformConfig,
  Contract,
  ContractFile,
} from '../domain/enterprise';
import type { PersonProfile } from '../domain/person-profile';
import type { EnterpriseRepositoryPort } from '../domain/ports/enterprise-repository.port';

interface StorageData {
  enterprises: Enterprise[];
  collaborators: PersonProfile[];
  requests: LoanRequest[];
  transactions: Transaction[];
  contracts: Contract[];
  contractFiles: ContractFile[];
  platformConfig: PlatformConfig;
}

const DEFAULT_CONFIG: PlatformConfig = { serviceFeePercent: 5 };

/**
 * Implementacion local del repositorio empresarial usando archivos JSON.
 */
@Injectable()
export class FileEnterpriseRepositoryService implements EnterpriseRepositoryPort {
  private readonly storageRoot = resolve(
    process.cwd(),
    'storage',
    'enterprise',
  );
  private readonly fileName = 'enterprise.metadata.json';

  private getFilePath(): string {
    return join(this.storageRoot, this.fileName);
  }

  private async ensureDir(): Promise<void> {
    await mkdir(this.storageRoot, { recursive: true });
  }

  private async read(): Promise<StorageData> {
    await this.ensureDir();
    try {
      const raw = await readFile(this.getFilePath(), 'utf8');
      const parsed = JSON.parse(raw) as Partial<StorageData>;
      return {
        enterprises: parsed.enterprises ?? [],
        collaborators: parsed.collaborators ?? [],
        requests: parsed.requests ?? [],
        transactions: parsed.transactions ?? [],
        contracts: parsed.contracts ?? [],
        contractFiles: parsed.contractFiles ?? [],
        platformConfig: parsed.platformConfig ?? { ...DEFAULT_CONFIG },
      };
    } catch {
      return {
        enterprises: [],
        collaborators: [],
        requests: [],
        transactions: [],
        contracts: [],
        contractFiles: [],
        platformConfig: { ...DEFAULT_CONFIG },
      };
    }
  }

  private async write(data: StorageData): Promise<void> {
    await this.ensureDir();
    await writeFile(this.getFilePath(), JSON.stringify(data, null, 2), 'utf8');
  }

  // --- Enterprise ---

  async findEnterpriseById(id: string): Promise<Enterprise | null> {
    const data = await this.read();
    return data.enterprises.find((e) => e.id === id) ?? null;
  }

  async findEnterpriseByUserId(userId: string): Promise<Enterprise | null> {
    const data = await this.read();
    return data.enterprises.find((e) => e.userId === userId) ?? null;
  }

  async saveEnterprise(enterprise: Enterprise): Promise<Enterprise> {
    const data = await this.read();
    const idx = data.enterprises.findIndex((e) => e.id === enterprise.id);
    if (idx >= 0) {
      data.enterprises[idx] = enterprise;
    } else {
      data.enterprises.push(enterprise);
    }
    await this.write(data);
    return enterprise;
  }

  // --- Collaborators ---

  async findCollaboratorsByEnterprise(
    enterpriseId: string,
  ): Promise<PersonProfile[]> {
    const data = await this.read();
    return data.collaborators.filter((c) => c.enterpriseId === enterpriseId);
  }

  async findCollaboratorById(id: string): Promise<PersonProfile | null> {
    const data = await this.read();
    return data.collaborators.find((c) => c.id === id) ?? null;
  }

  async findProfileByUserId(userId: string): Promise<PersonProfile | null> {
    const data = await this.read();
    return data.collaborators.find((c) => c.userId === userId) ?? null;
  }

  async saveCollaborator(collaborator: PersonProfile): Promise<PersonProfile> {
    const data = await this.read();
    const idx = data.collaborators.findIndex((c) => c.id === collaborator.id);
    if (idx >= 0) {
      data.collaborators[idx] = collaborator;
    } else {
      data.collaborators.push(collaborator);
    }
    await this.write(data);
    return collaborator;
  }

  async saveCollaborators(
    collaborators: PersonProfile[],
  ): Promise<PersonProfile[]> {
    const data = await this.read();
    for (const col of collaborators) {
      const idx = data.collaborators.findIndex((c) => c.id === col.id);
      if (idx >= 0) {
        data.collaborators[idx] = col;
      } else {
        data.collaborators.push(col);
      }
    }
    await this.write(data);
    return collaborators;
  }

  // --- Loan Requests ---

  async findRequestsByEnterprise(
    enterpriseId: string,
    status?: LoanRequest['status'],
  ): Promise<LoanRequest[]> {
    const data = await this.read();
    let results = data.requests.filter((r) => r.enterpriseId === enterpriseId);
    if (status) {
      results = results.filter((r) => r.status === status);
    }
    return results;
  }

  async findRequestById(id: string): Promise<LoanRequest | null> {
    const data = await this.read();
    return data.requests.find((r) => r.id === id) ?? null;
  }

  async findRequestsByCollaborator(
    collaboratorId: string,
    status?: LoanRequest['status'],
  ): Promise<LoanRequest[]> {
    const data = await this.read();
    let results = data.requests.filter(
      (r) => r.collaboratorId === collaboratorId,
    );
    if (status) {
      results = results.filter((r) => r.status === status);
    }
    return results;
  }

  async saveRequest(request: LoanRequest): Promise<LoanRequest> {
    const data = await this.read();
    const idx = data.requests.findIndex((r) => r.id === request.id);
    if (idx >= 0) {
      data.requests[idx] = request;
    } else {
      data.requests.push(request);
    }
    await this.write(data);
    return request;
  }

  // --- Contracts ---

  async findContractsByEnterprise(enterpriseId: string): Promise<Contract[]> {
    const data = await this.read();
    return data.contracts
      .filter((contract) => contract.enterpriseId === enterpriseId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findContractById(id: string): Promise<Contract | null> {
    const data = await this.read();
    return data.contracts.find((contract) => contract.id === id) ?? null;
  }

  async saveContract(contract: Contract): Promise<Contract> {
    const data = await this.read();
    const index = data.contracts.findIndex((item) => item.id === contract.id);
    if (index >= 0) {
      data.contracts[index] = contract;
    } else {
      data.contracts.push(contract);
    }
    await this.write(data);
    return contract;
  }

  async deleteContract(id: string): Promise<void> {
    const data = await this.read();
    data.contracts = data.contracts.filter((contract) => contract.id !== id);
    data.contractFiles = data.contractFiles.filter((file) => file.contractId !== id);
    await this.write(data);
  }

  async findContractFilesByContract(contractId: string): Promise<ContractFile[]> {
    const data = await this.read();
    return data.contractFiles
      .filter((file) => file.contractId === contractId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findContractFileById(id: string): Promise<ContractFile | null> {
    const data = await this.read();
    return data.contractFiles.find((file) => file.id === id) ?? null;
  }

  async saveContractFiles(files: ContractFile[]): Promise<ContractFile[]> {
    const data = await this.read();
    for (const file of files) {
      const index = data.contractFiles.findIndex((item) => item.id === file.id);
      if (index >= 0) {
        data.contractFiles[index] = file;
      } else {
        data.contractFiles.push(file);
      }
    }
    await this.write(data);
    return files;
  }

  async deleteContractFile(id: string): Promise<void> {
    const data = await this.read();
    data.contractFiles = data.contractFiles.filter((file) => file.id !== id);
    await this.write(data);
  }

  // --- Transactions ---

  async findTransactionsByEnterprise(
    enterpriseId: string,
  ): Promise<Transaction[]> {
    const data = await this.read();
    return data.transactions
      .filter((t) => t.enterpriseId === enterpriseId)
      .map((t) => ({
        ...t,
        collaboratorId: t.collaboratorId ?? null,
        kind: t.kind ?? 'payment',
      }));
  }

  async findTransactionsByCollaborator(
    collaboratorId: string,
  ): Promise<Transaction[]> {
    const data = await this.read();
    return data.transactions
      .filter((t) => t.collaboratorId === collaboratorId)
      .map((t) => ({
        ...t,
        collaboratorId: t.collaboratorId ?? null,
        kind: t.kind ?? 'payment',
      }));
  }

  async saveTransaction(transaction: Transaction): Promise<Transaction> {
    const data = await this.read();
    const idx = data.transactions.findIndex((t) => t.id === transaction.id);
    if (idx >= 0) {
      data.transactions[idx] = transaction;
    } else {
      data.transactions.push(transaction);
    }
    await this.write(data);
    return transaction;
  }

  // --- Platform Config ---

  async getPlatformConfig(): Promise<PlatformConfig> {
    const data = await this.read();
    return data.platformConfig;
  }

  async savePlatformConfig(config: PlatformConfig): Promise<PlatformConfig> {
    const data = await this.read();
    data.platformConfig = config;
    await this.write(data);
    return config;
  }
}
