export interface PolymarketActivity {
    id: string;
    user: string;
    market: string;
    outcome: string;
    side: "BUY" | "SELL";
    price: number;
    slug: string;
    eventSlug: string;
    size: number;
    timestamp: string;
    type: string;
    conditionId: string
}

export interface ActivityResponse {
    activity: PolymarketActivity[];
}




