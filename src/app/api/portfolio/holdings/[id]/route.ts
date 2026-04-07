import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/service';
import { PortfolioService } from '@/lib/portfolio/service';
import { CardCondition } from '@/lib/types';
import { z } from 'zod';

const updateHoldingSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  purchase_price: z.number().min(0).optional(),
  acquired_date: z.string().optional(),
  condition: z.nativeEnum(CardCondition).optional(),
  finish: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

// PATCH /api/portfolio/holdings/[id] - Update holding
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: holdingId } = await params;
    
    // Verify user owns this holding
    const ownsHolding = await PortfolioService.userOwnsHolding(holdingId, user.id);
    if (!ownsHolding) {
      return NextResponse.json({ error: 'Holding not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateHoldingSchema.parse(body);

    const holding = await PortfolioService.updateHolding(holdingId, user.id, validatedData);

    return NextResponse.json({ data: holding });
  } catch (error) {
    console.error('Holding PATCH error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/portfolio/holdings/[id] - Delete holding
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: holdingId } = await params;
    
    // Verify user owns this holding
    const ownsHolding = await PortfolioService.userOwnsHolding(holdingId, user.id);
    if (!ownsHolding) {
      return NextResponse.json({ error: 'Holding not found' }, { status: 404 });
    }

    await PortfolioService.deleteHolding(holdingId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Holding DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
