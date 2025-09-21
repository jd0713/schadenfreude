import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbEntity {
  address: string;
  name: string;
  twitter?: string;
  entity_type?: string;
  collected_at: string;
  chain: string;
}

export interface DbPosition {
  id?: number;
  address: string;
  coin: string;
  entry_price: number;
  position_size: number;
  leverage: number;
  liquidation_price: number;
  unrealized_pnl: number;
  margin_used: number;
  position_value: number;
  last_updated?: string;
}

export interface DbLiquidationAlert {
  id?: number;
  position_id: number;
  alert_type: 'warning' | 'danger' | 'critical';
  distance_to_liquidation: number;
  current_price: number;
  created_at?: string;
}

// Database helper functions
export const db = {
  // Entity operations
  async getEntities(): Promise<DbEntity[]> {
    const { data, error } = await supabase
      .from('entities')
      .select('*');
    
    if (error) throw error;
    return data || [];
  },

  async upsertEntity(entity: DbEntity): Promise<void> {
    const { error } = await supabase
      .from('entities')
      .upsert(entity);
    
    if (error) throw error;
  },

  // Position operations
  async getPositions(): Promise<DbPosition[]> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .order('liquidation_price', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async upsertPosition(position: DbPosition): Promise<number | null> {
    const { data, error } = await supabase
      .from('positions')
      .upsert(position)
      .select('id')
      .single();
    
    if (error) throw error;
    return data?.id || null;
  },

  async deleteOldPositions(address: string, currentCoins: string[]): Promise<void> {
    if (currentCoins.length === 0) {
      // Delete all positions for this address
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('address', address);
      
      if (error) throw error;
    } else {
      // Delete positions not in current coins list
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('address', address)
        .not('coin', 'in', `(${currentCoins.join(',')})`);
      
      if (error) throw error;
    }
  },

  // Liquidation alert operations
  async createAlert(alert: DbLiquidationAlert): Promise<void> {
    const { error } = await supabase
      .from('liquidation_alerts')
      .insert(alert);
    
    if (error) throw error;
  },

  async getRecentAlerts(limit: number = 50): Promise<DbLiquidationAlert[]> {
    const { data, error } = await supabase
      .from('liquidation_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },
};