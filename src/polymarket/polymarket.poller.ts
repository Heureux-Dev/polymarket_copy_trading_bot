import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { PolymarketClient } from "src/clients/polymarket.client";
import { CopyTradingService } from "src/copy-trading/copy-trading.service";
import { FollowedWallet } from "src/followed-wallets/entity/followed-wallet.entity";
import { FollowedWalletsService } from "src/followed-wallets/followed-wallets.service";
import { Trade } from "src/types/polymarket.types";

@Injectable()
export class PolymarketPoller {
  constructor(
    private readonly polyClient: PolymarketClient,
    private readonly copyService: CopyTradingService,
    private readonly followedWallets: FollowedWalletsService,
  ) { }

  async initializeCursor(wallet: FollowedWallet, trades: any[]) {
    if (wallet.lastTradeId) return;

    if (trades.length === 0) return;

    wallet.lastTradeId = trades[0].id; // newest trade
    await this.followedWallets.update(wallet.id, {
      lastTradeId: wallet.lastTradeId,
    });
  }

  @Interval(5000)
  async pollFollowedUsers() {
    const client = await this.polyClient.getClient();
    const wallets = await this.followedWallets.findActive();

    for (const wallet of wallets) {
      const trades = await client.getTrades({
        maker: wallet.wallet,
        limit: 20,
      });

      // First run: initialize cursor & skip history
      if (!wallet.lastTradeId) {
        await this.initializeCursor(wallet, trades);
        continue;
      }

      const newTrades: Trade[] = [];

      for (const trade of trades) {
        if (trade.id === wallet.lastTradeId) break;
        newTrades.push(trade);
      }

      // Process oldest → newest
      for (const trade of newTrades.reverse()) {
        await this.copyService.handleTrade(wallet.wallet, trade);
      }

      if (newTrades.length > 0) {
        wallet.lastTradeId = newTrades[0].id;
        await this.followedWallets.update(wallet.id, {
          lastTradeId: wallet.lastTradeId,
        });
      }
    }
  }

}
