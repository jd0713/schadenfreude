import { NextRequest, NextResponse } from 'next/server';
import { PositionFetcher } from '@/services/positionFetcher';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const minRiskLevel = searchParams.get('minRiskLevel') || 'warning';
    
    const validRiskLevels = ['warning', 'danger', 'critical'];
    if (!validRiskLevels.includes(minRiskLevel)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid risk level. Must be one of: warning, danger, critical',
        },
        { status: 400 }
      );
    }

    const fetcher = new PositionFetcher();
    const riskyPositions = await fetcher.getRiskyPositions(
      minRiskLevel as 'warning' | 'danger' | 'critical'
    );

    return NextResponse.json({
      success: true,
      data: riskyPositions,
      count: riskyPositions.length,
      minRiskLevel,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching risky positions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch risky positions',
      },
      { status: 500 }
    );
  }
}