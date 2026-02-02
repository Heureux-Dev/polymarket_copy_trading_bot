import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { PolymarketClient } from './clients/polymarket.client';
import { PolymarketService } from './polymarket/polymarket.service';
import { PolymarketPoller } from './polymarket/polymarket.poller';
import { CopyTradingModule } from './copy-trading/copy-trading.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,       // ✅ makes env available everywhere
      envFilePath: '.env', // optional, default is .env
    }),
    ScheduleModule.forRoot(),
    CopyTradingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PolymarketClient,
    PolymarketService,
    PolymarketPoller,
  ],
  exports: [
    PolymarketClient,
    PolymarketService,
  ],
})
export class AppModule { }
