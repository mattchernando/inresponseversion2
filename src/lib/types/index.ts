export interface Card {
  id: string;
  scryfall_id: string;
  oracle_id: string;
  name: string;
  normalized_name: string;
  mana_cost: string | null;
  cmc: number;
  type_line: string;
  oracle_text: string | null;
  colors: string[];
  color_identity: string[];
  image_uri: string | null;
  layout: string;
  reserved: boolean;
  reprint: boolean;
  released_at: string;
  created_at: string;
  updated_at: string;
}

export interface Set {
  id: string;
  scryfall_set_id: string;
  code: string;
  name: string;
  set_type: string;
  released_at: string;
  card_count: number;
  icon_svg_uri: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardPrinting {
  id: string;
  scryfall_id: string;
  oracle_id: string;
  card_id: string;
  set_id: string;
  set_code: string;
  collector_number: string;
  rarity: string;
  finish: string | null;
  released_at: string;
  image_uri: string | null;
  usd: number | null;
  usd_foil: number | null;
  usd_etched: number | null;
  eur: number | null;
  tix: number | null;
  created_at: string;
  updated_at: string;
}

export interface PriceSnapshot {
  id: string;
  card_printing_id: string;
  snapshot_date: string;
  usd: number | null;
  usd_foil: number | null;
  usd_etched: number | null;
  source: string;
  created_at: string;
}

export interface RecommendationResult {
  verdict: 'buy_now' | 'wait' | 'fair_price' | 'buy_below_target';
  confidence: 'low' | 'medium' | 'high';
  targetPrice: number | null;
  summary: string;
  factors: string[];
}

export interface SearchFilters {
  set?: string;
  rarity?: string;
  finish?: string;
}

export interface SearchResult {
  card: Card;
  printing: CardPrinting;
  set: Set;
}

// Phase 2 Types - Portfolio & Auth

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioHolding {
  id: string;
  portfolio_id: string;
  user_id: string;
  card_id: string;
  card_printing_id: string;
  quantity: number;
  purchase_price: number;
  acquired_date: string;
  condition: CardCondition;
  finish: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Computed fields (not in DB)
  card?: Card;
  printing?: CardPrinting & { set?: Set };
  current_price?: number;
  current_value?: number;
  cost_basis?: number;
  gain_loss?: number;
  gain_loss_percent?: number;
}

export enum CardCondition {
  NEAR_MINT = 'near_mint',
  LIGHTLY_PLAYED = 'lightly_played',
  MODERATELY_PLAYED = 'moderately_played',
  HEAVILY_PLAYED = 'heavily_played',
  DAMAGED = 'damaged'
}

export enum HoldingSource {
  GAME_STORE = 'game_store',
  ONLINE = 'online',
  TRADE = 'trade',
  GIFT = 'gift',
  OTHER = 'other'
}

export interface PortfolioSnapshot {
  id: string;
  portfolio_id: string;
  user_id: string;
  snapshot_date: string;
  total_value: number;
  total_cost_basis: number;
  unrealized_gain_loss: number;
  percent_gain_loss: number;
  created_at: string;
}

export interface HoldingSnapshot {
  id: string;
  holding_id: string;
  portfolio_id: string;
  user_id: string;
  snapshot_date: string;
  quantity: number;
  market_price: number;
  total_value: number;
  cost_basis: number;
  gain_loss: number;
  created_at: string;
}

export interface PortfolioSummary {
  portfolio: Portfolio;
  total_value: number;
  total_cost_basis: number;
  unrealized_gain_loss: number;
  percent_gain_loss: number;
  holdings_count: number;
  cards_count: number;
  top_gainers: PortfolioHolding[];
  top_losers: PortfolioHolding[];
  largest_positions: PortfolioHolding[];
  recent_additions: PortfolioHolding[];
}

export interface ProjectionResult {
  direction: 'up' | 'flat' | 'down' | 'uncertain';
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  factors: string[];
}

export interface CreateHoldingInput {
  card_printing_id: string;
  quantity: number;
  purchase_price: number;
  acquired_date: string;
  condition: CardCondition;
  finish?: string;
  source?: string;
  notes?: string;
}

export interface UpdateHoldingInput {
  quantity?: number;
  purchase_price?: number;
  acquired_date?: string;
  condition?: CardCondition;
  finish?: string;
  source?: string;
  notes?: string;
}

// Auth related types
export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error?: string;
}

// Scryfall API types (raw responses)
export interface ScryfallCard {
  id: string;
  oracle_id: string;
  name: string;
  layout: string;
  image_uris?: {
    normal: string;
    large: string;
    small: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
  mana_cost: string | null;
  cmc: number;
  type_line: string;
  oracle_text: string | null;
  colors: string[];
  color_identity: string[];
  reserved: boolean;
  reprint: boolean;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  finishes: string[];
  released_at: string;
  usd: string | null;
  usd_foil: string | null;
  usd_etched: string | null;
  eur: string | null;
  tix: string | null;
  printed_type?: string;
  printed_text?: string;
  flavor_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
}

export interface ScryfallSet {
  id: string;
  code: string;
  name: string;
  set_type: string;
  released_at: string;
  card_count: number;
  icon_svg_uri: string;
  search_uri: string;
}
