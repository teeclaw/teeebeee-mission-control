import { NextResponse } from 'next/server';
import { generateNonce } from 'siwe';
import { cookies } from 'next/headers';

export async function GET() {
  const nonce = generateNonce();
  
  // Store nonce in cookie for verification
  cookies().set('siwe-nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 5, // 5 minutes
  });
  
  return NextResponse.json({ nonce });
}
