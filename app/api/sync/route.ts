import { NextRequest, NextResponse } from 'next/server';
import { DataSyncService } from '@/services/dataSync';

// Create a singleton instance
let syncService: DataSyncService | null = null;

function getSyncService() {
  if (!syncService) {
    syncService = new DataSyncService();
  }
  return syncService;
}

export async function POST(request: NextRequest) {
  try {
    const syncService = getSyncService();
    const result = await syncService.manualSync();

    return NextResponse.json({
      success: result.success,
      positionsUpdated: result.positionsUpdated,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error during sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST method to trigger sync',
    endpoint: '/api/sync',
    method: 'POST',
  });
}