#!/usr/bin/env node

/**
 * Start script for the background sync service
 * Usage: npx tsx scripts/startBackgroundSync.ts
 */

import { BackgroundSyncService } from '../services/backgroundSyncService';

async function start() {
  console.log('🚀 Starting Arkham Liquidation Monitor Background Sync...\n');

  const syncInterval = process.env.SYNC_INTERVAL_SECONDS 
    ? parseInt(process.env.SYNC_INTERVAL_SECONDS) 
    : 30;

  const service = new BackgroundSyncService(syncInterval);
  await service.start();
}

start().catch(error => {
  console.error('❌ Failed to start background sync:', error);
  process.exit(1);
});