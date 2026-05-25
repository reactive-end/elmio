import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { UserEntity } from './entities/user.entity';
import { hashPassword } from '../helpers';
import { UserRole } from '../domain/user';
import { PersonProfileEntity } from '../../enterprise/infrastructure/entities/person-profile.entity';

@Injectable()
export class AuthSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthSeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdmins();
  }

  private async seedAdmins(): Promise<void> {
    const defaultAdmins = [
      {
        name: 'Kelly',
        lastName: 'Aular',
        email: 'kelly@elmio.app',
        password: 'Elmio.2026',
        phone: '+584125529842',
      },
      {
        name: 'Rafael',
        lastName: 'Pisani',
        email: 'rafaelpisani19@gmail.com',
        password: 'Elmio.2026',
        phone: '+584247413675',
      },
    ];

    const profileRepo = this.dataSource.getRepository(PersonProfileEntity);

    for (const admin of defaultAdmins) {
      const emailLower = admin.email.trim().toLowerCase();
      let user = await this.userRepo.findOne({ where: { email: emailLower } });

      if (!user) {
        user = new UserEntity();
        user.id = randomUUID();
        user.name = `${admin.name} ${admin.lastName}`.trim();
        user.email = emailLower;
        user.passwordHash = hashPassword(admin.password);
        user.role = 'ADMIN' as UserRole;
        user.owner = 'system';
        user.createdAt = new Date().toISOString();
        user.requirePasswordChange = false;

        await this.userRepo.save(user);
        this.logger.log(`Administrador por defecto creado con éxito: ${admin.name} ${admin.lastName} (${admin.email})`);
      }

      // Asegurar que el perfil de persona exista con su telefono correspondiente
      try {
        const existingProfile = await profileRepo.findOne({ where: { email: emailLower } });

        if (!existingProfile) {
          const profile = new PersonProfileEntity();
          profile.id = randomUUID();
          profile.userId = user.id;
          profile.name = admin.name;
          profile.lastName = admin.lastName;
          profile.documentType = 'V';
          profile.documentId = '00000000';
          profile.documentPhoto = '';
          profile.email = emailLower;
          profile.phone = admin.phone;
          profile.phone2 = '';
          profile.phoneType = 'mobile';
          profile.photo = '';
          profile.birthDate = '1990-01-01';
          profile.age = 30;
          profile.gender = 'N/A';
          profile.civilStatus = 'single';
          profile.height = '';
          profile.weight = '';
          profile.diseases = '';
          profile.familyDependents = 0;
          profile.countryOfOrigin = 'Venezuela';
          profile.countryOfResidence = 'Venezuela';
          profile.address = 'Caracas, Venezuela';
          profile.hobbies = '';
          profile.favoriteFood = '';
          profile.hasLaptopOrPc = false;
          profile.operatingSystem = '';
          profile.vehicleCount = 0;
          profile.hasDriverLicense = false;
          profile.enterpriseId = null;
          profile.department = 'IT';
          profile.position = 'Administrator';
          profile.startDate = '2026-01-01';
          profile.baseSalary = 0;
          profile.maxLoanLimit = 0;
          profile.employmentType = 'full-time';
          profile.employmentSector = 'technology';
          profile.timeInCompanyMonths = 1;
          profile.loanPurpose = '';
          profile.status = 'active';
          profile.socialMedia1 = '';
          profile.socialMedia2 = '';
          profile.socialMedia3 = '';
          profile.residenceType = '';
          profile.isResidenceOwned = false;
          profile.recurringIncome = 0;
          profile.nationalBank1 = '';
          profile.nationalBank2 = '';
          profile.nationalBank3 = '';
          profile.internationalBank = '';
          profile.creditCard = null;
          profile.debitCard = null;
          profile.personalReferences = [];
          profile.onboardingCompleted = true;
          profile.createdAt = new Date().toISOString();

          await profileRepo.save(profile);
          this.logger.log(`Perfil de persona creado con éxito para ${admin.name} ${admin.lastName} con teléfono ${admin.phone}`);
        } else {
          // Si el perfil ya existe, actualizamos el teléfono para asegurarnos de que tenga el teléfono correcto provisto
          existingProfile.phone = admin.phone;
          await profileRepo.save(existingProfile);
          this.logger.log(`Teléfono actualizado para el perfil de ${admin.name} ${admin.lastName}: ${admin.phone}`);
        }
      } catch (err) {
        this.logger.warn(`No se pudo crear o actualizar el perfil de persona para ${admin.name}: ${(err as Error).message}`);
      }
    }
  }
}
