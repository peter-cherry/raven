'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/Toast'

interface Admin {
  id: string
  user_id: string
  email: string
  granted_at: string
  granted_by: string | null
}

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; email: string } | null>(null)

  useEffect(() => {
    loadAdmins()
  }, [])

  async function loadAdmins() {
    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .order('granted_at', { ascending: false })

    if (data) {
      setAdmins(data)
    }
  }

  async function grantAdmin() {
    if (!newAdminEmail.trim()) {
      setError('Please enter an email address')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Use API endpoint to grant admin (bypasses RLS)
      const response = await fetch('/api/admin/grant-admin-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to grant admin access')
      } else {
        showToast(`Admin access granted to ${newAdminEmail}`, 'success')
        setNewAdminEmail('')
        loadAdmins()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant admin access')
    } finally {
      setLoading(false)
    }
  }

  function promptRevokeAdmin(adminId: string, email: string) {
    setRevokeTarget({ id: adminId, email });
    setShowRevokeModal(true);
  }

  async function revokeAdmin() {
    if (!revokeTarget) return;

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', revokeTarget.id)

    if (error) {
      showToast(error.message, 'error')
      setError(null)
    } else {
      showToast(`Admin access revoked for ${revokeTarget.email}`, 'success')
      setSuccess(null)
      loadAdmins()
    }
    setRevokeTarget(null);
  }

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h1 style={{
          fontSize: 'var(--font-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--ds-text-primary)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Admin Settings
        </h1>
        <p style={{
          fontSize: 'var(--font-md)',
          color: 'var(--ds-text-secondary)'
        }}>
          Manage administrator access
        </p>
      </div>

      {/* Grant Admin Form */}
      <div style={{
        background: 'var(--ds-bg-surface)',
        border: '1px solid var(--ds-border-default)',
        borderRadius: 'var(--ds-radius-lg)',
        padding: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ds-text-primary)', marginBottom: 'var(--spacing-lg)' }}>
          Grant Admin Access
        </h2>

        {error && (
          <div style={{
            padding: 'var(--spacing-md)',
            background: 'var(--ds-error-bg)',
            border: '1px solid var(--ds-error-border)',
            borderRadius: 'var(--ds-radius-md)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            <div style={{ color: 'var(--ds-error)', fontSize: 'var(--font-sm)' }}>{error}</div>
          </div>
        )}

        {success && (
          <div style={{
            padding: 'var(--spacing-md)',
            background: 'var(--ds-success-bg)',
            border: '1px solid var(--ds-success-border)',
            borderRadius: 'var(--ds-radius-md)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            <div style={{ color: 'var(--ds-success)', fontSize: 'var(--font-sm)' }}>{success}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <input
            type="email"
            placeholder="user@example.com"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && grantAdmin()}
            style={{
              flex: 1,
              padding: 'var(--spacing-md)',
              background: 'var(--ds-bg-subtle)',
              border: '1px solid var(--ds-border-default)',
              borderRadius: 'var(--ds-radius-md)',
              color: 'var(--ds-text-primary)',
              fontSize: 'var(--font-md)'
            }}
          />
          <button
            className="btn btn-primary"
            onClick={grantAdmin}
            disabled={loading}
          >
            {loading ? 'Granting...' : 'Grant Admin'}
          </button>
        </div>

        <div style={{ marginTop: 'var(--spacing-md)', fontSize: 'var(--font-xs)', color: 'var(--ds-text-secondary)' }}>
          💡 The user must have an account first. They need to sign up at /signup before you can grant admin access.
        </div>
      </div>

      {/* Current Admins List */}
      <div style={{
        background: 'var(--ds-bg-surface)',
        border: '1px solid var(--ds-border-default)',
        borderRadius: 'var(--ds-radius-lg)',
        padding: 'var(--spacing-xl)'
      }}>
        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ds-text-primary)', marginBottom: 'var(--spacing-lg)' }}>
          Current Administrators ({admins.length})
        </h2>

        {admins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', color: 'var(--ds-text-secondary)' }}>
            No admins found
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {admins.map((admin) => (
              <div
                key={admin.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-md) var(--spacing-lg)',
                  background: 'var(--ds-bg-subtle)',
                  border: '1px solid var(--ds-border-subtle)',
                  borderRadius: 'var(--ds-radius-md)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--ds-text-primary)' }}>{admin.email}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--ds-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                    Granted {new Date(admin.granted_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                  {admin.user_id === user?.id && (
                    <span style={{
                      padding: '4px 10px',
                      background: 'var(--ds-accent-primary-light)',
                      border: '1px solid var(--ds-accent-primary-border)',
                      borderRadius: 'var(--ds-radius-md)',
                      fontSize: 'var(--font-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--ds-accent-primary)'
                    }}>
                      You
                    </span>
                  )}
                  {admins.length > 1 && (
                    <button
                      onClick={() => promptRevokeAdmin(admin.id, admin.email)}
                      style={{
                        fontSize: 'var(--font-xs)',
                        padding: '6px 12px',
                        background: 'var(--ds-error-bg)',
                        border: '1px solid var(--ds-error-border)',
                        borderRadius: 'var(--ds-radius-md)',
                        color: 'var(--ds-error)',
                        cursor: 'pointer'
                      }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showRevokeModal}
        onClose={() => {
          setShowRevokeModal(false);
          setRevokeTarget(null);
        }}
        onConfirm={revokeAdmin}
        title="Revoke Admin Access?"
        message={`Are you sure you want to revoke admin access for ${revokeTarget?.email}? They will immediately lose access to admin features.`}
        confirmText="Revoke Access"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
