import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class FollowedWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  wallet: string;

  @Column({ nullable: true })
  label?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastTradeId?: string;
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
