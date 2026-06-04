import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { EnterpriseEntity } from './entities/enterprise.entity';
import { PersonProfileEntity } from './entities/person-profile.entity';
import { PersonBankAccountEntity } from './entities/person-bank-account.entity';
import { DisbursementEntity } from './entities/disbursement.entity';
import { LoanRequestEntity } from './entities/loan-request.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { PlatformConfigEntity } from './entities/platform-config.entity';
import { ContractEntity } from './entities/contract.entity';
import { ContractFileEntity } from './entities/contract-file.entity';
import { PurchaseEntity } from './entities/purchase.entity';

const DEFAULT_CONFIG: PlatformConfig = { serviceFeePercent: 5 };

@Injectable()
export class DbEnterpriseRepositoryService implements EnterpriseRepositoryPort {
  constructor(
    @InjectRepository(EnterpriseEntity)
    private readonly enterpriseRepo: Repository<EnterpriseEntity>,
    @InjectRepository(PersonProfileEntity)
    private readonly profileRepo: Repository<PersonProfileEntity>,
    @InjectRepository(PersonBankAccountEntity)
    private readonly personBankAccountRepo: Repository<PersonBankAccountEntity>,
    @InjectRepository(DisbursementEntity)
    private readonly disbursementRepo: Repository<DisbursementEntity>,
    @InjectRepository(LoanRequestEntity)
    private readonly requestRepo: Repository<LoanRequestEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    @InjectRepository(PlatformConfigEntity)
    private readonly configRepo: Repository<PlatformConfigEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    @InjectRepository(ContractFileEntity)
    private readonly contractFileRepo: Repository<ContractFileEntity>,
    @InjectRepository(PurchaseEntity)
    private readonly purchaseRepo: Repository<PurchaseEntity>,
  ) {}

  // --- Mapeadores de Enterprise ---
  private enterpriseToDomain(entity: EnterpriseEntity): Enterprise {
    return {
      id: entity.id,
      userId: entity.userId,
      companyName: entity.companyName,
      sector: entity.sector,
      employeeCount: entity.employeeCount,
      phone: entity.phone,
      email: entity.email,
      taxId: entity.taxId,
      website: entity.website,
      socialMedia: entity.socialMedia,
      headquartersLocation: entity.headquartersLocation,
      taxIdPhoto: entity.taxIdPhoto,
      constitutiveActPhoto: entity.constitutiveActPhoto,
      lastAssemblyPhoto: entity.lastAssemblyPhoto,
      serviceReceiptPhoto: entity.serviceReceiptPhoto,
      bankStatementsPhotos: entity.bankStatementsPhotos,
      bankReferencePhotos: entity.bankReferencePhotos,
      legalRepDocumentId: entity.legalRepDocumentId,
      legalRepDocumentPhoto: entity.legalRepDocumentPhoto,
      accountManagerDocumentId: entity.accountManagerDocumentId,
      accountManagerDocumentPhoto: entity.accountManagerDocumentPhoto,
      shareholderCount: entity.shareholderCount,
      shareholders: entity.shareholders,
      bankAccounts: entity.bankAccounts,
      additionalLegalReps: entity.additionalLegalReps || [],
      onboardingCompleted: entity.onboardingCompleted,
      createdAt: entity.createdAt,
    };
  }

  private enterpriseToPersistence(domain: Enterprise): EnterpriseEntity {
    const entity = new EnterpriseEntity();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.companyName = domain.companyName;
    entity.sector = domain.sector;
    entity.employeeCount = domain.employeeCount;
    entity.phone = domain.phone;
    entity.email = domain.email;
    entity.taxId = domain.taxId;
    entity.website = domain.website;
    entity.socialMedia = domain.socialMedia;
    entity.headquartersLocation = domain.headquartersLocation;
    entity.taxIdPhoto = domain.taxIdPhoto;
    entity.constitutiveActPhoto = domain.constitutiveActPhoto;
    entity.lastAssemblyPhoto = domain.lastAssemblyPhoto;
    entity.serviceReceiptPhoto = domain.serviceReceiptPhoto;
    entity.bankStatementsPhotos = domain.bankStatementsPhotos;
    entity.bankReferencePhotos = domain.bankReferencePhotos;
    entity.legalRepDocumentId = domain.legalRepDocumentId;
    entity.legalRepDocumentPhoto = domain.legalRepDocumentPhoto;
    entity.accountManagerDocumentId = domain.accountManagerDocumentId;
    entity.accountManagerDocumentPhoto = domain.accountManagerDocumentPhoto;
    entity.shareholderCount = domain.shareholderCount;
    entity.shareholders = domain.shareholders;
    entity.bankAccounts = domain.bankAccounts;
    entity.additionalLegalReps = domain.additionalLegalReps || [];
    entity.onboardingCompleted = domain.onboardingCompleted;
    entity.createdAt = domain.createdAt;
    return entity;
  }

