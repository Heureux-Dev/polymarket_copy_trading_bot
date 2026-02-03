import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
  } from 'typeorm';
  
  export enum TradeStatus {
    PENDING = 'PENDING',
    COPIED = 'COPIED',
    SKIPPED = 'SKIPPED',
    FAILED = 'FAILED',
  }
  
  @Entity('leader_trades')
  @Index(['tradeId'], { unique: true })
  export class LeaderTrade {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    tradeId: string; // Polymarket trade id
  
    @Column()
    wallet: string; // leader wallet
  
    @Column()
    marketId: string;
  
    @Column()
    tokenId: string;
  
    @Column()
    side: 'BUY' | 'SELL';
  
    @Column({ type: 'decimal', precision: 36, scale: 18 })
    size: string;
  
    @Column({ type: 'decimal', precision: 36, scale: 18 })
    price: string;
  
    @Column({
      type: 'enum',
      enum: TradeStatus,
      default: TradeStatus.PENDING,
    })
    status: TradeStatus;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    reason?: string | null;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  