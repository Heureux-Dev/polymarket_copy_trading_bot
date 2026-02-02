import { Module, forwardRef } from '@nestjs/common';
import { PolymarketClient } from 'src/clients/polymarket.client';
import { PolymarketService } from './polymarket.service';
import { PolymarketPoller } from './polymarket.poller';
import { CopyTradingModule } from '../copy-trading/copy-trading.module';

@Module({
  imports: [
    forwardRef(() => CopyTradingModule),
  ],
  providers: [
    PolymarketClient,
    PolymarketService,
    PolymarketPoller,
  ],
  exports: [
    PolymarketClient,
    PolymarketService,
  ],
})
export class PolymarketModule {}
