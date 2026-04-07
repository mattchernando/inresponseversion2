import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/service';

// POST /api/auth/signout - Sign out user
export async function POST(request: NextRequest) {
  try {
    await AuthService.signOut();
    return NextResponse.json({ message: 'Signout successful' });
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
