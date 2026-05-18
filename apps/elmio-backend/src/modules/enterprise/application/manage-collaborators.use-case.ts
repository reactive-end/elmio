import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PersonProfile } from '../domain/person-profile';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';
import {
  AUTH_REPOSITORY_PORT,
  type AuthRepositoryPort,
} from '../../auth/domain/ports/auth-repository.port';
import { UserRole, type User } from '../../auth/domain/user';
import { hashPassword } from '../../auth/helpers';
import type { CreateCollaboratorDto } from '../presentation/http/dto/enterprise.dto';

/**
 * Gestiona la creacion individual y masiva de colaboradores.
 */
@Injectable()
export class ManageCollaboratorsUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
    @Inject(AUTH_REPOSITORY_PORT)
    private readonly authRepository: AuthRepositoryPort,
  ) {}

  /**
   * Crea un colaborador individual.
   * @param enterpriseId ID de la empresa.
   * @param input Datos del colaborador.
   * @returns Colaborador creado.
   */
  async createOne(
    enterpriseId: string,
    input: CreateCollaboratorDto,
  ): Promise<PersonProfile> {
    const enterprise = await this.repository.findEnterpriseById(enterpriseId);
    if (!enterprise) throw new NotFoundException('Empresa no encontrada.');

    // Verificar si el correo ya existe
    const existingUser = await this.authRepository.findByEmail(input.email.trim().toLowerCase());
    if (existingUser) {
      throw new ConflictException(`El correo ${input.email} ya está registrado.`);
    }

    const userId = randomUUID();
    const newUser: User = {
      id: userId,
      name: `${input.name.trim()} ${input.lastName.trim()}`,
      email: input.email.trim().toLowerCase(),
      // Clave inicial: la cédula encriptada
      passwordHash: hashPassword(input.documentId.trim()),
      role: UserRole.EMPLOYEE,
      owner: enterpriseId,
      createdAt: new Date().toISOString(),
      // Obligar a cambiar contraseña en el primer inicio de sesión
      requirePasswordChange: true,
    };

    await this.authRepository.create(newUser);

    const profile = this.buildProfile(enterpriseId, input, userId);
    return this.repository.saveCollaborator(profile);
  }

  /**
   * Carga masiva de colaboradores.
   * @param enterpriseId ID de la empresa.
   * @param inputs Lista de datos de colaboradores.
   * @returns Colaboradores creados.
   */
  async createBulk(
    enterpriseId: string,
    inputs: CreateCollaboratorDto[],
  ): Promise<PersonProfile[]> {
    const enterprise = await this.repository.findEnterpriseById(enterpriseId);
    if (!enterprise) throw new NotFoundException('Empresa no encontrada.');

    const profiles: PersonProfile[] = [];

    for (const input of inputs) {
      const email = input.email.trim().toLowerCase();
      const existingUser = await this.authRepository.findByEmail(email);
      
      if (existingUser) {
        // En carga masiva, si ya existe saltamos o fallamos. Optamos por lanzar error o ignorar?
        // Vamos a lanzar error por ahora para ser consistentes con la validacion
        throw new ConflictException(`El correo ${email} ya está registrado.`);
      }

      const userId = randomUUID();
      const newUser: User = {
        id: userId,
        name: `${input.name.trim()} ${input.lastName.trim()}`,
        email,
        passwordHash: hashPassword(input.documentId.trim()),
        role: UserRole.EMPLOYEE,
        owner: enterpriseId,
        createdAt: new Date().toISOString(),
        requirePasswordChange: true,
      };

      await this.authRepository.create(newUser);
      profiles.push(this.buildProfile(enterpriseId, input, userId));
    }

    return this.repository.saveCollaborators(profiles);
  }

  /**
   * Actualiza datos de un colaborador.
   * @param collaboratorId ID del colaborador.
   * @param updates Datos parciales a actualizar.
   * @returns Colaborador actualizado.
   */
  async update(
    collaboratorId: string,
    updates: Partial<
      CreateCollaboratorDto & { status: PersonProfile['status'] }
    >,
  ): Promise<PersonProfile> {
    const collaborator =
      await this.repository.findCollaboratorById(collaboratorId);
    if (!collaborator)
      throw new NotFoundException('Colaborador no encontrado.');

    if (updates.name !== undefined) collaborator.name = updates.name.trim();
    if (updates.lastName !== undefined)
      collaborator.lastName = updates.lastName.trim();
    if (updates.documentType !== undefined)
      collaborator.documentType = updates.documentType;
    if (updates.documentId !== undefined)
      collaborator.documentId = updates.documentId.trim();
    if (updates.email !== undefined)
      collaborator.email = updates.email.trim().toLowerCase();
    if (updates.phone !== undefined) collaborator.phone = updates.phone.trim();
    if (updates.birthDate !== undefined)
      collaborator.birthDate = updates.birthDate;
    if (updates.gender !== undefined) collaborator.gender = updates.gender;
    if (updates.civilStatus !== undefined)
      collaborator.civilStatus = updates.civilStatus;
    if (updates.address !== undefined) collaborator.address = updates.address;
    if (updates.countryOfOrigin !== undefined)
      collaborator.countryOfOrigin = updates.countryOfOrigin;
    if (updates.familyDependents !== undefined)
      collaborator.familyDependents = updates.familyDependents;
    if (updates.department !== undefined)
      collaborator.department = updates.department;
    if (updates.position !== undefined)
      collaborator.position = updates.position;
    if (updates.startDate !== undefined)
      collaborator.startDate = updates.startDate;
    if (updates.baseSalary !== undefined)
      collaborator.baseSalary = updates.baseSalary;
    if (updates.maxLoanLimit !== undefined)
      collaborator.maxLoanLimit = updates.maxLoanLimit;
    if (updates.status !== undefined) collaborator.status = updates.status;

    return this.repository.saveCollaborator(collaborator);
  }

  /**
   * Lista los colaboradores de una empresa.
   * @param enterpriseId ID de la empresa.
   * @returns Lista de colaboradores.
   */
  async list(enterpriseId: string): Promise<PersonProfile[]> {
    return this.repository.findCollaboratorsByEnterprise(enterpriseId);
  }

  /**
   * Construye un PersonProfile completo a partir de los datos obligatorios.
   */
  private buildProfile(
    enterpriseId: string,
    input: CreateCollaboratorDto,
    userId: string,
  ): PersonProfile {
    const now = new Date().toISOString();
    return {
      id: randomUUID(),
      userId: userId,
      // Grupo 1: Identidad
      name: input.name.trim(),
      lastName: input.lastName.trim(),
      documentType: input.documentType,
      documentId: input.documentId.trim(),
      documentPhoto: '',
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      phone2: '',
      phoneType: '',
      photo: '',
      // Grupo 2: Demograficos
      birthDate: input.birthDate,
      age: 0,
      gender: input.gender,
      civilStatus: input.civilStatus,
      height: '',
      weight: '',
      diseases: '',
      familyDependents: input.familyDependents,
      countryOfOrigin: input.countryOfOrigin,
      countryOfResidence: '',
      address: input.address,
      // Grupo 3: Estilo de vida
      hobbies: '',
      favoriteFood: '',
      hasLaptopOrPc: false,
      operatingSystem: '',
      vehicleCount: 0,
      hasDriverLicense: false,
      // Grupo 4: Empleo
      enterpriseId,
      department: input.department,
      position: input.position,
      startDate: input.startDate,
      baseSalary: input.baseSalary,
      maxLoanLimit: input.maxLoanLimit,
      employmentType: '',
      employmentSector: '',
      timeInCompanyMonths: 0,
      loanPurpose: '',
      status: 'active',
      // Grupo 5: Redes sociales
      socialMedia1: '',
      socialMedia2: '',
      socialMedia3: '',
      // Grupo 6: Financieros
      residenceType: '',
      isResidenceOwned: false,
      recurringIncome: 0,
      nationalBank1: '',
      nationalBank2: '',
      nationalBank3: '',
      internationalBank: '',
      // Grupo 7: Tarjetas
      creditCard: null,
      debitCard: null,
      // Grupo 8: Referencias
      personalReferences: [],
      // Metadatos
      onboardingCompleted: false,
      createdAt: now,
    };
  }
}
