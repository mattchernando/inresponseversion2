import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  set: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  prices: { usd: string | null; usd_foil: string | null; tix?: string | null };
  image_uris?: { normal: string; small: string; large: string };
  card_faces?: Array<{ image_uris?: { normal: string; small: string; large: string } }>;
  released_at: string;
}

function getImageUrl(card: ScryfallCard): string {
  if (card.image_uris?.normal) return card.image_uris.normal;
  if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal;
  return '';
}

function generateRecommendation(card: ScryfallCard) {
  const usd = parseFloat(card.prices?.usd || '0');
  const foil = parseFloat(card.prices?.usd_foil || '0');
  const rarity = card.rarity;

  const signals: string[] = [];
  let score = 0; // positive = BUY, negative = SELL, near 0 = HOLD

  // Foil premium: if foil is significantly more expensive, card has collector demand
  if (foil > 0 && usd > 0) {
    const foilMultiplier = foil / usd;
    if (foilMultiplier > 5) { score += 2; signals.push('high foil premium signals collector demand'); }
    else if (foilMultiplier > 2) { score += 1; signals.push('moderate foil premium'); }
  }

  // Price tier analysis
  if (usd === 0) {
    score -= 1;
    signals.push('no market price — low liquidity');
  } else if (usd >= 100) {
    score -= 1;
    signals.push('high price may limit upside');
  } else if (usd >= 20) {
    score += 1;
    signals.push('established value card');
  } else if (usd >= 5) {
    score += 1;
    signals.push('solid mid-range price point');
  } else if (usd >= 1) {
    score += 2;
    signals.push('undervalued relative to rarity');
  } else {
    score += 1;
    signals.push('budget pickup with upside');
  }

  // Rarity signal
  if (rarity === 'mythic') { score += 2; signals.push('mythic rarity drives scarcity'); }
  else if (rarity === 'rare') { score += 1; signals.push('rare with reprint risk'); }
  else if (rarity === 'uncommon') { score += 0; }
  else { score -= 1; signals.push('common — low price ceiling'); }

  // Double-faced cards have collector premium
  if (card.card_faces && card.card_faces.length > 1) {
    score += 1;
    signals.push('double-faced card with collector appeal');
  }

  // Derive signal
  let signal: 'BUY' | 'HOLD' | 'SELL';
  let confidence: number;
  if (score >= 3) { signal = 'BUY'; confidence = Math.min(0.55 + score * 0.08, 0.95); }
  else if (score <= 0) { signal = 'SELL'; confidence = Math.min(0.50 + Math.abs(score) * 0.08, 0.90); }
  else { signal = 'HOLD'; confidence = 0.60 + score * 0.05; }

  return {
    signal,
    confidence: parseFloat(confidence.toFixed(2)),
    reasoning: signals.slice(0, 2).join('; '),
  };
}

async function searchScryfall(query: string, limit: number): Promise<any[]> {
  const scryfallUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints&order=released&dir=desc`;

  const response = await fetch(scryfallUrl, {
    headers: { 'User-Agent': 'InResponse/1.0', 'Accept': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`Scryfall API error: ${response.status}`);
  }

  const data = await response.json();
  const cards: ScryfallCard[] = data.data || [];

  return cards.slice(0, limit).map((card) => ({
    id: card.id,
    name: card.name,
    set: card.set,
    set_name: card.set_name,
    collector_number: card.collector_number,
    rarity: card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1),
    price: parseFloat(card.prices?.usd || '0'),
    price_foil: parseFloat(card.prices?.usd_foil || '0'),
    image_url: getImageUrl(card),
    scryfall_id: card.id,
    released_at: card.released_at,
    recommendation: generateRecommendation(card),
    card_faces: card.card_faces,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);

    const validatedParams = searchSchema.parse(params);

    const results = await searchScryfall(validatedParams.q, validatedParams.limit);

    return NextResponse.json({
      data: results,
      has_more: false,
      total_cards: results.length,
    });
  } catch (error) {
    console.error('Search API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Search failed', data: [], has_more: false, total_cards: 0 },
      { status: 500 }
    );
  }
}
