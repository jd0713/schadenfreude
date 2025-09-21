/**
 * Background Sync Service
 * Runs continuously to sync positions from Hyperliquid to Supabase
 */

import { DataSyncService } from './dataSync';

// Note: Environment variables are loaded by Next.js automatically
// No need to manually load dotenv in Next.js projects

class BackgroundSyncService {
  private syncService: DataSyncService;
  private isRunning: boolean = false;
  private syncIntervalMs: number;
  private syncCount: number = 0;
  private errorCount: number = 0;
  private lastSyncTime: Date | null = null;
  private startTime: Date;

  constructor(syncIntervalSeconds: number = 30) {
    this.syncService = new DataSyncService();
    this.syncIntervalMs = syncIntervalSeconds * 1000;
    this.startTime = new Date();
  }

  /**
   * Start the background sync service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Background sync service is already running');
      return;
    }

    console.log('🚀 Starting Background Sync Service');
    console.log(`📊 Sync interval: ${this.syncIntervalMs / 1000} seconds`);
    console.log(`🌐 Hyperliquid API: ${process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz/info'}`);
    console.log(`📦 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}`);
    console.log('=' .repeat(50));

    this.isRunning = true;

    // Perform initial sync
    await this.performSync();

    // Start continuous sync loop
    this.runSyncLoop();
  }

  /**
   * Stop the background sync service
   */
  stop(): void {
    console.log('\n🛑 Stopping Background Sync Service');
    this.isRunning = false;
    this.printStats();
  }

  /**
   * Run the continuous sync loop
   */
  private async runSyncLoop(): Promise<void> {
    while (this.isRunning) {
      await this.sleep(this.syncIntervalMs);
      
      if (this.isRunning) {
        await this.performSync();
      }
    }
  }

  /**
   * Perform a single sync operation
   */
  private async performSync(): Promise<void> {
    const syncStartTime = Date.now();
    
    try {
      console.log(`\n[${new Date().toISOString()}] 🔄 Starting sync #${this.syncCount + 1}`);
      
      const result = await this.syncService.manualSync();
      
      const syncDuration = Date.now() - syncStartTime;
      
      if (result.success) {
        this.syncCount++;
        this.lastSyncTime = new Date();
        
        console.log(`✅ Sync completed in ${syncDuration}ms`);
        console.log(`   📊 Positions updated: ${result.positionsUpdated}`);
        
        // Print periodic stats every 10 syncs
        if (this.syncCount % 10 === 0) {
          this.printStats();
        }
      } else {
        this.errorCount++;
        console.error(`❌ Sync failed: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      this.errorCount++;
      console.error(`❌ Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // If too many errors, consider stopping
      if (this.errorCount > 10 && this.errorCount > this.syncCount * 0.5) {
        console.error('⚠️ Too many errors, consider checking the configuration');
      }
    }
  }

  /**
   * Print service statistics
   */
  private printStats(): void {
    const uptime = Date.now() - this.startTime.getTime();
    const successRate = this.syncCount > 0 
      ? ((this.syncCount / (this.syncCount + this.errorCount)) * 100).toFixed(2)
      : '0';

    console.log('\n' + '=' .repeat(50));
    console.log('📈 Background Sync Service Statistics');
    console.log(`⏱️  Uptime: ${this.formatUptime(uptime)}`);
    console.log(`✅ Successful syncs: ${this.syncCount}`);
    console.log(`❌ Failed syncs: ${this.errorCount}`);
    console.log(`📊 Success rate: ${successRate}%`);
    if (this.lastSyncTime) {
      console.log(`🕐 Last sync: ${this.lastSyncTime.toISOString()}`);
    }
    console.log('=' .repeat(50));
  }

  /**
   * Format uptime in human-readable format
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle process signals for graceful shutdown
let service: BackgroundSyncService | null = null;

process.on('SIGINT', () => {
  console.log('\n📥 Received SIGINT signal');
  if (service) {
    service.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n📥 Received SIGTERM signal');
  if (service) {
    service.stop();
  }
  process.exit(0);
});

// Main execution
async function main() {
  console.log('🎯 Arkham Liquidation Monitor - Background Sync Service');
  console.log('=' .repeat(50));

  // Get sync interval from environment or use default
  const syncInterval = process.env.SYNC_INTERVAL_SECONDS 
    ? parseInt(process.env.SYNC_INTERVAL_SECONDS) 
    : 30;

  // Create and start service
  service = new BackgroundSyncService(syncInterval);
  await service.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { BackgroundSyncService };