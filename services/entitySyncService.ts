/**
 * Entity Sync Service
 * Watches for changes in entities.json and syncs with Supabase
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local BEFORE importing supabase
config({ path: path.join(__dirname, '../.env.local') });

// Now import modules that depend on environment variables
import fs from 'fs/promises';
import { watch, FSWatcher } from 'fs';
import { supabase } from '../lib/supabase';
import crypto from 'crypto';

interface ArkhamEntity {
  address: string;
  chain: string;
  arkhamEntity: {
    name: string;
    note: string;
    id: string;
    type: 'individual' | 'fund' | 'institution';
    service: string | null;
    addresses: string[] | null;
    twitter: string;
  };
  collected_at: string;
}

export class EntitySyncService {
  private entitiesPath: string;
  private watcher: FSWatcher | null = null;
  private lastFileHash: string | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;
  private syncCount: number = 0;
  private errorCount: number = 0;

  constructor() {
    // Path to entities.json
    this.entitiesPath = path.join(
      process.cwd(),
      '..',
      'arkham_entity_collector',
      'data',
      'entities.json'
    );
  }

  /**
   * Start watching entities.json for changes
   */
  async start(): Promise<void> {
    console.log('🔍 Starting Entity Sync Service');
    console.log(`📁 Watching: ${this.entitiesPath}`);
    
    // Initial sync
    await this.syncEntities();
    
    // Watch for file changes
    this.setupFileWatcher();
    
    // Also check periodically (every 5 minutes) as backup
    this.checkInterval = setInterval(() => {
      this.checkAndSync();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop the sync service
   */
  stop(): void {
    console.log('🛑 Stopping Entity Sync Service');
    
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.printStats();
  }

  /**
   * Setup file watcher for entities.json
   */
  private setupFileWatcher(): void {
    try {
      this.watcher = watch(this.entitiesPath, async (eventType) => {
        if (eventType === 'change' && !this.isProcessing) {
          console.log('📝 File change detected in entities.json');
          await this.checkAndSync();
        }
      });
      
      console.log('✅ File watcher setup complete');
    } catch (error) {
      console.error('❌ Failed to setup file watcher:', error);
      console.log('⚠️ Will rely on periodic checks only');
    }
  }

  /**
   * Check if file has changed and sync if needed
   */
  private async checkAndSync(): Promise<void> {
    if (this.isProcessing) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    try {
      const currentHash = await this.getFileHash();
      
      if (currentHash !== this.lastFileHash) {
        console.log('🔄 File content changed, syncing entities...');
        await this.syncEntities();
        this.lastFileHash = currentHash;
      }
    } catch (error) {
      console.error('❌ Error during check and sync:', error);
      this.errorCount++;
    }
  }

  /**
   * Calculate hash of the file to detect changes
   */
  private async getFileHash(): Promise<string> {
    try {
      const content = await fs.readFile(this.entitiesPath, 'utf-8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      console.error('❌ Error reading file for hash:', error);
      throw error;
    }
  }

  /**
   * Sync entities to Supabase
   */
  private async syncEntities(): Promise<void> {
    this.isProcessing = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n[${new Date().toISOString()}] 🚀 Starting entity sync...`);
      
      // Read entities from file
      const fileContent = await fs.readFile(this.entitiesPath, 'utf-8');
      const entitiesObj = JSON.parse(fileContent);
      const entities: ArkhamEntity[] = Object.values(entitiesObj);
      
      console.log(`📊 Found ${entities.length} entities in file`);
      
      // Get existing entities from database
      const { data: existingEntities, error: fetchError } = await supabase
        .from('entities')
        .select('address');
      
      if (fetchError) {
        throw new Error(`Failed to fetch existing entities: ${fetchError.message}`);
      }
      
      const existingAddresses = new Set(existingEntities?.map(e => e.address) || []);
      
      // Find new entities
      const newEntities = entities.filter(e => !existingAddresses.has(e.address));
      const updatedEntities = entities.filter(e => existingAddresses.has(e.address));
      
      console.log(`📈 New entities: ${newEntities.length}, Updated: ${updatedEntities.length}`);
      
      // Batch upsert all entities (will update existing, insert new)
      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < entities.length; i += batchSize) {
        const batch = entities.slice(i, i + batchSize);
        
        const batchData = batch.map(entity => ({
          address: entity.address,
          name: entity.arkhamEntity.name,
          twitter: entity.arkhamEntity.twitter,
          entity_type: entity.arkhamEntity.type,
          collected_at: entity.collected_at,
          chain: entity.chain,
        }));
        
        const { error } = await supabase
          .from('entities')
          .upsert(batchData, {
            onConflict: 'address', // Update if exists
          });
        
        if (error) {
          console.error(`❌ Error uploading batch: ${error.message}`);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }
        
        // Small delay between batches
        if (i + batchSize < entities.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const syncDuration = Date.now() - startTime;
      
      console.log(`\n✅ Entity sync completed in ${syncDuration}ms`);
      console.log(`   📊 Success: ${successCount}, Failed: ${errorCount}`);
      console.log(`   🆕 New entities added: ${newEntities.length}`);
      
      this.syncCount++;
      
      // Log some of the new entities for visibility
      if (newEntities.length > 0) {
        console.log('\n🆕 Sample of new entities added:');
        newEntities.slice(0, 5).forEach(entity => {
          console.log(`   - ${entity.arkhamEntity.name} (${entity.address.slice(0, 6)}...)`);
        });
        if (newEntities.length > 5) {
          console.log(`   ... and ${newEntities.length - 5} more`);
        }
      }
      
    } catch (error) {
      console.error('❌ Entity sync failed:', error);
      this.errorCount++;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Print service statistics
   */
  private printStats(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📈 Entity Sync Service Statistics');
    console.log(`✅ Successful syncs: ${this.syncCount}`);
    console.log(`❌ Failed syncs: ${this.errorCount}`);
    console.log('='.repeat(50));
  }
}

// Handle process signals for graceful shutdown
let service: EntitySyncService | null = null;

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
  console.log('🎯 Arkham Entity Sync Service');
  console.log('='.repeat(50));
  
  service = new EntitySyncService();
  await service.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export default EntitySyncService;