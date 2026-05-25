import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '../../../auth/domain/user';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { Roles } from '../../../auth/presentation/guards/roles.decorator';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { IntegrationApiKeysService } from '../../application/integration-api-keys.service';
import {
  CreateIntegrationApiKeyDto,
  RevealIntegrationApiKeyDto,
  ToggleIntegrationApiKeyDto,
  UpdateIntegrationApiKeyDto,
} from './dto/integration-api-key.dto';

/**
 * Controlador admin para credenciales por banco e integracion.
 */
@Controller('admin/integration-api-keys')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class IntegrationApiKeysAdminController {
  constructor(private readonly service: IntegrationApiKeysService) {}

  /**
   * GET /api/admin/integration-api-keys - Lista credenciales registradas.
   */
  @Get()
  async list() {
    return this.service.list();
  }

  /**
   * POST /api/admin/integration-api-keys - Crea una credencial cifrada.
   */
  @Post()
  async create(@Body() body: CreateIntegrationApiKeyDto) {
    return this.service.create(body);
  }

  /**
   * PATCH /api/admin/integration-api-keys/:id - Actualiza una credencial.
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateIntegrationApiKeyDto,
  ) {
    return this.service.update(id, body);
  }

  /**
   * POST /api/admin/integration-api-keys/:id/reveal - Revela el valor real.
   */
  @Post(':id/reveal')
  async reveal(
    @Param('id') id: string,
    @Body() body: RevealIntegrationApiKeyDto,
  ) {
    return this.service.reveal(id, body.revealKey);
  }

  /**
   * POST /api/admin/integration-api-keys/:id/toggle-active - Activa o desactiva una credencial.
   */
  @Post(':id/toggle-active')
  async toggleActive(
    @Param('id') id: string,
    @Body() body: ToggleIntegrationApiKeyDto,
  ) {
    return this.service.toggleActive(id, body.isActive);
  }
}
