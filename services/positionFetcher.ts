import { HyperliquidClient } from '@/lib/hyperliquid';
import { db } from '@/lib/supabase';
import { calculatePositionMetrics } from '@/lib/liquidation';
import { Position } from '@/lib/types';

export class PositionFetcher {
  private hyperliquid: HyperliquidClient;

  constructor() {
    this.hyperliquid = new HyperliquidClient();
  }

  /**
   * Fetch positions for all entities
   */
  async fetchAllPositions(): Promise<Position[]> {
    // Get entities from database
    const entities = await db.getEntities();
    const addresses = entities.map(e => e.address);
    
    // Get current prices
    const prices = await this.hyperliquid.getAllMidPrices();
    if (!prices) {
      throw new Error('Failed to fetch current prices');
    }

    // Fetch account states for all addresses
    const accountStates = await this.hyperliquid.getMultipleAccountStates(addresses);
    
    const positions: Position[] = [];

    // Process each account
    for (const [address, accountState] of accountStates.entries()) {
      const entity = entities.find(e => e.address === address);
      if (!entity) continue;

      const currentCoins: string[] = [];

      // Process each position
      for (const assetPosition of accountState.assetPositions) {
        const pos = assetPosition.position;
        currentCoins.push(pos.coin);

        const currentPrice = parseFloat(prices[pos.coin] || '0');
        if (currentPrice === 0) continue;

        const position: Position = {
          address,
          entityName: entity.name,
          twitter: entity.twitter,
          coin: pos.coin,
          entryPrice: parseFloat(pos.entryPx),
          positionSize: parseFloat(pos.szi),
          leverage: pos.leverage.value,
          liquidationPrice: parseFloat(pos.liquidationPx),
          unrealizedPnl: parseFloat(pos.unrealizedPnl),
          marginUsed: parseFloat(pos.marginUsed),
          positionValue: parseFloat(pos.positionValue),
          lastUpdated: new Date(),
        };

        // Calculate metrics
        const enrichedPosition = calculatePositionMetrics(position, currentPrice);
        positions.push(enrichedPosition);

        // Save to database
        try {
          const positionId = await db.upsertPosition({
            address,
            coin: pos.coin,
            entry_price: position.entryPrice,
            position_size: position.positionSize,
            leverage: position.leverage,
            liquidation_price: position.liquidationPrice,
            unrealized_pnl: enrichedPosition.unrealizedPnl,
            margin_used: position.marginUsed,
            position_value: enrichedPosition.positionValue,
          });

          // Create alert if position is risky
          if (enrichedPosition.riskLevel && enrichedPosition.riskLevel !== 'safe' && positionId) {
            await db.createAlert({
              position_id: positionId,
              alert_type: enrichedPosition.riskLevel as 'warning' | 'danger' | 'critical',
              distance_to_liquidation: enrichedPosition.liquidationDistance || 0,
              current_price: currentPrice,
            });
          }
        } catch (error) {
          console.error(`Error saving position for ${address}:`, error);
        }
      }

      // Clean up old positions
      try {
        await db.deleteOldPositions(address, currentCoins);
      } catch (error) {
        console.error(`Error cleaning old positions for ${address}:`, error);
      }
    }

    return positions;
  }

  /**
   * Get risky positions
   */
  async getRiskyPositions(minRiskLevel: 'warning' | 'danger' | 'critical' = 'warning'): Promise<Position[]> {
    const allPositions = await this.fetchAllPositions();
    
    const riskOrder = { safe: 3, warning: 2, danger: 1, critical: 0 };
    const minRisk = riskOrder[minRiskLevel];
    
    return allPositions
      .filter(position => {
        const positionRisk = riskOrder[position.riskLevel || 'safe'];
        return positionRisk <= minRisk;
      })
      .sort((a, b) => (a.liquidationDistance || 100) - (b.liquidationDistance || 100));
  }
}