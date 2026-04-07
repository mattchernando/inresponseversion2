import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db/service';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const setCode = params.code;
    
    // Get set information
    const set = await DatabaseService.getSetByCode(setCode);
    
    if (!set) {
      return NextResponse.json(
        { error: 'Set not found' },
        { status: 404 }
      );
    }
    
    // For Phase 1, we'll keep this simple and not return all cards in the set
    // This can be expanded in Phase 2
    
    return NextResponse.json({
      set
    });
    
  } catch (error) {
    console.error('Set detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
