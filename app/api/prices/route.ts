import { NextRequest, NextResponse } from 'next/server';
import { HyperliquidClient } from '@/lib/hyperliquid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const coin = searchParams.get('coin');

    const hyperliquid = new HyperliquidClient();
    const prices = await hyperliquid.getAllMidPrices();

    if (!prices) {
      throw new Error('Failed to fetch prices');
    }

    // If specific coin requested
    if (coin) {
      const price = prices[coin.toUpperCase()];
      if (!price) {
        return NextResponse.json(
          {
            success: false,
            error: `Price not found for ${coin}`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          coin: coin.toUpperCase(),
          price: parseFloat(price),
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Return all prices
    const formattedPrices = Object.entries(prices).map(([coin, price]) => ({
      coin,
      price: parseFloat(price),
    }));

    return NextResponse.json({
      success: true,
      data: formattedPrices,
      count: formattedPrices.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prices',
      },
      { status: 500 }
    );
  }
}