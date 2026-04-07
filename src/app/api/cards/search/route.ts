import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db/service';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  set: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    
    const validatedParams = searchSchema.parse(params);
    
    // Try to search from database first
    const results = await DatabaseService.searchCardsWithPrintings(
      validatedParams.q,
      validatedParams.set,
      validatedParams.limit
    );
    
    return NextResponse.json({
      data: results,
      has_more: false,
      total_cards: results.length
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
