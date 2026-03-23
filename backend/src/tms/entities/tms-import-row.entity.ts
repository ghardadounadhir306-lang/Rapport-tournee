import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tms_import_rows' })
@Index(['otsnum'])
@Index(['toucode'])
@Index(['cdate'])
export class TmsImportRow {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  affcode!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  artcode!: string | null;

  @Column({ type: 'date', nullable: true })
  cdate!: string | null;

  @Column({ type: 'int', nullable: true })
  entnbpal!: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  otdcode!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  otscontainer!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  otsetat!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  otskm2!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  otsnumbdx!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  ottmt!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  placha1i!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  plakm1!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  plakm2!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  plalib!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  plamoti!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  plargiarr!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rgilibl!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  salnom!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  saltel!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sitcode!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  sitsiretedi!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  tiecode!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  toucode!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  voycle!: string | null;

  @Column({ type: 'datetime', precision: 3, nullable: true })
  voydtd!: Date | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  voyhrd!: string | null;

  @Column({ type: 'int', nullable: true })
  voypal!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  performance_camion!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  performance_chauffeur!: string | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  taux_remplissage_pal!: string | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  taux_remplissage_ton!: string | null;

  @Column({ type: 'datetime', precision: 3, nullable: true })
  mdate!: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sitechauff!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sitecamion!: string | null;

  @Column({ type: 'text', nullable: true })
  salmemoe!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  otsnum!: string | null;

  @Column({ type: 'int', nullable: true })
  platouordre!: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  salmobilite!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  km_tsp!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  toutrafcode!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  chargement!: string | null;

  @Column({ type: 'datetime', precision: 3, nullable: true })
  voydtf!: Date | null;

  @Column({ type: 'datetime', precision: 3, nullable: true })
  otdhd!: Date | null;

  @Column({ type: 'text', nullable: true })
  voymemo!: string | null;

  @Column({ type: 'longtext', nullable: true })
  raw_json!: string | null;

  @Column({ type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  created_at!: Date;
}
