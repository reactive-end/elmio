import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { UserEntity } from './entities/user.entity';
import { hashPassword } from '../helpers';
import { UserRole } from '../domain/user';

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
        const existingProfile: any[] = await this.dataSource.query(
          `SELECT id FROM person_profiles WHERE email = $1 LIMIT 1`,
          [emailLower],
        );

        if (existingProfile.length === 0) {
          const profileId = randomUUID();
          await this.dataSource.query(
            `INSERT INTO person_profiles (
              id, "userId", name, "lastName", "documentType", "documentId", "documentPhoto",
              email, phone, "phone2", "phoneType", photo, "birthDate", age, gender, "civilStatus",
              height, weight, diseases, "familyDependents", "countryOfOrigin", "countryOfResidence",
              address, hobbies, "favoriteFood", "hasLaptopOrPc", "operatingSystem", "vehicleCount",
              "hasDriverLicense", "enterpriseId", department, position, "startDate", "baseSalary",
              "maxLoanLimit", "employmentType", "employmentSector", "timeInCompanyMonths", "loanPurpose",
              status, "socialMedia1", "socialMedia2", "socialMedia3", "residenceType", "isResidenceOwned",
              "recurringIncome", "nationalBank1", "nationalBank2", "nationalBank3", "internationalBank",
              "creditCard", "debitCard", "personalReferences", "onboardingCompleted", "createdAt"
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
              $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
              $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
              $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55
            )`,
            [
              profileId,
              user.id,
              admin.name,
              admin.lastName,
              'V',
              '00000000',
              '',
              emailLower,
              admin.phone,
              '',
              'mobile',
              '',
              '1990-01-01',
              30,
              'N/A',
              'single',
              '',
              '',
              '',
              0,
              'Venezuela',
              'Venezuela',
              'Caracas, Venezuela',
              '',
              '',
              false,
              '',
              0,
              false,
              null,
              'IT',
              'Administrator',
              '2026-01-01',
              0,
              0,
              'full-time',
              'technology',
              1,
              '',
              'active',
              '',
              '',
              '',
              '',
              false,
              0,
              '',
              '',
              '',
              '',
              null,
              null,
              '[]',
              true,
              new Date().toISOString(),
            ],
          );
          this.logger.log(`Perfil de persona creado con éxito para ${admin.name} ${admin.lastName} con teléfono ${admin.phone}`);
        } else {
          // Si el perfil ya existe, actualizamos el teléfono para asegurarnos de que tenga el teléfono correcto provisto
          await this.dataSource.query(
            `UPDATE person_profiles SET phone = $1 WHERE email = $2`,
            [admin.phone, emailLower],
          );
          this.logger.log(`Teléfono actualizado para el perfil de ${admin.name} ${admin.lastName}: ${admin.phone}`);
        }
      } catch (err) {
        this.logger.warn(`No se pudo crear o actualizar el perfil de persona para ${admin.name}: ${(err as Error).message}`);
      }
    }
  }
}
