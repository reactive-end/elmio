import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { User } from '../domain/user';
import type { AuthRepositoryPort } from '../domain/ports/auth-repository.port';

interface MetadataFile {
  users: User[];
}

/**
 * Implementacion local del repositorio de usuarios usando archivos JSON.
 */
@Injectable()
export class FileAuthRepositoryService implements AuthRepositoryPort {
  private readonly storageRoot = resolve(process.cwd(), 'storage', 'auth');
  private readonly metadataFileName = 'users.metadata.json';

  private getMetadataFilePath(): string {
    return join(this.storageRoot, this.metadataFileName);
  }

  private async ensureStorageDirectory(): Promise<void> {
    await mkdir(this.storageRoot, { recursive: true });
  }

  private async readMetadata(): Promise<MetadataFile> {
    await this.ensureStorageDirectory();

    try {
      const raw = await readFile(this.getMetadataFilePath(), 'utf8');
      const parsed = JSON.parse(raw) as MetadataFile;

      return { users: parsed.users ?? [] };
    } catch {
      return { users: [] };
    }
  }

  private async writeMetadata(metadata: MetadataFile): Promise<void> {
    await this.ensureStorageDirectory();
    await writeFile(
      this.getMetadataFilePath(),
      JSON.stringify(metadata, null, 2),
      'utf8',
    );
  }

  /**
   * Busca un usuario por su email.
   * @param email Email o telefono del usuario.
   * @returns Usuario o null si no existe.
   */
  async findByEmail(email: string): Promise<User | null> {
    let resolvedEmail = email.trim().toLowerCase();

    // Si no contiene '@', asumimos que es un telefono
    if (!resolvedEmail.includes('@')) {
      const cleanInputPhone = resolvedEmail.replace(/\D/g, '');
      if (cleanInputPhone.length > 0) {
        try {
          const enterpriseFilePath = join(
            process.cwd(),
            'storage',
            'enterprise',
            'enterprise.metadata.json',
          );
          const raw = await readFile(enterpriseFilePath, 'utf8');
          const parsed = JSON.parse(raw);

          const enterprises = parsed.enterprises ?? [];
          const collaborators = parsed.collaborators ?? [];

          // Buscar en enterprises
          const matchedEnterprise = enterprises.find((e: any) => {
            const cleanPhone = (e.phone ?? '').replace(/\D/g, '');
            return cleanPhone === cleanInputPhone;
          });

          if (matchedEnterprise) {
            resolvedEmail = matchedEnterprise.email.toLowerCase();
          } else {
            // Buscar en collaborators
            const matchedCollaborator = collaborators.find((c: any) => {
              const cleanPhone = (c.phone ?? '').replace(/\D/g, '');
              return cleanPhone === cleanInputPhone;
            });
            if (matchedCollaborator) {
              resolvedEmail = matchedCollaborator.email.toLowerCase();
            }
          }
        } catch {
          // Silenciar errores de lectura de archivo
        }
      }
    }

    const metadata = await this.readMetadata();
    return metadata.users.find((u) => u.email === resolvedEmail) ?? null;
  }

  /**
   * Busca un usuario por su ID.
   * @param id ID del usuario.
   * @returns Usuario o null si no existe.
   */
  async findById(id: string): Promise<User | null> {
    const metadata = await this.readMetadata();
    return metadata.users.find((u) => u.id === id) ?? null;
  }

  /**
   * Crea un nuevo usuario.
   * @param user Datos del usuario a registrar.
   * @returns Usuario creado.
   */
  async create(user: User): Promise<User> {
    const metadata = await this.readMetadata();
    metadata.users.push(user);
    await this.writeMetadata(metadata);

    return user;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<User> {
    const metadata = await this.readMetadata();
    const index = metadata.users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error('Usuario no encontrado.');
    }
    metadata.users[index] = {
      ...metadata.users[index],
      passwordHash,
      requirePasswordChange: false,
    };
    await this.writeMetadata(metadata);
    return metadata.users[index];
  }

  /**
   * Busca todos los usuarios asociados a un mismo email o teléfono.
   */
  async findAllByEmail(email: string): Promise<User[]> {
    let resolvedEmail = email.trim().toLowerCase();

    // Si no contiene '@', asumimos que es un telefono
    if (!resolvedEmail.includes('@')) {
      const cleanInputPhone = resolvedEmail.replace(/\D/g, '');
      if (cleanInputPhone.length > 0) {
        try {
          const enterpriseFilePath = join(
            process.cwd(),
            'storage',
            'enterprise',
            'enterprise.metadata.json',
          );
          const raw = await readFile(enterpriseFilePath, 'utf8');
          const parsed = JSON.parse(raw);

          const enterprises = parsed.enterprises ?? [];
          const collaborators = parsed.collaborators ?? [];

          const matchedEnterprise = enterprises.find((e: any) => {
            const cleanPhone = (e.phone ?? '').replace(/\D/g, '');
            return cleanPhone === cleanInputPhone;
          });

          if (matchedEnterprise) {
            resolvedEmail = matchedEnterprise.email.toLowerCase();
          } else {
            const matchedCollaborator = collaborators.find((c: any) => {
              const cleanPhone = (c.phone ?? '').replace(/\D/g, '');
              return cleanPhone === cleanInputPhone;
            });
            if (matchedCollaborator) {
              resolvedEmail = matchedCollaborator.email.toLowerCase();
            }
          }
        } catch {
          // Silenciar errores
        }
      }
    }

    const metadata = await this.readMetadata();
    return metadata.users.filter((u) => u.email === resolvedEmail);
  }
}
