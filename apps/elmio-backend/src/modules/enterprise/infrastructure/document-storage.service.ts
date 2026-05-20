import { Storage, type StorageOptions } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

@Injectable()
export class DocumentStorageService {
  private readonly storageRoot = resolve(process.cwd(), 'storage', 'enterprise');
  private readonly bucketName = process.env.GCS_BUCKET_NAME ?? '';
  private readonly storageClient = this.createStorageClient();

  private createStorageClient(): Storage {
    const credentialsJson = process.env.GCS_CREDENTIALS_JSON?.trim();
    const credentialsPath = process.env.GCS_CREDENTIALS_JSON_PATH?.trim();

    if (credentialsJson) {
      const options = {
        credentials: JSON.parse(
          credentialsJson,
        ) as StorageOptions['credentials'],
      } satisfies StorageOptions;

      return new Storage(options);
    }

    if (credentialsPath) {
      return new Storage({ keyFilename: credentialsPath });
    }

    return new Storage();
  }

  private isGcsEnabled(): boolean {
    const hasInlineCredentials = Boolean(
      process.env.GCS_CREDENTIALS_JSON?.trim(),
    );
    const hasFileCredentials = Boolean(
      process.env.GCS_CREDENTIALS_JSON_PATH?.trim(),
    );
    const hasBucketName = Boolean(process.env.GCS_BUCKET_NAME?.trim());
    const hasDefaultProject = Boolean(process.env.GOOGLE_CLOUD_PROJECT?.trim());

    return (
      hasBucketName &&
      (hasInlineCredentials || hasFileCredentials || hasDefaultProject)
    );
  }

  private getBucket() {
    if (!this.bucketName) {
      throw new Error(
        'Debes definir GCS_BUCKET_NAME para usar Google Cloud Storage para documentos.',
      );
    }
    return this.storageClient.bucket(this.bucketName);
  }

  private getLocalPath(taxId: string): string {
    return join(this.storageRoot, taxId, 'documentos');
  }

  private async ensureLocalDirectory(taxId: string): Promise<void> {
    await mkdir(this.getLocalPath(taxId), { recursive: true });
  }

  /**
   * Guarda un documento de onboarding en GCS o disco local.
   * Retorna el nombre único del archivo guardado.
   */
  async save(
    taxId: string,
    originalName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const cleanTaxId = taxId.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '');
    const extension = originalName.includes('.')
      ? `.${originalName.split('.').pop()?.toLowerCase() ?? 'bin'}`
      : '';
    const uniqueName = `${randomUUID()}${extension}`;

    if (this.isGcsEnabled()) {
      // Guardar en Google Cloud Storage
      const objectKey = `enterprise/${cleanTaxId}/documentos/${uniqueName}`;
      await this.getBucket()
        .file(objectKey)
        .save(buffer, {
          contentType: mimeType,
          resumable: false,
          metadata: {
            cacheControl: 'private, no-transform, max-age=86400',
          },
        });
    } else {
      // Guardar localmente
      await this.ensureLocalDirectory(cleanTaxId);
      const filePath = join(this.getLocalPath(cleanTaxId), uniqueName);
      await writeFile(filePath, buffer);
    }

    return uniqueName;
  }

  /**
   * Resuelve el documento guardado, retornando buffer y mimeType desde GCS o local.
   */
  async getDocument(
    taxId: string,
    fileName: string,
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const cleanTaxId = taxId.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '');
    const cleanFileName = fileName.trim();

    if (this.isGcsEnabled()) {
      const objectKey = `enterprise/${cleanTaxId}/documentos/${cleanFileName}`;
      const file = this.getBucket().file(objectKey);

      try {
        const [exists] = await file.exists();
        if (!exists) return null;

        const [metadata] = await file.getMetadata();
        const mimeType = (metadata.contentType as string) || 'application/octet-stream';
        const [buffer] = await file.download();

        return { buffer, mimeType };
      } catch {
        return null;
      }
    } else {
      const filePath = join(this.getLocalPath(cleanTaxId), cleanFileName);
      try {
        await stat(filePath);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require('node:fs/promises');
        const buffer = await fs.readFile(filePath);

        // Intentar inferir un tipo MIME básico o usar binario
        let mimeType = 'application/octet-stream';
        if (cleanFileName.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (cleanFileName.endsWith('.jpg') || cleanFileName.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (cleanFileName.endsWith('.png')) mimeType = 'image/png';

        return { buffer, mimeType };
      } catch {
        return null;
      }
    }
  }
}
