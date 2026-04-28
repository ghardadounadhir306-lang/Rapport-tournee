import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BaseCamion } from '../../base-camion/entities/base-camion.entity';

@Entity({ name: 'transport_data' })
export class TransportData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  affcode: string;

  @Column({ nullable: true })
  artcode: string;

  @Column({ type: 'timestamp', nullable: true })
  cdate: Date;

  @Column({ type: 'int', nullable: true })
  entnbpal: number;

  @Column({ nullable: true })
  otdcode: string;

  @Column({ nullable: true })
  otscontainer: string;

  @Column({ nullable: true })
  otsetat: string;

  @Column({ type: 'text', default: 'pending' })
  states: 'pending' | 'done';

  @Column({ type: 'numeric', nullable: true })
  otskm2: number;

  @Column({ type: 'int', nullable: true })
  otsnumbdx: number;

  @Column({ nullable: true })
  ottmt: string;

  @Column({ nullable: true })
  placha1i: string;

  @Column({ type: 'numeric', nullable: true })
  plakm1: number;

  @Column({ type: 'numeric', nullable: true })
  plakm2: number;

  @Column({ nullable: true })
  plalib: string;

  @Column({ nullable: true })
  plamoti: string;

  @ManyToOne(() => BaseCamion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'camion_code', referencedColumnName: 'camion' })
  camion?: BaseCamion | null;

  @Column({ nullable: true })
  plargiarr: string;

  @Column({ nullable: true })
  rgilibl: string;

  @Column({ name: 'sal_id', type: 'bigint', nullable: true })
  salId: string | null;

  @Column({ nullable: true })
  sitcode: string;

  @Column({ nullable: true })
  sitsiretedi: string;

  @Column({ nullable: true })
  tiecode: string;

  @Column({ nullable: true })
  toucode: string;

  @Column({ nullable: true })
  voycle: string;

  @Column({ type: 'date', nullable: true })
  voydtd: string;

  @Column({ type: 'time', nullable: true })
  voyhrd: string;

  @Column({ type: 'int', nullable: true })
  voypal: number;

  @Column({ type: 'numeric', nullable: true })
  performance_camion: number;

  @Column({ type: 'numeric', nullable: true })
  performance_chauffeur: number;

  @Column({ type: 'numeric', nullable: true })
  taux_remplissage_pal: number;

  @Column({ type: 'numeric', nullable: true })
  taux_remplissage_ton: number;

  @Column({ type: 'timestamp', nullable: true })
  mdate: Date;

  @Column({ nullable: true })
  sitechauff: string;

  @Column({ nullable: true })
  sitecamion: string;

  @Column({ nullable: true })
  salmemoe: string;

  @Column({ nullable: true })
  otsnum: string;

  @Column({ nullable: true })
  platouordre: string;

  @Column({ nullable: true })
  salmobilite: string;

  @Column({ type: 'numeric', nullable: true })
  km_tsp: number;

  @Column({ nullable: true })
  toutrafcode: string;

  @Column({ nullable: true })
  chargement: string;

  @Column({ type: 'date', nullable: true })
  voydtf: string;

  @Column({ nullable: true })
  otdhd: string;

  @Column({ nullable: true })
  voymemo: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
