import { Controller, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Entidades e imports del dominio
import { UserEntity } from '../../../auth/infrastructure/entities/user.entity';
import { PersonProfileEntity } from '../../../enterprise/infrastructure/entities/person-profile.entity';
import { MarketplaceEntity } from '../../../marketplace/infrastructure/entities/marketplace.entity';
import { UserRole } from '../../../auth/domain/user';
import { hashPassword } from '../../../auth/helpers';

@Controller('migration')
export class MigrationController {
  private readonly logger = new Logger(MigrationController.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Parseador robusto de CSV nativo compatible con saltos de linea y comillas en JSON.
   */
  private parseCsv(content: string): string[][] {
    const result: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentField = '';

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++; // Saltar la comilla doble escapada
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentField);
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentField);
        result.push(row);
        row = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    if (row.length > 0 || currentField) {
      row.push(currentField);
      result.push(row);
    }
    return result.filter(r => r.length > 0 && r.some(cell => cell.trim() !== ''));
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runMigration() {
    this.logger.log('Iniciando proceso de migración de usuarios y marketplaces viejos...');

    const rootDir = process.cwd();
    
    // Lista de posibles ubicaciones de los archivos CSV (desarrollo y compilado en dist)
    const possibleUsersPaths = [
      path.join(rootDir, 'src', 'shared', 'database', 'migrations', 'data', 'usuarios.csv'),
      path.join(rootDir, 'dist', 'shared', 'database', 'migrations', 'data', 'usuarios.csv'),
      path.join(rootDir, 'apps', 'elmio-backend', 'src', 'shared', 'database', 'migrations', 'data', 'usuarios.csv'),
      path.join(rootDir, 'apps', 'elmio-backend', 'dist', 'shared', 'database', 'migrations', 'data', 'usuarios.csv'),
      path.join(__dirname, '..', '..', '..', 'shared', 'database', 'migrations', 'data', 'usuarios.csv'),
      path.join(__dirname, '..', '..', 'shared', 'database', 'migrations', 'data', 'usuarios.csv'),
      path.join(rootDir, 'usuarios.csv'), // Fallback clásico
    ];

    const possibleMarketplacesPaths = [
      path.join(rootDir, 'src', 'shared', 'database', 'migrations', 'data', 'marketplaces.csv'),
      path.join(rootDir, 'dist', 'shared', 'database', 'migrations', 'data', 'marketplaces.csv'),
      path.join(rootDir, 'apps', 'elmio-backend', 'src', 'shared', 'database', 'migrations', 'data', 'marketplaces.csv'),
      path.join(rootDir, 'apps', 'elmio-backend', 'dist', 'shared', 'database', 'migrations', 'data', 'marketplaces.csv'),
      path.join(__dirname, '..', '..', '..', 'shared', 'database', 'migrations', 'data', 'marketplaces.csv'),
      path.join(__dirname, '..', '..', 'shared', 'database', 'migrations', 'data', 'marketplaces.csv'),
      path.join(rootDir, 'marketplaces.csv'), // Fallback clásico
    ];

    let usersCsvPath = '';
    let marketplacesCsvPath = '';

    for (const p of possibleUsersPaths) {
      if (fs.existsSync(p)) {
        usersCsvPath = p;
        break;
      }
    }

    for (const p of possibleMarketplacesPaths) {
      if (fs.existsSync(p)) {
        marketplacesCsvPath = p;
        break;
      }
    }

    if (!usersCsvPath) {
      throw new Error(`El archivo usuarios.csv no se encuentra en las rutas intentadas: ${JSON.stringify(possibleUsersPaths, null, 2)}`);
    }
    if (!marketplacesCsvPath) {
      throw new Error(`El archivo marketplaces.csv no se encuentra en las rutas intentadas: ${JSON.stringify(possibleMarketplacesPaths, null, 2)}`);
    }

    this.logger.log(`Archivos CSV encontrados con éxito.`);
    this.logger.log(`usuarios.csv en: ${usersCsvPath}`);
    this.logger.log(`marketplaces.csv en: ${marketplacesCsvPath}`);

    // Inicializar cliente GCS (Se desactiva la interacción con GCS a petición del usuario ya que las imágenes ya están ubicadas)
    const bucketName = process.env.GCS_BUCKET_NAME || 'elmio-img';

    // Repositorios de base de datos
    const userRepo = this.dataSource.getRepository(UserEntity);
    const profileRepo = this.dataSource.getRepository(PersonProfileEntity);
    const marketplaceRepo = this.dataSource.getRepository(MarketplaceEntity);

    // Leer y parsear CSVs
    const usersCsvContent = fs.readFileSync(usersCsvPath, 'utf8');
    const marketplacesCsvContent = fs.readFileSync(marketplacesCsvPath, 'utf8');

    const usersRows = this.parseCsv(usersCsvContent);
    const marketplacesRows = this.parseCsv(marketplacesCsvContent);

    // Remover cabeceras
    const usersHeader = usersRows.shift();
    const marketplacesHeader = marketplacesRows.shift();

    this.logger.log(`Total filas de usuarios a procesar: ${usersRows.length}`);
    this.logger.log(`Total filas de marketplaces a procesar: ${marketplacesRows.length}`);

    const oldToNewUserIdMap: Record<string, { newUserId: string; slug: string }> = {};
    const stats = {
      usersProcessed: 0,
      usersMigrated: 0,
      marketplacesProcessed: 0,
      marketplacesMigrated: 0,
      imagesCopied: 0,
      errors: [] as string[],
    };

    // 1. MIGRACIÓN DE USUARIOS
    for (const row of usersRows) {
      try {
        stats.usersProcessed++;
        const [
          oldId,
          name,
          slugRaw,
          countryCode,
          phone,
          emailRaw,
          , // passwordHash vieja (ignorar)
          , // isActive
          , // role_id
          createdAtRaw,
        ] = row;

        const slug = slugRaw?.trim();
        if (!slug || slug.toLowerCase() === 'null') {
          this.logger.log(`Ignorando usuario ${name} porque no tiene un slug válido.`);
          continue;
        }

        const cleanSlug = slug.toLowerCase();
        const email = emailRaw && emailRaw.toLowerCase() !== 'null' ? emailRaw.trim().toLowerCase() : `${cleanSlug}@elmio.app`;

        // Verificar si ya existe en la nueva DB
        let existingUser = await userRepo.findOne({ where: { slug: cleanSlug } });
        let newUserId = existingUser ? existingUser.id : randomUUID();

        if (!existingUser) {
          // El hash para la contraseña Elmio.2026
          const newPasswordHash = hashPassword('Elmio.2026');

          const user = new UserEntity();
          user.id = newUserId;
          user.name = name ? name.trim() : 'Aliado Importado';
          user.email = email;
          user.passwordHash = newPasswordHash;
          user.role = UserRole.ALLIED;
          user.owner = cleanSlug;
          user.slug = cleanSlug;
          user.countryCode = countryCode && countryCode !== 'NULL' ? countryCode.trim() : '+58';
          user.phone = phone && phone !== 'NULL' ? phone.trim() : '';
          user.createdAt = createdAtRaw && createdAtRaw !== 'NULL' ? new Date(createdAtRaw.trim()).toISOString() : new Date().toISOString();
          user.requirePasswordChange = false;

          await userRepo.save(user);

          // Crear perfil de persona
          const profile = new PersonProfileEntity();
          profile.id = randomUUID();
          profile.userId = newUserId;
          profile.name = user.name;
          profile.lastName = '';
          profile.documentType = 'J';
          profile.documentId = '00000000';
          profile.documentPhoto = '';
          profile.email = user.email;
          profile.phone = user.phone;
          profile.phone2 = '';
          profile.phoneType = 'mobile';
          profile.photo = '';
          profile.birthDate = '1990-01-01';
          profile.age = 30;
          profile.gender = 'N/A';
          profile.civilStatus = 'single';
          profile.height = '';
          profile.weight = '';
          profile.diseases = '';
          profile.familyDependents = 0;
          profile.countryOfOrigin = 'Venezuela';
          profile.countryOfResidence = 'Venezuela';
          profile.address = 'Caracas, Venezuela';
          profile.hobbies = '';
          profile.favoriteFood = '';
          profile.hasLaptopOrPc = false;
          profile.operatingSystem = '';
          profile.vehicleCount = 0;
          profile.hasDriverLicense = false;
          profile.enterpriseId = null;
          profile.department = 'IT';
          profile.position = 'Allied';
          profile.startDate = '2026-01-01';
          profile.baseSalary = 0;
          profile.maxLoanLimit = 0;
          profile.employmentType = 'full-time';
          profile.employmentSector = 'insurance';
          profile.timeInCompanyMonths = 1;
          profile.loanPurpose = '';
          profile.status = 'active';
          profile.socialMedia1 = '';
          profile.socialMedia2 = '';
          profile.socialMedia3 = '';
          profile.residenceType = '';
          profile.isResidenceOwned = false;
          profile.recurringIncome = 0;
          profile.nationalBank1 = '';
          profile.nationalBank2 = '';
          profile.nationalBank3 = '';
          profile.internationalBank = '';
          profile.creditCard = null;
          profile.debitCard = null;
          profile.personalReferences = [];
          profile.onboardingCompleted = true;
          profile.createdAt = new Date().toISOString();

          await profileRepo.save(profile);
          stats.usersMigrated++;
          this.logger.log(`Usuario y Perfil creados con éxito para aliado: ${user.name} (${cleanSlug})`);
        } else {
          this.logger.log(`Usuario aliado ya existe en la DB: ${existingUser.name} (${cleanSlug}). Reutilizando su ID.`);
        }

        oldToNewUserIdMap[oldId] = { newUserId, slug: cleanSlug };
      } catch (err) {
        const errMsg = `Error al migrar usuario en fila: ${JSON.stringify(row)}. Detalle: ${(err as Error).message}`;
        this.logger.error(errMsg);
        stats.errors.push(errMsg);
      }
    }

    // 2. MIGRACIÓN DE MARKETPLACES
    for (const row of marketplacesRows) {
      try {
        stats.marketplacesProcessed++;
        const [
          oldMarketplaceId,
          nameRaw,
          , // isActive
          sectionsRaw,
          , // whatsapp
          , // cart
          , // login
          , // createdAt
          , // updatedAt
          ownerIdRaw,
        ] = row;

        const oldOwnerId = ownerIdRaw?.trim();
        if (!oldOwnerId || oldOwnerId.toLowerCase() === 'null') {
          this.logger.log(`Ignorando marketplace "${nameRaw}" porque no tiene ownerId asociado (es el de la empresa vieja).`);
          continue;
        }

        const ownerData = oldToNewUserIdMap[oldOwnerId];
        if (!ownerData) {
          this.logger.log(`Ignorando marketplace "${nameRaw}" porque su owner viejo ${oldOwnerId} no fue migrado (no tiene slug válido).`);
          continue;
        }

        const { newUserId, slug: slugAliado } = ownerData;

        // Limpiar el nombre quitando "(importada)" globalmente e insensible
        const cleanName = nameRaw.replace(/\(importada\)/gi, '').replace(/\s+/g, ' ').trim();

        this.logger.log(`Migrando marketplace "${cleanName}" para el aliado "${slugAliado}"...`);

        // Parsear sections
        let sections: any[] = [];
        if (sectionsRaw && sectionsRaw !== 'NULL') {
          try {
            sections = JSON.parse(sectionsRaw);
          } catch (e) {
            this.logger.warn(`No se pudo parsear el JSON de secciones del marketplace "${cleanName}": ${(e as Error).message}`);
          }
        }

        // Función recursiva para buscar y migrar imágenes viejas al nuevo formato multitenant esperado
        const processObjectImages = async (obj: any): Promise<any> => {
          if (typeof obj === 'string') {
            if (obj.includes('/marketplace/')) {
              // Extraer la ruta física en el bucket
              const match = obj.match(/https:\/\/storage\.googleapis\.com\/[^\/]+\/(.+)/);
              if (match) {
                const oldPathInBucket = decodeURIComponent(match[1]);

                // Procesar únicamente si pertenece a la carpeta vieja 'marketplace/'
                if (oldPathInBucket.startsWith('marketplace/')) {
                  try {
                    // Extraer nombre original de la imagen
                    const parts = oldPathInBucket.split('/');
                    const originalName = parts[parts.length - 1];

                    const newObjectKey = `gallery/${slugAliado}/images/${originalName}`;

                    // Devolver nueva URL pública multitenant directamente
                    const publicBaseUrl = process.env.GCS_PUBLIC_BASE_URL?.trim();
                    if (publicBaseUrl) {
                      return `${publicBaseUrl.replace(/\/$/, '')}/${newObjectKey}`;
                    }
                    return `https://storage.googleapis.com/${bucketName}/${newObjectKey}`;
                  } catch (imgErr) {
                    this.logger.error(`Error al procesar la URL de la imagen ${oldPathInBucket}: ${(imgErr as Error).message}`);
                  }
                }
              }
            }
            return obj;
          } else if (Array.isArray(obj)) {
            const newArr = [];
            for (const item of obj) {
              newArr.push(await processObjectImages(item));
            }
            return newArr;
          } else if (obj !== null && typeof obj === 'object') {
            const newObj: any = {};
            for (const key of Object.keys(obj)) {
              newObj[key] = await processObjectImages(obj[key]);
            }
            return newObj;
          }
          return obj;
        };

        // Procesar imágenes recursivamente en las secciones
        const migratedSections = await processObjectImages(sections);

        // Verificar si ya existe el marketplace en la base de datos
        let marketplace = await marketplaceRepo.findOne({ where: { slug: slugAliado } });
        if (!marketplace) {
          marketplace = new MarketplaceEntity();
          marketplace.id = randomUUID();
        }

        marketplace.name = cleanName;
        marketplace.slug = slugAliado;
        marketplace.description = '';
        marketplace.active = true;
        marketplace.owner = slugAliado;
        
        // Obtener el logo del header si está disponible para el logo principal del marketplace
        const headerSection = migratedSections.find((s: any) => s.type === 'header');
        marketplace.logo = headerSection?.content?.logoUrl || headerSection?.content?.logo || '';
        
        marketplace.theme = {
          primaryColor: '#0f4ecf',
          secondaryColor: '#ffffff',
          font: 'Inter',
        };
        marketplace.sections = migratedSections;

        await marketplaceRepo.save(marketplace);
        stats.marketplacesMigrated++;
        this.logger.log(`Marketplace "${cleanName}" guardado y actualizado con éxito para el aliado: ${slugAliado}`);
      } catch (err) {
        const errMsg = `Error al migrar marketplace en fila: ${JSON.stringify(row)}. Detalle: ${(err as Error).message}`;
        this.logger.error(errMsg);
        stats.errors.push(errMsg);
      }
    }

    this.logger.log('Proceso de migración finalizado.');

    return {
      success: true,
      message: 'Migración completada',
      stats,
    };
  }
}
