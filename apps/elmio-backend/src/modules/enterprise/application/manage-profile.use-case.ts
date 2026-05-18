import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PersonProfile } from '../domain/person-profile';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';
import type { UpdatePersonProfileDto } from '../presentation/http/dto/enterprise.dto';

/**
 * Crea o actualiza el perfil unificado de una persona natural (CLIENT).
 */
@Injectable()
export class ManageProfileUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
  ) {}

  /**
   * Obtiene o crea el perfil para el usuario.
   * @param userId ID del usuario.
   * @returns El perfil encontrado o uno nuevo por defecto.
   */
  async getOrCreateProfile(userId: string): Promise<PersonProfile> {
    const existing = await this.repository.findProfileByUserId(userId);
    if (existing) return existing;

    const newProfile: PersonProfile = {
      id: randomUUID(),
      userId,
      // Grupo 1: Identidad
      name: '',
      lastName: '',
      documentType: 'V',
      documentId: '',
      documentPhoto: '',
      email: '',
      phone: '',
      phone2: '',
      phoneType: '',
      photo: '',
      // Grupo 2: Demograficos
      birthDate: '',
      age: 0,
      gender: '',
      civilStatus: '',
      height: '',
      weight: '',
      diseases: '',
      familyDependents: 0,
      countryOfOrigin: '',
      countryOfResidence: '',
      address: '',
      // Grupo 3: Estilo de vida
      hobbies: '',
      favoriteFood: '',
      hasLaptopOrPc: false,
      operatingSystem: '',
      vehicleCount: 0,
      hasDriverLicense: false,
      // Grupo 4: Empleo
      enterpriseId: null,
      department: '',
      position: '',
      startDate: '',
      baseSalary: 0,
      maxLoanLimit: 0,
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
      createdAt: new Date().toISOString(),
    };

    return this.repository.saveCollaborator(newProfile);
  }

  /**
   * Actualiza el perfil de una persona.
   * @param userId ID del usuario logueado.
   * @param updates Datos a actualizar (UpdatePersonProfileDto incluye datos de identidad para la creacion inicial del cliente).
   * @returns Perfil actualizado.
   */
  async updateProfile(
    userId: string,
    updates: Partial<
      UpdatePersonProfileDto & {
        name?: string;
        lastName?: string;
        documentType?: string;
        documentId?: string;
        email?: string;
        phone?: string;
        birthDate?: string;
        gender?: string;
        civilStatus?: string;
        address?: string;
        countryOfOrigin?: string;
        familyDependents?: number;
      }
    >,
  ): Promise<PersonProfile> {
    const profile = await this.getOrCreateProfile(userId);

    // Mapeo seguro de todas las propiedades posibles
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key in profile) {
        // @ts-expect-error key is guaranteed to be in profile
        profile[key] = value;
      }
    }

    return this.repository.saveCollaborator(profile);
  }

  /**
   * Finaliza el onboarding del perfil de la persona.
   * @param userId ID del usuario logueado.
   * @returns Perfil actualizado.
   */
  async completeOnboarding(userId: string): Promise<PersonProfile> {
    const profile = await this.repository.findProfileByUserId(userId);
    if (!profile) throw new NotFoundException('Perfil no encontrado.');

    profile.onboardingCompleted = true;
    return this.repository.saveCollaborator(profile);
  }
}