  // --- Mapeadores de PersonProfile ---
  private profileToDomain(entity: PersonProfileEntity): PersonProfile {
    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      lastName: entity.lastName,
      documentType: entity.documentType,
      documentId: entity.documentId,
      documentPhoto: entity.documentPhoto,
      email: entity.email,
      phone: entity.phone,
      phone2: entity.phone2,
      phoneType: entity.phoneType,
      photo: entity.photo,
      birthDate: entity.birthDate,
      age: entity.age,
      gender: entity.gender,
      civilStatus: entity.civilStatus,
      height: entity.height,
      weight: entity.weight,
      diseases: entity.diseases,
      familyDependents: entity.familyDependents,
      countryOfOrigin: entity.countryOfOrigin,
      countryOfResidence: entity.countryOfResidence,
      address: entity.address,
      hobbies: entity.hobbies,
      favoriteFood: entity.favoriteFood,
      hasLaptopOrPc: entity.hasLaptopOrPc,
      operatingSystem: entity.operatingSystem,
      vehicleCount: entity.vehicleCount,
      hasDriverLicense: entity.hasDriverLicense,
      enterpriseId: entity.enterpriseId,
      department: entity.department,
      position: entity.position,
      startDate: entity.startDate,
      baseSalary: entity.baseSalary,
      maxLoanLimit: entity.maxLoanLimit,
      employmentType: entity.employmentType,
      employmentSector: entity.employmentSector,
      timeInCompanyMonths: entity.timeInCompanyMonths,
      loanPurpose: entity.loanPurpose,
      status: entity.status,
      socialMedia1: entity.socialMedia1,
      socialMedia2: entity.socialMedia2,
      socialMedia3: entity.socialMedia3,
      residenceType: entity.residenceType,
      isResidenceOwned: entity.isResidenceOwned,
      recurringIncome: entity.recurringIncome,
      nationalBank1: entity.nationalBank1,
      nationalBank2: entity.nationalBank2,
      nationalBank3: entity.nationalBank3,
      internationalBank: entity.internationalBank,
      personalReferences: entity.personalReferences,
      onboardingCompleted: entity.onboardingCompleted,
      createdAt: entity.createdAt,
    };
  }

  private profileToPersistence(domain: PersonProfile): PersonProfileEntity {
    const entity = new PersonProfileEntity();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.name = domain.name;
    entity.lastName = domain.lastName;
    entity.documentType = domain.documentType;
    entity.documentId = domain.documentId;
    entity.documentPhoto = domain.documentPhoto;
    entity.email = domain.email;
    entity.phone = domain.phone;
    entity.phone2 = domain.phone2;
    entity.phoneType = domain.phoneType;
    entity.photo = domain.photo;
    entity.birthDate = domain.birthDate;
    entity.age = domain.age;
    entity.gender = domain.gender;
    entity.civilStatus = domain.civilStatus;
    entity.height = domain.height;
    entity.weight = domain.weight;
    entity.diseases = domain.diseases;
    entity.familyDependents = domain.familyDependents;
    entity.countryOfOrigin = domain.countryOfOrigin;
    entity.countryOfResidence = domain.countryOfResidence;
    entity.address = domain.address;
    entity.hobbies = domain.hobbies;
    entity.favoriteFood = domain.favoriteFood;
    entity.hasLaptopOrPc = domain.hasLaptopOrPc;
    entity.operatingSystem = domain.operatingSystem;
    entity.vehicleCount = domain.vehicleCount;
    entity.hasDriverLicense = domain.hasDriverLicense;
    entity.enterpriseId = domain.enterpriseId;
    entity.department = domain.department;
    entity.position = domain.position;
    entity.startDate = domain.startDate;
    entity.baseSalary = domain.baseSalary;
    entity.maxLoanLimit = domain.maxLoanLimit;
    entity.employmentType = domain.employmentType;
    entity.employmentSector = domain.employmentSector;
    entity.timeInCompanyMonths = domain.timeInCompanyMonths;
    entity.loanPurpose = domain.loanPurpose;
    entity.status = domain.status;
    entity.socialMedia1 = domain.socialMedia1;
    entity.socialMedia2 = domain.socialMedia2;
    entity.socialMedia3 = domain.socialMedia3;
    entity.residenceType = domain.residenceType;
    entity.isResidenceOwned = domain.isResidenceOwned;
    entity.recurringIncome = domain.recurringIncome;
    entity.nationalBank1 = domain.nationalBank1;
    entity.nationalBank2 = domain.nationalBank2;
    entity.nationalBank3 = domain.nationalBank3;
    entity.internationalBank = domain.internationalBank;
    entity.personalReferences = domain.personalReferences;
    entity.onboardingCompleted = domain.onboardingCompleted;
    entity.createdAt = domain.createdAt;
    return entity;
  }

  // --- Mapeadores de LoanRequest ---
  private requestToDomain(entity: LoanRequestEntity): LoanRequest {
    return {
      id: entity.id,
      enterpriseId: entity.enterpriseId,
      collaboratorId: entity.collaboratorId,
      collaboratorName: entity.collaboratorName,
      type: entity.type,
      amount: entity.amount,
      description: entity.description,
      status: entity.status,
      denialReason: entity.denialReason,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      productId: entity.productId ?? null,
    };
  }

  private requestToPersistence(domain: LoanRequest): LoanRequestEntity {
    const entity = new LoanRequestEntity();
    entity.id = domain.id;
    entity.enterpriseId = domain.enterpriseId;
    entity.collaboratorId = domain.collaboratorId;
    entity.collaboratorName = domain.collaboratorName;
    entity.type = domain.type;
    entity.amount = domain.amount;
    entity.description = domain.description;
    entity.status = domain.status;
    entity.denialReason = domain.denialReason;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    entity.productId = domain.productId ?? null;
    return entity;
  }

  // --- Mapeadores de Transaction ---
  private transactionToDomain(entity: TransactionEntity): Transaction {
    return {
      id: entity.id,
      enterpriseId: entity.enterpriseId,
      collaboratorId: entity.collaboratorId ?? null,
      kind: entity.kind ?? 'payment',
      concept: entity.concept,
      amount: entity.amount,
      status: entity.status,
      date: entity.date,
    };
  }

  private transactionToPersistence(domain: Transaction): TransactionEntity {
    const entity = new TransactionEntity();
    entity.id = domain.id;
    entity.enterpriseId = domain.enterpriseId;
    entity.collaboratorId = domain.collaboratorId;
    entity.kind = domain.kind;
    entity.concept = domain.concept;
    entity.amount = domain.amount;
    entity.status = domain.status;
    entity.date = domain.date;
    return entity;
  }

  // --- Mapeadores de Contract ---
  private contractToDomain(entity: ContractEntity): Contract {
    return {
      id: entity.id,
      enterpriseId: entity.enterpriseId,
      name: entity.name,
      createdAt: entity.createdAt,
    };
  }

  private contractToPersistence(domain: Contract): ContractEntity {
    const entity = new ContractEntity();
    entity.id = domain.id;
    entity.enterpriseId = domain.enterpriseId;
    entity.name = domain.name;
    entity.createdAt = domain.createdAt;
    return entity;
  }

  private contractFileToDomain(entity: ContractFileEntity): ContractFile {
    return {
      id: entity.id,
      contractId: entity.contractId,
      fileName: entity.fileName,
      originalName: entity.originalName,
      mimeType: entity.mimeType,
      createdAt: entity.createdAt,
    };
  }

  private contractFileToPersistence(domain: ContractFile): ContractFileEntity {
    const entity = new ContractFileEntity();
    entity.id = domain.id;
    entity.contractId = domain.contractId;
    entity.fileName = domain.fileName;
    entity.originalName = domain.originalName;
    entity.mimeType = domain.mimeType;
    entity.createdAt = domain.createdAt;
    return entity;
  }

  // --- Métodos de Persistencia ---

  // --- Enterprise ---

  async findEnterpriseById(id: string): Promise<Enterprise | null> {
    const entity = await this.enterpriseRepo.findOne({ where: { id } });
    return entity ? this.enterpriseToDomain(entity) : null;
  }

  async findEnterpriseByUserId(userId: string): Promise<Enterprise | null> {
    const entity = await this.enterpriseRepo.findOne({ where: { userId } });
    return entity ? this.enterpriseToDomain(entity) : null;
  }

  async saveEnterprise(enterprise: Enterprise): Promise<Enterprise> {
    const entity = this.enterpriseToPersistence(enterprise);
    await this.enterpriseRepo.save(entity);
    return enterprise;
  }

  // --- Collaborators (PersonProfile) ---

  async findCollaboratorsByEnterprise(
    enterpriseId: string,
  ): Promise<PersonProfile[]> {
    const entities = await this.profileRepo.find({ where: { enterpriseId } });
    return entities.map((entity) => this.profileToDomain(entity));
  }

  async findCollaboratorById(id: string): Promise<PersonProfile | null> {
    const entity = await this.profileRepo.findOne({ where: { id } });
    return entity ? this.profileToDomain(entity) : null;
  }

  async findProfileByUserId(userId: string): Promise<PersonProfile | null> {
    const entity = await this.profileRepo.findOne({ where: { userId } });
    return entity ? this.profileToDomain(entity) : null;
  }

  async saveCollaborator(collaborator: PersonProfile): Promise<PersonProfile> {
    const entity = this.profileToPersistence(collaborator);
    await this.profileRepo.save(entity);
    return collaborator;
  }

  async saveCollaborators(
    collaborators: PersonProfile[],
  ): Promise<PersonProfile[]> {
    const entities = collaborators.map((c) => this.profileToPersistence(c));
    await this.profileRepo.save(entities);
    return collaborators;
  }

  // --- Loan Requests ---

  async findRequestsByEnterprise(
    enterpriseId: string,
    status?: LoanRequest['status'],
  ): Promise<LoanRequest[]> {
    const query: { enterpriseId: string; status?: LoanRequest['status'] } = {
      enterpriseId,
    };
    if (status) {
      query.status = status;
    }
    const entities = await this.requestRepo.find({ where: query });
    return entities.map((entity) => this.requestToDomain(entity));
  }

  async findRequestById(id: string): Promise<LoanRequest | null> {
    const entity = await this.requestRepo.findOne({ where: { id } });
    return entity ? this.requestToDomain(entity) : null;
  }

  async findAllRequests(status?: LoanRequest['status']): Promise<LoanRequest[]> {
    const query: { status?: LoanRequest['status'] } = {};
    if (status) {
      query.status = status;
    }
    const entities = await this.requestRepo.find({ where: query });
    return entities.map((entity) => this.requestToDomain(entity));
  }

  async findRequestsByCollaborator(
    collaboratorId: string,
    status?: LoanRequest['status'],
  ): Promise<LoanRequest[]> {
    const query: { collaboratorId: string; status?: LoanRequest['status'] } = {
      collaboratorId,
    };
    if (status) {
      query.status = status;
    }
    const entities = await this.requestRepo.find({ where: query });
    return entities.map((entity) => this.requestToDomain(entity));
  }

  async saveRequest(request: LoanRequest): Promise<LoanRequest> {
    const entity = this.requestToPersistence(request);
    await this.requestRepo.save(entity);
    return request;
  }

  // --- Contracts ---

  async findContractsByEnterprise(enterpriseId: string): Promise<Contract[]> {
    const entities = await this.contractRepo.find({
      where: { enterpriseId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.contractToDomain(entity));
  }

  async findContractById(id: string): Promise<Contract | null> {
    const entity = await this.contractRepo.findOne({ where: { id } });
    return entity ? this.contractToDomain(entity) : null;
  }

  async saveContract(contract: Contract): Promise<Contract> {
    const entity = this.contractToPersistence(contract);
    await this.contractRepo.save(entity);
    return contract;
  }

  async deleteContract(id: string): Promise<void> {
    await this.contractRepo.delete({ id });
  }

  async findContractFilesByContract(contractId: string): Promise<ContractFile[]> {
    const entities = await this.contractFileRepo.find({
      where: { contractId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.contractFileToDomain(entity));
  }

  async findContractFileById(id: string): Promise<ContractFile | null> {
    const entity = await this.contractFileRepo.findOne({ where: { id } });
    return entity ? this.contractFileToDomain(entity) : null;
  }

  async saveContractFiles(files: ContractFile[]): Promise<ContractFile[]> {
    const entities = files.map((file) => this.contractFileToPersistence(file));
    await this.contractFileRepo.save(entities);
    return files;
  }

  async deleteContractFile(id: string): Promise<void> {
    await this.contractFileRepo.delete({ id });
  }

  // --- Transactions ---

  async findTransactionsByEnterprise(
    enterpriseId: string,
  ): Promise<Transaction[]> {
    const entities = await this.transactionRepo.find({
      where: { enterpriseId },
    });
    return entities.map((entity) => this.transactionToDomain(entity));
  }

  async findTransactionsByCollaborator(
    collaboratorId: string,
  ): Promise<Transaction[]> {
    const entities = await this.transactionRepo.find({
      where: { collaboratorId },
    });
    return entities.map((entity) => this.transactionToDomain(entity));
  }

  async findTransactionById(id: string): Promise<Transaction | null> {
    const entity = await this.transactionRepo.findOne({ where: { id } });
    return entity ? this.transactionToDomain(entity) : null;
  }

  async saveTransaction(transaction: Transaction): Promise<Transaction> {
    const entity = this.transactionToPersistence(transaction);
    await this.transactionRepo.save(entity);
    return transaction;
  }

  async findAllTransactions(): Promise<Transaction[]> {
    const entities = await this.transactionRepo.find();
    return entities.map((entity) => this.transactionToDomain(entity));
  }


  // --- Platform Config ---

  async getPlatformConfig(): Promise<PlatformConfig> {
    const entity = await this.configRepo.findOne({
      where: { id: 'global_config' },
    });
    if (!entity) {
      return { ...DEFAULT_CONFIG };
    }
    return {
      serviceFeePercent: entity.serviceFeePercent,
    };
  }

  async savePlatformConfig(config: PlatformConfig): Promise<PlatformConfig> {
    const entity = new PlatformConfigEntity();
    entity.id = 'global_config';
    entity.serviceFeePercent = config.serviceFeePercent;
    await this.configRepo.save(entity);
    return config;
  }

  // --- Mapeadores de PersonBankAccount ---

  private bankAccountToDomain(entity: PersonBankAccountEntity): PersonBankAccount {
    return {
      id: entity.id,
      personProfileId: entity.personProfileId,
      bankCode: entity.bankCode,
      bankName: entity.bankName,
      accountNumber: entity.accountNumber,
      phoneNumber: entity.phoneNumber,
      documentId: entity.documentId,
      documentPhoto: entity.documentPhoto,
      isPrimary: entity.isPrimary,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private bankAccountToPersistence(domain: PersonBankAccount): PersonBankAccountEntity {
    const entity = new PersonBankAccountEntity();
    entity.id = domain.id;
    entity.personProfileId = domain.personProfileId;
    entity.bankCode = domain.bankCode;
    entity.bankName = domain.bankName;
    entity.accountNumber = domain.accountNumber;
    entity.phoneNumber = domain.phoneNumber;
    entity.documentId = domain.documentId;
    entity.documentPhoto = domain.documentPhoto;
    entity.isPrimary = domain.isPrimary;
    return entity;
  }

  // --- Person Bank Accounts ---

  async findBankAccountsByPersonProfileId(personProfileId: string): Promise<PersonBankAccount[]> {
    const entities = await this.personBankAccountRepo.find({
      where: { personProfileId },
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });
    return entities.map((entity) => this.bankAccountToDomain(entity));
  }

  async findBankAccountById(id: string): Promise<PersonBankAccount | null> {
    const entity = await this.personBankAccountRepo.findOne({ where: { id } });
    return entity ? this.bankAccountToDomain(entity) : null;
  }

  async saveBankAccount(account: PersonBankAccount): Promise<PersonBankAccount> {
    const entity = this.bankAccountToPersistence(account);
    await this.personBankAccountRepo.save(entity);
    return account;
  }

  async deleteBankAccount(id: string): Promise<void> {
    await this.personBankAccountRepo.delete({ id });
  }

  // --- Mapeadores de Disbursement ---

  private disbursementToDomain(entity: DisbursementEntity): Disbursement {
    return {
      id: entity.id,
      loanRequestId: entity.loanRequestId,
      paymentId: entity.paymentId,
      financeUserId: entity.financeUserId,
      financeUserName: entity.financeUserName,
      amountUsd: entity.amountUsd,
      amountBs: entity.amountBs,
      exchangeRate: entity.exchangeRate,
      bankCode: entity.bankCode,
      accountNumber: entity.accountNumber,
      phoneNumber: entity.phoneNumber,
      documentId: entity.documentId,
      concept: entity.concept,
      bankReference: entity.bankReference,
      bankOperationId: entity.bankOperationId,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
    }
  }

  // --- Disbursements ---

  async saveDisbursement(disbursement: Disbursement): Promise<Disbursement> {
    const entity = new DisbursementEntity()
    entity.id = disbursement.id
    entity.loanRequestId = disbursement.loanRequestId
    entity.paymentId = disbursement.paymentId
    entity.financeUserId = disbursement.financeUserId
    entity.financeUserName = disbursement.financeUserName
    entity.amountUsd = disbursement.amountUsd
    entity.amountBs = disbursement.amountBs
    entity.exchangeRate = disbursement.exchangeRate
    entity.bankCode = disbursement.bankCode
    entity.accountNumber = disbursement.accountNumber
    entity.phoneNumber = disbursement.phoneNumber
    entity.documentId = disbursement.documentId
    entity.concept = disbursement.concept
    entity.bankReference = disbursement.bankReference
    entity.bankOperationId = disbursement.bankOperationId
    entity.status = disbursement.status
    await this.disbursementRepo.save(entity)
    return disbursement
  }

  async findDisbursementByLoanRequestId(loanRequestId: string): Promise<Disbursement | null> {
    const entity = await this.disbursementRepo.findOne({
      where: { loanRequestId },
      order: { createdAt: 'DESC' },
    })
    return entity ? this.disbursementToDomain(entity) : null
  }

  // --- Purchases ---

  private purchaseToDomain(entity: PurchaseEntity): Purchase {
    return {
      id: entity.id,
      purchaserType: entity.purchaserType,
      purchaserId: entity.purchaserId,
      purchaserName: entity.purchaserName,
      purchaserEmail: entity.purchaserEmail,
      purchaserDocument: entity.purchaserDocument,
      productId: entity.productId,
      productName: entity.productName,
      productSku: entity.productSku,
      marketplaceId: entity.marketplaceId,
      marketplaceName: entity.marketplaceName,
      amountUsd: Number(entity.amountUsd),
      amountVes: entity.amountVes !== null ? Number(entity.amountVes) : null,
      exchangeRate: entity.exchangeRate !== null ? Number(entity.exchangeRate) : null,
      isFinanced: entity.isFinanced,
      installments: entity.installments,
      interestRate: entity.interestRate !== null ? Number(entity.interestRate) : null,
      channel: entity.channel,
      transactionId: entity.transactionId,
      loanRequestId: entity.loanRequestId,
      disbursementId: entity.disbursementId,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }
  }

  private purchaseToEntity(purchase: Purchase): PurchaseEntity {
    const entity = new PurchaseEntity()
    entity.id = purchase.id
    entity.purchaserType = purchase.purchaserType
    entity.purchaserId = purchase.purchaserId
    entity.purchaserName = purchase.purchaserName
    entity.purchaserEmail = purchase.purchaserEmail
    entity.purchaserDocument = purchase.purchaserDocument
    entity.productId = purchase.productId
    entity.productName = purchase.productName
    entity.productSku = purchase.productSku
    entity.marketplaceId = purchase.marketplaceId
    entity.marketplaceName = purchase.marketplaceName
    entity.amountUsd = purchase.amountUsd
    entity.amountVes = purchase.amountVes
    entity.exchangeRate = purchase.exchangeRate
    entity.isFinanced = purchase.isFinanced
    entity.installments = purchase.installments
    entity.interestRate = purchase.interestRate
    entity.channel = purchase.channel
    entity.transactionId = purchase.transactionId
    entity.loanRequestId = purchase.loanRequestId
    entity.disbursementId = purchase.disbursementId
    entity.status = purchase.status
    return entity
  }

  async savePurchase(purchase: Purchase): Promise<Purchase> {
    const entity = this.purchaseToEntity(purchase)
    const saved = await this.purchaseRepo.save(entity)
    return this.purchaseToDomain(saved)
  }

  async findPurchaseById(id: string): Promise<Purchase | null> {
    const entity = await this.purchaseRepo.findOne({ where: { id } })
    return entity ? this.purchaseToDomain(entity) : null
  }

  async findAllPurchases(channel?: Purchase['channel']): Promise<Purchase[]> {
    const where = channel ? { channel } : {}
    const entities = await this.purchaseRepo.find({
      where,
      order: { createdAt: 'DESC' },
    })
    return entities.map((e) => this.purchaseToDomain(e))
  }

  async findPurchasesByPurchaser(
    purchaserType: Purchase['purchaserType'],
    purchaserId: string,
  ): Promise<Purchase[]> {
    const entities = await this.purchaseRepo.find({
      where: { purchaserType, purchaserId },
      order: { createdAt: 'DESC' },
    })
    return entities.map((e) => this.purchaseToDomain(e))
  }
}
