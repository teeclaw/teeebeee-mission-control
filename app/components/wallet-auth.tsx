'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SiweMessage } from 'siwe';

export function WalletAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    if (!address) return setIsAuthenticated(false);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
  }, [address]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleSignIn = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const nonceRes = await fetch('/api/auth/nonce');
      const { nonce } = await nonceRes.json();

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Teeebeee Mission Control',
        uri: window.location.origin,
        version: '1',
        chainId: 8453,
        nonce,
      });

      const messageText = message.prepareMessage();
      const signature = await signMessageAsync({ message: messageText });

      const verifyRes = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, signature }),
      });

      if (verifyRes.ok) {
        setIsAuthenticated(true);
        // Redirect to dashboard if on login page
        if (pathname === '/login') {
          router.push('/');
        }
      }
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  if (!isConnected) {
    return (
      <div className="wallet-auth">
        <ConnectButton showBalance={false} chainStatus="icon" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="wallet-auth">
        <div className="auth-status">
          <span className="auth-icon">🔒</span>
          <span className="auth-text">Sign to authenticate</span>
        </div>
        <button className="auth-btn" onClick={handleSignIn} disabled={isLoading}>
          {isLoading ? 'Signing...' : 'Sign Message'}
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-auth authenticated">
      <div className="auth-status">
        <span className="auth-icon">✅</span>
        <span className="auth-text">Authenticated</span>
      </div>
      <ConnectButton showBalance={false} chainStatus="icon" />
      <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
    </div>
  );
}
