import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  cookies().delete('siwe-auth');
  cookies().delete('siwe-nonce');
  return NextResponse.json({ success: true });
}
