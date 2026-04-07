import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/service';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/signup - Sign up new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Determine if this is signup or signin based on request body
    if (body.action === 'signup') {
      const validatedData = signUpSchema.parse(body);
      
      const result = await AuthService.signUp(
        validatedData.email,
        validatedData.password,
        validatedData.displayName
      );

      // Create profile if signup successful
      if (result.user && !result.user.email_confirmed_at) {
        await AuthService.upsertProfile(result.user.id, {
          display_name: validatedData.displayName || null,
        });
      }

      return NextResponse.json({ 
        message: 'Signup successful. Please check your email to verify your account.',
        user: result.user 
      });
    } else if (body.action === 'signin') {
      const validatedData = signInSchema.parse(body);
      
      const result = await AuthService.signIn(
        validatedData.email,
        validatedData.password
      );

      return NextResponse.json({ 
        message: 'Signin successful',
        user: result.user 
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    // Handle specific auth errors
    if (error instanceof Error) {
      if (error.message?.includes('User already registered')) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 });
      }
      
      if (error.message?.includes('Invalid login credentials')) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
