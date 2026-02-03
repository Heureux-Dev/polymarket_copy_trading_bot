import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FollowedWallet } from './entity/followed-wallet.entity';

@Injectable()
export class FollowedWalletsService {
  constructor(
    @InjectRepository(FollowedWallet)
    private readonly followedWalletRepo: Repository<FollowedWallet>,
  ) { }

  async findAll(): Promise<FollowedWallet[]> {
    return this.followedWalletRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<FollowedWallet[]> {
    return this.followedWalletRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async add(wallet: string, label?: string): Promise<FollowedWallet> {
    const normalized = wallet.trim().toLowerCase();
    if (!normalized) {
      throw new ConflictException('Wallet address is required');
    }

    const existing = await this.followedWalletRepo.findOne({ where: { wallet: normalized } });
    if (existing) {
      return existing;
    }

    const newWallet = this.followedWalletRepo.create({
      wallet: normalized,
      label: label?.trim() || undefined,
    });

    return this.followedWalletRepo.save(newWallet);
  }

  async update(
    id: string,
    data: {
      label?: string;
      isActive?: boolean;
      lastTradeId?: string | null;
    },
  ): Promise<FollowedWallet> {
    const wallet = await this.followedWalletRepo.findOne({ where: { id } });

    if (!wallet) {
      throw new NotFoundException('Followed wallet not found');
    }

    if (data.label !== undefined) {
      wallet.label = data.label?.trim() || undefined;
    }

    if (data.isActive !== undefined) {
      wallet.isActive = data.isActive;
    }

    if (data.lastTradeId !== undefined) {
      wallet.lastTradeId = data.lastTradeId || undefined;
    }

    return this.followedWalletRepo.save(wallet);
  }
  
  async remove(id: string) {
    await this.followedWalletRepo.delete(id);
    return { ok: true };
  }

  async removeByWallet(wallet: string) {
    const normalized = wallet.trim().toLowerCase();
    await this.followedWalletRepo.delete({ wallet: normalized });
    return { ok: true };
  }
}
