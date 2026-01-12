'use client'

import { AdminGuard } from '@/components/AdminGuard'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const navItems = [
    { href: '/admin/activity', label: 'Activity' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/outreach', label: 'Outreach' },
    { href: '/admin/leads', label: 'Leads' },
    { href: '/admin/settings', label: 'Settings' },
    { href: '/admin/agent', label: 'Agent' },
  ]

  return (
    <AdminGuard>
      {/* Admin Sub-Navigation - sits below main app topbar */}
      <div style={{
        background: 'var(--ds-bg-surface)',
        borderBottom: '1px solid var(--ds-border-default)',
        padding: '0 var(--ds-space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '48px',
        position: 'sticky',
        top: '0',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-6)' }}>
          {/* Breadcrumb / Title */}
          <Link href="/" style={{
            color: 'var(--ds-text-primary)',
            textDecoration: 'none',
            fontSize: 'var(--ds-text-sm)',
            fontWeight: 'var(--ds-font-semibold)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ds-space-2)'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Admin
          </Link>

          {/* Divider */}
          <div style={{
            height: '20px',
            width: '1px',
            background: 'var(--ds-border-default)'
          }} />

          {/* Nav Items */}
          <nav style={{ display: 'flex', gap: 'var(--ds-space-1)' }}>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: isActive(item.href) ? 'var(--ds-accent-primary)' : 'var(--ds-text-secondary)',
                  textDecoration: 'none',
                  fontSize: 'var(--ds-text-sm)',
                  fontWeight: 'var(--ds-font-medium)',
                  padding: 'var(--ds-space-2) var(--ds-space-3)',
                  borderRadius: 'var(--ds-radius-md)',
                  background: isActive(item.href) ? 'var(--ds-accent-primary-light)' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link
          href="/"
          style={{
            color: 'var(--ds-text-secondary)',
            textDecoration: 'none',
            fontSize: 'var(--ds-text-sm)',
            fontWeight: 'var(--ds-font-medium)',
            padding: 'var(--ds-space-2) var(--ds-space-3)',
            borderRadius: 'var(--ds-radius-md)',
            border: '1px solid var(--ds-border-default)',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ds-space-2)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Page Content */}
      <main style={{
        width: '100%',
        padding: 'var(--ds-space-6)'
      }}>
        {children}
      </main>
    </AdminGuard>
  )
}
