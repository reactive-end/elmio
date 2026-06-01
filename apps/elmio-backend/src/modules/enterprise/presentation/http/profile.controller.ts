import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { ManageProfileUseCase } from '../../application/manage-profile.use-case';
import { ManageLoanRequestsUseCase } from '../../application/manage-loan-requests.use-case';
import { GetAccountStatementUseCase } from '../../application/get-account-statement.use-case';
import { CreateTransactionUseCase } from '../../application/create-transaction.use-case';
import { CreateTransactionDto } from './dto/enterprise.dto';
import type { LoanRequest } from '../../domain/enterprise';

/**
 * Controlador HTTP del perfil de persona (CLIENT / EMPLOYEE).
 */
@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(
    private readonly manageProfile: ManageProfileUseCase,
    private readonly manageRequests: ManageLoanRequestsUseCase,
    private readonly getAccountStatement: GetAccountStatementUseCase,
    private readonly createTransactionUseCase: CreateTransactionUseCase,
  ) {}

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

  /** GET /api/profile/me/requests - Lista solicitudes del colaborador autenticado. */
  @Get('me/requests')
  async listMyRequests(
    @Req() req: Request,
    @Query('status') status?: LoanRequest['status'],
  ) {
    const profile = await this.manageProfile.getOrCreateProfile(
      req.session!.userId,
    );
    return this.manageRequests.listByCollaborator(profile.id, status);
  }

  /** GET /api/profile/me/account-statement - Resumen de estado de cuenta del colaborador. */
  @Get('me/account-statement')
  async getMyAccountStatement(@Req() req: Request) {
    const profile = await this.manageProfile.getOrCreateProfile(
      req.session!.userId,
    );
    return this.getAccountStatement.getCollaboratorSummary(profile.id);
  }

  /** GET /api/profile/me/transactions - Lista movimientos del colaborador autenticado. */
  @Get('me/transactions')
  async listMyTransactions(@Req() req: Request) {
    const profile = await this.manageProfile.getOrCreateProfile(
      req.session!.userId,
    );
    return this.getAccountStatement.getCollaboratorTransactions(profile.id);
  }

  /** POST /api/profile/me/transactions - Registra un movimiento del colaborador autenticado. */
  @Post('me/transactions')
  async createMyTransaction(
    @Req() req: Request,
    @Body() body: CreateTransactionDto,
  ) {
    const profile = await this.manageProfile.getOrCreateProfile(
      req.session!.userId,
    );

    return this.createTransactionUseCase.execute(profile.enterpriseId, {
      ...body,
      collaboratorId: profile.id,
    });
  }
}
