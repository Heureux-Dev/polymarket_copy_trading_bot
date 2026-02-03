import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FollowedWalletsService } from './followed-wallets.service';
import { FollowedWallet } from './entity/followed-wallet.entity';
import { AddFollowedWalletDto } from './dto/add-followed-wallet.dto';

@ApiTags('Followed Wallets')
@Controller('wallets')
export class FollowedWalletsController {
  constructor(private readonly service: FollowedWalletsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all followed wallets' })
  @ApiResponse({ status: 200, description: 'List of wallets', type: [FollowedWallet] })
  async findAll(): Promise<FollowedWallet[]> {
    return this.service.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get only active followed wallets' })
  @ApiResponse({ status: 200, description: 'List of active wallets', type: [FollowedWallet] })
  async findActive(): Promise<FollowedWallet[]> {
    return this.service.findActive();
  }

  @Post()
  @ApiOperation({ summary: 'Add a new followed wallet' })
  @ApiResponse({ status: 201, description: 'Wallet added', type: FollowedWallet })
  async add(@Body() body: AddFollowedWalletDto): Promise<FollowedWallet> {
    const { wallet, label } = body;
    return this.service.add(wallet, label);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a wallet by ID' })
  @ApiResponse({ status: 200, description: 'Wallet removed' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Delete('by-wallet/:wallet')
  @ApiOperation({ summary: 'Remove a wallet by wallet address' })
  @ApiResponse({ status: 200, description: 'Wallet removed' })
  async removeByWallet(@Param('wallet') wallet: string) {
    return this.service.removeByWallet(wallet);
  }
}
