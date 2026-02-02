import { Injectable, Logger } from '@nestjs/common';
import { PolymarketClient } from 'src/clients/polymarket.client';
import { CopyTradingStrategy, NormalizedTrade } from './copy-trading.strategy';

@Injectable()
export class CopyTradingService {
  private readonly logger = new Logger(CopyTradingService.name);

  constructor(
    private readonly polyClient: PolymarketClient,
    private readonly strategy: CopyTradingStrategy,
  ) {}

  /**
   * Handle a batch of trades from a leader wallet
   */
  async handleTrades(sourceWallet: string, trades: any[]) {
    for (const rawTrade of trades) {
      try {
        if (await this.tradeExists(rawTrade.id)) continue;

        const trade = this.normalizeTrade(rawTrade);

        const leaderNetChange = trade.side === 'BUY'
          ? trade.size
          : -trade.size;

        const botCurrentPosition = await this.getBotPosition(trade.marketId);

        const decision = this.strategy.decide({
          leaderNetChange,
          botCurrentPosition,
          trade,
        });

        if (!decision.shouldTrade) {
          this.logger.debug(
            `Skip trade ${trade.tradeId}: ${decision.reason}`,
          );
          await this.saveTrade(trade, sourceWallet);
          continue;
        }

        await this.executeTrade(trade, decision.side!, decision.size!);
        await this.saveTrade(trade, sourceWallet);

      } catch (err) {
        this.logger.error(
          `Failed handling trade ${rawTrade?.id} from ${sourceWallet}`,
          err instanceof Error ? err.stack : undefined,
        );
      }
    }
  }

  // ------------------------------------------------------------------
  // EXECUTION
  // ------------------------------------------------------------------

  private async executeTrade(
    trade: NormalizedTrade,
    side: 'BUY' | 'SELL',
    size: number,
  ) {
    const client = await this.polyClient.getClient();

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

  // ------------------------------------------------------------------
  // NORMALIZATION & STATE (DB STUBS)
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

  private async tradeExists(tradeId: string): Promise<boolean> {
    return false; // TODO: DB
  }

  private async saveTrade(
    trade: NormalizedTrade,
    sourceWallet: string,
  ): Promise<void> {
    this.logger.debug(
      `Saved trade ${trade.tradeId} from ${sourceWallet}`,
    );
  }

  private async getBotPosition(marketId: string): Promise<number> {
    return 0; // TODO: query DB / Polymarket positions
  }
}
