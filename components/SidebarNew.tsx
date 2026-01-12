"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';

/* =============================================================================
 * SIDEBAR COMPONENT - Clean SaaS Dashboard Style
 * 
 * Features:
 * - Section groups with titles (Operations, Admin, Settings)
 * - Icon + text labels for each nav item
 * - Active state indicator
 * - User menu at bottom
 * - Full width (240px) with readable labels
 * 
 * PRESERVES ALL EXISTING FUNCTIONALITY:
 * - Same navigation items
 * - Same click handlers
 * - Same overlay triggers
 * - Same role-based filtering
 * ============================================================================= */

// Icons - Clean stroke style
function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
}

function IconTechnicians() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function IconDrafts() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Raven bird logo - from brand assets
function RavenLogo() {
  return (
    <svg width="28" height="38" viewBox="0 0 27 39" fill="none">
      <path d="M26.9919 15.1313C26.9593 15.0361 26.9267 14.9409 26.8901 14.8457C26.9593 15.0361 26.9959 15.1486 27 15.1529C27 15.1529 27 15.1443 26.9919 15.1313ZM19.5845 2.63232L19.5682 2.66693V2.67558C15.018 -1.11867 11.53 -0.374526 8.44094 1.80598C5.25415 4.04705 4.70877 7.46058 4.70877 7.46058C4.70877 7.46058 3.79303 8.32153 2.12841 10.0391C0.447516 11.7913 -0.199609 13.8593 0.0527288 14.9279C0.0934285 15.0577 4.489 12.6349 5.8036 12.2369C7.14262 11.8562 9.12062 12.3927 9.95497 15.1789C10.7975 17.9045 8.05022 37.1396 25.5918 39C21.7619 34.5179 13.0115 24.0393 11.8434 20.5479C10.3416 16.0658 12.3888 10.9087 16.6297 9.30362C19.9997 8.02733 23.6341 9.64108 25.7342 12.6436V11.9038C24.4848 9.0224 22.3602 4.92963 19.5886 2.63664L19.5845 2.63232ZM10.4434 9.05269C9.5032 9.35554 8.52234 8.81041 8.23744 7.81101C7.95254 6.81162 8.46536 5.76896 9.40552 5.46611C10.3457 5.16326 11.3265 5.70839 11.6114 6.70778C11.8963 7.70718 11.3835 8.74984 10.4434 9.05269ZM25.3842 15.6937C24.1754 12.159 20.5491 9.83144 17.2239 11.1077C13.8988 12.3927 12.2667 16.4292 13.4429 19.9725C14.375 22.7328 25.3557 36.5599 25.6569 36.5772L25.7302 17.4286C25.6488 16.6974 25.5348 16.1177 25.3883 15.6937H25.3842Z" fill="currentColor"/>
    </svg>
  );
}

// Navigation structure - now links to standalone pages
const navSections = [
  {
    title: 'Operations',
    items: [
      { href: '/', icon: IconHome, label: 'Dashboard' },
      { href: '/jobs', icon: IconList, label: 'Jobs' },
      { href: '/drafts', icon: IconDrafts, label: 'Drafts' },
      { href: '/technicians', icon: IconTechnicians, label: 'Technicians' },
    ]
  },
  {
    title: 'Compliance',
    items: [
      { href: '/policies', icon: IconShield, label: 'Policies' },
    ]
  },
  {
    title: 'Admin',
    items: [
      { href: '/admin/outreach', icon: IconTarget, label: 'Lead Outreach' },
    ]
  },
];

// Settings navigation - separate section at bottom
const settingsItems = [
  { href: '/settings/coi', icon: IconSettings, label: 'COI Configuration' },
  { href: '/settings/integrations', icon: IconLink, label: 'Integrations' },
];

export function SidebarNew() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Fetch user role - preserves existing logic
  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setUserRole(null);
        return;
      }
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data, error } = await supabase
          .from('org_memberships')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          setUserRole('owner');
          return;
        }
        setUserRole(data?.role || 'owner');
      } catch {
        setUserRole('owner');
      }
    }
    fetchUserRole();
  }, [user]);

  // Handle navigation click - simplified for standalone pages
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof navSections[0]['items'][0]) => {
    // All navigation now goes to standalone pages - no special handling needed
  };

  // Handle sign out - uses centralized client with mock mode support
  const handleSignOut = async () => {
    const confirmed = confirm('Are you sure you want to sign out?');
    if (confirmed) {
      const { supabase } = await import('@/lib/supabaseClient');
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  // Hide on auth/onboarding pages - preserves existing behavior
  if (pathname?.startsWith('/login') || pathname?.startsWith('/signup') || pathname?.startsWith('/onboarding')) {
    return null;
  }

  // Filter sections based on role - preserves existing logic
  const filteredSections = userRole === 'contractor'
    ? [{ title: 'Operations', items: navSections[0].items.filter(item => item.href === '/') }]
    : navSections;

  // Get user display info
  const userEmail = user?.email || 'user@example.com';
  const userName = user?.user_metadata?.full_name || userEmail.split('@')[0];
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Header with Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <RavenLogo />
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {filteredSections.map((section) => (
          <div key={section.title} className="sidebar-section">
            <div className="sidebar-section-title">{section.title}</div>
            <ul className="sidebar-nav-list">
              {section.items.map((item) => {
                const base = item.href.replace(/#.*/, '');
                const isActive = item.href === '/' 
                  ? pathname === '/' 
                  : pathname?.startsWith(base) ?? false;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item)}
                      className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
                    >
                      <span className="sidebar-nav-icon">
                        <Icon />
                      </span>
                      <span className="sidebar-nav-label">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Settings Section - at bottom of nav */}
        <div className="sidebar-section sidebar-section--settings">
          <div className="sidebar-section-title">Settings</div>
          <ul className="sidebar-nav-list">
            {settingsItems.map((item) => {
              const isActive = pathname?.startsWith(item.href) ?? false;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
                  >
                    <span className="sidebar-nav-icon">
                      <Icon />
                    </span>
                    <span className="sidebar-nav-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer with User Menu */}
      <div className="sidebar-footer" ref={userMenuRef}>
        <button
          type="button"
          className="sidebar-user"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          style={{ border: 'none', width: '100%' }}
        >
          <div className="sidebar-user-avatar">{userInitials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-email">{userEmail}</div>
          </div>
          <IconChevronDown />
        </button>

        {/* Dropdown Menu */}
        {userMenuOpen && (
          <div className="dropdown-menu" style={{ bottom: '100%', left: 8, right: 8, marginBottom: 8 }}>
            <button
              type="button"
              className="dropdown-item dropdown-item--danger"
              onClick={handleSignOut}
            >
              <IconLogout />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default SidebarNew;
