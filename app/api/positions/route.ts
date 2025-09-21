import { NextRequest, NextResponse } from 'next/server';
import { PositionFetcher } from '@/services/positionFetcher';
import { db } from '@/lib/supabase';
import { Position } from '@/lib/types';
import { calculatePositionMetrics } from '@/lib/liquidation';
import { HyperliquidClient } from '@/lib/hyperliquid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const riskLevel = searchParams.get('riskLevel');
    const coin = searchParams.get('coin');
    const sortBy = searchParams.get('sortBy') || 'liquidationDistance';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Get positions from database with entity info
    const { data: dbPositions, error } = await db.supabase
      .from('positions')
      .select(`
        *,
        entities (
          name,
          twitter,
          entity_type
        )
      `)
      .order('liquidation_price', { ascending: false });

    if (error) {
      throw error;
    }

    // Get current prices
    const hyperliquid = new HyperliquidClient();
    const prices = await hyperliquid.getAllMidPrices();
    
    if (!prices) {
      throw new Error('Failed to fetch current prices');
    }

    // Transform and enrich positions
    let positions: Position[] = (dbPositions || []).map((dbPos: any) => {
      const currentPrice = parseFloat(prices[dbPos.coin] || '0');
      
      const position: Position = {
        id: dbPos.id.toString(),
        address: dbPos.address,
        entityName: dbPos.entities?.name || 'Unknown',
        twitter: dbPos.entities?.twitter,
        coin: dbPos.coin,
        entryPrice: dbPos.entry_price,
        positionSize: dbPos.position_size,
        leverage: dbPos.leverage,
        liquidationPrice: dbPos.liquidation_price,
        unrealizedPnl: dbPos.unrealized_pnl,
        marginUsed: dbPos.margin_used,
        positionValue: dbPos.position_value,
        lastUpdated: new Date(dbPos.last_updated),
      };

      // Calculate current metrics
      return calculatePositionMetrics(position, currentPrice);
    });

    // Apply filters
    if (riskLevel) {
      const validRiskLevels = ['safe', 'warning', 'danger', 'critical'];
      if (validRiskLevels.includes(riskLevel)) {
        positions = positions.filter(p => p.riskLevel === riskLevel);
      }
    }

    if (coin) {
      positions = positions.filter(p => p.coin.toLowerCase() === coin.toLowerCase());
    }

    // Apply sorting
    positions.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'liquidationDistance':
          comparison = (a.liquidationDistance || 100) - (b.liquidationDistance || 100);
          break;
        case 'positionValue':
          comparison = b.positionValue - a.positionValue;
          break;
        case 'unrealizedPnl':
          comparison = b.unrealizedPnl - a.unrealizedPnl;
          break;
        default:
          comparison = (a.liquidationDistance || 100) - (b.liquidationDistance || 100);
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return NextResponse.json({
      success: true,
      data: positions,
      count: positions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch positions',
      },
      { status: 500 }
    );
  }
}