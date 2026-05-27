import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

// Entidades del backend
import { GalleryImageEntity } from '../gallery/infrastructure/entities/gallery-image.entity';
import type { MarketplaceSection, SectionStyle, SectionType } from '../marketplace/domain/marketplace';

interface OldSection {
  id: string;
  type: string;
  styles?: Record<string, unknown>;
  style?: Record<string, unknown>;
  content: Record<string, unknown>;
  order: number;
}

interface OldMarketplace {
  id: string;
  name: string;
  isActive: boolean;
  ownerId?: string | null;
  sections: OldSection[];
  whatsapp?: Record<string, unknown> | null;
  cart?: Record<string, unknown> | null;
  login?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

async function bootstrap() {
  dotenv.config();

  const logger = new Logger('MigrateElmioDefaultCli');
  logger.log('Iniciando contexto de aplicación NestJS para migrar marketplace default de ElMio...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get(DataSource);
    const galleryRepo = dataSource.getRepository(GalleryImageEntity);

    // 1. Cargar el JSON viejo de la raíz del proyecto
    const rootDir = process.cwd();
    const possiblePaths = [
      path.join(rootDir, 'marketplace-default.json'),
      path.join(rootDir, '..', '..', 'marketplace-default.json'),
      path.join(rootDir, '..', 'marketplace-default.json'),
    ];

    let oldJsonPath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        oldJsonPath = p;
        break;
      }
    }

    if (!oldJsonPath) {
      throw new Error(`No se encontró el archivo marketplace-default.json en ninguna de las rutas intentadas: ${JSON.stringify(possiblePaths, null, 2)}`);
    }

    logger.log(`Cargando archivo JSON desde: ${oldJsonPath}`);
    const oldMarketplaceData = JSON.parse(fs.readFileSync(oldJsonPath, 'utf8')) as OldMarketplace;

    // 2. Inicializar cliente GCS
    const bucketName = process.env.GCS_BUCKET_NAME || '';
    const credentialsJson = process.env.GCS_CREDENTIALS_JSON?.trim();
    const credentialsPath = process.env.GCS_CREDENTIALS_JSON_PATH?.trim();

    if (!bucketName) {
      throw new Error('La variable de entorno GCS_BUCKET_NAME no está configurada.');
    }

    let storageClient: Storage;
    if (credentialsJson) {
      storageClient = new Storage({
        credentials: JSON.parse(credentialsJson) as Record<string, unknown>,
      });
    } else if (credentialsPath) {
      storageClient = new Storage({ keyFilename: credentialsPath });
    } else {
      storageClient = new Storage();
    }

    const bucket = storageClient.bucket(bucketName);
    const tenantSlug = 'elmio';
    const newTenantDir = `gallery/${tenantSlug}/images`;

    logger.log(`Conectado a bucket GCS: ${bucketName}. Procesando imágenes para el tenant: ${tenantSlug}...`);

    let imagesCopiedCount = 0;

    // Función recursiva estricta para procesar imágenes en objetos y arrays
    const processObjectImages = async (obj: unknown): Promise<unknown> => {
      if (typeof obj === 'string') {
        if (obj.includes('/marketplace/')) {
          // Extraer la ruta física del archivo en el bucket
          const match = obj.match(/https:\/\/storage\.googleapis\.com\/[^\/]+\/(.+)/);
          if (match) {
            const oldPathInBucket = decodeURIComponent(match[1]);

            // Procesar únicamente si pertenece a la carpeta vieja 'marketplace/'
            if (oldPathInBucket.startsWith('marketplace/')) {
              try {
                const sourceFile = bucket.file(oldPathInBucket);
                const [exists] = await sourceFile.exists();

                if (!exists) {
                  logger.warn(`Imagen física no encontrada en el bucket viejo: ${oldPathInBucket}`);
                  return obj;
                }

                // Extraer nombre y extensión del archivo
                const parts = oldPathInBucket.split('/');
                const originalName = parts[parts.length - 1];
                const extension = originalName.includes('.')
                  ? originalName.split('.').pop()?.toLowerCase() ?? 'png'
                  : 'png';

                const newFileName = `${randomUUID()}.${extension}`;
                const newObjectKey = `${newTenantDir}/${newFileName}`;

                logger.log(`Copiando imagen en GCS: ${oldPathInBucket} -> ${newObjectKey}`);

                // Copiar en GCS
                const destFile = bucket.file(newObjectKey);
                await sourceFile.copy(destFile);

                // Obtener metadatos de la imagen copiada
                const [metadata] = await destFile.getMetadata();
                const size = parseInt(String(metadata.size || '0'), 10);
                const mimeType = metadata.contentType || `image/${extension === 'svg' ? 'svg+xml' : extension}`;

                // Generar el storagePath consistente
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const safeName = originalName
                  .trim()
                  .toLowerCase()
                  .replace(/[^a-z0-9.-]+/g, '-');
                const storagePath = `${newTenantDir}/${timestamp}-${safeName}`;

                // Registrar en gallery_images
                const galleryImage = new GalleryImageEntity();
                galleryImage.id = randomUUID();
                galleryImage.tenantDirectory = newTenantDir;
                galleryImage.name = originalName;
                galleryImage.mimeType = mimeType;
                galleryImage.size = size;
                galleryImage.storagePath = storagePath;
                galleryImage.fileName = newFileName;
                galleryImage.createdAt = new Date().toISOString();

                await galleryRepo.save(galleryImage);
                imagesCopiedCount++;
                logger.log(`Imagen registrada en DB con ID: ${galleryImage.id}`);

                // Devolver nueva URL pública
                const publicBaseUrl = process.env.GCS_PUBLIC_BASE_URL?.trim();
                if (publicBaseUrl) {
                  return `${publicBaseUrl.replace(/\/$/, '')}/${newObjectKey}`;
                }
                return `https://storage.googleapis.com/${bucketName}/${newObjectKey}`;
              } catch (imgErr) {
                logger.error(`Error al procesar la imagen física ${oldPathInBucket}: ${(imgErr as Error).message}`);
              }
            }
          }
        }
        return obj;
      } else if (Array.isArray(obj)) {
        const newArr: unknown[] = [];
        for (const item of obj) {
          newArr.push(await processObjectImages(item));
        }
        return newArr;
      } else if (obj !== null && typeof obj === 'object') {
        const newObj: Record<string, unknown> = {};
        for (const key of Object.keys(obj)) {
          newObj[key] = await processObjectImages((obj as Record<string, unknown>)[key]);
        }
        return newObj;
      }
      return obj;
    };

