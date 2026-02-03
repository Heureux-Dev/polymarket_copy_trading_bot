import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolymarketClient } from 'src/clients/polymarket.client';
import { CopyTradingStrategy, NormalizedTrade } from './copy-trading.strategy';
import { BotPosition } from './entities/bot-position.entity';
import { LeaderTrade, TradeStatus } from './entities/leader-trade.entity';

@Injectable()
export class CopyTradingService {
  private readonly logger = new Logger(CopyTradingService.name);

  constructor(
    private readonly polyClient: PolymarketClient,
    private readonly strategy: CopyTradingStrategy,

    @InjectRepository(BotPosition)
    private readonly botPositionRepo: Repository<BotPosition>,

    @InjectRepository(LeaderTrade)
    private readonly tradeRepo: Repository<LeaderTrade>,
  ) {}

  // ------------------------------------------------------------------
  // Handle single trade
  // ------------------------------------------------------------------
  async handleTrade(sourceWallet: string, rawTrade: any): Promise<void> {
    const tradeId = rawTrade?.id;

    try {
      // 1️⃣ Idempotency
      if (await this.tradeExists(tradeId)) {
        return;
      }

      // 2️⃣ Normalize
      const trade = this.normalizeTrade(rawTrade);

      // 3️⃣ Leader delta
      const leaderNetChange =
        trade.side === 'BUY' ? trade.size : -trade.size;

      // 4️⃣ Bot position
      const botCurrentPosition = await this.getBotPosition(
        trade.marketId,
        trade.tokenID,
      );

      // 5️⃣ Strategy
      const decision = this.strategy.decide({
        leaderNetChange,
        botCurrentPosition,
        trade,
      });

      // 6️⃣ Persist BEFORE execution
      await this.saveTrade(trade, sourceWallet, {
        status: decision.shouldTrade
          ? TradeStatus.PENDING
          : TradeStatus.SKIPPED,
        reason: decision.reason,
      });

      if (!decision.shouldTrade) {
        this.logger.debug(
          `Skip trade ${trade.tradeId}: ${decision.reason}`,
        );
        return;
      }

      // 7️⃣ Execute
      await this.executeTrade(
        trade,
        decision.side!,
        decision.size!,
      );

      // 8️⃣ Update bot position
      await this.updateBotPosition(
        trade,
        decision.side!,
        decision.size!,
      );

      // 9️⃣ Mark copied
      await this.updateTradeStatus(trade.tradeId, TradeStatus.COPIED);

    } catch (err) {
      this.logger.error(
        `Failed handling trade ${tradeId} from ${sourceWallet}`,
        err instanceof Error ? err.stack : undefined,
      );

      if (tradeId) {
        await this.updateTradeStatus(tradeId, TradeStatus.FAILED, err?.message);
      }
    }
  }

  // ------------------------------------------------------------------
  // DB helpers
  // ------------------------------------------------------------------

  private async tradeExists(tradeId: string): Promise<boolean> {
    if (!tradeId) return true;

    return this.tradeRepo.exist({
      where: { tradeId },
    });
  }

  private async saveTrade(
    trade: NormalizedTrade,
    sourceWallet: string,
    meta?: {
      status?: TradeStatus;
      reason?: string;
    },
  ): Promise<void> {
    try {
      const entity = this.tradeRepo.create({
        tradeId: trade.tradeId,
        wallet: sourceWallet,
        marketId: trade.marketId,
        tokenId: trade.tokenID,
        side: trade.side,
        size: trade.size.toString(),
        price: trade.price.toString(),
        status: meta?.status ?? TradeStatus.PENDING,
        reason: meta?.reason,
      });

      await this.tradeRepo.save(entity);

    } catch (err: any) {
      // MySQL / Postgres duplicate protection
      if (
        err?.code === 'ER_DUP_ENTRY' ||
        err?.code === '23505'
      ) {
        return;
      }
      throw err;
    }
  }

  private async updateTradeStatus(
    tradeId: string,
    status: TradeStatus,
    reason?: string,
  ): Promise<void> {
    await this.tradeRepo.update(
      { tradeId },
      { status, reason },
    );
  }

  private async getBotPosition(
    marketId: string,
    tokenId: string,
  ): Promise<number> {
    const botPos = await this.botPositionRepo.findOne({
      where: { marketId, tokenId },
    });

    return botPos ? Number(botPos.netSize) : 0;
  }

  private async updateBotPosition(
    trade: NormalizedTrade,
    side: 'BUY' | 'SELL',
    size: number,
  ): Promise<void> {
    let botPos = await this.botPositionRepo.findOne({
      where: { marketId: trade.marketId, tokenId: trade.tokenID },
    });

    if (!botPos) {
      botPos = this.botPositionRepo.create({
        marketId: trade.marketId,
        tokenId: trade.tokenID,
        netSize: '0',
      });
    }

    const delta = side === 'BUY' ? size : -size;
    botPos.netSize = (Number(botPos.netSize) + delta).toString();

    await this.botPositionRepo.save(botPos);
  }

  // ------------------------------------------------------------------
  // Normalization
  // ------------------------------------------------------------------
  private normalizeTrade(raw: any): NormalizedTrade {
    return {
      tradeId: raw.id,
      marketId: raw.market_id ?? raw.marketId,
      tokenID: raw.tokenID ?? raw.market_token_id,
      side: raw.side,
      size: Number(raw.size),
      price: Number(raw.price),
    };
  }

  // ------------------------------------------------------------------
  // Execution
  // ------------------------------------------------------------------
  private async executeTrade(
    trade: NormalizedTrade,
    side: 'BUY' | 'SELL',
    size: number,
  ) {
    const client = await this.polyClient.getClient();

    if (!trade.tokenID) {
      throw new Error('Missing tokenID');
    }

    this.logger.log(
      `Executing ${side} ${size} @ ${trade.price} (${trade.tokenID})`,
    );

    await client.createAndPostOrder(
      {
        tokenID: trade.tokenID,
        side,
        price: trade.price,
        size,
      },
      {
        tickSize: '0.01',
        negRisk: false,
      },
    );
  }
}
