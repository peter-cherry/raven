"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';

interface Platform {
  id: string;
  name: string;
  display_name: string;
  api_base_url: string;
  logo?: string;
}

interface ConnectedPlatform {
  platform: Platform;
  connection_status: 'active' | 'expired' | 'revoked' | 'error';
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
}

interface ImportProgress {
  status: 'idle' | 'importing' | 'success' | 'error';
  total: number;
  imported: number;
  message: string;
}

// Platform Logo Components (unchanged - they work on any background)
function MaintainXLogo() {
  return (
    <svg width="44" height="44" viewBox="610 245 118 95" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '7px 10px 13px 11px' }}>
      <path fill="#1d1d1b" d="M617.4,345.1l34.9-45.5-34.9-45.5h41.4l33.8,45.5-33.8,45.5h-41.4Z"/>
      <path fill="#246cff" d="M675.9,331.3l10.3,13.8h41.4l-31.5-41-20.2,27.2Z"/>
      <path fill="#246cff" d="M696.1,295.1l31.5-41h-41.4l-10.3,13.8,20.2,27.2Z"/>
    </svg>
  );
}

function UpkeepLogo() {
  return (
    <svg width="44" height="44" viewBox="0 -18 106 122" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '13px 10px 7px 7px' }}>
      <path fillRule="evenodd" clipRule="evenodd" fill="none" stroke="#FF3B30" strokeWidth="2" d="M88.8,11.8c0.5-0.7,1.3-1.7,2.1-2.8c0.8-1.1,1.6-2,2.4-3c0.3-0.3,0.5-0.7,0.7-0.9c0.1-0.2,0.2-0.3,0.3-0.4c0.8-1,0.7-2.5-0.1-3.4l-7.4-7.8c-1-1-2.5-1.1-3.6-0.2c-0.1,0.1-0.1,0.1-0.3,0.3c-0.3,0.2-0.6,0.5-0.9,0.8C81-4.8,80-4,79.1-3.2C78-2.3,77.2-1.5,76.5-1c-3.7-2.6-8.1-4.4-13.3-5.6c-0.1-0.7-0.2-1.6-0.3-2.6c0-0.2-0.1-0.5-0.1-0.8c-0.1-1.2-0.2-2.4-0.4-3.6c0-0.4-0.1-0.8-0.1-1.2c0-0.4,0-0.4,0-0.5c-0.1-1.3-1.2-2.4-2.6-2.4H49.2c-1.3,0-2.4,1-2.6,2.3c0,0.1,0,0.1-0.1,0.4c0,0.4-0.1,0.8-0.2,1.2c-0.2,1.2-0.3,2.5-0.5,3.6c0,0.2,0,0.2-0.1,0.4c-0.2,1.2-0.3,2.1-0.4,2.9c-5,1-9.7,2.9-13.7,5.6c-0.7-0.5-1.5-1.2-2.5-2c-1.1-0.9-2-1.7-2.9-2.5c-0.3-0.3-0.6-0.5-0.9-0.8c-0.2-0.1-0.3-0.2-0.3-0.3c-1-0.9-2.6-0.8-3.5,0.1l-7.4,7.4c-0.9,0.9-1,2.3-0.3,3.3c0,0.1,0,0.1,0.3,0.4c0.2,0.3,0.4,0.6,0.7,1c0.7,1,1.5,2,2.1,3c0.9,1.2,1.5,2.2,2,2.9c-2.9,3.9-5,9-5.6,14c-0.1,0-0.3,0-0.4,0c-0.8,0.1-1.7,0.1-2.7,0.2c-1.2,0.1-2.4,0.2-3.7,0.2c-0.4,0-0.8,0-1.2,0.1c-0.2,0-0.4,0-0.5,0c-1.4,0.1-2.5,1.2-2.5,2.6v10.6c0,1.3,1,2.4,2.3,2.6c0.1,0,0.2,0,0.5,0C5.6,41.9,6,42,6.4,42c1.3,0.1,2.5,0.3,3.7,0.4c0.7,0.1,1.3,0.2,1.9,0.2c0.6,0.1,1.1,0.2,1.5,0.2c0.7,4.4,2.6,8.6,5.8,13.3c-0.5,0.7-1.3,1.7-2.2,2.8c-0.9,1.2-1.7,2.1-2.5,3.1c-0.3,0.3-0.5,0.7-0.8,0.9c-0.1,0.2-0.2,0.3-0.3,0.4c-0.9,1-0.8,2.6,0.2,3.5l7.4,7.1c0.9,0.9,2.4,1,3.4,0.2c0.1,0,0.2-0.1,0.4-0.3c0.3-0.2,0.6-0.5,0.9-0.7c1-0.8,2-1.5,2.9-2.2c1.4-1.1,2.4-1.8,3.1-2.3c5.2,3.2,9.3,5,13.6,5.7c0,0.2,0,0.3,0,0.5c0.1,0.8,0.2,1.7,0.2,2.8c0.1,1.2,0.2,2.4,0.3,3.7c0,0.4,0.1,0.9,0.1,1.2c0,0.2,0,0.4,0,0.5c0.1,1.4,1.2,2.4,2.6,2.4h10.2c1.3,0,2.4-1,2.6-2.3c0-0.1,0-0.2,0-0.5c0-0.4,0.1-0.8,0.1-1.2c0.1-1.3,0.3-2.5,0.4-3.7c0.1-0.8,0.2-1.5,0.3-2.1c0.1-0.6,0.2-1.1,0.2-1.5c5-1.1,9.7-3.1,13.8-5.8c0.7,0.5,1.6,1.3,2.6,2.1c0.1,0.1,0.1,0.1,0.3,0.2c0.9,0.8,1.9,1.6,2.8,2.4c0.3,0.3,0.6,0.5,0.9,0.8c0.2,0.1,0.3,0.2,0.3,0.3c1,0.9,2.6,0.8,3.6-0.2l7.1-7.4c0.9-1,1-2.5,0-3.5c-0.1-0.1-0.2-0.2-0.3-0.3c-0.2-0.3-0.5-0.6-0.8-0.9c-0.8-0.9-1.6-1.8-2.4-2.7c-0.1-0.1-0.1-0.1-0.2-0.3c-0.8-1-1.5-1.8-2.1-2.4c2.8-3.9,4.7-8.2,5.7-13.2c0.3,0,0.6-0.1,1-0.1c0.7-0.1,1.6-0.2,2.5-0.3c1.2-0.1,2.5-0.3,3.7-0.4c0.4,0,0.9-0.1,1.2-0.1c0.2,0,0.4,0,0.5,0c1.3-0.1,2.4-1.2,2.4-2.6V28.3c0-1.4-1.1-2.5-2.4-2.6c-0.1,0-0.2,0-0.5,0c-0.4,0-0.8-0.1-1.2-0.1c-1.3-0.1-2.5-0.2-3.7-0.3c-0.9-0.1-1.8-0.1-2.5-0.2c-0.4,0-0.8-0.1-1.1-0.1C92.8,19.9,91.2,15.9,88.8,11.8z"/>
      <circle cx="53.3" cy="34.4" r="26" fill="none" stroke="#FF3B30" strokeWidth="2"/>
    </svg>
  );
}

