import { Position } from './types';

/**
 * Calculate the distance to liquidation as a percentage
 * @param currentPrice Current price of the asset
 * @param liquidationPrice Liquidation price of the position
 * @param isLong Whether this is a long position
 * @returns Distance to liquidation as a percentage (positive means safe, negative means liquidated)
 */
export function calculateLiquidationDistance(
  currentPrice: number,
  liquidationPrice: number,
  isLong: boolean = true
): number {
  if (isLong) {
    // For long positions: liquidation happens when price drops below liquidation price
    // Distance = (currentPrice - liquidationPrice) / currentPrice * 100
    return ((currentPrice - liquidationPrice) / currentPrice) * 100;
  } else {
    // For short positions: liquidation happens when price rises above liquidation price
    // Distance = (liquidationPrice - currentPrice) / currentPrice * 100
    return ((liquidationPrice - currentPrice) / currentPrice) * 100;
  }
}

/**
 * Determine the risk level based on liquidation distance
 * @param liquidationDistance Distance to liquidation as a percentage
 * @returns Risk level category
 */
export function getRiskLevel(liquidationDistance: number): 'safe' | 'warning' | 'danger' | 'critical' {
  if (liquidationDistance < 2) return 'critical';
  if (liquidationDistance < 5) return 'danger';
  if (liquidationDistance < 10) return 'warning';
  return 'safe';
}

/**
 * Check if a position is long or short based on position size
 * @param positionSize The size of the position (positive for long, negative for short)
 * @returns true if long, false if short
 */
export function isLongPosition(positionSize: number): boolean {
  return positionSize > 0;
}

/**
 * Calculate position metrics
 */
export function calculatePositionMetrics(
  position: Position,
  currentPrice: number
): Position {
  const isLong = isLongPosition(position.positionSize);
  const liquidationDistance = calculateLiquidationDistance(
    currentPrice,
    position.liquidationPrice,
    isLong
  );
  
  const riskLevel = getRiskLevel(liquidationDistance);
  
  // Calculate current position value
  const currentPositionValue = Math.abs(position.positionSize) * currentPrice;
  
  // Calculate PnL
  const entryValue = Math.abs(position.positionSize) * position.entryPrice;
  let unrealizedPnl: number;
  
  if (isLong) {
    unrealizedPnl = currentPositionValue - entryValue;
  } else {
    unrealizedPnl = entryValue - currentPositionValue;
  }
  
  return {
    ...position,
    currentPrice,
    liquidationDistance,
    liquidationPercentage: liquidationDistance,
    riskLevel,
    positionValue: currentPositionValue,
    unrealizedPnl,
  };
}

/**
 * Sort positions by risk level (most risky first)
 */
export function sortPositionsByRisk(positions: Position[]): Position[] {
  return [...positions].sort((a, b) => {
    // First sort by risk level
    const riskOrder = { critical: 0, danger: 1, warning: 2, safe: 3 };
    const riskDiff = riskOrder[a.riskLevel || 'safe'] - riskOrder[b.riskLevel || 'safe'];
    
    if (riskDiff !== 0) return riskDiff;
    
    // Then sort by liquidation distance (smaller distance = higher risk)
    return (a.liquidationDistance || 100) - (b.liquidationDistance || 100);
  });
}

/**
 * Filter positions by risk level
 */
export function filterPositionsByRisk(
  positions: Position[],
  minRiskLevel: 'safe' | 'warning' | 'danger' | 'critical'
): Position[] {
  const riskOrder = { safe: 3, warning: 2, danger: 1, critical: 0 };
  const minRisk = riskOrder[minRiskLevel];
  
  return positions.filter(position => {
    const positionRisk = riskOrder[position.riskLevel || 'safe'];
    return positionRisk <= minRisk;
  });
}

/**
 * Get emoji indicator for risk level
 */
export function getRiskEmoji(riskLevel: 'safe' | 'warning' | 'danger' | 'critical'): string {
  switch (riskLevel) {
    case 'critical':
      return '🚨';
    case 'danger':
      return '🔴';
    case 'warning':
      return '🟡';
    case 'safe':
      return '🟢';
    default:
      return '⚪';
  }
}