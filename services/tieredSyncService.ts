/**
 * Tiered Sync Service
 * Updates positions based on their risk level with different intervals
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local BEFORE importing supabase
config({ path: path.join(__dirname, '../.env.local') });

// Now import modules that depend on environment variables
import { DataSyncService } from './dataSync';
import { PositionFetcher } from './positionFetcher';
import { db } from '../lib/supabase';
import { Position } from '../lib/types';

// Update tiers based on liquidation distance
const UPDATE_TIERS = {
  CRITICAL: { 
    threshold: 5,     // <5% to liquidation
    interval: 10000,  // 10 seconds
    label: '🔴 Critical'
  },
  DANGER: { 
    threshold: 10,    // 5-10% to liquidation
    interval: 30000,  // 30 seconds
    label: '🟠 Danger'
  },
  WARNING: { 
    threshold: 20,    // 10-20% to liquidation
    interval: 60000,  // 1 minute
    label: '🟡 Warning'
  },
  SAFE: { 
    threshold: 100,   // >20% to liquidation
    interval: 300000, // 5 minutes
    label: '🟢 Safe'
  }
};

interface PositionTracker {
  address: string;
  coin: string;
  lastUpdated: Date;
  nextUpdate: Date;
  tier: keyof typeof UPDATE_TIERS;
  liquidationDistance?: number;
}

export class TieredSyncService {
  private fetcher: PositionFetcher;
  private positionTrackers: Map<string, PositionTracker> = new Map();
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private syncStats = {
    critical: { count: 0, updates: 0 },
    danger: { count: 0, updates: 0 },
    warning: { count: 0, updates: 0 },
    safe: { count: 0, updates: 0 },
    total: { updates: 0, errors: 0 }
  };
  private startTime: Date;

  constructor() {
    this.fetcher = new PositionFetcher();
    this.startTime = new Date();
  }

  /**
   * Start the tiered sync service
   */
  async start(): Promise<void> {
    console.log('🚀 Starting Tiered Sync Service');
    console.log('📊 Update intervals:');
    Object.entries(UPDATE_TIERS).forEach(([tier, config]) => {
      console.log(`   ${config.label}: Every ${config.interval / 1000}s (distance < ${config.threshold}%)`);
    });
    console.log('=' .repeat(50));

    this.isRunning = true;

    // Initial full sync to establish baseline
    await this.performInitialSync();

    // Start the tiered update loop
    this.startTieredUpdates();

    // Periodic stats reporting
    setInterval(() => this.printStats(), 60000); // Every minute
  }

  /**
   * Stop the service
   */
  stop(): void {
    console.log('\n🛑 Stopping Tiered Sync Service');
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.printStats();
  }

  /**
   * Perform initial full sync
   */
  private async performInitialSync(): Promise<void> {
    console.log('🔄 Performing initial full sync...');
    
    try {
      const positions = await this.fetcher.fetchAllPositions();
      
      // Initialize trackers for all positions
      positions.forEach(position => {
        const key = `${position.address}_${position.coin}`;
        const tier = this.getTierForPosition(position.liquidationDistance);
        
        this.positionTrackers.set(key, {
          address: position.address,
          coin: position.coin,
          lastUpdated: new Date(),
          nextUpdate: new Date(Date.now() + UPDATE_TIERS[tier].interval),
          tier,
          liquidationDistance: position.liquidationDistance
        });

        // Update stats
        const tierKey = tier.toLowerCase() as 'critical' | 'danger' | 'warning' | 'safe';
        this.syncStats[tierKey].count++;
      });

      console.log(`✅ Initial sync complete: ${positions.length} positions tracked`);
      this.printTierDistribution();
      
    } catch (error) {
      console.error('❌ Initial sync failed:', error);
      this.syncStats.total.errors++;
    }
  }

  /**
   * Start tiered update loop
   */
  private startTieredUpdates(): void {
    // Check every 5 seconds for positions that need updating
    this.checkInterval = setInterval(async () => {
      if (!this.isRunning) return;
      
      await this.updateDuePositions();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Update positions that are due for refresh
   */
  private async updateDuePositions(): Promise<void> {
    const now = new Date();
    const duePositions: PositionTracker[] = [];

    // Find positions due for update
    this.positionTrackers.forEach(tracker => {
      if (tracker.nextUpdate <= now) {
        duePositions.push(tracker);
      }
    });

    if (duePositions.length === 0) return;

    console.log(`\n[${now.toISOString()}] 🔄 Updating ${duePositions.length} positions`);

    // Group by tier for logging
    const byTier = this.groupByTier(duePositions);
    Object.entries(byTier).forEach(([tier, positions]) => {
      if (positions.length > 0) {
        const tierConfig = UPDATE_TIERS[tier as keyof typeof UPDATE_TIERS];
        console.log(`   ${tierConfig.label}: ${positions.length} positions`);
      }
    });

    // Update positions in batches
    const batchSize = 50; // Process 50 at a time
    for (let i = 0; i < duePositions.length; i += batchSize) {
      const batch = duePositions.slice(i, i + batchSize);
      await this.updatePositionBatch(batch);
    }
  }

  /**
   * Update a batch of positions
   */
  private async updatePositionBatch(trackers: PositionTracker[]): Promise<void> {
    try {
      // Get unique addresses
      const addresses = [...new Set(trackers.map(t => t.address))];
      
      // Fetch updated data from Hyperliquid
      const fetcher = new PositionFetcher();
      
      // We need to fetch positions for these specific addresses
      // This is a targeted fetch, not a full scan
      const entities = await db.getEntities();
      const targetEntities = entities.filter(e => addresses.includes(e.address));
      
      if (targetEntities.length === 0) return;

      // Get account states for target addresses
      const hyperliquid = (fetcher as any).hyperliquid;
      const accountStates = await hyperliquid.getMultipleAccountStates(addresses);
      
      // Get current prices
      const prices = await hyperliquid.getAllMidPrices();
      if (!prices) {
        throw new Error('Failed to fetch prices');
      }

      // Process updates
      for (const tracker of trackers) {
        const accountState = accountStates.get(tracker.address);
        if (!accountState) continue;

        // Find the specific position
        const assetPosition = accountState.assetPositions.find(
          (ap: any) => ap.position.coin === tracker.coin
        );

        if (!assetPosition) {
          // Position closed, remove tracker
          this.positionTrackers.delete(`${tracker.address}_${tracker.coin}`);
          continue;
        }

        const pos = assetPosition.position;
        const currentPrice = parseFloat(prices[pos.coin] || '0');
        
        // Calculate new liquidation distance
        const liquidationPrice = parseFloat(pos.liquidationPx);
        const isLong = parseFloat(pos.szi) > 0;
        const liquidationDistance = isLong
          ? ((currentPrice - liquidationPrice) / currentPrice) * 100
          : ((liquidationPrice - currentPrice) / currentPrice) * 100;

        // Determine new tier
        const newTier = this.getTierForPosition(liquidationDistance);
        
        // Update tracker
        tracker.lastUpdated = new Date();
        tracker.nextUpdate = new Date(Date.now() + UPDATE_TIERS[newTier].interval);
        tracker.tier = newTier;
        tracker.liquidationDistance = liquidationDistance;

        // Update database (through existing upsert logic)
        await db.upsertPosition({
          address: tracker.address,
          coin: pos.coin,
          entry_price: parseFloat(pos.entryPx),
          position_size: parseFloat(pos.szi),
          leverage: pos.leverage.value,
          liquidation_price: liquidationPrice,
          unrealized_pnl: parseFloat(pos.unrealizedPnl),
          margin_used: parseFloat(pos.marginUsed),
          position_value: parseFloat(pos.positionValue),
        });

        // Update stats
        const newTierKey = newTier.toLowerCase() as 'critical' | 'danger' | 'warning' | 'safe';
        this.syncStats[newTierKey].updates++;
        this.syncStats.total.updates++;

        // Log if position moved to critical
        if (newTier === 'CRITICAL' && tracker.tier !== 'CRITICAL') {
          console.log(`   ⚠️ Position became CRITICAL: ${tracker.address.slice(0, 6)}... ${tracker.coin} (${liquidationDistance.toFixed(2)}% to liq)`);
        }
      }

    } catch (error) {
      console.error('❌ Batch update error:', error);
      this.syncStats.total.errors++;
    }
  }

  /**
   * Determine tier for a position based on liquidation distance
   */
  private getTierForPosition(liquidationDistance?: number): keyof typeof UPDATE_TIERS {
    if (!liquidationDistance || liquidationDistance < 0) return 'CRITICAL';
    
    if (liquidationDistance < UPDATE_TIERS.CRITICAL.threshold) return 'CRITICAL';
    if (liquidationDistance < UPDATE_TIERS.DANGER.threshold) return 'DANGER';
    if (liquidationDistance < UPDATE_TIERS.WARNING.threshold) return 'WARNING';
    return 'SAFE';
  }

  /**
   * Group positions by tier
   */
  private groupByTier(trackers: PositionTracker[]): Record<string, PositionTracker[]> {
    const grouped: Record<string, PositionTracker[]> = {
      CRITICAL: [],
      DANGER: [],
      WARNING: [],
      SAFE: []
    };

    trackers.forEach(tracker => {
      grouped[tracker.tier].push(tracker);
    });

    return grouped;
  }

  /**
   * Print tier distribution
   */
  private printTierDistribution(): void {
    console.log('\n📊 Position Distribution by Risk:');
    
    let critical = 0, danger = 0, warning = 0, safe = 0;
    
    this.positionTrackers.forEach(tracker => {
      switch (tracker.tier) {
        case 'CRITICAL': critical++; break;
        case 'DANGER': danger++; break;
        case 'WARNING': warning++; break;
        case 'SAFE': safe++; break;
      }
    });

    const total = this.positionTrackers.size;
    
    console.log(`   ${UPDATE_TIERS.CRITICAL.label}: ${critical} positions (${((critical/total)*100).toFixed(1)}%)`);
    console.log(`   ${UPDATE_TIERS.DANGER.label}: ${danger} positions (${((danger/total)*100).toFixed(1)}%)`);
    console.log(`   ${UPDATE_TIERS.WARNING.label}: ${warning} positions (${((warning/total)*100).toFixed(1)}%)`);
    console.log(`   ${UPDATE_TIERS.SAFE.label}: ${safe} positions (${((safe/total)*100).toFixed(1)}%)`);
    console.log(`   📈 Total: ${total} positions`);
  }

  /**
   * Print service statistics
   */
  private printStats(): void {
    const uptime = Date.now() - this.startTime.getTime();
    
    console.log('\n' + '='.repeat(50));
    console.log('📈 Tiered Sync Service Statistics');
    console.log(`⏱️ Uptime: ${this.formatUptime(uptime)}`);
    console.log('\nUpdate counts by tier:');
    console.log(`   🔴 Critical: ${this.syncStats.critical.updates} updates`);
    console.log(`   🟠 Danger: ${this.syncStats.danger.updates} updates`);
    console.log(`   🟡 Warning: ${this.syncStats.warning.updates} updates`);
    console.log(`   🟢 Safe: ${this.syncStats.safe.updates} updates`);
    console.log(`\n📊 Total updates: ${this.syncStats.total.updates}`);
    console.log(`❌ Total errors: ${this.syncStats.total.errors}`);
    
    // Calculate efficiency
    const avgUpdateRate = this.syncStats.total.updates / (uptime / 60000); // per minute
    console.log(`⚡ Average update rate: ${avgUpdateRate.toFixed(2)} positions/min`);
    
    this.printTierDistribution();
    console.log('='.repeat(50));
  }

  /**
   * Format uptime
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  }
}

// Handle process signals
let service: TieredSyncService | null = null;

process.on('SIGINT', () => {
  if (service) {
    service.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (service) {
    service.stop();
  }
  process.exit(0);
});

// Main execution
async function main() {
  console.log('🎯 Arkham Liquidation Monitor - Tiered Sync Service');
  console.log('='.repeat(50));
  
  service = new TieredSyncService();
  await service.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export default TieredSyncService;