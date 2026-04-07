-- Create tables for InResponse v2

-- Sets table
CREATE TABLE IF NOT EXISTS sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scryfall_set_id TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  set_type TEXT NOT NULL,
  released_at DATE NOT NULL,
  card_count INTEGER NOT NULL,
  icon_svg_uri TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards table (canonical card identity)
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scryfall_id TEXT UNIQUE NOT NULL,
  oracle_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  mana_cost TEXT,
  cmc DECIMAL(3,1) NOT NULL,
  type_line TEXT NOT NULL,
  oracle_text TEXT,
  colors TEXT[] NOT NULL,
  color_identity TEXT[] NOT NULL,
  image_uri TEXT,
  layout TEXT NOT NULL,
  reserved BOOLEAN DEFAULT FALSE,
  reprint BOOLEAN DEFAULT FALSE,
  released_at DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card printings table
CREATE TABLE IF NOT EXISTS card_printings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scryfall_id TEXT UNIQUE NOT NULL,
  oracle_id TEXT NOT NULL,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
  set_code TEXT NOT NULL,
  collector_number TEXT NOT NULL,
  rarity TEXT NOT NULL,
  finish TEXT,
  released_at DATE NOT NULL,
  image_uri TEXT,
  usd DECIMAL(10,2),
  usd_foil DECIMAL(10,2),
  usd_etched DECIMAL(10,2),
  eur DECIMAL(10,2),
  tix DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(card_id, set_id)
);

-- Price snapshots table
CREATE TABLE IF NOT EXISTS price_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_printing_id UUID REFERENCES card_printings(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  usd DECIMAL(10,2),
  usd_foil DECIMAL(10,2),
  usd_etched DECIMAL(10,2),
  source TEXT DEFAULT 'scryfall',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(card_printing_id, snapshot_date)
);

-- Phase 2: User Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phase 2: Portfolios
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_default_portfolio UNIQUE (user_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Phase 2: Portfolio Holdings
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  card_printing_id UUID REFERENCES card_printings(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  purchase_price DECIMAL(10,2) NOT NULL CHECK (purchase_price >= 0),
  acquired_date DATE NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged')),
  finish TEXT,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phase 2: Portfolio Snapshots
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE NOT NULL,
  total_value DECIMAL(12,2) NOT NULL,
  total_cost_basis DECIMAL(12,2) NOT NULL,
  unrealized_gain_loss DECIMAL(12,2) NOT NULL,
  percent_gain_loss DECIMAL(8,4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(portfolio_id, snapshot_date)
);

-- Phase 2: Holding Snapshots (optional but recommended)
CREATE TABLE IF NOT EXISTS holding_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  holding_id UUID REFERENCES portfolio_holdings(id) ON DELETE CASCADE NOT NULL,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  market_price DECIMAL(10,2) NOT NULL,
  total_value DECIMAL(12,2) NOT NULL,
  cost_basis DECIMAL(12,2) NOT NULL,
  gain_loss DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(holding_id, snapshot_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
CREATE INDEX IF NOT EXISTS idx_cards_normalized_name ON cards(normalized_name);
CREATE INDEX IF NOT EXISTS idx_cards_oracle_id ON cards(oracle_id);
CREATE INDEX IF NOT EXISTS idx_cards_released_at ON cards(released_at);

CREATE INDEX IF NOT EXISTS idx_sets_code ON sets(code);
CREATE INDEX IF NOT EXISTS idx_sets_released_at ON sets(released_at);

CREATE INDEX IF NOT EXISTS idx_card_printings_card_id ON card_printings(card_id);
CREATE INDEX IF NOT EXISTS idx_card_printings_set_id ON card_printings(set_id);
CREATE INDEX IF NOT EXISTS idx_card_printings_oracle_id ON card_printings(oracle_id);
CREATE INDEX IF NOT EXISTS idx_card_printings_set_code ON card_printings(set_code);
CREATE INDEX IF NOT EXISTS idx_card_printings_released_at ON card_printings(released_at);

CREATE INDEX IF NOT EXISTS idx_price_snapshots_card_printing_id ON price_snapshots(card_printing_id);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_snapshot_date ON price_snapshots(snapshot_date);

-- Phase 2 Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_is_default ON portfolios(is_default);

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_portfolio_id ON portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id ON portfolio_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_card_id ON portfolio_holdings(card_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_card_printing_id ON portfolio_holdings(card_printing_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_acquired_date ON portfolio_holdings(acquired_date);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_portfolio_id ON portfolio_snapshots(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_id ON portfolio_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_snapshot_date ON portfolio_snapshots(snapshot_date);

CREATE INDEX IF NOT EXISTS idx_holding_snapshots_holding_id ON holding_snapshots(holding_id);
CREATE INDEX IF NOT EXISTS idx_holding_snapshots_portfolio_id ON holding_snapshots(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holding_snapshots_user_id ON holding_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_holding_snapshots_snapshot_date ON holding_snapshots(snapshot_date);

-- Enable Row Level Security (RLS)
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_printings ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE holding_snapshots ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all reads for public data, user-specific for private data)
CREATE POLICY "Allow read access to sets" ON sets FOR SELECT USING (true);
CREATE POLICY "Allow insert access to sets (service only)" ON sets FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow update access to sets (service only)" ON sets FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Allow delete access to sets (service only)" ON sets FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Allow read access to cards" ON cards FOR SELECT USING (true);
CREATE POLICY "Allow insert access to cards (service only)" ON cards FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow update access to cards (service only)" ON cards FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Allow delete access to cards (service only)" ON cards FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Allow read access to card_printings" ON card_printings FOR SELECT USING (true);
CREATE POLICY "Allow insert access to card_printings (service only)" ON card_printings FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow update access to card_printings (service only)" ON card_printings FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Allow delete access to card_printings (service only)" ON card_printings FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Allow read access to price_snapshots" ON price_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow insert access to price_snapshots (service only)" ON price_snapshots FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow update access to price_snapshots (service only)" ON price_snapshots FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Allow delete access to price_snapshots (service only)" ON price_snapshots FOR DELETE USING (auth.role() = 'service_role');

-- Phase 2 RLS Policies - User-specific data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own portfolios" ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own portfolios" ON portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolios" ON portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own portfolios" ON portfolios FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own holdings" ON portfolio_holdings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own holdings" ON portfolio_holdings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own holdings" ON portfolio_holdings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own holdings" ON portfolio_holdings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own portfolio snapshots" ON portfolio_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own portfolio snapshots" ON portfolio_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolio snapshots" ON portfolio_snapshots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own portfolio snapshots" ON portfolio_snapshots FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own holding snapshots" ON holding_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own holding snapshots" ON holding_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own holding snapshots" ON holding_snapshots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own holding snapshots" ON holding_snapshots FOR DELETE USING (auth.uid() = user_id);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_card_printings_updated_at BEFORE UPDATE ON card_printings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_holdings_updated_at BEFORE UPDATE ON portfolio_holdings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default portfolio for new users
CREATE OR REPLACE FUNCTION create_default_portfolio()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO portfolios (user_id, name, is_default)
    VALUES (NEW.id, 'My Portfolio', true);
    RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

-- Trigger to create default portfolio when user signs up
CREATE TRIGGER create_default_portfolio_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_portfolio();
