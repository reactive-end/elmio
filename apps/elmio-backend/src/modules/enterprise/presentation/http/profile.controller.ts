import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { ManageProfileUseCase } from '../../application/manage-profile.use-case';

/**
 * Controlador HTTP del perfil de persona (CLIENT / EMPLOYEE).
 */
@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly manageProfile: ManageProfileUseCase) {}

  /** GET /api/profile/me - Obtiene o crea el perfil del usuario autenticado. */
  @Get('me')
  async getMe(@Req() req: Request) {
    return this.manageProfile.getOrCreateProfile(req.session!.userId);
  }

  /** PATCH /api/profile/me - Actualiza datos del perfil. */
  @Patch('me')
  async updateMe(
    @Req() req: Request,
    @Body() body: Record<string, unknown>, // Acepta UpdatePersonProfileDto + datos basicos (nombre, cedula) durante el registro
  ) {
    return this.manageProfile.updateProfile(req.session!.userId, body);
  }

  /** PATCH /api/profile/me/complete-onboarding - Finaliza el onboarding del perfil. */
  @Patch('me/complete-onboarding')
  async completeOnboarding(@Req() req: Request) {
    return this.manageProfile.completeOnboarding(req.session!.userId);
  }
}
