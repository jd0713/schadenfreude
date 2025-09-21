import axios from 'axios';
import { HyperliquidAccountState, HyperliquidMidPrice } from './types';

const API_URL = process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz/info';

export class HyperliquidClient {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || API_URL;
  }

  /**
   * Get account state for a specific user address
   */
  async getAccountState(address: string): Promise<HyperliquidAccountState | null> {
    try {
      const response = await axios.post(this.apiUrl, {
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
   */
  async getAllMidPrices(): Promise<HyperliquidMidPrice | null> {
    try {
      const response = await axios.post(this.apiUrl, {
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
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 10;
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
      
      // Small delay between batches
      if (i + batchSize < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
}