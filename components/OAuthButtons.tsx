"use client";

import { useAuth } from '@/components/AuthProvider';

export function OAuthButtons() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  return (
    <div className="provider-buttons">
      <button className="provider-button" onClick={signInWithGoogle} aria-label="Continue with Google">Continue with Google</button>
      <button className="provider-button" onClick={signInWithApple} aria-label="Continue with Apple">Continue with Apple</button>
    </div>
  );
}
