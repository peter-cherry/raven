"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarNew } from '@/components/SidebarNew';
import { TopBar } from '@/components/TopBar';

/* =============================================================================
 * APP SHELL COMPONENT
 * 
 * Provides the main dashboard layout structure:
 * - Sidebar navigation (left)
 * - Top bar with page title and actions
 * - Main content area
 * 
 * Handles:
 * - Responsive sidebar toggle
 * - Layout for authenticated pages
 * - Excludes auth/landing pages from shell
 * ============================================================================= */

interface AppShellProps {
  children: React.ReactNode;
}

// Pages that should NOT have the app shell (full-page layouts)
const excludedPaths = [
  '/login',
  '/signup',
  '/onboarding',
  '/landing',
  '/operators-landing',
  '/technicians-landing',
  '/legal',
  '/contact',
  '/unsubscribe',
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Check if current path should use the app shell
  const shouldUseShell = !excludedPaths.some(path => pathname?.startsWith(path));

  // If not using shell, render children directly
  if (!shouldUseShell) {
    return <>{children}</>;
  }

  // Apply sidebar open class for mobile
  const sidebarClassName = `app-shell__sidebar ${sidebarOpen ? 'app-shell__sidebar--open' : ''}`;

  return (
    <div className="app-shell">
      {/* Sidebar with dynamic class for mobile open state */}
      <aside className={sidebarClassName}>
        <SidebarNew />
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="panel-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{ zIndex: 199 }}
        />
      )}

      {/* Main content area */}
      <div className="app-shell__main">
        <TopBar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={isMobile}
        />
        <main className="app-shell__content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
