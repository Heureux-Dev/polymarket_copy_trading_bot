import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { PolymarketClient } from './clients/polymarket.client';
import { PolymarketController } from './polymarket/polymarket.controller';
import { PolymarketService } from './polymarket/polymarket.service';
import { PolymarketPoller } from './polymarket/polymarket.poller';
import { CopyTradingModule } from './copy-trading/copy-trading.module';
import { FollowedWalletsModule } from './followed-wallets/followed-wallets.module';

import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', 
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'polymarket_bot',
      autoLoadEntities: true,
      synchronize: true,
    }),
    ScheduleModule.forRoot(),
    CopyTradingModule,
    FollowedWalletsModule,
  ],
  controllers: [PolymarketController],
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
export class AppModule { }
