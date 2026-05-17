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
   * @param email Email del usuario.
   * @returns Usuario o null si no existe.
   */
  async findByEmail(email: string): Promise<User | null> {
    const metadata = await this.readMetadata();
    return metadata.users.find((u) => u.email === email.toLowerCase()) ?? null;
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
}
