import { supabaseAdmin } from './supabase';
import { Card, Set, CardPrinting, PriceSnapshot } from '../types';

export class DatabaseService {
  // Card operations
  static async createCard(card: Omit<Card, 'id' | 'created_at' | 'updated_at'>): Promise<Card> {
    const { data, error } = await supabaseAdmin
      .from('cards')
      .insert(card)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getCardByScryfallId(scryfallId: string): Promise<Card | null> {
    const { data, error } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('scryfall_id', scryfallId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async getCardByOracleId(oracleId: string): Promise<Card | null> {
    const { data, error } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('oracle_id', oracleId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async searchCards(query: string, limit = 20): Promise<Card[]> {
    const { data, error } = await supabaseAdmin
      .from('cards')
      .select('*')
      .or(`name.ilike.%${query}%,normalized_name.ilike.%${query}%`)
      .order('released_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Set operations
  static async createSet(setData: Omit<Set, 'id' | 'created_at' | 'updated_at'>): Promise<Set> {
    const { data, error } = await supabaseAdmin
      .from('sets')
      .insert(setData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getSetByCode(code: string): Promise<Set | null> {
    const { data, error } = await supabaseAdmin
      .from('sets')
      .select('*')
      .eq('code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async getAllSets(): Promise<Set[]> {
    const { data, error } = await supabaseAdmin
      .from('sets')
      .select('*')
      .order('released_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Card printing operations
  static async createCardPrinting(printing: Omit<CardPrinting, 'id' | 'created_at' | 'updated_at'>): Promise<CardPrinting> {
    const { data, error } = await supabaseAdmin
      .from('card_printings')
      .insert(printing)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getCardPrintings(oracleId: string): Promise<CardPrinting[]> {
    const { data, error } = await supabaseAdmin
      .from('card_printings')
      .select(`
        *,
        sets (
          code,
          name,
          released_at
        )
      `)
      .eq('oracle_id', oracleId)
      .order('released_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getCardPrintingByScryfallId(scryfallId: string): Promise<CardPrinting | null> {
    const { data, error } = await supabaseAdmin
      .from('card_printings')
      .select(`
        *,
        cards (
          name,
          type_line,
          oracle_text
        ),
        sets (
          code,
          name
        )
      `)
      .eq('scryfall_id', scryfallId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  // Price snapshot operations
  static async createPriceSnapshot(snapshot: Omit<PriceSnapshot, 'id' | 'created_at'>): Promise<PriceSnapshot> {
    const { data, error } = await supabaseAdmin
      .from('price_snapshots')
      .upsert(snapshot, { onConflict: 'card_printing_id,snapshot_date' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPriceHistory(cardPrintingId: string, days = 90): Promise<PriceSnapshot[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabaseAdmin
      .from('price_snapshots')
      .select('*')
      .eq('card_printing_id', cardPrintingId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Search with printings
  static async searchCardsWithPrintings(query: string, setCode?: string, limit = 20): Promise<{
    card: Card;
    printing: CardPrinting;
    set: Set;
  }[]> {
    let queryBuilder = supabaseAdmin
      .from('card_printings')
      .select(`
        *,
        cards!inner (
          *
        ),
        sets!inner (
          *
        )
      `)
      .or(`cards.name.ilike.%${query}%,cards.normalized_name.ilike.%${query}%`);

    if (setCode) {
      queryBuilder = queryBuilder.eq('sets.code', setCode);
    }

    const { data, error } = await queryBuilder
      .order('released_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      card: item.cards as Card,
      printing: item as CardPrinting,
      set: item.sets as Set
    }));
  }
}
