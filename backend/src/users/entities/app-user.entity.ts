import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'app_users' })
export class AppUser {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 32, default: 'user' })
  role!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  matricule!: string | null;

  @Column({ name: 'allowed_pages', type: 'text', nullable: true, default: null })
  allowedPages!: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  /** Code dépôt de l'utilisateur (ex: BAR, TUN). NULL = aucune restriction (admins). */
  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  zone!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt!: Date;
}
