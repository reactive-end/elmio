import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { UserRole } from '../../../auth/domain/user';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { Roles } from '../../../auth/presentation/guards/roles.decorator';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { EnterpriseInterestConfigService } from '../../application/enterprise-interest-config.service';
import { UpdateEnterpriseInterestConfigDto } from './dto/enterprise-interest-config.dto';

/**
 * Controlador admin para la tasa global por empresa.
 */
@Controller('enterprise-interest-configs')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class EnterpriseInterestConfigAdminController {
  constructor(private readonly service: EnterpriseInterestConfigService) {}

  /**
   * GET /api/admin/enterprise-interest-configs - Lista empresas con su configuracion de interes.
   */
  @Get()
  async list() {
    return this.service.list();
  }

  /**
   * GET /api/admin/enterprise-interest-configs/:enterpriseId - Obtiene la configuracion de una empresa.
   */
  @Get(':enterpriseId')
  async getByEnterpriseId(@Param('enterpriseId') enterpriseId: string) {
    return this.service.getByEnterpriseId(enterpriseId);
  }

  /**
   * PUT /api/admin/enterprise-interest-configs/:enterpriseId - Crea o actualiza la configuracion de interes.
   */
  @Put(':enterpriseId')
  async upsert(
    @Param('enterpriseId') enterpriseId: string,
    @Body() body: UpdateEnterpriseInterestConfigDto,
  ) {
    return this.service.upsert(enterpriseId, body);
  }
}
