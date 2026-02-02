import { Injectable } from '@nestjs/common';

export interface NormalizedTrade {
  tradeId: string;
  marketId: string;
  tokenID: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
}

export interface StrategyDecision {
  shouldTrade: boolean;
  side?: 'BUY' | 'SELL';
  size?: number;
  reason: string;
}

@Injectable()
export class CopyTradingStrategy {
  // ---- CONFIG ----
  private readonly MIN_EXECUTABLE_SIZE = 1; // Polymarket minimum
  private readonly MIN_SIGNAL_SIZE = 5;     // ignore micro rebalances
  private readonly MAX_POSITION_SIZE = 50;  // hard cap

  decide(params: {
    leaderNetChange: number;
    botCurrentPosition: number;
    trade: NormalizedTrade;
  }): StrategyDecision {
    const { leaderNetChange, botCurrentPosition } = params;

    // Ignore noise
    if (Math.abs(leaderNetChange) < this.MIN_SIGNAL_SIZE) {
      return {
        shouldTrade: false,
        reason: 'Leader change too small (rebalance)',
      };
    }

    const side: 'BUY' | 'SELL' =
      leaderNetChange > 0 ? 'BUY' : 'SELL';

    // Already aligned
    if (
      (side === 'BUY' && botCurrentPosition > 0) ||
      (side === 'SELL' && botCurrentPosition < 0)
    ) {
      return {
        shouldTrade: false,
        reason: 'Bot already aligned',
      };
    }

    const size = Math.min(
      Math.max(this.MIN_EXECUTABLE_SIZE, Math.abs(leaderNetChange)),
      this.MAX_POSITION_SIZE,
    );

    return {
      shouldTrade: true,
      side,
      size,
      reason: 'Leader showed meaningful intent',
    };
  }
}
