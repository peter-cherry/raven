"use client";

import { usePathname, useRouter } from 'next/navigation';

/* =============================================================================
 * TOPBAR COMPONENT - Clean SaaS Dashboard Style
 * 
 * Features:
 * - Page title reflecting current route
 * - Optional breadcrumbs
 * - Global search
 * - Primary action button
 * - Mobile menu toggle
 * ============================================================================= */

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// Route to page title mapping
const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/jobs': 'Jobs',
  '/jobs/create': 'Create Job',
  '/drafts': 'Drafts',
  '/technicians': 'Technicians',
  '/compliance': 'Compliance',
  '/admin/outreach': 'Lead Outreach',
  '/settings/coi': 'Settings',
  '/settings/integrations': 'Integrations',
};

interface TopBarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function TopBar({ onMenuClick, showMenuButton = false }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Get page title based on current route
  const getPageTitle = () => {
    if (!pathname) return 'Dashboard';
    
    // Exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }
    
    // Check for partial matches (e.g., /jobs/123)
    for (const [route, title] of Object.entries(pageTitles)) {
      if (pathname.startsWith(route) && route !== '/') {
        return title;
      }
    }
    
    return 'Dashboard';
  };

  // Get primary action based on current page
  const getPrimaryAction = () => {
    if (pathname === '/' || pathname === '/jobs') {
      return {
        label: 'Create Work Order',
        onClick: () => router.push('/jobs/create'),
      };
    }
    return null;
  };

  const primaryAction = getPrimaryAction();
  const pageTitle = getPageTitle();

  return (
    <header className="app-shell__topbar">
      <div className="topbar">
        {/* Left: Menu button (mobile) + Title */}
        <div className="topbar-left">
          {showMenuButton && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onMenuClick}
              aria-label="Toggle menu"
              style={{ padding: 8 }}
            >
              <IconMenu />
            </button>
          )}
          <h1 className="topbar-title">{pageTitle}</h1>
        </div>

        {/* Center: Search - Coming Soon */}
        <div className="topbar-center">
          <div 
            className="search-input-wrapper search-input-wrapper--disabled"
            title="Global search coming soon"
          >
            <span className="search-input-icon">
              <IconSearch />
            </span>
            <span className="search-placeholder">
              Search...
            </span>
            <span className="search-shortcut">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="topbar-right">
          {primaryAction && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={primaryAction.onClick}
            >
              <IconPlus />
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
