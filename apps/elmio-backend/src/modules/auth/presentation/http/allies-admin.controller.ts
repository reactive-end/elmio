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

export class CreateAlliedDto {
  name!: string;
  slug!: string;
  countryCode!: string;
  phone!: string;
  email?: string;
  password!: string;
}

export class UpdateAlliedDto {
  name!: string;
  slug!: string;
  countryCode!: string;
  phone!: string;
  email?: string;
  password?: string;
}

@Controller('allies')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AlliesAdminController {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  @Get()
  async list(): Promise<Omit<UserEntity, 'passwordHash'>[]> {
    const allies = await this.userRepo.find({
      where: { role: UserRole.ALLIED },
      order: { createdAt: 'DESC' },
    });
    return allies.map(({ passwordHash, ...user }) => user);
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
  ): Promise<Omit<UserEntity, 'passwordHash'>> {
    const ally = await this.userRepo.findOne({
      where: { id, role: UserRole.ALLIED },
    });
    if (!ally) {
      throw new NotFoundException('Aliado no encontrado.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = ally;
    return rest;
  }

  @Post()
  async create(
    @Body() body: CreateAlliedDto,
  ): Promise<Omit<UserEntity, 'passwordHash'>> {
    if (body.email) {
      const existingEmail = await this.userRepo.findOne({
        where: { email: body.email.trim().toLowerCase() },
      });
      if (existingEmail) {
        throw new ConflictException('El correo electrónico ya está registrado.');
      }
    }

    if (body.slug) {
      const existingSlug = await this.userRepo.findOne({
        where: { slug: body.slug.trim().toLowerCase() },
      });
      if (existingSlug) {
        throw new ConflictException('El slug del aliado ya está en uso.');
      }
    }

    const userId = randomUUID();
    const newUser = new UserEntity();
    newUser.id = userId;
    newUser.name = body.name.trim();
    newUser.email = body.email ? body.email.trim().toLowerCase() : `${body.phone}@elmio.com`;
    newUser.passwordHash = hashPassword(body.password);
    newUser.role = UserRole.ALLIED;
    newUser.owner = userId;
    newUser.slug = body.slug ? body.slug.trim().toLowerCase() : null;
    newUser.countryCode = body.countryCode.trim();
    newUser.phone = body.phone.trim();
    newUser.createdAt = new Date().toISOString();
    newUser.requirePasswordChange = false;

    const saved = await this.userRepo.save(newUser);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = saved;
    return rest;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAlliedDto,
  ): Promise<Omit<UserEntity, 'passwordHash'>> {
    const ally = await this.userRepo.findOne({
      where: { id, role: UserRole.ALLIED },
    });

    if (!ally) {
      throw new NotFoundException('Aliado no encontrado.');
    }

    if (body.email) {
      const existingWithEmail = await this.userRepo.findOne({
        where: { email: body.email.trim().toLowerCase() },
      });
      if (existingWithEmail && existingWithEmail.id !== id) {
        throw new ConflictException('El correo electrónico ya está registrado por otro usuario.');
      }
    }

    if (body.slug) {
      const existingWithSlug = await this.userRepo.findOne({
        where: { slug: body.slug.trim().toLowerCase() },
      });
      if (existingWithSlug && existingWithSlug.id !== id) {
        throw new ConflictException('El slug del aliado ya está en uso por otro aliado.');
      }
    }

    ally.name = body.name.trim();
    ally.email = body.email ? body.email.trim().toLowerCase() : ally.email;
    ally.slug = body.slug ? body.slug.trim().toLowerCase() : null;
    ally.countryCode = body.countryCode.trim();
    ally.phone = body.phone.trim();

    if (body.password && body.password.trim().length > 0) {
      ally.passwordHash = hashPassword(body.password);
    }

    const saved = await this.userRepo.save(ally);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = saved;
    return rest;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    const ally = await this.userRepo.findOne({
      where: { id, role: UserRole.ALLIED },
    });

    if (!ally) {
      throw new NotFoundException('Aliado no encontrado.');
    }

    await this.userRepo.remove(ally);
    return { success: true };
  }
}
