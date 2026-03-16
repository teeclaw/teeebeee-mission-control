'use client';

import { WalletAuth } from '@/app/components/wallet-auth';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });
        const data = await res.json();
        
        if (data.authenticated) {
          setIsAuthenticated(true);
          router.push('/');
        } else {
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [address, router]);

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>Mission Control</h1>
            <p>Teeebeee Autonomous Business Engine</p>
          </div>
          <div className="login-loading">
            <div className="spinner"></div>
            <p>Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>Mission Control</h1>
            <p>Authenticated - Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Mission Control</h1>
          <p>Teeebeee Autonomous Business Engine</p>
          <div className="login-subtitle">
            <span className="login-icon">🔐</span>
            Wallet authentication required to access the command center
          </div>
        </div>
        
        <div className="login-auth-section">
          <WalletAuth />
          
          {isConnected && (
            <div className="login-help">
              <p>✅ Wallet connected</p>
              <p>👆 Sign the message to authenticate</p>
            </div>
          )}
          
          {!isConnected && (
            <div className="login-help">
              <p>Connect your wallet to continue</p>
              <p className="login-chains">Supported: Base • Ethereum</p>
            </div>
          )}
        </div>

        <div className="login-footer">
          <p>Secure authentication via Sign-In with Ethereum (SIWE)</p>
        </div>
      </div>
    </div>
  );
}