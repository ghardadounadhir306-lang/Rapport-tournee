import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'chauffeurs' })
export class BaseChauffeur {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'employee_id', type: 'varchar', length: 64 })
  employeeId: string;

  @Column({ type: 'varchar', length: 255 })
  nom: string;

  @Column({ type: 'varchar', length: 255 })
  prenom: string;

  @Column({ type: 'varchar', length: 64 })
  cin: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  tel: string | null;
}