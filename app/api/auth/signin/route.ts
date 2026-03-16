import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();
    
    if (!message || !signature) {
      return NextResponse.json({ error: 'Missing message or signature' }, { status: 400 });
    }

    const nonce = cookies().get('siwe-nonce')?.value;
    if (!nonce) {
      return NextResponse.json({ error: 'Nonce expired' }, { status: 400 });
    }

    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature, nonce });

    if (result.success) {
      // Store auth session in cookie
      cookies().set('siwe-auth', JSON.stringify({
        address: siweMessage.address,
        chainId: siweMessage.chainId,
        authenticated: true,
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      // Clear nonce
      cookies().delete('siwe-nonce');

      return NextResponse.json({ 
        success: true,
        address: siweMessage.address,
        chainId: siweMessage.chainId,
      });
    }

    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  } catch (error) {
    console.error('SIWE verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