function ServiceTitanLogo() {
  return (
    <svg viewBox="0 0 280 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="55" fontFamily="Arial, sans-serif" fontSize="38" fontWeight="700" fill="var(--ds-text-primary)">ServiceTitan</text>
    </svg>
  );
}

function CorrigoLogo() {
  return (
    <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="55" fontFamily="Arial, sans-serif" fontSize="48" fontWeight="700" fill="var(--ds-text-primary)">Corrigo</text>
    </svg>
  );
}

function DefaultPlatformLogo({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="24" fill="var(--ds-accent-primary)"/>
      <text x="100" y="115" fontSize="80" fill="white" textAnchor="middle" fontWeight="700">
        {name.charAt(0).toUpperCase()}
      </text>
    </svg>
  );
}

function getPlatformLogo(platformName: string) {
  const name = platformName.toLowerCase();
  if (name.includes('maintainx')) return <MaintainXLogo />;
  if (name.includes('upkeep')) return <UpkeepLogo />;
  if (name.includes('servicetitan')) return <ServiceTitanLogo />;
  if (name.includes('corrigo')) return <CorrigoLogo />;
  return <DefaultPlatformLogo name={platformName} />;
}

export default function IntegrationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [availablePlatforms, setAvailablePlatforms] = useState<Platform[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    status: 'idle', total: 0, imported: 0, message: ''
  });

  useEffect(() => {
    loadIntegrations();
  }, [user]);

  const loadIntegrations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/status');
      const data = await response.json();
      if (data.success) {
        setAvailablePlatforms(data.availablePlatforms || []);
        setConnectedPlatforms(data.connectedPlatforms || []);
      }
    } catch (error) {
      console.error('[Integrations] Failed to load:', error);
      showToast('Failed to load integrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectClick = (platform: Platform) => {
    setSelectedPlatform(platform);
    setShowConnectModal(true);
    setApiKey('');
  };

  const handleConnect = async () => {
    if (!selectedPlatform || !apiKey.trim() || !user) return;
    setConnectingPlatform(selectedPlatform.name);
    try {
      const response = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform_name: selectedPlatform.name, credentials: { api_key: apiKey } })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`Connected to ${selectedPlatform.display_name}!`, 'success');
        setShowConnectModal(false);
        setApiKey('');
        await loadIntegrations();
      } else {
        showToast(data.error || 'Failed to connect', 'error');
      }
    } catch (error) {
      console.error('[Integrations] Connect error:', error);
      showToast('Failed to connect', 'error');
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleImport = async (platformName: string) => {
    if (!user) return;
    setImportProgress({ status: 'importing', total: 0, imported: 0, message: 'Starting import...' });
    try {
      const response = await fetch('/api/integrations/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform_name: platformName })
      });
      const data = await response.json();
      if (data.success) {
        setImportProgress({
          status: 'success',
          total: data.imported_count || 0,
          imported: data.imported_count || 0,
          message: `Successfully imported ${data.imported_count || 0} technicians${data.duplicates_found ? ` (${data.duplicates_found} duplicates skipped)` : ''}`
        });
        showToast(`Imported ${data.imported_count || 0} technicians!`, 'success');
        setTimeout(() => setImportProgress({ status: 'idle', total: 0, imported: 0, message: '' }), 5000);
      } else {
        setImportProgress({ status: 'error', total: 0, imported: 0, message: data.error || 'Import failed' });
        showToast(data.error || 'Failed to import', 'error');
      }
    } catch (error) {
      console.error('[Integrations] Import error:', error);
      setImportProgress({ status: 'error', total: 0, imported: 0, message: 'Import failed' });
      showToast('Failed to import technicians', 'error');
    }
  };

  const handleDisconnect = async (platformName: string) => {
    if (!confirm('Are you sure you want to disconnect this platform?')) return;
    try {
      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform_name: platformName })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Platform disconnected', 'success');
        await loadIntegrations();
      } else {
        showToast(data.error || 'Failed to disconnect', 'error');
      }
    } catch (error) {
      console.error('[Integrations] Disconnect error:', error);
      showToast('Failed to disconnect', 'error');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'expired': return 'badge-warning';
      case 'error': return 'badge-error';
      default: return 'badge-default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Connected';
      case 'expired': return 'Expired';
      case 'revoked': return 'Revoked';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-header-title">Integrations</h1>
          <p className="page-header-description">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-header-title">Integrations</h1>
          <p className="page-header-description">Connect your CMMS platform to sync technicians and work orders</p>
        </div>
      </div>

      {/* Import Progress Banner */}
      {importProgress.status !== 'idle' && (
        <div className={`card ${importProgress.status === 'error' ? 'card-error' : importProgress.status === 'success' ? 'card-success' : 'card-info'}`} style={{ marginBottom: 'var(--ds-space-6)' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)' }}>
            {importProgress.status === 'importing' && <span className="auth-spinner" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'var(--ds-font-semibold)', marginBottom: 4 }}>
                {importProgress.status === 'importing' ? 'Importing technicians...' :
                 importProgress.status === 'success' ? 'Import complete!' : 'Import failed'}
              </div>
              <div style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)' }}>
                {importProgress.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connected Platforms */}
      {connectedPlatforms.length > 0 && (
        <div style={{ marginBottom: 'var(--ds-space-8)' }}>
          <h2 style={{ fontSize: 'var(--ds-text-lg)', fontWeight: 'var(--ds-font-semibold)', marginBottom: 'var(--ds-space-4)', color: 'var(--ds-text-primary)' }}>
            Connected Platforms
          </h2>
          <div style={{ display: 'flex', gap: 'var(--ds-space-4)', overflowX: 'auto', paddingBottom: 8 }}>
            {connectedPlatforms.map((conn) => (
              <div key={conn.platform.id} className="card" style={{ minWidth: 280, maxWidth: 280 }}>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-4)' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', background: 'var(--ds-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getPlatformLogo(conn.platform.display_name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'var(--ds-font-semibold)', fontSize: 'var(--ds-text-md)', marginBottom: 6, color: 'var(--ds-text-primary)' }}>
                      {conn.platform.display_name}
                    </div>
                    <span className={`badge ${getStatusBadgeClass(conn.connection_status)}`}>
                      {getStatusLabel(conn.connection_status)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-2)' }}>
                    <button onClick={() => handleImport(conn.platform.name)} className="btn btn-secondary btn-sm">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                      </svg>
                      Refresh Sync
                    </button>
                    <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Auto-syncs daily
                    </div>
                  </div>
                  {conn.last_sync_at && (
                    <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-secondary)' }}>
                      Last sync: {new Date(conn.last_sync_at).toLocaleDateString()}
                    </div>
                  )}
                  <button onClick={() => handleDisconnect(conn.platform.name)} className="btn btn-secondary" style={{ marginTop: 'auto' }}>
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Platforms */}
      {availablePlatforms.length > 0 && (
        <div>
          <h2 style={{ fontSize: 'var(--ds-text-lg)', fontWeight: 'var(--ds-font-semibold)', marginBottom: 'var(--ds-space-4)', color: 'var(--ds-text-primary)' }}>
            Available Integrations
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--ds-space-4)' }}>
            {availablePlatforms.map((platform) => (
              <div key={platform.id} className="card card-interactive" onClick={() => handleConnectClick(platform)}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-4)' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', background: 'var(--ds-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {getPlatformLogo(platform.display_name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'var(--ds-font-semibold)', fontSize: 'var(--ds-text-md)', color: 'var(--ds-text-primary)' }}>
                      {platform.display_name}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleConnectClick(platform); }} className="btn btn-primary btn-sm">
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Platforms Available */}
      {availablePlatforms.length === 0 && connectedPlatforms.length === 0 && (
        <div className="card">
          <div className="empty-state" style={{ padding: 'var(--ds-space-12)' }}>
            <div style={{ fontSize: 48, marginBottom: 'var(--ds-space-4)', opacity: 0.5 }}>🔌</div>
            <h3 className="empty-state-title">No integrations available</h3>
            <p className="empty-state-description">Check back later for new platform integrations</p>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && selectedPlatform && (
        <>
          <div className="panel-overlay" onClick={() => setShowConnectModal(false)} />
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Connect to {selectedPlatform.display_name}</h2>
              <button className="modal-close" onClick={() => setShowConnectModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', background: 'var(--ds-bg-elevated)', marginBottom: 'var(--ds-space-6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getPlatformLogo(selectedPlatform.display_name)}
              </div>
              <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--ds-space-6)' }}>
                Enter your API key to connect your {selectedPlatform.display_name} account
              </p>
              <div className="form-field">
                <label className="form-label" htmlFor="api-key">API Key</label>
                <input id="api-key" type="password" className="form-input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your API key" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowConnectModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleConnect} className="btn btn-primary" disabled={!apiKey.trim() || !!connectingPlatform}>
                {connectingPlatform ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
