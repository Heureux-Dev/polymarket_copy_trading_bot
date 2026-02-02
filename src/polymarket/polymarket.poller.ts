import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { PolymarketClient } from "src/clients/polymarket.client";
import { CopyTradingService } from "src/copy-trading/copy-trading.service";

@Injectable()
export class PolymarketPoller {
  constructor(
    private readonly polyClient: PolymarketClient,
    private readonly copyService: CopyTradingService,
  ) {}

  @Interval(5000) // every 5s
  async pollFollowedUsers() {
    const client = await this.polyClient.getClient();
    const followedWallets = await this.getFollowedWallets();

    for (const wallet of followedWallets) {
      const trades = await client.getTrades({
        maker: wallet.address,
        limit: 10,
      });

      await this.copyService.handleTrades(wallet.address, trades);
    }
  }

  private async getFollowedWallets() {
    // DB query
    return [
      { address: '0x7960f86f8f43d8830a16de52537c35ae1b92b94f' },
      { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
    ];
  }
}
