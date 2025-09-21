// Arkham Entity Types
export interface ArkhamEntity {
  address: string;
  chain: string;
  arkhamEntity: {
    name: string;
    note: string;
    id: string;
    type: 'individual' | 'fund' | 'institution';
    service: string | null;
    addresses: string[] | null;
    twitter: string;
  };
  collected_at: string;
}

// Hyperliquid API Types
export interface HyperliquidPosition {
  coin: string;
  cumFunding: {
    allTime: string;
    sinceChange: string;
    sinceOpen: string;
  };
  entryPx: string;
  leverage: {
    rawUsd: string;
    type: 'isolated' | 'cross';
    value: number;
  };
  liquidationPx: string;
  marginUsed: string;
  maxLeverage: number;
  positionValue: string;
  returnOnEquity: string;
  szi: string;
  unrealizedPnl: string;
}

export interface HyperliquidAccountState {
  assetPositions: Array<{
    position: HyperliquidPosition;
    type: 'oneWay' | 'twoWay';
  }>;
  crossMaintenanceMarginUsed: string;
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  time: number;
  withdrawable: string;
}

export interface HyperliquidMidPrice {
  [coin: string]: string;
}

// Application Types
export interface Position {
  id?: string;
  address: string;
  entityName: string;
  twitter?: string;
  coin: string;
  entryPrice: number;
  currentPrice?: number;
  positionSize: number;
  leverage: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  marginUsed: number;
  positionValue: number;
  liquidationDistance?: number;
  liquidationPercentage?: number;
  riskLevel?: 'safe' | 'warning' | 'danger' | 'critical';
  lastUpdated: Date;
}

export interface LiquidationAlert {
  id?: string;
  positionId: string;
  alertType: 'warning' | 'danger' | 'critical';
  distanceToLiquidation: number;
  currentPrice: number;
  createdAt: Date;
}

export interface PriceData {
  coin: string;
  price: number;
  timestamp: Date;
}

// API Request/Response Types
export interface PositionFilters {
  riskLevel?: 'safe' | 'warning' | 'danger' | 'critical';
  coin?: string;
  minPositionValue?: number;
  sortBy?: 'liquidationDistance' | 'positionValue' | 'unrealizedPnl';
  sortOrder?: 'asc' | 'desc';
}

export interface SyncResult {
  success: boolean;
  positionsUpdated: number;
  errors?: string[];
  timestamp: Date;
}