import axios from 'axios';
import { HyperliquidAccountState, HyperliquidMidPrice } from './types';

// Dual endpoint configuration:
// - Private API (local node) for account states / clearinghouse data
// - Public API for price data (allmids)
const PRIVATE_API_URL = process.env.HYPERLIQUID_PRIVATE_API_URL ||
                        process.env.HYPERLIQUID_API_URL ||
                        'http://localhost:3001/info';
const PUBLIC_API_URL = process.env.HYPERLIQUID_PUBLIC_API_URL ||
                       'https://api.hyperliquid.xyz/info';

export class HyperliquidClient {
  private privateApiUrl: string;  // For account states (clearinghouse)
  private publicApiUrl: string;   // For price data (allmids)

  constructor(privateApiUrl?: string, publicApiUrl?: string) {
    this.privateApiUrl = privateApiUrl || PRIVATE_API_URL;
    this.publicApiUrl = publicApiUrl || PUBLIC_API_URL;

    console.log('🔧 HyperliquidClient initialized:');
    console.log(`   Private API (account states): ${this.privateApiUrl}`);
    console.log(`   Public API (price data): ${this.publicApiUrl}`);
  }

  /**
   * Get account state for a specific user address
   * Uses private API (local node) for clearinghouse state
   */
  async getAccountState(address: string): Promise<HyperliquidAccountState | null> {
    try {
      const response = await axios.post(this.privateApiUrl, {
        type: 'clearinghouseState',
        user: address,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching account state for ${address}:`, error);
      return null;
    }
  }

  /**
   * Get current mid prices for all assets
   * Note: This must use the public API, not local node
   */
  async getAllMidPrices(): Promise<HyperliquidMidPrice | null> {
    try {
      const response = await axios.post(this.publicApiUrl, {
        type: 'allMids',
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching mid prices:', error);
      return null;
    }
  }

  /**
   * Get multiple account states in parallel
   */
  async getMultipleAccountStates(addresses: string[]): Promise<Map<string, HyperliquidAccountState>> {
    const results = new Map<string, HyperliquidAccountState>();
    
    // Optimized batch size for local node (can handle much more)
    const isLocalNode = this.privateApiUrl.includes('localhost') || this.privateApiUrl.includes('127.0.0.1');
    
    // Allow configuration via environment variables
    const batchSize = isLocalNode 
      ? (process.env.BATCH_SIZE_LOCAL ? parseInt(process.env.BATCH_SIZE_LOCAL) : 500)
      : (process.env.BATCH_SIZE_REMOTE ? parseInt(process.env.BATCH_SIZE_REMOTE) : 10);
    
    const delayMs = isLocalNode 
      ? (process.env.BATCH_DELAY_LOCAL ? parseInt(process.env.BATCH_DELAY_LOCAL) : 5)
      : (process.env.BATCH_DELAY_REMOTE ? parseInt(process.env.BATCH_DELAY_REMOTE) : 100);
    
    console.log(`🔄 Fetching ${addresses.length} account states in batches of ${batchSize}`);
    
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      const promises = batch.map(address => this.getAccountState(address));
      const batchResults = await Promise.all(promises);
      
      batch.forEach((address, index) => {
        const result = batchResults[index];
        if (result) {
          results.set(address, result);
        }
      });
      
      // Progress logging for large batches
      if (addresses.length > 50 && i % 100 === 0) {
        console.log(`   Progress: ${Math.min(i + batchSize, addresses.length)}/${addresses.length} accounts fetched`);
      }
      
      // Small delay between batches (shorter for local node)
      if (i + batchSize < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.log(`✅ Fetched ${results.size}/${addresses.length} account states successfully`);
    
    return results;
  }
}