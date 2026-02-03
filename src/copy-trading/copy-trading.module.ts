import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotPosition } from './entities/bot-position.entity';
import { FollowedWallet } from 'src/followed-wallets/entity/followed-wallet.entity';
import { CopyTradingService } from './copy-trading.service';
import { PolymarketModule } from 'src/polymarket/polymarket.module';
import { CopyTradingStrategy } from './copy-trading.strategy';
import { PolymarketClient } from 'src/clients/polymarket.client';
import { LeaderTrade } from './entities/leader-trade.entity';

@Module({
  imports: [
    forwardRef(() => PolymarketModule),
    TypeOrmModule.forFeature([BotPosition, FollowedWallet, LeaderTrade])
  ],
  providers: [
    CopyTradingService, CopyTradingStrategy, PolymarketClient
  ],
  exports: [
    CopyTradingService,
  ],
})
export class CopyTradingModule {}