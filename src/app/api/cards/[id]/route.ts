import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db/service';
import { getBuySignal } from '@/lib/recommendations/engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params;
    
    // Get card printing by Scryfall ID
    const printing = await DatabaseService.getCardPrintingByScryfallId(cardId);
    
    if (!printing) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }
    
    // Get all printings for this card
    const printings = await DatabaseService.getCardPrintings(printing.oracle_id);
    
    // Get price history for this printing
    const priceHistory = await DatabaseService.getPriceHistory(printing.id);
    
    // Get the canonical card data for reprint info
    const card = await DatabaseService.getCardByOracleId(printing.oracle_id);
    
    // Generate recommendation
    const recommendation = getBuySignal({
      currentPrice: printing.usd,
      priceHistory,
      card: {
        released_at: printing.released_at,
        reprint: card?.reprint || false
      },
      printing: {
        rarity: printing.rarity,
        released_at: printing.released_at
      },
      printingsCount: printings.length
    });
    
    return NextResponse.json({
      printing,
      printings,
      priceHistory,
      recommendation
    });
    
  } catch (error) {
    console.error('Card detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
