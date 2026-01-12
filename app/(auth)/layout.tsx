'use client';

import { useRouter } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <main
      className="center-viewport auth-layout"
      onClick={() => router.push('/')}
      style={{
        paddingTop: 0,
        cursor: 'pointer'
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ cursor: 'default' }}>
        {children}
      </div>
    </main>
  );
}
