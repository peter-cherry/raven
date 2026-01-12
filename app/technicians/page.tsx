"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import EmptyState from '@/components/EmptyState';
import ContractorProfileOverlay from '@/components/ContractorProfileOverlay';
import { AnimatePresence } from 'framer-motion';

interface TechRow {
  id: string;
  full_name: string | null;
  trade_needed: string | null;
  average_rating: number | null;
  coi_state: string | null;
  city: string | null;
  state: string | null;
  is_available: boolean | null;
}

export default function TechniciansPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [techs, setTechs] = useState<TechRow[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [fCity, setFCity] = useState('');
  const [fName, setFName] = useState('');
  const [fState, setFState] = useState('');
  const [fZip, setFZip] = useState('');
  const [fTrade, setFTrade] = useState('');
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get user's org_id and redirect if not authenticated
  useEffect(() => {
    const getUserOrg = async () => {
      // Check for mock mode
      const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
      if (isMockMode) {
        setUserOrgId('mock-org-id');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?returnUrl=/technicians');
        return;
      }

      const { data: membership } = await supabase
        .from('org_memberships')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (membership) {
        setUserOrgId(membership.org_id);
      } else {
        router.push('/');
      }
      setLoading(false);
    };
    getUserOrg();
  }, [router]);

  useEffect(() => {
    if (!userOrgId) return;
    
    const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
    if (isMockMode) {
      // Mock data for demo
      setTechs([
        { id: '1', full_name: 'John Smith', trade_needed: 'HVAC', average_rating: 4.8, coi_state: 'valid', city: 'Miami', state: 'FL', is_available: true },
        { id: '2', full_name: 'Maria Garcia', trade_needed: 'Plumbing', average_rating: 4.5, coi_state: 'valid', city: 'Fort Lauderdale', state: 'FL', is_available: true },
        { id: '3', full_name: 'James Wilson', trade_needed: 'Electrical', average_rating: 4.2, coi_state: 'expired', city: 'Tampa', state: 'FL', is_available: false },
      ]);
      return;
    }

    supabase
      .from('technicians')
      .select('*')
      .eq('org_id', userOrgId)
      .order('average_rating', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching technicians:', error);
          setTechs([]);
        } else {
          setTechs((data as TechRow[]) ?? []);
        }
      });
  }, [userOrgId]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const filtered = useMemo(() => {
    const zkeys = ['zip', 'zipcode', 'zip_code', 'postal_code'];
    return techs.filter((t: any) => {
      const name = (t.full_name || '').toLowerCase();
      const city = (t.city || '').toLowerCase();
      const state = (t.state || '').toLowerCase();
      const trade = (t.trade_needed || '').toLowerCase();
      const zipVal = zkeys.map((k) => (t[k] || '')).find(Boolean) as string | undefined;
      const zip = (zipVal || '').toString().toLowerCase();

      const matchesQ = name.includes(debouncedQ.toLowerCase());
      const matchesName = !fName || name.includes(fName.toLowerCase());
      const matchesCity = !fCity || city.includes(fCity.toLowerCase());
      const matchesState = !fState || state.includes(fState.toLowerCase());
      const matchesZip = !fZip || zip.includes(fZip.toLowerCase());
      const matchesTrade = !fTrade || trade.includes(fTrade.toLowerCase());
      return matchesQ && matchesName && matchesCity && matchesState && matchesZip && matchesTrade;
    });
  }, [techs, debouncedQ, fName, fCity, fState, fZip, fTrade]);

  const getScoreClass = (rating: number | null) => {
    if (!rating) return 'badge-default';
    if (rating >= 4) return 'badge-success';
    if (rating >= 3) return 'badge-warning';
    return 'badge-error';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-header-title">Technicians</h1>
          <p className="page-header-description">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-info">
            <h1 className="page-header-title">Technicians</h1>
            <p className="page-header-description">Manage and view all technicians in your network</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Technician
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: 'var(--ds-space-6)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 'var(--ds-space-3)', alignItems: 'center' }}>
            <div className="search-input-wrapper" style={{ flex: 1, maxWidth: 400 }}>
              <span className="search-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="search"
                className="search-input"
                placeholder="Search technicians..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary" onClick={() => setShowFilters((v) => !v)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/>
              </svg>
              Filters
            </button>
          </div>

          {showFilters && (
            <div style={{ marginTop: 'var(--ds-space-4)', paddingTop: 'var(--ds-space-4)', borderTop: '1px solid var(--ds-border-default)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--ds-space-3)' }}>
                <div className="form-field">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Filter by name" />
                </div>
                <div className="form-field">
                  <label className="form-label">City</label>
                  <input className="form-input" value={fCity} onChange={(e) => setFCity(e.target.value)} placeholder="Filter by city" />
                </div>
                <div className="form-field">
                  <label className="form-label">State</label>
                  <input className="form-input" value={fState} onChange={(e) => setFState(e.target.value)} placeholder="Filter by state" />
                </div>
                <div className="form-field">
                  <label className="form-label">Zip</label>
                  <input className="form-input" value={fZip} onChange={(e) => setFZip(e.target.value)} placeholder="Filter by zip" />
                </div>
                <div className="form-field">
                  <label className="form-label">Trade</label>
                  <input className="form-input" value={fTrade} onChange={(e) => setFTrade(e.target.value)} placeholder="Filter by trade" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--ds-space-2)', marginTop: 'var(--ds-space-4)' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { setFName(''); setFCity(''); setFState(''); setFZip(''); setFTrade(''); }}>Clear</button>
                <button className="btn btn-primary btn-sm" onClick={() => setShowFilters(false)}>Apply</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technicians Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="card-body">
            <EmptyState
              icon="technicians"
              title={techs.length === 0 ? "No technicians yet" : "No matching technicians"}
              description={
                techs.length === 0
                  ? "Your technician network is empty. Start building your network by adding qualified technicians."
                  : "No technicians match your current search or filters. Try adjusting your criteria."
              }
              actionLabel={techs.length === 0 ? "Add Technician" : "Clear Filters"}
              onAction={() => {
                if (techs.length === 0) {
                  alert('Add technician functionality coming soon!');
                } else {
                  setQ('');
                  setFName('');
                  setFCity('');
                  setFState('');
                  setFZip('');
                  setFTrade('');
                }
              }}
            />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Trade</th>
                  <th>Location</th>
                  <th>State</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tech) => (
                  <tr key={tech.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: tech.is_available ? 'var(--ds-success)' : 'var(--ds-text-tertiary)'
                        }} />
                        <span style={{ fontWeight: 'var(--ds-font-medium)' }}>{tech.full_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>{tech.trade_needed || 'N/A'}</td>
                    <td>{tech.city || 'N/A'}</td>
                    <td>{tech.state || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getScoreClass(tech.average_rating)}`}>
                        {tech.average_rating?.toFixed(1) || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        color: tech.is_available ? 'var(--ds-success)' : 'var(--ds-text-secondary)',
                        fontWeight: 'var(--ds-font-medium)'
                      }}>
                        {tech.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTechId(tech.id)}>
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contractor Profile Overlay */}
      <AnimatePresence>
        {selectedTechId && (
          <ContractorProfileOverlay
            contractorId={selectedTechId}
            onClose={() => setSelectedTechId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
