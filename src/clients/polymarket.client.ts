import { Injectable } from '@nestjs/common';
import { Wallet, JsonRpcProvider } from 'ethers';
import { V5SignerAdapter } from '../utils/web3-utils';

@Injectable()
export class PolymarketClient {
  private clientPromise: Promise<any>;

  constructor() {
    this.clientPromise = this.createClient();
  }

  private async createClient() {
    const { ClobClient } = await import('@polymarket/clob-client');

    const provider = new JsonRpcProvider(process.env.RPC_URL!);
    const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);
    const signer = new V5SignerAdapter(wallet);

    return new ClobClient(
      'https://clob.polymarket.com',
      137,
      signer as any,
      JSON.parse(process.env.POLYMARKET_API_CREDS!),
      2,
      process.env.FUNDER_ADDRESS,
    );
  }

  async getClient() {
    return this.clientPromise;
  }
}
