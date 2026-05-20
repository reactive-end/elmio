import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  Enterprise,
  LoanRequest,
  Transaction,
  PlatformConfig,
} from '../domain/enterprise';
import type { PersonProfile } from '../domain/person-profile';
import type { EnterpriseRepositoryPort } from '../domain/ports/enterprise-repository.port';
import { EnterpriseEntity } from './entities/enterprise.entity';
import { PersonProfileEntity } from './entities/person-profile.entity';
import { LoanRequestEntity } from './entities/loan-request.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { PlatformConfigEntity } from './entities/platform-config.entity';

const DEFAULT_CONFIG: PlatformConfig = { serviceFeePercent: 5 };

@Injectable()
export class DbEnterpriseRepositoryService implements EnterpriseRepositoryPort {
  constructor(
    @InjectRepository(EnterpriseEntity)
    private readonly enterpriseRepo: Repository<EnterpriseEntity>,
    @InjectRepository(PersonProfileEntity)
    private readonly profileRepo: Repository<PersonProfileEntity>,
    @InjectRepository(LoanRequestEntity)
    private readonly requestRepo: Repository<LoanRequestEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    @InjectRepository(PlatformConfigEntity)
    private readonly configRepo: Repository<PlatformConfigEntity>,
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
      creditCard: entity.creditCard,
      debitCard: entity.debitCard,
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
    entity.creditCard = domain.creditCard;
    entity.debitCard = domain.debitCard;
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
    return entity;
  }

  // --- Mapeadores de Transaction ---
  private transactionToDomain(entity: TransactionEntity): Transaction {
    return {
      id: entity.id,
      enterpriseId: entity.enterpriseId,
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
    entity.concept = domain.concept;
    entity.amount = domain.amount;
    entity.status = domain.status;
    entity.date = domain.date;
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

  async findCollaboratorsByEnterprise(enterpriseId: string): Promise<PersonProfile[]> {
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

  async saveCollaborators(collaborators: PersonProfile[]): Promise<PersonProfile[]> {
    const entities = collaborators.map((c) => this.profileToPersistence(c));
    await this.profileRepo.save(entities);
    return collaborators;
  }

  // --- Loan Requests ---

  async findRequestsByEnterprise(
    enterpriseId: string,
    status?: LoanRequest['status'],
  ): Promise<LoanRequest[]> {
    const query: { enterpriseId: string; status?: LoanRequest['status'] } = { enterpriseId };
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

  async saveRequest(request: LoanRequest): Promise<LoanRequest> {
    const entity = this.requestToPersistence(request);
    await this.requestRepo.save(entity);
    return request;
  }

  // --- Transactions ---

  async findTransactionsByEnterprise(enterpriseId: string): Promise<Transaction[]> {
    const entities = await this.transactionRepo.find({ where: { enterpriseId } });
    return entities.map((entity) => this.transactionToDomain(entity));
  }

  async saveTransaction(transaction: Transaction): Promise<Transaction> {
    const entity = this.transactionToPersistence(transaction);
    await this.transactionRepo.save(entity);
    return transaction;
  }

  // --- Platform Config ---

  async getPlatformConfig(): Promise<PlatformConfig> {
    const entity = await this.configRepo.findOne({ where: { id: 'global_config' } });
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
}
