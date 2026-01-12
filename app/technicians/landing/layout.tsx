'use client';

import '../../globals.css';
import { useEffect } from 'react';

/**
 * Landing Page Layout
 *
 * Custom layout without sidebar for the technicians landing page
 * Provides clean, full-width presentation for marketing
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Hide sidebar on mount
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      sidebar.style.display = 'none';
    }

    // Remove body margin
    document.body.style.marginLeft = '0';

    return () => {
      // Restore on unmount
      if (sidebar) {
        sidebar.style.display = '';
      }
      document.body.style.marginLeft = '';
    };
  }, []);

  return (
    <div style={{ width: '100%', minHeight: '100vh', marginLeft: 0 }}>
      {children}
    </div>
  );
}
