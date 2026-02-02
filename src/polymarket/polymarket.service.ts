import { Injectable, Logger } from '@nestjs/common';
import { PolymarketClient } from 'src/clients/polymarket.client';

@Injectable()
export class PolymarketService {
  private readonly logger = new Logger(PolymarketService.name);

  constructor(
    private readonly polyClient: PolymarketClient,
  ) {}
}
