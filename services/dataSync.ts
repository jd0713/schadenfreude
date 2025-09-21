import { PositionFetcher } from './positionFetcher';

export class DataSyncService {
  private fetcher: PositionFetcher;
  private syncInterval: NodeJS.Timer | null = null;

  constructor() {
    this.fetcher = new PositionFetcher();
  }

  /**
   * Perform initial sync
   */
  async initialSync(): Promise<void> {
    console.log('Starting initial data sync...');
    
    // Load and sync entities
    const entities = await this.fetcher.loadEntitiesFromFile();
    console.log(`Loaded ${entities.length} entities from file`);
    
    await this.fetcher.syncEntitiesToDatabase(entities);
    console.log('Entities synced to database');
    
    // Fetch initial positions
    const positions = await this.fetcher.fetchAllPositions();
    console.log(`Fetched ${positions.length} positions`);
  }

  /**
   * Start automatic sync
   */
  startAutoSync(intervalSeconds: number = 30): void {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    console.log(`Starting auto-sync with ${intervalSeconds}s interval`);
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.fetcher.fetchAllPositions();
        console.log(`Auto-sync completed at ${new Date().toISOString()}`);
      } catch (error) {
        console.error('Auto-sync error:', error);
      }
    }, intervalSeconds * 1000);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Manual sync trigger
   */
  async manualSync(): Promise<{
    success: boolean;
    positionsUpdated: number;
    errors?: string[];
  }> {
    const errors: string[] = [];
    
    try {
      // Sync entities first
      const entities = await this.fetcher.loadEntitiesFromFile();
      await this.fetcher.syncEntitiesToDatabase(entities);
      
      // Then fetch positions
      const positions = await this.fetcher.fetchAllPositions();
      
      return {
        success: true,
        positionsUpdated: positions.length,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        positionsUpdated: 0,
        errors,
      };
    }
  }
}