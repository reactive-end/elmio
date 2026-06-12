import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { RequestRecoveryUseCase } from '../application/request-recovery.use-case';
import type { RequestRecoveryResult } from '../application/request-recovery.use-case';
import { VerifyCodeUseCase } from '../application/verify-code.use-case';
import type { VerifyCodeResult } from '../application/verify-code.use-case';
import { ResetPasswordUseCase } from '../application/reset-password.use-case';
import type { ResetPasswordResult } from '../application/reset-password.use-case';
import { CheckRecoveryAvailabilityUseCase } from '../application/check-recovery-availability.use-case';
import type { RecoveryAvailabilityResult } from '../application/check-recovery-availability.use-case';
import { RequestRecoveryDto } from './dtos/request-recovery.dto';
import { VerifyCodeDto } from './dtos/verify-code.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

/**
 * Controlador para la gestion de recuperacion de contrasenas.
 * Expone endpoints publicos para iniciar la solicitud, verificar el OTP y restablecer la contrasena.
 */
@Controller('password-recovery')
export class PasswordRecoveryController {
  constructor(
    private readonly requestRecoveryUseCase: RequestRecoveryUseCase,
    private readonly verifyCodeUseCase: VerifyCodeUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly checkRecoveryAvailabilityUseCase: CheckRecoveryAvailabilityUseCase,
  ) {}

  /**
   * Endpoint publico que indica si los canales de recuperacion de contrasena
   * (WhatsApp o email) estan operativos. Pensado para que el frontend
   * muestre un mensaje de indisponibilidad antes de habilitar el formulario.
   * `GET /api/password-recovery/availability`
   * @returns Banderas `whatsappReady`, `emailConfigured` y `available` agregada.
   */
  @Get('availability')
  @HttpCode(HttpStatus.OK)
  checkAvailability(): RecoveryAvailabilityResult {
    return this.checkRecoveryAvailabilityUseCase.execute();
  }

  /**
   * Endpoint para solicitar un codigo de recuperacion.
   * Envia un codigo OTP de 6 digitos por WhatsApp o Email (fallback).
   * @param dto - Contiene el email del usuario.
   * @returns Confirmacion generica del envio.
   */
  @Post('request')
  @HttpCode(HttpStatus.OK)
  async requestRecovery(
    @Body() dto: RequestRecoveryDto,
  ): Promise<RequestRecoveryResult> {
    return this.requestRecoveryUseCase.execute(dto.email);
  }

  /**
   * Endpoint para verificar el codigo OTP provisto por el usuario.
   * @param dto - Contiene el email y el codigo OTP.
   * @returns Token temporal JWT de restablecimiento si es valido.
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Body() dto: VerifyCodeDto): Promise<VerifyCodeResult> {
    return this.verifyCodeUseCase.execute(dto.email, dto.code);
  }

  /**
   * Endpoint para restablecer la contrasena utilizando el token temporal.
   * @param dto - Contiene el token temporal JWT y la nueva contrasena.
   * @returns Mensaje de exito en la actualizacion.
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ResetPasswordResult> {
    return this.resetPasswordUseCase.execute(dto.token, dto.newPassword);
  }
}
