import { Body, Controller, Post } from '@nestjs/common';
import { LoginUseCase } from '../../application/login.use-case';
import { RegisterUseCase } from '../../application/register.use-case';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { UserRole } from '../../domain/user';

interface LoginResponseDto {
  token: string;
  user: {
    userId: string;
    email: string;
    role: UserRole;
    owner: string;
  };
}

interface RegisterResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
  ) {}

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
}
