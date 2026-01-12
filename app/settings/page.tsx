"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Profile state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Organization state
  const [orgName, setOrgName] = useState('');
  const [orgRole, setOrgRole] = useState('');

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dispatchNotifications, setDispatchNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  // Modal state
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setFullName(user.user_metadata?.full_name || '');
      loadOrganizationInfo();
    }
  }, [user]);

  const loadOrganizationInfo = async () => {
    if (!user) return;

    const { data: membership } = await supabase
      .from('org_memberships')
      .select('role, organizations(name)')
      .eq('user_id', user.id)
      .single();

    if (membership) {
      setOrgRole(membership.role || 'member');
      setOrgName((membership.organizations as any)?.name || '');
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (updateError) throw updateError;

      showToast('Profile updated successfully!', 'success');
      setSuccess(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      setPasswordLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      showToast('Password changed successfully!', 'success');
      setPasswordSuccess(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const signOutAllSessions = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    router.push('/login');
  };

  // Password strength calculator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 'none', label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { strength: 'weak', label: 'Weak', color: '#EF4444' };
    if (score <= 3) return { strength: 'medium', label: 'Medium', color: '#F59E0B' };
    return { strength: 'strong', label: 'Strong', color: '#10B981' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <main className="content-area">
      <div className="content-inner" style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 className="header-title">Settings</h1>
        <p className="header-subtitle">Manage your account and preferences</p>

        {/* Profile Information */}
        <div className="container-card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Profile Information
          </h2>

          {success && (
            <div style={{
              padding: 12,
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 8,
              marginBottom: 16,
              color: 'var(--success)'
            }}>
              {success}
            </div>
          )}

          {error && (
            <div style={{
              padding: 12,
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 8,
              marginBottom: 16,
              color: 'var(--error)'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={updateProfile} style={{ display: 'grid', gap: 16 }}>
            <div className="form-field">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                className="text-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                className="text-input"
                type="email"
                value={email}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                Email cannot be changed. Contact support if needed.
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">User ID</label>
              <input
                className="text-input"
                type="text"
                value={user?.id || '—'}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed', fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
              style={{ width: 'fit-content' }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Organization */}
        <div className="container-card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Organization
          </h2>

          <div style={{ display: 'grid', gap: 12 }}>
            <div className="form-field">
              <label className="form-label">Organization Name</label>
              <input
                className="text-input"
                type="text"
                value={orgName || 'Not a member of any organization'}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Your Role</label>
              <input
                className="text-input"
                type="text"
                value={orgRole || '—'}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed', textTransform: 'capitalize' }}
              />
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="container-card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Change Password
          </h2>

          {passwordSuccess && (
            <div style={{
              padding: 12,
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 8,
              marginBottom: 16,
              color: 'var(--success)'
            }}>
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div style={{
              padding: 12,
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 8,
              marginBottom: 16,
              color: 'var(--error)'
            }}>
              {passwordError}
            </div>
          )}

          <form onSubmit={changePassword} style={{ display: 'grid', gap: 16 }}>
            <div className="form-field">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                className="text-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={8}
              />

              {/* Password strength indicator */}
              {newPassword && (
                <div style={{ marginTop: 8 }}>
                  <div style={{
                    display: 'flex',
                    gap: 4,
                    marginBottom: 4
                  }}>
                    <div style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: passwordStrength.strength === 'none' ? '#333' : passwordStrength.color,
                      opacity: passwordStrength.strength === 'none' ? 0.3 : 1
                    }} />
                    <div style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: passwordStrength.strength === 'medium' || passwordStrength.strength === 'strong' ? passwordStrength.color : '#333',
                      opacity: passwordStrength.strength === 'medium' || passwordStrength.strength === 'strong' ? 1 : 0.3
                    }} />
                    <div style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: passwordStrength.strength === 'strong' ? passwordStrength.color : '#333',
                      opacity: passwordStrength.strength === 'strong' ? 1 : 0.3
                    }} />
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: passwordStrength.color,
                    fontWeight: 600
                  }}>
                    {passwordStrength.label} password
                  </div>
                </div>
              )}

              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                Use 8+ characters with a mix of letters, numbers & symbols
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                className="text-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              {/* Password match indicator */}
              {confirmPassword && (
                <div style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: newPassword === confirmPassword ? '#10B981' : '#EF4444'
                }}>
                  {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={passwordLoading || !newPassword || !confirmPassword}
              style={{ width: 'fit-content' }}
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="container-card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Notification Preferences
          </h2>

          <div style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Email Notifications</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Receive emails about important account activities
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={dispatchNotifications}
                onChange={(e) => setDispatchNotifications(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Dispatch Notifications</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Get notified when technicians respond to work orders
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={weeklyReports}
                onChange={(e) => setWeeklyReports(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Weekly Reports</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Receive weekly summary of dispatch activity
                </div>
              </div>
            </label>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 16, padding: 12, background: 'rgba(108, 114, 201, 0.1)', borderRadius: 8 }}>
            💡 Note: Notification preferences are stored locally and will be synced to the database in a future update.
          </div>
        </div>

        {/* Security & Sessions */}
        <div className="container-card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Security & Sessions
          </h2>

          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Active Session</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                You are currently signed in on this device
              </div>
            </div>

            <button
              onClick={() => setShowSignOutModal(true)}
              className="outline-button"
              style={{
                width: 'fit-content',
                borderColor: 'var(--error)',
                color: 'var(--error)'
              }}
            >
              Sign Out All Devices
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="container-card" style={{
          marginBottom: 24,
          borderColor: 'rgba(239, 68, 68, 0.3)'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--error)' }}>
            Danger Zone
          </h2>

          <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Delete Account</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </div>
            <button
              onClick={() => alert('Account deletion will be available in a future update. Please contact support to delete your account.')}
              className="outline-button"
              style={{
                borderColor: 'var(--error)',
                color: 'var(--error)',
                fontSize: 13
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={signOutAllSessions}
        title="Sign Out All Devices?"
        message="You will be signed out from all devices and need to log in again. This action cannot be undone."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="warning"
      />
    </main>
  );
}
