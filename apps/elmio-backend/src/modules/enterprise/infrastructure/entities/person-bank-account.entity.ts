import { randomUUID } from 'node:crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PersonProfileEntity } from './person-profile.entity';

/**
 * Entidad que representa una cuenta bancaria de una persona natural o colaborador.
 * Permite asociar multiples cuentas bancarias a un perfil de persona.
 */
@Entity('person_bank_accounts')
export class PersonBankAccountEntity {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @ManyToOne(() => PersonProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'personProfileId' })
  personProfile!: PersonProfileEntity;

  @Column({ type: 'uuid' })
  personProfileId!: string;

  @Column({ type: 'varchar', length: 4 })
  bankCode!: string;

  @Column({ type: 'varchar', length: 100 })
  bankName!: string;

  @Column({ type: 'varchar', length: 20 })
  accountNumber!: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber!: string;

  @Column({ type: 'varchar', length: 20 })
  documentId!: string;

  @Column({ type: 'text', nullable: true })
  documentPhoto!: string | null;

  @Column({ type: 'boolean', default: true })
  isPrimary!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
