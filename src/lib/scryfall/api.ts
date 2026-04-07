import { ScryfallCard, ScryfallSet } from '../types';

const SCRYFALL_API_BASE = process.env.SCRYFALL_API_BASE_URL || 'https://api.scryfall.com';

export class ScryfallAPI {
  private static async fetchFromScryfall<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${SCRYFALL_API_BASE}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  static async searchCards(query: string, page = 1): Promise<{
    data: ScryfallCard[];
    has_more: boolean;
    total_cards: number;
    next_page?: string;
  }> {
    const searchParams = new URLSearchParams({
      q: query,
      page: page.toString(),
      order: 'released',
      dir: 'desc',
      include_extras: 'false',
      include_multilingual: 'false',
    });

    return this.fetchFromScryfall(`/cards/search?${searchParams}`);
  }

  static async getCardById(id: string): Promise<ScryfallCard> {
    return this.fetchFromScryfall(`/cards/${id}`);
  }

  static async getCardPrintings(oracleId: string): Promise<ScryfallCard[]> {
    const response = await this.fetchFromScryfall<{
      data: ScryfallCard[];
    }>(`/cards/collector/${oracleId}`);
    return response.data;
  }

  static async getSetByCode(code: string): Promise<ScryfallSet> {
    return this.fetchFromScryfall(`/sets/${code}`);
  }

  static async getAllSets(): Promise<ScryfallSet[]> {
    const response = await this.fetchFromScryfall<{
      data: ScryfallSet[];
    }>('/sets');
    return response.data;
  }

  static async getCardsInSet(setCode: string, page = 1): Promise<{
    data: ScryfallCard[];
    has_more: boolean;
    next_page?: string;
  }> {
    return this.fetchFromScryfall(`/cards/search?order=set&page=${page}&q=set:${setCode}`);
  }
}
