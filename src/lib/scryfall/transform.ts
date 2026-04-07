import { Card, Set, CardPrinting, ScryfallCard, ScryfallSet } from '../types';

export function transformScryfallCard(scryfallCard: ScryfallCard): Omit<Card, 'id' | 'created_at' | 'updated_at'> {
  return {
    scryfall_id: scryfallCard.id,
    oracle_id: scryfallCard.oracle_id,
    name: scryfallCard.name,
    normalized_name: scryfallCard.name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
    mana_cost: scryfallCard.mana_cost,
    cmc: scryfallCard.cmc,
    type_line: scryfallCard.type_line,
    oracle_text: scryfallCard.oracle_text,
    colors: scryfallCard.colors,
    color_identity: scryfallCard.color_identity,
    image_uri: scryfallCard.image_uris?.normal || null,
    layout: scryfallCard.layout,
    reserved: scryfallCard.reserved,
    reprint: scryfallCard.reprint,
    released_at: scryfallCard.released_at,
  };
}

export function transformScryfallSet(scryfallSet: ScryfallSet): Omit<Set, 'id' | 'created_at' | 'updated_at'> {
  return {
    scryfall_set_id: scryfallSet.id,
    code: scryfallSet.code,
    name: scryfallSet.name,
    set_type: scryfallSet.set_type,
    released_at: scryfallSet.released_at,
    card_count: scryfallSet.card_count,
    icon_svg_uri: scryfallSet.icon_svg_uri,
  };
}

export function transformScryfallCardToPrinting(
  scryfallCard: ScryfallCard,
  cardId: string,
  setId: string
): Omit<CardPrinting, 'id' | 'created_at' | 'updated_at'> {
  return {
    scryfall_id: scryfallCard.id,
    oracle_id: scryfallCard.oracle_id,
    card_id: cardId,
    set_id: setId,
    set_code: scryfallCard.set,
    collector_number: scryfallCard.collector_number,
    rarity: scryfallCard.rarity,
    finish: scryfallCard.finishes?.[0] || null,
    released_at: scryfallCard.released_at,
    image_uri: scryfallCard.image_uris?.normal || null,
    usd: scryfallCard.usd ? parseFloat(scryfallCard.usd) : null,
    usd_foil: scryfallCard.usd_foil ? parseFloat(scryfallCard.usd_foil) : null,
    usd_etched: scryfallCard.usd_etched ? parseFloat(scryfallCard.usd_etched) : null,
    eur: scryfallCard.eur ? parseFloat(scryfallCard.eur) : null,
    tix: scryfallCard.tix ? parseFloat(scryfallCard.tix) : null,
  };
}

export function formatPrice(price: number | null): string {
  if (price === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getRarityColor(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'common':
      return 'bg-gray-500';
    case 'uncommon':
      return 'bg-green-500';
    case 'rare':
      return 'bg-blue-500';
    case 'mythic':
      return 'bg-orange-500';
    case 'special':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
}

export function getFinishColor(finish: string | null): string {
  switch (finish?.toLowerCase()) {
    case 'foil':
      return 'bg-gradient-to-r from-gray-400 to-gray-600';
    case 'etched':
      return 'bg-gradient-to-r from-purple-400 to-purple-600';
    case 'glossy':
      return 'bg-gradient-to-r from-blue-400 to-blue-600';
    case 'textured':
      return 'bg-gradient-to-r from-orange-400 to-orange-600';
    default:
      return 'bg-gray-200';
  }
}
