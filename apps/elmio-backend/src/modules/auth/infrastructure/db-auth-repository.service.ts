import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import type { User } from '../domain/user';
import type { AuthRepositoryPort } from '../domain/ports/auth-repository.port';
import { UserEntity } from './entities/user.entity';
import { EnterpriseEntity } from '../../enterprise/infrastructure/entities/enterprise.entity';
import { PersonProfileEntity } from '../../enterprise/infrastructure/entities/person-profile.entity';

  /**
   * Obtiene el resumen del shopcart de compra de pólizas de Mercantil.
   * @async
   * @param {string} shopcartId - ID del carrito.
   * @returns {Promise<ShopcartSummary>} Objeto del resumen del carrito.
   */
  async getShopcartSummary(shopcartId: string): Promise<ShopcartSummary> {
    return apiFetch<ShopcartSummary>(`/mercantil/shopcarts/${shopcartId}/summary`);
  },

  /**
   * Consulta la información de vehículos disponibles por año, marca, modelo y versión.
   * @async
   * @param {Record<string, unknown>} params - Parámetros de filtro (year, brand, model, version).
   * @returns {Promise<Record<string, unknown>>} Datos de vehículos del catálogo Mercantil.
   */
  async getVehicleInformation(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    return apiFetch<Record<string, unknown>>(`/mercantil/auto-products/vehicles/vehicle-information?${query.toString()}`);
  },

  /**
   * Obtiene la lista de colores de vehículos disponibles.
   * @async
   * @returns {Promise<Record<string, unknown>[]>} Lista de colores.
   */
  async getVehicleColors(): Promise<Record<string, unknown>[]> {
    return apiFetch<Record<string, unknown>[]>('/mercantil/auto-products/vehicles/colors');
  },

  /**
   * Obtiene la lista de ubicaciones geográficas para vehículos.
   * @async
   * @returns {Promise<Record<string, unknown>[]>} Lista de ubicaciones.
   */
  async getVehicleLocations(): Promise<Record<string, unknown>[]> {
    return apiFetch<Record<string, unknown>[]>('/mercantil/auto-products/vehicles/locations');
  },

  /**
   * Obtiene los planes RCV disponibles para un tipo de vehículo específico.
   * @async
   * @param {string} vehicleTypeId - ID del tipo de vehículo.
   * @returns {Promise<MercantilCategoryResult[]>} Planes de seguro RCV.
   */
  async getAutoPlans(vehicleTypeId: string): Promise<MercantilCategoryResult[]> {
    return apiFetch<MercantilCategoryResult[]>(`/mercantil/auto-products/plans/client?vehicleTypeId=${encodeURIComponent(vehicleTypeId)}`);
  },

  /**
   * Completa la información técnica del vehículo en el shopcart.
   * @async
   * @param {string} shopcartId - ID del carrito.
   * @param {Record<string, unknown>} body - Datos del vehículo.
   * @returns {Promise<Record<string, unknown>>} Confirmación del servidor.
   */
  async completeVehicleInfo(shopcartId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>(`/mercantil/auto-products/vehicles/complete-vehicle-info?shopcartId=${encodeURIComponent(shopcartId)}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Sube el título de propiedad del vehículo al shopcart.
   * @async
   * @param {string} shopcartId - ID del carrito.
   * @param {File} file - Archivo del título de propiedad.
   * @returns {Promise<Record<string, unknown>>} Confirmación del servidor.
   */
  async uploadVehiclePropertyTitle(shopcartId: string, file: File): Promise<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('vehiclePropertyFile', file);
    return apiFetch<Record<string, unknown>>(`/mercantil/shopcarts/${shopcartId}/vehicle-property-title`, {
      method: 'POST',
      body: formData,
    });
  },
};
  }

  private toPersistence(domain: User): UserEntity {
    const entity = new UserEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.email = domain.email;
    entity.passwordHash = domain.passwordHash;
    entity.role = domain.role;
    entity.owner = domain.owner;
    entity.createdAt = domain.createdAt;
    entity.requirePasswordChange = domain.requirePasswordChange;
    return entity;
  }

  /**
   * Busca un usuario por su email o telefono de forma transparente.
   * Si no contiene '@', realiza busquedas en las tablas de empresas o perfiles de persona
   * para resolver el telefono limpio al email correspondiente en base de datos.
   */
  async findByEmail(email: string): Promise<User | null> {
    let resolvedEmail = email.trim().toLowerCase();

    // Si no contiene '@', asumimos que es un telefono
    if (!resolvedEmail.includes('@')) {
      const cleanInputPhone = resolvedEmail.replace(/\D/g, '');
      if (cleanInputPhone.length > 0) {
        try {
          const enterprise = await this.dataSource
            .getRepository(EnterpriseEntity)
            .createQueryBuilder('e')
            .select('e.email')
            .where(
              `RIGHT(regexp_replace(e.phone, '[^0-9]', '', 'g'), 10) = RIGHT(:phone, 10)`,
              { phone: cleanInputPhone },
            )
            .getOne();

          if (enterprise) {
            resolvedEmail = enterprise.email.toLowerCase();
          } else {
            const profile = await this.dataSource
              .getRepository(PersonProfileEntity)
              .createQueryBuilder('p')
              .select('p.email')
              .where(
                `RIGHT(regexp_replace(p.phone, '[^0-9]', '', 'g'), 10) = RIGHT(:phone, 10)`,
                { phone: cleanInputPhone },
              )
              .getOne();

            if (profile) {
              resolvedEmail = profile.email.toLowerCase();
            }
          }
        } catch (err) {
          console.error('Error al resolver teléfono en findByEmail:', err);
        }
      }
    }

    const userEntity = await this.repo.findOne({
      where: { email: resolvedEmail },
    });
    return userEntity ? this.toDomain(userEntity) : null;
  }

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.repo.findOne({ where: { id } });
    return userEntity ? this.toDomain(userEntity) : null;
  }

  async create(user: User): Promise<User> {
    const entity = this.toPersistence(user);
    await this.repo.save(entity);
    return user;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<User> {
    const entity = await this.repo.findOne({ where: { id: userId } });
    if (!entity) {
      throw new Error('Usuario no encontrado.');
    }
    entity.passwordHash = passwordHash;
    entity.requirePasswordChange = false;
    await this.repo.save(entity);
    return this.toDomain(entity);
  }

  /**
   * Busca todos los usuarios asociados a un mismo email o teléfono.
   */
  async findAllByEmail(email: string): Promise<User[]> {
    let resolvedEmails = [email.trim().toLowerCase()];

    // Si no contiene '@', asumimos que es un teléfono
    if (!email.includes('@')) {
      const cleanInputPhone = email.replace(/\D/g, '');
      if (cleanInputPhone.length > 0) {
        try {
          const emailsSet = new Set<string>();

          const enterprises = await this.dataSource
            .getRepository(EnterpriseEntity)
            .createQueryBuilder('e')
            .select('e.email')
            .where(
              `RIGHT(regexp_replace(e.phone, '[^0-9]', '', 'g'), 10) = RIGHT(:phone, 10)`,
              { phone: cleanInputPhone },
            )
            .getMany();
          for (const ent of enterprises) {
            emailsSet.add(ent.email.toLowerCase());
          }

          const profiles = await this.dataSource
            .getRepository(PersonProfileEntity)
            .createQueryBuilder('p')
            .select('p.email')
            .where(
              `RIGHT(regexp_replace(p.phone, '[^0-9]', '', 'g'), 10) = RIGHT(:phone, 10)`,
              { phone: cleanInputPhone },
            )
            .getMany();
          for (const prof of profiles) {
            emailsSet.add(prof.email.toLowerCase());
          }

          if (emailsSet.size > 0) {
            resolvedEmails = Array.from(emailsSet);
          }
        } catch (err) {
          console.error('Error al resolver teléfono en findAllByEmail:', err);
        }
      }
    }

    const userEntities = await this.repo.find({
      where: { email: In(resolvedEmails) },
    });
    return userEntities.map((entity) => this.toDomain(entity));
  }
}
