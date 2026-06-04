import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { UserRole } from '../../domain/user';
import { UserEntity } from '../../infrastructure/entities/user.entity';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { hashPassword } from '../../helpers';

export class CreateFinanceUserDto {
  name!: string;
  cedula!: string;
  countryCode!: string;
  phone!: string;
  email!: string;
}

export class UpdateFinanceUserDto {
  name!: string;
  cedula!: string;
  countryCode!: string;
  phone!: string;
  email!: string;
}

@Controller('finance-users')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class FinanceUsersAdminController {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  @Get()
  async list(): Promise<Omit<UserEntity, 'passwordHash'>[]> {
    const users = await this.userRepo.find({
      where: { role: UserRole.FINANCE },
      order: { createdAt: 'DESC' },
    });
    return users.map(({ passwordHash, ...user }) => user);
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
  ): Promise<Omit<UserEntity, 'passwordHash'>> {
    const user = await this.userRepo.findOne({
      where: { id, role: UserRole.FINANCE },
    });
    if (!user) {
      throw new NotFoundException('Usuario de finanzas no encontrado.');
    }
    const { passwordHash, ...rest } = user;
    return rest;
  }

  @Post()
  async create(
    @Body() body: CreateFinanceUserDto,
  ): Promise<Omit<UserEntity, 'passwordHash'>> {
    const emailLower = body.email.trim().toLowerCase();
    const cedulaClean = body.cedula.trim().toLowerCase();

    // Validar email único dentro del rol FINANCE
    const existingEmail = await this.userRepo.findOne({
      where: { email: emailLower, role: UserRole.FINANCE },
    });
    if (existingEmail) {
      throw new ConflictException('Este correo electrónico ya está registrado para un usuario de finanzas.');
    }

    // Validar cédula única dentro del rol FINANCE (usamos la columna slug)
    const existingCedula = await this.userRepo.findOne({
      where: { slug: cedulaClean, role: UserRole.FINANCE },
    });
    if (existingCedula) {
      throw new ConflictException('La cédula ingresada ya está registrada para otro usuario de finanzas.');
    }

    const userId = randomUUID();
    const newUser = new UserEntity();
    newUser.id = userId;
    newUser.name = body.name.trim();
    newUser.email = emailLower;
    // Contraseña inicial es su cédula
    newUser.passwordHash = hashPassword(body.cedula.trim());
    newUser.role = UserRole.FINANCE;
    newUser.owner = userId;
    newUser.slug = cedulaClean; // Guardamos la cédula en la columna slug
    newUser.countryCode = body.countryCode.trim();
    newUser.phone = body.phone.trim();
    newUser.createdAt = new Date().toISOString();
    newUser.requirePasswordChange = true;

    const saved = await this.userRepo.save(newUser);
    const { passwordHash, ...rest } = saved;
    return rest;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateFinanceUserDto,
  ): Promise<Omit<UserEntity, 'passwordHash'>> {
    const user = await this.userRepo.findOne({
      where: { id, role: UserRole.FINANCE },
    });

    if (!user) {
      throw new NotFoundException('Usuario de finanzas no encontrado.');
    }

    const emailLower = body.email.trim().toLowerCase();
    const cedulaClean = body.cedula.trim().toLowerCase();

    const existingWithEmail = await this.userRepo.findOne({
      where: { email: emailLower, role: UserRole.FINANCE },
    });
    if (existingWithEmail && existingWithEmail.id !== id) {
      throw new ConflictException('Este correo electrónico ya está registrado para otro usuario de finanzas.');
    }

    const existingWithCedula = await this.userRepo.findOne({
      where: { slug: cedulaClean, role: UserRole.FINANCE },
    });
    if (existingWithCedula && existingWithCedula.id !== id) {
      throw new ConflictException('La cédula ingresada ya está registrada para otro usuario de finanzas.');
    }

    user.name = body.name.trim();
    user.email = emailLower;
    user.slug = cedulaClean; // Cédula en slug
    user.countryCode = body.countryCode.trim();
    user.phone = body.phone.trim();

    const saved = await this.userRepo.save(user);
    const { passwordHash, ...rest } = saved;
    return rest;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    const user = await this.userRepo.findOne({
      where: { id, role: UserRole.FINANCE },
    });

    if (!user) {
      throw new NotFoundException('Usuario de finanzas no encontrado.');
    }

    await this.userRepo.remove(user);
    return { success: true };
  }
}
