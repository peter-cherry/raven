'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

function useInitials(nameOrEmail: string | null | undefined) {
  return useMemo(() => {
    const src = (nameOrEmail || '').trim();
    if (!src) return '??';
    const parts = src.includes('@') ? src.split('@')[0].split(/[._-]+/) : src.split(/\s+/);
    const first = (parts[0] || '').charAt(0);
    const last = (parts[parts.length - 1] || '').charAt(0);
    const letters = (first + last).toUpperCase();
    return letters || src.slice(0, 2).toUpperCase();
  }, [nameOrEmail]);
}

export function HeaderElements() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const fullName = (user?.user_metadata?.full_name as string | undefined) || (user?.user_metadata?.name as string | undefined) || user?.email || '';
  const initials = useInitials(fullName);

  return (
    <div className="header-elements">
      <div className="logo-section">
        <img
          className="logo-icon"
          src="https://cdn.builder.io/api/v1/image/assets%2Fd7e7e3dd91284e2dbc17f9afe5047bd6%2F06f085150f964ee983dd7fff95740981?format=webp&width=800"
          srcSet="https://cdn.builder.io/api/v1/image/assets%2Fd7e7e3dd91284e2dbc17f9afe5047bd6%2F06f085150f964ee983dd7fff95740981?format=webp&width=800 1x, https://cdn.builder.io/api/v1/image/assets%2Fd7e7e3dd91284e2dbc17f9afe5047bd6%2F06f085150f964ee983dd7fff95740981?format=webp&width=1600 2x, https://cdn.builder.io/api/v1/image/assets%2Fd7e7e3dd91284e2dbc17f9afe5047bd6%2F06f085150f964ee983dd7fff95740981?format=webp&width=2400 3x"
          sizes="134px"
          alt="RAVENSEARCH logo"
          decoding="async"
        />
      </div>
      <div className="auth-buttons">
        {!user && (
          <>
            <Link href="/login" className="auth-cta-button">Login</Link>
            <Link href="/signup" className="auth-cta-button">Signup</Link>
          </>
        )}
        <div className="header-profile" ref={menuRef}>
          <button type="button" className="header-profile-button" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            <span className="header-profile-initials" aria-hidden="true" suppressHydrationWarning>{initials}</span>
            <span className="sr-only">Open profile menu</span>
          </button>
          {user && menuOpen && (
            <div className="profile-menu" role="menu">
              <>
                <Link href="/settings" className="profile-menu-item" role="menuitem">Settings</Link>
                <button className="profile-menu-item" role="menuitem" onClick={async () => { await signOut(); setMenuOpen(false); router.push('/'); }}>Logout</button>
              </>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
