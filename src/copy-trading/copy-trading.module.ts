import { Module, forwardRef } from '@nestjs/common';
import { CopyTradingService } from './copy-trading.service';
import { PolymarketModule } from 'src/polymarket/polymarket.module';

@Module({
  imports: [
    forwardRef(() => PolymarketModule),
  ],
  providers: [
    CopyTradingService,
  ],
  exports: [
    CopyTradingService,
  ],
})
export class CopyTradingModule {}