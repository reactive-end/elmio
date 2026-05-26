import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MarketplaceEntity } from '../marketplace/infrastructure/entities/marketplace.entity';
import { GalleryImageEntity } from '../gallery/infrastructure/entities/gallery-image.entity';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();

  const logger = new Logger('HealMarketplaceImagesCli');
  logger.log('Iniciando contexto de aplicación NestJS para sanar imágenes huérfanas...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get(DataSource);
    const marketplaceRepo = dataSource.getRepository(MarketplaceEntity);
    const galleryImageRepo = dataSource.getRepository(GalleryImageEntity);

    logger.log('Consultando todos los marketplaces registrados...');
    const marketplaces = await marketplaceRepo.find();
    logger.log(`Se encontraron ${marketplaces.length} marketplaces.`);

    let totalHealedCount = 0;

    for (const marketplace of marketplaces) {
      let logoHealed = false;
      let sectionsHealed = false;

      // 1. Sanar Logo si contiene la URL antigua
      let logoStr = marketplace.logo || '';
      const gcsBaseRegex = /https:\/\/storage\.googleapis\.com\/elmio-img\/(gallery\/[a-zA-Z0-9_.-]+(?:\/images)?)\/([^"\s'<>\\{}?]+)/g;

      // 2. Sanar Secciones
      let sectionsStr = JSON.stringify(marketplace.sections);

      // Encontrar todas las URLs antiguas de GCS en logo y secciones
      const matches: { fullUrl: string; tenantDir: string; name: string }[] = [];
      let match;

      // Escanear logo
      while ((match = gcsBaseRegex.exec(logoStr)) !== null) {
        matches.push({ fullUrl: match[0], tenantDir: match[1], name: match[2] });
      }
      gcsBaseRegex.lastIndex = 0; // reset regex index

      // Escanear secciones
      while ((match = gcsBaseRegex.exec(sectionsStr)) !== null) {
        matches.push({ fullUrl: match[0], tenantDir: match[1], name: match[2] });
      }
      gcsBaseRegex.lastIndex = 0; // reset regex index

      if (matches.length > 0) {
        logger.log(`Marketplace "${marketplace.name}" (${marketplace.slug}) tiene ${matches.length} candidatos de imágenes a verificar.`);

        // Realizar consulta en lote
        const galleryMatches = await galleryImageRepo.find({
          where: matches.map(m => ({
            tenantDirectory: m.tenantDir,
            name: m.name
          }))
        });

        // Crear mapa para resolución rápida
        const fileNameMap = new Map<string, string>();
        for (const item of galleryMatches) {
          fileNameMap.set(`${item.tenantDirectory}:${item.name}`, item.fileName);
        }

        // Aplicar reemplazos
        for (const match of matches) {
          const key = `${match.tenantDir}:${match.name}`;
          const foundFileName = fileNameMap.get(key);
          if (foundFileName && !foundFileName.includes(match.name)) {
            const newUrl = `https://storage.googleapis.com/elmio-img/${match.tenantDir}/${foundFileName}`;
            
            if (logoStr.includes(match.fullUrl)) {
              logoStr = logoStr.replace(match.fullUrl, newUrl);
              logoHealed = true;
            }

            if (sectionsStr.includes(match.fullUrl)) {
              sectionsStr = sectionsStr.split(match.fullUrl).join(newUrl);
              sectionsHealed = true;
            }
          }
        }

        if (logoHealed || sectionsHealed) {
          marketplace.logo = logoStr;
          marketplace.sections = JSON.parse(sectionsStr);
          await marketplaceRepo.save(marketplace);
          logger.log(`✅ ¡Marketplace "${marketplace.name}" (${marketplace.slug}) sanado con éxito!`);
          totalHealedCount++;
        } else {
          logger.log(`ℹ️ No se requirieron cambios reales para el marketplace "${marketplace.name}" (las imágenes ya están sanadas o no existen en la galería).`);
        }
      }
    }

    logger.log(`Proceso completado. Se sanaron ${totalHealedCount} marketplaces.`);
  } catch (error) {
    logger.error('Error durante la ejecución del sanador de imágenes:', error);
    process.exit(1);
  } finally {
    await app.close();
    logger.log('Contexto de aplicación cerrado.');
  }
}

void bootstrap();
