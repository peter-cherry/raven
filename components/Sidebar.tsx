"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';

// Simple, clean SVG icons - stroke only, no fill (using inline styles)
const iconStyle = { fill: 'none' } as const;

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={iconStyle} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path style={iconStyle} d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline style={iconStyle} points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={iconStyle} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect style={iconStyle} x="3" y="4" width="18" height="4" rx="2" />
      <line style={iconStyle} x1="3" y1="12" x2="21" y2="12" />
      <line style={iconStyle} x1="3" y1="16" x2="21" y2="16" />
      <line style={iconStyle} x1="3" y1="20" x2="21" y2="20" />
    </svg>
  );
}

function IconAvatar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={iconStyle} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path style={iconStyle} d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={iconStyle} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path style={iconStyle} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline style={iconStyle} points="9 12 11 14 15 10" />
    </svg>
  );
}

function IconDrafts() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={iconStyle} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path style={iconStyle} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline style={iconStyle} points="14 2 14 8 20 8" />
      <line style={iconStyle} x1="16" y1="13" x2="8" y2="13" />
      <line style={iconStyle} x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={iconStyle} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle style={iconStyle} cx="12" cy="12" r="3" />
      <path style={iconStyle} d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconLeads() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={iconStyle} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle style={iconStyle} cx="12" cy="12" r="10" />
      <circle style={iconStyle} cx="12" cy="12" r="6" />
      <circle style={iconStyle} cx="12" cy="12" r="2" />
    </svg>
  );
}

