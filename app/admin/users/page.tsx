'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

interface User {
  id: string;
  email: string;
  provider: string;
  createdAt: string;
  lastSignIn: string | null;
  emailConfirmed: boolean;
  organizations: { id: string; name: string }[];
  isAdmin: boolean;
  metadata: any;
}

export default function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterAdmin, setFilterAdmin] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openMenuUserId) {
        setOpenMenuUserId(null);
      }
    }

    if (openMenuUserId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuUserId]);

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/list-users');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        showToast(data.error || 'Failed to load users', 'error');
      }
    } catch (error) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(email: string) {
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`User ${email} deleted successfully`, 'success');
        loadUsers();
      } else {
        showToast(data.error || 'Failed to delete user', 'error');
      }
    } catch (error) {
      showToast('Failed to delete user', 'error');
    }
  }

  async function toggleAdmin(userId: string, isAdmin: boolean) {
    try {
      const response = await fetch('/api/admin/toggle-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, grant: !isAdmin })
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message, 'success');
        loadUsers();
      } else {
        showToast(data.error || 'Failed to update admin status', 'error');
      }
    } catch (error) {
      showToast('Failed to update admin status', 'error');
    }
  }

  async function resendConfirmation(email: string) {
    try {
      const response = await fetch('/api/admin/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message, 'success');
      } else {
        showToast(data.error || 'Failed to resend confirmation', 'error');
      }
    } catch (error) {
      showToast('Failed to resend confirmation', 'error');
    }
  }

  async function banUser(userId: string, duration: string = '24') {
    try {
      const response = await fetch('/api/admin/ban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ban: true, duration: parseInt(duration) })
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message, 'success');
        loadUsers();
      } else {
        showToast(data.error || 'Failed to ban user', 'error');
      }
    } catch (error) {
      showToast('Failed to ban user', 'error');
    }
  }

  function exportUsers() {
    window.open('/api/admin/export-users', '_blank');
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = filterProvider === 'all' || user.provider === filterProvider;
    const matchesAdmin = filterAdmin === 'all' ||
      (filterAdmin === 'admin' && user.isAdmin) ||
      (filterAdmin === 'non-admin' && !user.isAdmin);

    return matchesSearch && matchesProvider && matchesAdmin;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.isAdmin).length,
    google: users.filter(u => u.provider === 'google').length,
    email: users.filter(u => u.provider === 'email').length,
    confirmed: users.filter(u => u.emailConfirmed).length
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h1 style={{
          fontSize: 'var(--font-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--ds-text-primary)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          User Management
        </h1>
        <p style={{
          fontSize: 'var(--font-md)',
          color: 'var(--ds-text-secondary)'
        }}>
          View and manage all users in the system
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-2xl)'
      }}>
        {[
          { label: 'Total Users', value: stats.total, color: 'var(--ds-accent-primary)' },
          { label: 'Admins', value: stats.admins, color: 'var(--ds-warning)' },
          { label: 'Google Auth', value: stats.google, color: 'var(--ds-success)' },
          { label: 'Email Auth', value: stats.email, color: 'var(--ds-info)' },
          { label: 'Confirmed', value: stats.confirmed, color: '#8B5CF6' }
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--ds-bg-surface)',
              border: '1px solid var(--ds-border-default)',
              borderRadius: 'var(--ds-radius-lg)',
              padding: 'var(--spacing-lg)',
              textAlign: 'center'
            }}
          >
            <div style={{
              fontSize: 'var(--font-3xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: stat.color,
              marginBottom: 'var(--spacing-xs)'
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: 'var(--font-sm)',
              color: 'var(--ds-text-secondary)'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--ds-bg-surface)',
        border: '1px solid var(--ds-border-default)',
        borderRadius: 'var(--ds-radius-lg)',
        padding: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-xl)',
        display: 'flex',
        gap: 'var(--spacing-lg)',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search by email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 250,
            padding: 'var(--spacing-md)',
            background: 'var(--ds-bg-subtle)',
            border: '1px solid var(--ds-border-default)',
            borderRadius: 'var(--ds-radius-md)',
            color: 'var(--ds-text-primary)',
            fontSize: 'var(--font-md)'
          }}
        />

        <select
          value={filterProvider}
          onChange={(e) => setFilterProvider(e.target.value)}
          style={{
            padding: 'var(--spacing-md)',
            background: 'var(--ds-bg-subtle)',
            border: '1px solid var(--ds-border-default)',
            borderRadius: 'var(--ds-radius-md)',
            color: 'var(--ds-text-primary)',
            fontSize: 'var(--font-md)'
          }}
        >
          <option value="all">All Providers</option>
          <option value="google">Google</option>
          <option value="email">Email</option>
          <option value="apple">Apple</option>
        </select>

        <select
          value={filterAdmin}
          onChange={(e) => setFilterAdmin(e.target.value)}
          style={{
            padding: 'var(--spacing-md)',
            background: 'var(--ds-bg-subtle)',
            border: '1px solid var(--ds-border-default)',
            borderRadius: 'var(--ds-radius-md)',
            color: 'var(--ds-text-primary)',
            fontSize: 'var(--font-md)'
          }}
        >
          <option value="all">All Users</option>
          <option value="admin">Admins Only</option>
          <option value="non-admin">Non-Admins</option>
        </select>

        <button
          onClick={loadUsers}
          className="btn btn-primary"
        >
          Refresh
        </button>

        <button
          onClick={exportUsers}
          className="btn btn-secondary"
          style={{
            background: 'var(--ds-success-bg)',
            borderColor: 'var(--ds-success-border)',
            color: 'var(--ds-success)'
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-5xl)', color: 'var(--ds-text-secondary)' }}>
          Loading users...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-5xl)', color: 'var(--ds-text-secondary)' }}>
          No users found
        </div>
      ) : (
        <div style={{
          background: 'var(--ds-bg-surface)',
          border: '1px solid var(--ds-border-default)',
          borderRadius: 'var(--ds-radius-lg)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--ds-bg-subtle)' }}>
                  {['Email', 'Provider', 'Status', 'Organizations', 'Created', 'Last Sign In', 'Actions'].map(header => (
                    <th
                      key={header}
                      style={{
                        padding: 'var(--spacing-md)',
                        textAlign: 'left',
                        fontSize: 'var(--font-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--ds-text-secondary)',
                        borderBottom: '1px solid var(--ds-border-default)'
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid var(--ds-border-subtle)'
                    }}
                  >
                    <td style={{ padding: 'var(--spacing-md)' }}>
                      <div style={{
                        fontSize: 'var(--font-md)',
                        color: 'var(--ds-text-primary)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}>
                        {user.email}
                      </div>
                      <div style={{
                        fontSize: 'var(--font-xs)',
                        color: 'var(--ds-text-tertiary)',
                        marginTop: 'var(--spacing-xs)'
                      }}>
                        {user.id}
                      </div>
                    </td>

                    <td style={{ padding: 'var(--spacing-md)' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: user.provider === 'google' ? 'var(--ds-success-bg)' : 'var(--ds-info-bg)',
                        border: `1px solid ${user.provider === 'google' ? 'var(--ds-success-border)' : 'var(--ds-info-border)'}`,
                        borderRadius: 'var(--ds-radius-md)',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: user.provider === 'google' ? 'var(--ds-success)' : 'var(--ds-info)',
                        textTransform: 'capitalize'
                      }}>
                        {user.provider}
                      </span>
                    </td>

                    <td style={{ padding: 'var(--spacing-md)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                        {user.isAdmin && (
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            background: 'var(--ds-warning-bg)',
                            border: '1px solid var(--ds-warning-border)',
                            borderRadius: 'var(--ds-radius-md)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--ds-warning)',
                            width: 'fit-content'
                          }}>
                            Admin
                          </span>
                        )}
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: user.emailConfirmed ? 'var(--ds-success-bg)' : 'var(--ds-error-bg)',
                          border: `1px solid ${user.emailConfirmed ? 'var(--ds-success-border)' : 'var(--ds-error-border)'}`,
                          borderRadius: 'var(--ds-radius-md)',
                          fontSize: 'var(--font-xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: user.emailConfirmed ? 'var(--ds-success)' : 'var(--ds-error)',
                          width: 'fit-content'
                        }}>
                          {user.emailConfirmed ? 'Confirmed' : 'Unconfirmed'}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: 'var(--spacing-md)' }}>
                      {user.organizations.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                          {user.organizations.map(org => (
                            <span
                              key={org.id}
                              style={{
                                fontSize: 'var(--font-sm)',
                                color: 'var(--ds-text-secondary)'
                              }}
                            >
                              {org.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--ds-text-tertiary)', fontSize: 'var(--font-sm)' }}>-</span>
                      )}
                    </td>

                    <td style={{ padding: 'var(--spacing-md)' }}>
                      <div style={{
                        fontSize: 'var(--font-sm)',
                        color: 'var(--ds-text-secondary)'
                      }}>
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </td>

                    <td style={{ padding: 'var(--spacing-md)' }}>
                      {user.lastSignIn ? (
                        <div style={{
                          fontSize: 'var(--font-sm)',
                          color: 'var(--ds-text-secondary)'
                        }}>
                          {new Date(user.lastSignIn).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--ds-text-tertiary)', fontSize: 'var(--font-sm)' }}>Never</span>
                      )}
                    </td>

                    <td style={{ padding: 'var(--spacing-md)', position: 'relative' }}>
                      <button
                        onClick={() => setOpenMenuUserId(openMenuUserId === user.id ? null : user.id)}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--ds-bg-subtle)',
                          border: '1px solid var(--ds-border-default)',
                          borderRadius: 'var(--ds-radius-md)',
                          color: 'var(--ds-text-primary)',
                          fontSize: 'var(--font-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          cursor: 'pointer'
                        }}
                      >
                        Actions ▼
                      </button>

                      {openMenuUserId === user.id && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          marginTop: 4,
                          background: 'var(--ds-bg-elevated)',
                          border: '1px solid var(--ds-border-default)',
                          borderRadius: 'var(--ds-radius-lg)',
                          padding: 'var(--spacing-xs)',
                          minWidth: 180,
                          zIndex: 1000,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}>
                          <button
                            onClick={() => {
                              toggleAdmin(user.id, user.isAdmin);
                              setOpenMenuUserId(null);
                            }}
                            style={{
                              padding: 'var(--spacing-sm) var(--spacing-md)',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: 'var(--ds-radius-md)',
                              color: user.isAdmin ? 'var(--ds-warning)' : 'var(--ds-success)',
                              fontSize: 'var(--font-sm)',
                              fontWeight: 'var(--font-weight-medium)',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            {user.isAdmin ? '⊖ Revoke Admin' : '⊕ Grant Admin'}
                          </button>

                          {!user.emailConfirmed && (
                            <button
                              onClick={() => {
                                resendConfirmation(user.email);
                                setOpenMenuUserId(null);
                              }}
                              style={{
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 'var(--ds-radius-md)',
                                color: 'var(--ds-info)',
                                fontSize: 'var(--font-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                            >
                              ✉ Resend Confirmation
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm('Ban this user for 24 hours?')) {
                                banUser(user.id, '24');
                              }
                              setOpenMenuUserId(null);
                            }}
                            style={{
                              padding: 'var(--spacing-sm) var(--spacing-md)',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: 'var(--ds-radius-md)',
                              color: 'var(--ds-warning)',
                              fontSize: 'var(--font-sm)',
                              fontWeight: 'var(--font-weight-medium)',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            ⊝ Ban (24h)
                          </button>

                          <div style={{
                            height: 1,
                            background: 'var(--ds-border-default)',
                            margin: '4px 0'
                          }} />

                          <button
                            onClick={() => {
                              setDeleteTarget({ id: user.id, email: user.email });
                              setShowDeleteModal(true);
                              setOpenMenuUserId(null);
                            }}
                            style={{
                              padding: 'var(--spacing-sm) var(--spacing-md)',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: 'var(--ds-radius-md)',
                              color: 'var(--ds-error)',
                              fontSize: 'var(--font-sm)',
                              fontWeight: 'var(--font-weight-medium)',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            ⊗ Delete User
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete User"
          message={`Are you sure you want to delete ${deleteTarget.email}? This action cannot be undone.`}
          confirmText="Delete User"
          variant="danger"
          onConfirm={() => {
            deleteUser(deleteTarget.email);
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
