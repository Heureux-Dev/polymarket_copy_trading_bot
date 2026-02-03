import { Controller, Get, Query } from '@nestjs/common';
import { PolymarketClient } from '../clients/polymarket.client';

export interface TradeActivityDto {
  id: string;
  marketId: string;
  tokenID: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  timestamp?: string;
}

@Controller('polymarket')
export class PolymarketController {
  constructor(private readonly polyClient: PolymarketClient) {}

  @Get('activity')
  async getActivity(@Query('address') address: string): Promise<{ trades: TradeActivityDto[] }> {
    if (!address?.trim()) {
      return { trades: [] };
    }
    const client = await this.polyClient.getClient();
    const rawTrades = await client.getTrades({
      maker: address.trim(),
      limit: 50,
    });
    const trades: TradeActivityDto[] = (rawTrades ?? []).map((t: any) => ({
      id: t.id,
      marketId: t.market_id ?? t.marketId ?? '',
      tokenID: t.market_token_id ?? t.tokenID ?? '',
      side: t.side ?? 'BUY',
      size: Number(t.size ?? 0),
      price: Number(t.price ?? 0),
      timestamp: t.timestamp ?? t.created_at,
    }));
    return { trades };
  }
}
