import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const { address } = await req.json();
  const authCookie = cookies().get('siwe-auth')?.value;
  
  if (!authCookie || !address) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const session = JSON.parse(authCookie);
    const authenticated = Boolean(
      session.authenticated && 
      session.address?.toLowerCase() === address.toLowerCase()
    );
    
    return NextResponse.json({ 
      authenticated,
      address: session.address,
      chainId: session.chainId,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
