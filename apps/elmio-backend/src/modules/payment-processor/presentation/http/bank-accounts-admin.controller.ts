import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../../auth/domain/user';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { Roles } from '../../../auth/presentation/guards/roles.decorator';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { RbacGroup } from '../../../auth/presentation/guards/rbac-group.decorator';
import { BankAccount } from '../../infrastructure/persistence/entities/bank-account.entity';
import { Bank } from '../../infrastructure/persistence/entities/bank.entity';
import { Currency } from '../../infrastructure/persistence/entities/currency.entity';
import { BankAccountType } from '../../infrastructure/persistence/entities/bank-account-type.entity';
import { ExchangeRate } from '../../infrastructure/persistence/entities/exchange-rate.entity';
import { ApiKey } from '../../infrastructure/persistence/entities/api-key.entity';
import { ApiKeyCipher } from '../../infrastructure/persistence/api-key-cipher.util';
import {
  CreateBankAccountDto,
  UpdateBankAccountDto,
  CreateCurrencyDto,
  UpdateCurrencyDto,
  UpsertBankAccountApiKeyDto,
} from './dtos/bank-accounts-admin.dto';

export interface CurrencyWithRate {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
  exchangeRate: number;
}

/**
 * Controlador administrativo para la gestión de cuentas bancarias y catálogos asociados.
 * Solo accesible para usuarios con el rol de ADMIN.
 */
