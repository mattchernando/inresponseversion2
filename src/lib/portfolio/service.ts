import { supabase, supabaseAdmin } from '../supabase/client';
import { 
  Portfolio, 
  PortfolioHolding, 
  PortfolioSnapshot, 
  HoldingSnapshot,
  PortfolioSummary,
  CreateHoldingInput,
  UpdateHoldingInput,
  CardCondition
} from '../types';
import { z } from 'zod';

// Validation schemas
const createHoldingSchema = z.object({
  card_printing_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  purchase_price: z.number().min(0),
  acquired_date: z.string(),
  condition: z.nativeEnum(CardCondition),
  finish: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

const updateHoldingSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  purchase_price: z.number().min(0).optional(),
  acquired_date: z.string().optional(),
  condition: z.nativeEnum(CardCondition).optional(),
  finish: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export class PortfolioService {
  // Get user's default portfolio
  static async getDefaultPortfolio(userId: string): Promise<Portfolio> {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) throw error;
    return data;
  }

  // Get all portfolios for user
  static async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Create portfolio
  static async createPortfolio(userId: string, name: string): Promise<Portfolio> {
    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name,
        is_default: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get holdings for portfolio
  static async getPortfolioHoldings(portfolioId: string): Promise<PortfolioHolding[]> {
    const { data, error } = await supabase
      .from('portfolio_holdings')
      .select(`
        *,
        cards (
          id,
          name,
          oracle_id,
          type_line,
          mana_cost,
          colors,
          color_identity
        ),
        card_printings (
          id,
          scryfall_id,
          set_code,
          collector_number,
          rarity,
          finish,
          image_uri,
          usd,
          usd_foil,
          usd_etched,
          released_at,
          sets (
            id,
            code,
            name,
            icon_svg_uri
          )
        )
      `)
      .eq('portfolio_id', portfolioId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich holdings with computed values
    return (data || []).map(holding => this.enrichHolding(holding));
  }

  // Create holding
  static async createHolding(
    portfolioId: string, 
    userId: string, 
    input: CreateHoldingInput
  ): Promise<PortfolioHolding> {
    // Validate input
    const validatedInput = createHoldingSchema.parse(input);

    // Get card and printing info
    const { data: printing, error: printingError } = await supabase
      .from('card_printings')
      .select('card_id, set_id')
      .eq('id', input.card_printing_id)
      .single();

    if (printingError) throw printingError;

    const { data, error } = await supabase
      .from('portfolio_holdings')
      .insert({
        portfolio_id: portfolioId,
        user_id: userId,
        card_id: printing.card_id,
        card_printing_id: input.card_printing_id,
        quantity: input.quantity,
        purchase_price: input.purchase_price,
        acquired_date: input.acquired_date,
        condition: input.condition,
        finish: input.finish,
        source: input.source,
        notes: input.notes,
      })
      .select(`
        *,
        cards (
          id,
          name,
          oracle_id,
          type_line,
          mana_cost,
          colors,
          color_identity
        ),
        card_printings (
          id,
          scryfall_id,
          set_code,
          collector_number,
          rarity,
          finish,
          image_uri,
          usd,
          usd_foil,
          usd_etched,
          released_at,
          sets (
            id,
            code,
            name,
            icon_svg_uri
          )
        )
      `)
      .single();

    if (error) throw error;
    return this.enrichHolding(data);
  }

  // Update holding
  static async updateHolding(
    holdingId: string, 
    userId: string, 
    input: UpdateHoldingInput
  ): Promise<PortfolioHolding> {
    // Validate input
    const validatedInput = updateHoldingSchema.parse(input);

    const { data, error } = await supabase
      .from('portfolio_holdings')
      .update(validatedInput)
      .eq('id', holdingId)
      .eq('user_id', userId)
      .select(`
        *,
        cards (
          id,
          name,
          oracle_id,
          type_line,
          mana_cost,
          colors,
          color_identity
        ),
        card_printings (
          id,
          scryfall_id,
          set_code,
          collector_number,
          rarity,
          finish,
          image_uri,
          usd,
          usd_foil,
          usd_etched,
          released_at,
          sets (
            id,
            code,
            name,
            icon_svg_uri
          )
        )
      `)
      .single();

    if (error) throw error;
    return this.enrichHolding(data);
  }

  // Delete holding
  static async deleteHolding(holdingId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('portfolio_holdings')
      .delete()
      .eq('id', holdingId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Get portfolio summary
  static async getPortfolioSummary(portfolioId: string): Promise<PortfolioSummary> {
    // Get basic portfolio info
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();

    if (portfolioError) throw portfolioError;

    // Get all holdings
    const holdings = await this.getPortfolioHoldings(portfolioId);

    // Calculate summary metrics
    const totalValue = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
    const totalCostBasis = holdings.reduce((sum, h) => sum + (h.cost_basis || 0), 0);
    const unrealizedGainLoss = totalValue - totalCostBasis;
    const percentGainLoss = totalCostBasis > 0 ? (unrealizedGainLoss / totalCostBasis) * 100 : 0;

    // Sort holdings for different views
    const topGainers = holdings
      .filter(h => h.gain_loss_percent && h.gain_loss_percent > 0)
      .sort((a, b) => (b.gain_loss_percent || 0) - (a.gain_loss_percent || 0))
      .slice(0, 5);

    const topLosers = holdings
      .filter(h => h.gain_loss_percent && h.gain_loss_percent < 0)
      .sort((a, b) => (a.gain_loss_percent || 0) - (b.gain_loss_percent || 0))
      .slice(0, 5);

    const largestPositions = holdings
      .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
      .slice(0, 5);

    const recentAdditions = holdings
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return {
      portfolio,
      total_value: totalValue,
      total_cost_basis: totalCostBasis,
      unrealized_gain_loss: unrealizedGainLoss,
      percent_gain_loss: percentGainLoss,
      holdings_count: holdings.length,
      cards_count: holdings.length, // Could be different if we group by card
      top_gainers: topGainers,
      top_losers: topLosers,
      largest_positions: largestPositions,
      recent_additions: recentAdditions,
    };
  }

  // Create portfolio snapshot
  static async createPortfolioSnapshot(portfolioId: string, userId: string): Promise<PortfolioSnapshot> {
    const summary = await this.getPortfolioSummary(portfolioId);
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .upsert({
        portfolio_id: portfolioId,
        user_id: userId,
        snapshot_date: today,
        total_value: summary.total_value,
        total_cost_basis: summary.total_cost_basis,
        unrealized_gain_loss: summary.unrealized_gain_loss,
        percent_gain_loss: summary.percent_gain_loss,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get portfolio history
  static async getPortfolioHistory(portfolioId: string, days = 90): Promise<PortfolioSnapshot[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Helper method to enrich holding with computed values
  private static enrichHolding(holding: any): PortfolioHolding {
    const currentPrice = holding.card_printings?.usd;
    const quantity = holding.quantity;
    const purchasePrice = holding.purchase_price;
    
    const costBasis = quantity * purchasePrice;
    const currentValue = currentPrice ? quantity * currentPrice : 0;
    const gainLoss = currentValue - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

    return {
      ...holding,
      card: holding.cards,
      printing: holding.card_printings,
      current_price: currentPrice,
      current_value: currentValue,
      cost_basis: costBasis,
      gain_loss: gainLoss,
      gain_loss_percent: gainLossPercent,
    };
  }

  // Check if user owns holding
  static async userOwnsHolding(holdingId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('portfolio_holdings')
      .select('id')
      .eq('id', holdingId)
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  }

  // Check if user owns portfolio
  static async userOwnsPortfolio(portfolioId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  }
}
