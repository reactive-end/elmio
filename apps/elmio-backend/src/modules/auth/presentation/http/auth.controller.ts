import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { DiscoverProfilesUseCase } from '../../application/discover-profiles.use-case';
import { LoginUseCase } from '../../application/login.use-case';
import { RegisterUseCase } from '../../application/register.use-case';
import { ChangePasswordUseCase } from '../../application/change-password.use-case';
import { AuthGuard } from '../guards/auth.guard';
import { DiscoverProfilesDto } from './dto/discover-profiles.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { UserRole } from '../../domain/user';

interface LoginResponseDto {
  token?: string;
  user?: {
    userId: string;
    email: string;
    role: UserRole | string;
    owner: string;
    requirePasswordChange?: boolean;
  };
  passwordRequired?: boolean;
  multipleProfiles?: boolean;
  profiles?: Array<{
    userId: string;
    name: string;
    role: UserRole | string;
  }>;
}

interface RegisterResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  owner: string;
  createdAt: string;
}

/**
 * Controlador HTTP de autenticacion.
 * Expone login y registro de usuarios.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly discoverProfilesUseCase: DiscoverProfilesUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  /**
   * Resuelve los perfiles disponibles para un correo o telefono.
   * `POST /api/auth/discover-profiles`
   * @param body Identificador de acceso.
   * @returns Lista de perfiles encontrados.
   */
  @Post('discover-profiles')
  async discoverProfiles(@Body() body: DiscoverProfilesDto) {
    return this.discoverProfilesUseCase.execute(body.identifier);
  }

  /**
   * Inicia sesion y devuelve un token de autenticacion.
   * `POST /api/auth/login`
   * @param body Credenciales del usuario.
   * @returns Token de sesion y datos del usuario.
   */
  @Post('login')
  async login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    return this.loginUseCase.execute(body);
  }

  /**
   * Registra un nuevo usuario en el sistema.
   * `POST /api/auth/register`
   * @param body Datos de registro del usuario.
   * @returns Usuario creado.
   */
  @Post('register')
  async register(@Body() body: RegisterDto): Promise<RegisterResponseDto> {
    return this.registerUseCase.execute(body);
  }

  /**
   * Cambia la password del usuario autenticado.
   * `PATCH /api/auth/change-password`
   * @param req Request con sesion del usuario autenticado.
   * @param body Password actual y nueva.
   * @returns Usuario actualizado.
   */
  @Patch('change-password')
  @UseGuards(AuthGuard)
  async changePassword(@Req() req: Request, @Body() body: ChangePasswordDto) {
    return this.changePasswordUseCase.execute(
      req.session!.userId,
      body.currentPassword,
      body.newPassword,
    );
  }
}