@Controller()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BankAccountsAdminController implements OnModuleInit {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountRepo: Repository<BankAccount>,
    @InjectRepository(Bank)
    private readonly bankRepo: Repository<Bank>,
    @InjectRepository(Currency)
    private readonly currencyRepo: Repository<Currency>,
    @InjectRepository(BankAccountType)
    private readonly bankAccountTypeRepo: Repository<BankAccountType>,
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepo: Repository<ExchangeRate>,
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
  ) {}

  /**
   * Precarga el catálogo de los 26 bancos venezolanos, las monedas VES/USD y tipos de cuenta.
   */
  async onModuleInit(): Promise<void> {
    const seedBanks = [
      { bankCode: '0102', bankName: 'Banco de Venezuela' },
      { bankCode: '0104', bankName: 'Banco Venezolano de Crédito' },
      { bankCode: '0105', bankName: 'Banco Mercantil' },
      { bankCode: '0108', bankName: 'Banco Provincial' },
      { bankCode: '0114', bankName: 'Bancaribe' },
      { bankCode: '0115', bankName: 'Banco Exterior' },
      { bankCode: '0128', bankName: 'Banco Caroní' },
      { bankCode: '0134', bankName: 'Banesco' },
      { bankCode: '0137', bankName: 'Banco Sofitasa' },
      { bankCode: '0138', bankName: 'Banco Plaza' },
      { bankCode: '0146', bankName: 'Bangente' },
      { bankCode: '0151', bankName: 'Banco Fondo Común' },
      { bankCode: '0156', bankName: '100% Banco' },
      { bankCode: '0157', bankName: 'DelSur' },
      { bankCode: '0163', bankName: 'Banco del Tesoro' },
      { bankCode: '0166', bankName: 'Banco Agrícola de Venezuela' },
      { bankCode: '0168', bankName: 'Bancrecer' },
      { bankCode: '0169', bankName: 'R4' },
      { bankCode: '0171', bankName: 'Banco Activo' },
      { bankCode: '0172', bankName: 'Bancamiga' },
      { bankCode: '0173', bankName: 'Banco Internacional de Desarrollo' },
      { bankCode: '0174', bankName: 'Banplus' },
      {
        bankCode: '0175',
        bankName: 'Banco Digital de los Trabajadores / Bicentenario',
      },
      { bankCode: '0177', bankName: 'Banfanb' },
      { bankCode: '0178', bankName: 'N58 Banco Digital' },
      { bankCode: '0191', bankName: 'Banco Nacional de Crédito' },
    ];

    for (const sb of seedBanks) {
      const exists = await this.bankRepo.findOneBy({ bankCode: sb.bankCode });
      if (!exists) {
        const nb = new Bank();
        nb.bankCode = sb.bankCode;
        nb.bankName = sb.bankName;
        nb.isActive = true;
        await this.bankRepo.save(nb);
      }
    }

    const seedCurrencies = [
      { code: 'VES', name: 'Bolívares', symbol: 'Bs.' },
      { code: 'USD', name: 'Dólares', symbol: '$' },
    ];

    for (const sc of seedCurrencies) {
      const exists = await this.currencyRepo.findOneBy({ code: sc.code });
      if (!exists) {
        const nc = new Currency();
        nc.code = sc.code;
        nc.name = sc.name;
        nc.symbol = sc.symbol;
        nc.isActive = true;
        await this.currencyRepo.save(nc);
      }
    }

    const seedTypes = ['Corriente', 'Ahorro'];
    for (const st of seedTypes) {
      const exists = await this.bankAccountTypeRepo.findOneBy({
        accountType: st,
      });
      if (!exists) {
        const nt = new BankAccountType();
        nt.accountType = st;
        await this.bankAccountTypeRepo.save(nt);
      }
    }
  }

  /**
   * Lista todas las cuentas bancarias registradas.
   */
  @Get('bank-accounts')
  @RbacGroup('config-bank-accounts')
  async listAccounts(): Promise<BankAccount[]> {
    return this.bankAccountRepo.find({
      relations: { bank: true, currency: true, accountType: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtiene una cuenta bancaria por su ID.
   */
  @Get('bank-accounts/:id')
  @RbacGroup('config-bank-accounts')
  async getAccount(@Param('id') id: string): Promise<BankAccount> {
    const account = await this.bankAccountRepo.findOne({
      where: { id },
      relations: { bank: true, currency: true, accountType: true },
    });

    if (!account) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    return account;
  }

  /**
   * Registra una nueva cuenta bancaria corporativa.
   */
  @Post('bank-accounts')
  @RbacGroup('config-bank-accounts')
  async createAccount(
    @Body() body: CreateBankAccountDto,
  ): Promise<BankAccount> {
    const bank = await this.bankRepo.findOneBy({ id: body.bankId });
    const currency = await this.currencyRepo.findOneBy({ id: body.currencyId });
    const accountType = await this.bankAccountTypeRepo.findOneBy({
      id: body.accountTypeId,
    });

    if (!bank) {
      throw new BadRequestException('El banco seleccionado no es válido');
    }
    if (!currency) {
      throw new BadRequestException('La moneda seleccionada no es válida');
    }
    if (!accountType) {
      throw new BadRequestException(
        'El tipo de cuenta seleccionado no es válido',
      );
    }

    const account = new BankAccount();
    account.bank = bank;
    account.accountNumber = body.accountNumber;
    account.documentType = body.documentType;
    account.documentNumber = body.documentNumber;
    account.phoneNumber = body.phoneNumber;
    account.phoneValidationNumber = body.phoneValidationNumber ?? '';
    account.businessName = body.businessName ?? '';
    account.accountType = accountType;
    account.description = body.description ?? '';
    account.currency = currency;
    account.role = body.role ?? 'RECEPTOR';

    return this.bankAccountRepo.save(account);
  }

  /**
   * Actualiza una cuenta bancaria existente.
   */
  @Patch('bank-accounts/:id')
  @RbacGroup('config-bank-accounts')
  async updateAccount(
    @Param('id') id: string,
    @Body() body: UpdateBankAccountDto,
  ): Promise<BankAccount> {
    const account = await this.bankAccountRepo.findOne({
      where: { id },
      relations: { bank: true, currency: true, accountType: true },
    });

    if (!account) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    if (body.bankId) {
      const bank = await this.bankRepo.findOneBy({ id: body.bankId });
      if (!bank) {
        throw new BadRequestException('El banco seleccionado no es válido');
      }
      account.bank = bank;
    }

    if (body.currencyId) {
      const currency = await this.currencyRepo.findOneBy({
        id: body.currencyId,
      });
      if (!currency) {
        throw new BadRequestException('La moneda seleccionada no es válida');
      }
      account.currency = currency;
    }

    if (body.accountTypeId) {
      const accountType = await this.bankAccountTypeRepo.findOneBy({
        id: body.accountTypeId,
      });
      if (!accountType) {
        throw new BadRequestException(
          'El tipo de cuenta seleccionado no es válido',
        );
      }
      account.accountType = accountType;
    }

    if (body.accountNumber !== undefined) {
      account.accountNumber = body.accountNumber;
    }
    if (body.documentType !== undefined) {
      account.documentType = body.documentType;
    }
    if (body.documentNumber !== undefined) {
      account.documentNumber = body.documentNumber;
    }
    if (body.phoneNumber !== undefined) {
      account.phoneNumber = body.phoneNumber;
    }
    if (body.phoneValidationNumber !== undefined) {
      account.phoneValidationNumber = body.phoneValidationNumber ?? '';
    }
    if (body.businessName !== undefined) {
      account.businessName = body.businessName ?? '';
    }
    if (body.description !== undefined) {
      account.description = body.description;
    }
    if (body.role !== undefined) {
      account.role = body.role;
    }

    return this.bankAccountRepo.save(account);
  }

  /**
   * Elimina una cuenta bancaria.
   */
  @Delete('bank-accounts/:id')
  @RbacGroup('config-bank-accounts')
  async deleteAccount(@Param('id') id: string): Promise<{ success: boolean }> {
    const account = await this.bankAccountRepo.findOneBy({ id });

    if (!account) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    await this.bankAccountRepo.remove(account);
    return { success: true };
  }

  /**
   * Obtiene la lista de bancos activos.
   */
  @Get('banks')
  @RbacGroup('config-currencies')
  async listBanks(): Promise<Bank[]> {
    return this.bankRepo.find({
      where: { isActive: true },
      order: { bankName: 'ASC' },
    });
  }

  /**
   * Obtiene la lista de monedas activas e inyecta su tasa de cambio más reciente.
   */
  @Get('currencies')
  @RbacGroup('config-currencies')
  async listCurrencies(): Promise<CurrencyWithRate[]> {
    const list = await this.currencyRepo.find({
      relations: { exchangeRates: true },
      order: { name: 'ASC' },
    });

    return list.map((c) => {
      let lastRate = 1.0;
      if (c.code === 'VES') {
        lastRate = 1.0;
      } else if (c.exchangeRates && c.exchangeRates.length > 0) {
        const sorted = c.exchangeRates.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
        lastRate = Number(sorted[0].bolivaresPerUsd);
      }
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        isActive: c.isActive,
        exchangeRate: lastRate,
      };
    });
  }

  /**
   * Obtiene el detalle de una moneda por su ID, inyectando su tasa de cambio más reciente.
   */
  @Get('currencies/:id')
  @RbacGroup('config-currencies')
  async getCurrency(@Param('id') id: string): Promise<CurrencyWithRate> {
    const currency = await this.currencyRepo.findOne({
      where: { id },
      relations: { exchangeRates: true },
    });

    if (!currency) {
      throw new NotFoundException('Moneda no encontrada');
    }

    let lastRate = 1.0;
    if (currency.code === 'VES') {
      lastRate = 1.0;
    } else if (currency.exchangeRates && currency.exchangeRates.length > 0) {
      const sorted = currency.exchangeRates.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      lastRate = Number(sorted[0].bolivaresPerUsd);
    }

    return {
      id: currency.id,
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      isActive: currency.isActive,
      exchangeRate: lastRate,
    };
  }

  /**
   * Obtiene la lista de tipos de cuenta.
   */
  @Get('bank-account-types')
  @RbacGroup('config-currencies')
  async listAccountTypes(): Promise<BankAccountType[]> {
    return this.bankAccountTypeRepo.find({
      order: { accountType: 'ASC' },
    });
  }

  /**
   * Registra una nueva moneda en el sistema y guarda su tasa de cambio inicial.
   */
  @Post('currencies')
  @RbacGroup('config-currencies')
  async createCurrency(
    @Body() body: CreateCurrencyDto,
  ): Promise<CurrencyWithRate> {
    const codeUpper = body.code.trim().toUpperCase();
    if (codeUpper.length !== 3) {
      throw new BadRequestException(
        'El código ISO de la moneda debe ser exactamente de 3 caracteres (ej. EUR)',
      );
    }

    const exists = await this.currencyRepo.findOneBy({ code: codeUpper });
    if (exists) {
      throw new BadRequestException(
        `La moneda con código ${codeUpper} ya está registrada en el sistema.`,
      );
    }

    const currency = new Currency();
    currency.code = codeUpper;
    currency.name = body.name.trim();
    currency.symbol = body.symbol.trim();
    currency.isActive = true;

    const saved = await this.currencyRepo.save(currency);

    const rateVal =
      body.exchangeRate !== undefined ? Number(body.exchangeRate) : 1.0;
    const exchangeRate = new ExchangeRate();
    exchangeRate.currency = saved;
    exchangeRate.bolivaresPerUsd = rateVal;
    exchangeRate.effectiveDate = new Date();
    exchangeRate.source = 'manual';
    await this.exchangeRateRepo.save(exchangeRate);

    return {
      id: saved.id,
      code: saved.code,
      name: saved.name,
      symbol: saved.symbol,
      isActive: saved.isActive,
      exchangeRate: rateVal,
    };
  }

  /**
   * Actualiza una moneda en el sistema, permitiendo actualizar la tasa del Dólar (USD) y monedas personalizadas.
   */
  @Patch('currencies/:id')
  @RbacGroup('config-currencies')
  async updateCurrency(
    @Param('id') id: string,
    @Body() body: UpdateCurrencyDto,
  ): Promise<CurrencyWithRate> {
    const currency = await this.currencyRepo.findOneBy({ id });
    if (!currency) {
      throw new NotFoundException('Moneda no encontrada');
    }

    if (currency.code === 'USD' || currency.code === 'VES') {
      if (currency.code === 'VES') {
        throw new BadRequestException(
          'La moneda Bolívares (VES) está totalmente protegida y no puede ser modificada.',
        );
      }
      if (body.name !== undefined || body.symbol !== undefined) {
        throw new BadRequestException(
          'El nombre y símbolo de la moneda Dólares (USD) están protegidos y no pueden ser modificados.',
        );
      }
    }

    if (body.name !== undefined) {
      currency.name = body.name.trim();
    }
    if (body.symbol !== undefined) {
      currency.symbol = body.symbol.trim();
    }

    const saved = await this.currencyRepo.save(currency);

    let rateVal = 1.0;
    if (body.exchangeRate !== undefined) {
      rateVal = Number(body.exchangeRate);
      const exchangeRate = new ExchangeRate();
      exchangeRate.currency = saved;
      exchangeRate.bolivaresPerUsd = rateVal;
      exchangeRate.effectiveDate = new Date();
      exchangeRate.source = 'manual';
      await this.exchangeRateRepo.save(exchangeRate);
    } else {
      const rates = await this.exchangeRateRepo.find({
        where: { currency: { id: saved.id } },
        order: { createdAt: 'DESC' },
      });
      if (rates.length > 0) {
        rateVal = Number(rates[0].bolivaresPerUsd);
      }
    }

    return {
      id: saved.id,
      code: saved.code,
      name: saved.name,
      symbol: saved.symbol,
      isActive: saved.isActive,
      exchangeRate: rateVal,
    };
  }

  /**
   * Elimina una moneda del sistema, a excepción de las primordiales (USD/VES).
   */
  @Delete('currencies/:id')
  @RbacGroup('config-currencies')
  async deleteCurrency(@Param('id') id: string): Promise<{ success: boolean }> {
    const currency = await this.currencyRepo.findOneBy({ id });
    if (!currency) {
      throw new NotFoundException('Moneda no encontrada');
    }

    if (currency.code === 'USD' || currency.code === 'VES') {
      throw new BadRequestException(
        'Las monedas primordiales (USD, VES) están protegidas y no pueden ser eliminadas.',
      );
    }

    await this.currencyRepo.remove(currency);
    return { success: true };
  }

  /* ── API Key endpoints ─────────────────────────────────────────────── */

  /**
   * Obtiene la metadata de la API key activa asociada a una cuenta bancaria.
   * No expone los valores planos por seguridad.
   */
  @Get('bank-accounts/:id/api-key')
  @RbacGroup('config-bank-accounts')
  async getApiKeyMeta(
    @Param('id') id: string,
  ): Promise<{ exists: boolean; isActive: boolean }> {
    const account = await this.bankAccountRepo.findOneBy({ id });
    if (!account) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    const key = await this.apiKeyRepo.findOne({
      where: { bankAccount: { id } },
      order: { createdAt: 'DESC' },
    });

    return {
      exists: !!key,
      isActive: key?.isActive ?? false,
    };
  }

  /**
   * Crea o reemplaza (upsert) la API key de una cuenta bancaria.
   * Las claves se encriptan antes de persistirse.
   */
  @Post('bank-accounts/:id/api-key')
  @RbacGroup('config-bank-accounts')
  async upsertApiKey(
    @Param('id') id: string,
    @Body() body: UpsertBankAccountApiKeyDto,
  ): Promise<{ success: boolean }> {
    const account = await this.bankAccountRepo.findOneBy({ id });
    if (!account) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    // Desactivar cualquier key previa
    await this.apiKeyRepo.update({ bankAccount: { id } }, { isActive: false });

    const key = new ApiKey();
    key.bankAccount = account;
    key.commerceKey = ApiKeyCipher.encrypt(body.commerceKey);
    key.secretKey = body.secretKey
      ? ApiKeyCipher.encrypt(body.secretKey)
      : null;
    key.extraKey = body.extraKey ? ApiKeyCipher.encrypt(body.extraKey) : null;
    key.isActive = true;

    await this.apiKeyRepo.save(key);
    return { success: true };
  }

  /**
   * Activa o desactiva la API key más reciente de una cuenta bancaria.
   */
  @Patch('bank-accounts/:id/api-key/toggle')
  @RbacGroup('config-bank-accounts')
  async toggleApiKey(
    @Param('id') id: string,
  ): Promise<{ success: boolean; isActive: boolean }> {
    const account = await this.bankAccountRepo.findOneBy({ id });
    if (!account) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    const key = await this.apiKeyRepo.findOne({
      where: { bankAccount: { id } },
      order: { createdAt: 'DESC' },
    });

    if (!key) {
      throw new NotFoundException(
        'No hay credenciales API asociadas a esta cuenta',
      );
    }

    key.isActive = !key.isActive;
    await this.apiKeyRepo.save(key);

    return { success: true, isActive: key.isActive };
  }

  /**
   * Elimina todas las credenciales API asociadas a una cuenta bancaria.
   */
  @Delete('bank-accounts/:id/api-key')
  @RbacGroup('config-bank-accounts')
  async deleteApiKey(@Param('id') id: string): Promise<{ success: boolean }> {
    const account = await this.bankAccountRepo.findOneBy({ id });
    if (!account) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    await this.apiKeyRepo.delete({ bankAccount: { id } });
    return { success: true };
  }
}
