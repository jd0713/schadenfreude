-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS liquidation_alerts CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS entities CASCADE;

-- Arkham entity information
CREATE TABLE entities (
    address TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    twitter TEXT,
    entity_type TEXT CHECK (entity_type IN ('individual', 'fund', 'institution')),
    collected_at TIMESTAMP WITH TIME ZONE,
    chain TEXT DEFAULT 'ethereum',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Position information
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    address TEXT NOT NULL REFERENCES entities(address) ON DELETE CASCADE,
    coin TEXT NOT NULL,
    entry_price DECIMAL(20, 8),
    position_size DECIMAL(20, 8),
    leverage DECIMAL(10, 2),
    liquidation_price DECIMAL(20, 8),
    unrealized_pnl DECIMAL(20, 8),
    margin_used DECIMAL(20, 8),
    position_value DECIMAL(20, 8),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(address, coin) -- Each address can only have one position per coin
);

-- Liquidation alerts
CREATE TABLE liquidation_alerts (
    id SERIAL PRIMARY KEY,
    position_id INTEGER NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('warning', 'danger', 'critical')),
    distance_to_liquidation DECIMAL(10, 4),
    current_price DECIMAL(20, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_entities_chain ON entities(chain);
CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_positions_address ON positions(address);
CREATE INDEX idx_positions_coin ON positions(coin);
CREATE INDEX idx_positions_liquidation_price ON positions(liquidation_price);
CREATE INDEX idx_positions_updated ON positions(last_updated);
CREATE INDEX idx_alerts_position ON liquidation_alerts(position_id);
CREATE INDEX idx_alerts_type ON liquidation_alerts(alert_type);
CREATE INDEX idx_alerts_created ON liquidation_alerts(created_at);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Enable if needed
-- ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE liquidation_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust as needed)
-- CREATE POLICY "Allow public read access" ON entities FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON positions FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON liquidation_alerts FOR SELECT USING (true);