const navItems = [
  { href: '/', Icon: IconHome, label: 'Home - Search and create work orders', overlay: false },
  { href: '/jobs', Icon: IconList, label: 'Jobs Overview - View all work orders', overlay: 'jobs' as const },
  { href: '/drafts', Icon: IconDrafts, label: 'Drafts - View saved work order drafts', overlay: false },
  { href: '/technicians', Icon: IconAvatar, label: 'Technicians - Browse available technicians', overlay: false },
  { href: '/admin/outreach', Icon: IconLeads, label: 'Leads - Manage outreach targets and staging', overlay: false },
  { href: '/compliance#frame-6', Icon: IconCopy, label: 'Compliance - Manage compliance policies', overlay: 'compliance' as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [jobsIconJump, setJobsIconJump] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleJobsIconJump = () => {
      setJobsIconJump(true);
      setTimeout(() => setJobsIconJump(false), 300);
    };

    window.addEventListener('jobsIconJump', handleJobsIconJump);
    return () => window.removeEventListener('jobsIconJump', handleJobsIconJump);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuOpen && settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        // Check if click is not on the settings button itself
        const settingsButton = document.querySelector('.settings-button');
        if (settingsButton && !settingsButton.contains(event.target as Node)) {
          setSettingsMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsMenuOpen]);

  // Fetch user role from org_memberships
  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setUserRole(null);
        return;
      }

      try {
        // Import the shared supabase client (supports mock mode)
        const { supabase } = await import('@/lib/supabaseClient');

        const { data, error } = await supabase
          .from('org_memberships')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole('owner'); // Default to owner if error
          return;
        }

        setUserRole(data?.role || 'owner');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('owner'); // Default to owner if error
      }
    }

    fetchUserRole();
  }, [user]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof navItems[0]) => {
    // Always use overlay for Jobs and Compliance
    if (item.overlay) {
      e.preventDefault();
      e.stopPropagation();

      // If we're on the home page, dispatch the overlay event
      if (pathname === '/') {
        const event = new CustomEvent('openOverlay', {
          detail: { overlay: item.overlay },
          bubbles: true
        });
        window.dispatchEvent(event);
      } else {
        // If we're on a different page, navigate to home with a query param
        // The home page will pick this up and open the overlay
        window.location.href = `/?overlay=${item.overlay}`;
      }
    }
    // Otherwise, let the Link handle navigation normally
  };

  // Hide sidebar on auth pages (login, signup) and onboarding
  if (pathname?.startsWith('/login') || pathname?.startsWith('/signup') || pathname?.startsWith('/onboarding')) {
    return null;
  }

  // Filter navigation items based on user role
  const filteredNavItems = userRole === 'contractor'
    ? navItems.filter(item => item.href === '/') // Only show Home for contractors
    : navItems; // Show all items for operators

  return (
    <aside className="sidebar hover-expand" style={{ filter: 'brightness(1.15)' }}>
      <svg className="sidebar-svg-bg" width="85" height="1128" viewBox="0 0 85 1128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <rect x="0" y="0" width="85" height="1128" fill="#151413"/>
        <rect x="1" y="1" width="83" height="1126" stroke="#201939" strokeWidth="2" fill="none"/>
      </svg>

      <nav className="nav-stack">
        {filteredNavItems.map((item) => {
          const { href, Icon, label } = item;
          const roleClass = href === '/'
            ? 'nav-home'
            : href.startsWith('/jobs')
            ? 'nav-jobs'
            : href.startsWith('/technicians')
            ? 'nav-tech'
            : href.startsWith('/compliance')
            ? 'nav-compliance'
            : '';
          const base = href.replace(/#.*/, '');
          const isActive = href === '/' ? pathname === '/' : pathname?.startsWith(base) ?? false;
          const isJobsIcon = href.startsWith('/jobs');

          return (
            <Link
              key={href}
              href={href}
              onClick={(e) => handleNavClick(e, item)}
              className={`nav-item ${roleClass} ${isActive ? 'active' : ''}`}
              aria-label={label}
              title={label}
              style={isJobsIcon && jobsIconJump ? {
                animation: 'jumpIcon 0.3s ease-in-out',
              } : undefined}
            >
              <span className="nav-icon" aria-hidden><Icon /></span>
            </Link>
          );
        })}
      </nav>

      {/* Settings icon at bottom - 160px above lower stroke */}
      <div style={{
        position: 'absolute',
        bottom: 160,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
      }}>
        <button
          type="button"
          className="settings-button nav-item"
          onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
          aria-label="Settings"
          title="Settings"
          style={{
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: settingsMenuOpen ? '#9392AF' : '#656290',
            transition: 'color 0.2s ease',
          }}
        >
          <span className="nav-icon" aria-hidden><IconSettings /></span>
        </button>
      </div>

      {/* Dropdown menu for settings */}
      {settingsMenuOpen && (
        <div
          ref={settingsMenuRef}
          style={{
            position: 'absolute',
            bottom: 200,
            left: 85,
            background: 'rgba(47, 47, 47, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            borderRadius: 8,
            padding: '8px 0',
            minWidth: 180,
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          <button
            onClick={() => {
              router.push('/settings/coi');
              setSettingsMenuOpen(false);
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              color: '#F9F3E5',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </button>
          <button
            onClick={() => {
              router.push('/settings/integrations');
              setSettingsMenuOpen(false);
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              color: '#F9F3E5',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="6" height="6" rx="1"/>
              <rect x="14" y="4" width="6" height="6" rx="1"/>
              <rect x="4" y="14" width="6" height="6" rx="1"/>
              <rect x="14" y="14" width="6" height="6" rx="1"/>
              <line x1="10" y1="7" x2="14" y2="7"/>
              <line x1="7" y1="10" x2="7" y2="14"/>
              <line x1="17" y1="10" x2="17" y2="14"/>
            </svg>
            Integrations
          </button>
          <div style={{
            height: 1,
            background: 'rgba(255, 255, 255, 0.1)',
            margin: '8px 0',
          }} />
          <button
            onClick={async () => {
              const confirmed = confirm('Are you sure you want to sign out?');
              if (confirmed) {
                const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
                const supabase = createClientComponentClient();
                await supabase.auth.signOut();
                router.push('/login');
              }
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              color: '#F9F3E5',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