    // 3. Procesar imágenes recursivamente en las secciones
    logger.log('Iniciando copia física de imágenes en GCS y actualización de URLs...');
    const migratedRawSections = (await processObjectImages(oldMarketplaceData.sections)) as OldSection[];
    logger.log(`Se migraron exitosamente ${imagesCopiedCount} imágenes en GCS.`);

    // Helper para obtener el nombre amigable de la sección según su tipo
    const getSectionFriendlyName = (type: string): string => {
      switch (type) {
        case 'header':
          return 'Cabecera';
        case 'hero':
          return 'Principal';
        case 'banner':
          return 'Banner Informativo';
        case 'products':
          return 'Nuestros Productos';
        case 'dual-banner':
        case 'double-banner':
          return 'Banners Informativos';
        case 'pillars':
          return 'Nuestros Valores';
        case 'text':
          return 'Acerca de ElMio';
        case 'footer':
          return 'Pie de Página';
        case 'partners':
          return 'Nuestros Aliados';
        default:
          return 'Sección';
      }
    };

    // Estilos base por defecto para secciones que falten propiedades obligatorias
    const getBaseStyle = (): SectionStyle => ({
      paddingTop: 80,
      paddingRight: 24,
      paddingBottom: 80,
      paddingLeft: 24,
      marginTop: 0,
      marginBottom: 0,
      backgroundColor: '#ffffff',
      backgroundGradient: '',
      backgroundImage: '',
      overlayOpacity: 0,
      borderWidth: 0,
      borderColor: '#e5e7eb',
      borderRadius: 0,
      borderStyle: 'solid',
      titleSize: 36,
      titleWeight: 700,
      titleColor: '#111827',
      titleAlignment: 'center',
      subtitleSize: 18,
      subtitleColor: '#6b7280',
      bodySize: 16,
      bodyColor: '#374151',
      bodyAlignment: 'center',
      maxWidth: 1200,
      elementSpacing: 24,
      buttonBackgroundColor: '#0f4ece',
      buttonTextColor: '#ffffff',
      buttonBorderRadius: 12,
      productImageHeight: 200,
      carouselAuto: true,
      carouselSpeed: 5,
    });

    // 4. Mapear y reestructurar secciones al nuevo formato
    logger.log('Reestructurando secciones del marketplace al nuevo formato de MarketplaceSection...');
    const migratedSections: MarketplaceSection[] = migratedRawSections.map((sec) => {
      const type = sec.type as SectionType;
      
      // Mapear styles a style (singular)
      const rawStyle = sec.styles || sec.style || {};
      const style = {
        ...getBaseStyle(),
        ...rawStyle,
      } as SectionStyle;

      return {
        id: sec.id,
        name: getSectionFriendlyName(sec.type),
        type,
        visible: true,
        order: sec.order,
        content: sec.content as any, // Hacemos cast a any para compatibilidad de tipos
        style,
      };
    });

    // 5. Mapear el Marketplace completo al nuevo formato
    logger.log('Mapeando el marketplace default al nuevo formato completo...');
    const headerSection = migratedSections.find((s) => s.type === 'header');
    
    // Obtener el logo del header
    const logoUrl = headerSection?.content?.logoUrl || (headerSection?.content as any)?.logo || '';

    const newMarketplace = {
      id: oldMarketplaceData.id,
      name: 'ElMio Corporate',
      slug: tenantSlug,
      description: 'Marketplace principal predeterminado de ElMio',
      active: true,
      owner: 'system',
      logo: logoUrl as string,
      theme: {
        primaryColor: '#0f4ece',
        secondaryColor: '#13ce99',
        font: 'Inter',
      },
      sections: migratedSections,
    };

    // 6. Guardar en el subdirectorio local del backend
    const targetLocalDir = path.join(rootDir, 'src', 'modules', 'marketplace', 'infrastructure', 'data');
    if (!fs.existsSync(targetLocalDir)) {
      fs.mkdirSync(targetLocalDir, { recursive: true });
    }

    const targetLocalPath = path.join(targetLocalDir, 'marketplace-default.json');
    logger.log(`Guardando JSON migrado en la ruta local del módulo del backend: ${targetLocalPath}`);
    fs.writeFileSync(targetLocalPath, JSON.stringify(newMarketplace, null, 2), 'utf8');

    // 7. Actualizar el archivo en la raíz del proyecto para mantenerlo sincronizado
    logger.log(`Guardando JSON migrado sincronizado en la raíz del proyecto: ${oldJsonPath}`);
    fs.writeFileSync(oldJsonPath, JSON.stringify(newMarketplace, null, 2), 'utf8');

    logger.log('✅ ¡Proceso de migración del marketplace default finalizado con éxito!');
  } catch (error) {
    logger.error('❌ Error durante la migración del marketplace default:', error);
    process.exit(1);
  } finally {
    await app.close();
    logger.log('Contexto de aplicación cerrado.');
  }
}

void bootstrap();
