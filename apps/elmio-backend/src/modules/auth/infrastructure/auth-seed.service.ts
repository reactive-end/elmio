import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdmins();
  }

  private async seedAdmins(): Promise<void> {
    const defaultAdmins = [
      {
        name: 'Kelly Aular',
        email: 'kelly@elmio.app',
        password: 'Elmio.2026',
      },
      {
        name: 'Rafael Pisani',
        email: 'rafaelpisani19@gmail.com',
        password: 'Elmio.2026',
      },
    ];

    for (const admin of defaultAdmins) {
      const emailLower = admin.email.trim().toLowerCase();
      const existing = await this.userRepo.findOne({ where: { email: emailLower } });

      if (!existing) {
        const newAdmin = new UserEntity();
        newAdmin.id = randomUUID();
        newAdmin.name = admin.name.trim();
        newAdmin.email = emailLower;
        newAdmin.passwordHash = hashPassword(admin.password);
        newAdmin.role = 'ADMIN' as UserRole;
        newAdmin.owner = 'system';
        newAdmin.createdAt = new Date().toISOString();
        newAdmin.requirePasswordChange = false;

        await this.userRepo.save(newAdmin);
        this.logger.log(`Administrador por defecto creado con éxito: ${admin.name} (${admin.email})`);
      }
    }
  }
}
