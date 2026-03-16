// Session configuration for SIWE authentication
// Using Next.js cookies() for session management

export interface SessionData {
  nonce?: string;
  address?: string;
  chainId?: number;
  isAuthenticated?: boolean;
}

export const SESSION_COOKIE_NAME = 'siwe-auth';
export const NONCE_COOKIE_NAME = 'siwe-nonce';
