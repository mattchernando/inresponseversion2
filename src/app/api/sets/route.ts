import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db/service';

export async function GET() {
  try {
    const sets = await DatabaseService.getAllSets();
    
    return NextResponse.json({
      data: sets
    });
    
  } catch (error) {
    console.error('Sets API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
