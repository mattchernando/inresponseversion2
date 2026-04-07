import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/service';
import { PortfolioService } from '@/lib/portfolio/service';
import { CardCondition } from '@/lib/types';
import { z } from 'zod';

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

// GET /api/portfolio/holdings - Get all holdings for user's default portfolio
export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const portfolio = await PortfolioService.getDefaultPortfolio(user.id);
    const holdings = await PortfolioService.getPortfolioHoldings(portfolio.id);

    return NextResponse.json({ data: holdings });
  } catch (error) {
    console.error('Holdings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/portfolio/holdings - Create new holding
export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createHoldingSchema.parse(body);

    const portfolio = await PortfolioService.getDefaultPortfolio(user.id);
    const holding = await PortfolioService.createHolding(portfolio.id, user.id, validatedData);

    return NextResponse.json({ data: holding }, { status: 201 });
  } catch (error) {
    console.error('Holdings POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
