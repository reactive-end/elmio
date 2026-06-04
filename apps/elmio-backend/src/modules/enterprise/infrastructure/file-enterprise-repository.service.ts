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
import type { PersonBankAccount } from '../domain/person-bank-account';
import type { Disbursement } from '../domain/disbursement';
import type { Purchase } from '../domain/purchase';
import type { EnterpriseRepositoryPort } from '../domain/ports/enterprise-repository.port';

interface StorageData {
  enterprises: Enterprise[];
  collaborators: PersonProfile[];
  personBankAccounts: PersonBankAccount[];
  disbursements: Disbursement[];
  requests: LoanRequest[];
  transactions: Transaction[];
  contracts: Contract[];
  contractFiles: ContractFile[];
  purchases: Purchase[];
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
        personBankAccounts: parsed.personBankAccounts ?? [],
        disbursements: parsed.disbursements ?? [],
        requests: parsed.requests ?? [],
        transactions: parsed.transactions ?? [],
        contracts: parsed.contracts ?? [],
        contractFiles: parsed.contractFiles ?? [],
        purchases: parsed.purchases ?? [],
        platformConfig: parsed.platformConfig ?? { ...DEFAULT_CONFIG },
      };
    } catch {
      return {
        enterprises: [],
        collaborators: [],
        personBankAccounts: [],
        disbursements: [],
        requests: [],
        transactions: [],
        contracts: [],
        contractFiles: [],
        purchases: [],
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

  async findAllRequests(status?: LoanRequest['status']): Promise<LoanRequest[]> {
    const data = await this.read();
    let results = data.requests;
    if (status) {
      results = results.filter((r) => r.status === status);
    }
    return results;
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

  async findTransactionById(id: string): Promise<Transaction | null> {
    const data = await this.read();
    const found = data.transactions.find((t) => t.id === id);
    if (!found) return null;
    return {
      ...found,
      collaboratorId: found.collaboratorId ?? null,
      kind: found.kind ?? 'payment',
    };
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

  async findAllTransactions(): Promise<Transaction[]> {
    const data = await this.read();
    return data.transactions.map((t) => ({
      ...t,
      collaboratorId: t.collaboratorId ?? null,
      kind: t.kind ?? 'payment',
    }));
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

  // --- Person Bank Accounts ---

  async findBankAccountsByPersonProfileId(personProfileId: string): Promise<PersonBankAccount[]> {
    const data = await this.read();
    return data.personBankAccounts.filter((a) => a.personProfileId === personProfileId);
  }

  async findBankAccountById(id: string): Promise<PersonBankAccount | null> {
    const data = await this.read();
    return data.personBankAccounts.find((a) => a.id === id) ?? null;
  }

  async saveBankAccount(account: PersonBankAccount): Promise<PersonBankAccount> {
    const data = await this.read();
    const idx = data.personBankAccounts.findIndex((a) => a.id === account.id);
    if (idx >= 0) {
      data.personBankAccounts[idx] = account;
    } else {
      data.personBankAccounts.push(account);
    }
    await this.write(data);
    return account;
  }

  async deleteBankAccount(id: string): Promise<void> {
    const data = await this.read();
    data.personBankAccounts = data.personBankAccounts.filter((a) => a.id !== id);
    await this.write(data);
  }

  // --- Disbursements ---

  async saveDisbursement(disbursement: Disbursement): Promise<Disbursement> {
    const data = await this.read();
    const idx = data.disbursements.findIndex((d) => d.id === disbursement.id);
    if (idx >= 0) {
      data.disbursements[idx] = disbursement;
    } else {
      data.disbursements.push(disbursement);
    }
    await this.write(data);
    return disbursement;
  }

  async findDisbursementByLoanRequestId(loanRequestId: string): Promise<Disbursement | null> {
    const data = await this.read();
    return data.disbursements.find((d) => d.loanRequestId === loanRequestId) ?? null;
  }

  // --- Purchases ---

  async savePurchase(purchase: Purchase): Promise<Purchase> {
    const data = await this.read();
    const index = data.purchases.findIndex((p) => p.id === purchase.id);
    if (index >= 0) {
      data.purchases[index] = purchase;
    } else {
      data.purchases.push(purchase);
    }
    await this.write(data);
    return purchase;
  }

  async findPurchaseById(id: string): Promise<Purchase | null> {
    const data = await this.read();
    return data.purchases.find((p) => p.id === id) ?? null;
  }

  async findAllPurchases(channel?: Purchase['channel']): Promise<Purchase[]> {
    const data = await this.read();
    const filtered = channel ? data.purchases.filter((p) => p.channel === channel) : data.purchases;
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async findPurchasesByPurchaser(
    purchaserType: Purchase['purchaserType'],
    purchaserId: string,
  ): Promise<Purchase[]> {
    const data = await this.read();
    return data.purchases
      .filter((p) => p.purchaserType === purchaserType && p.purchaserId === purchaserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
