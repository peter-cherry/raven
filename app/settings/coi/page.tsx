'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import ComplianceOverlay from '@/components/ComplianceOverlay';

interface ComplianceTemplate {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  is_builtin: boolean;
  gl_amount: number;
  auto_amount: number;
  wc_amount: number;
  el_amount: number;
  cpl_amount: number;
  additional_insured: boolean;
  waiver_of_subrogation: boolean;
  primary_non_contributory: boolean;
  min_days_to_expiry: number;
  show_in_quick?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Built-in template defaults
const BUILTIN_TEMPLATES: Omit<ComplianceTemplate, 'id' | 'org_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Standard Coverage',
    description: 'Recommended for general HVAC, plumbing, and electrical work',
    is_builtin: true,
    show_in_quick: true,
    gl_amount: 1000000,
    auto_amount: 1000000,
    wc_amount: 1000000,
    el_amount: 1000000,
    cpl_amount: 500000,
    additional_insured: true,
    waiver_of_subrogation: true,
    primary_non_contributory: false,
    min_days_to_expiry: 30,
  },
  {
    name: 'High-Risk Coverage',
    description: 'For commercial projects and high-value properties',
    is_builtin: true,
    show_in_quick: true,
    gl_amount: 2000000,
    auto_amount: 2000000,
    wc_amount: 1000000,
    el_amount: 2000000,
    cpl_amount: 1000000,
    additional_insured: true,
    waiver_of_subrogation: true,
    primary_non_contributory: true,
    min_days_to_expiry: 30,
  },
  {
    name: 'Basic Coverage',
    description: 'Minimum requirements for residential work',
    is_builtin: true,
    show_in_quick: true,
    gl_amount: 500000,
    auto_amount: 500000,
    wc_amount: 500000,
    el_amount: 500000,
    cpl_amount: 250000,
    additional_insured: false,
    waiver_of_subrogation: false,
    primary_non_contributory: false,
    min_days_to_expiry: 30,
  },
];

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

export default function COIConfigurationPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [templates, setTemplates] = useState<ComplianceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ComplianceTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [overlayTemplate, setOverlayTemplate] = useState<ComplianceTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gl_amount: '1000000',
    auto_amount: '1000000',
    wc_amount: '1000000',
    el_amount: '1000000',
    cpl_amount: '500000',
    additional_insured: true,
    waiver_of_subrogation: true,
    primary_non_contributory: false,
    min_days_to_expiry: '30',
  });

  // Get org_id on mount
  useEffect(() => {
    const getOrgId = async () => {
      if (!user) return;
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('org_id')
        .eq('user_id', user.id)
        .single();
      if (membership?.org_id) {
        setOrgId(membership.org_id);
      }
    };
    getOrgId();
  }, [user]);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      if (!orgId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('compliance_templates')
          .select('*')
          .eq('org_id', orgId)
          .order('is_builtin', { ascending: false })
          .order('name');

        if (error) throw error;

        const existingBuiltins = (data || []).filter(t => t.is_builtin);
        if (existingBuiltins.length === 0) {
          await initializeBuiltinTemplates();
        } else {
          setTemplates(data || []);
        }
      } catch (error) {
        console.error('[COI Config] Failed to load templates:', error);
        showToast('Failed to load templates', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, [orgId]);

  const initializeBuiltinTemplates = async () => {
    if (!orgId) return;
    try {
      const templatesToInsert = BUILTIN_TEMPLATES.map(t => ({ ...t, org_id: orgId }));
      const { error: insertError } = await supabase.from('compliance_templates').insert(templatesToInsert);
      if (insertError) throw insertError;

      const { data: allTemplates, error: fetchError } = await supabase
        .from('compliance_templates')
        .select('*')
        .eq('org_id', orgId)
        .order('is_builtin', { ascending: false })
        .order('name');

      if (fetchError) throw fetchError;
      setTemplates(allTemplates || []);
      showToast('Initialized default templates', 'success');
    } catch (error) {
      console.error('[COI Config] Failed to initialize templates:', error);
    }
  };

  const handleEditClick = (template: ComplianceTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      gl_amount: template.gl_amount.toString(),
      auto_amount: template.auto_amount.toString(),
      wc_amount: template.wc_amount.toString(),
      el_amount: template.el_amount.toString(),
      cpl_amount: template.cpl_amount.toString(),
      additional_insured: template.additional_insured,
      waiver_of_subrogation: template.waiver_of_subrogation,
      primary_non_contributory: template.primary_non_contributory,
      min_days_to_expiry: template.min_days_to_expiry.toString(),
    });
    setShowEditModal(true);
  };

  const handleCreateClick = () => {
    setFormData({
      name: '',
      description: '',
      gl_amount: '1000000',
      auto_amount: '1000000',
      wc_amount: '1000000',
      el_amount: '1000000',
      cpl_amount: '500000',
      additional_insured: true,
      waiver_of_subrogation: true,
      primary_non_contributory: false,
      min_days_to_expiry: '30',
    });
    setShowCreateModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTemplate || !orgId) return;
    setSaving(true);
    try {
      const updateData: Partial<ComplianceTemplate> = {
        gl_amount: parseInt(formData.gl_amount) || 1000000,
        auto_amount: parseInt(formData.auto_amount) || 1000000,
        wc_amount: parseInt(formData.wc_amount) || 1000000,
        el_amount: parseInt(formData.el_amount) || 1000000,
        cpl_amount: parseInt(formData.cpl_amount) || 500000,
        additional_insured: formData.additional_insured,
        waiver_of_subrogation: formData.waiver_of_subrogation,
        primary_non_contributory: formData.primary_non_contributory,
        min_days_to_expiry: parseInt(formData.min_days_to_expiry) || 30,
      };
      if (!editingTemplate.is_builtin) {
        updateData.description = formData.description;
      }

      const { error } = await supabase.from('compliance_templates').update(updateData).eq('id', editingTemplate.id);
      if (error) throw error;

      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...updateData } : t));
      showToast('Template updated', 'success');
      setShowEditModal(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('[COI Config] Failed to save template:', error);
      showToast('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!orgId || !formData.name.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('compliance_templates')
        .insert({
          org_id: orgId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_builtin: false,
          gl_amount: parseInt(formData.gl_amount) || 1000000,
          auto_amount: parseInt(formData.auto_amount) || 1000000,
          wc_amount: parseInt(formData.wc_amount) || 1000000,
          el_amount: parseInt(formData.el_amount) || 1000000,
          cpl_amount: parseInt(formData.cpl_amount) || 500000,
          additional_insured: formData.additional_insured,
          waiver_of_subrogation: formData.waiver_of_subrogation,
          primary_non_contributory: formData.primary_non_contributory,
          min_days_to_expiry: parseInt(formData.min_days_to_expiry) || 30,
        })
        .select()
        .single();

      if (error) throw error;
      setTemplates(prev => [...prev, data]);
      showToast('Template created', 'success');
      setShowCreateModal(false);
    } catch (error: any) {
      console.error('[COI Config] Failed to create template:', error);
      if (error.code === '23505') {
        showToast('A template with this name already exists', 'error');
      } else {
        showToast('Failed to create template', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (template: ComplianceTemplate) => {
    if (template.is_builtin) {
      showToast('Cannot delete built-in templates', 'error');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;
    try {
      const { error } = await supabase.from('compliance_templates').delete().eq('id', template.id);
      if (error) throw error;
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      showToast('Template deleted', 'success');
    } catch (error) {
      console.error('[COI Config] Failed to delete template:', error);
      showToast('Failed to delete template', 'error');
    }
  };

  const builtinTemplates = templates.filter(t => t.is_builtin);
  const customTemplates = templates.filter(t => !t.is_builtin);

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-header-title">COI Configuration</h1>
          <p className="page-header-description">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <button onClick={() => router.back()} className="btn btn-ghost" style={{ marginRight: 'var(--ds-space-3)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="page-header-info">
            <h1 className="page-header-title">COI Configuration</h1>
            <p className="page-header-description">Configure compliance templates for work orders</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="card" style={{ marginBottom: 'var(--ds-space-8)', background: 'var(--ds-info-bg)', border: '1px solid var(--ds-info-border)' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--ds-space-3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ds-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <div>
            <div style={{ fontWeight: 'var(--ds-font-semibold)', marginBottom: 'var(--ds-space-1)', color: 'var(--ds-info-text)' }}>
              About COI Templates
            </div>
            <div style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
              Templates define insurance coverage requirements for contractors. Built-in templates have fixed names but configurable values. Custom templates give you full control over naming and configuration.
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--ds-space-8)' }}>
        {/* Custom Templates */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ds-space-4)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--ds-text-lg)', fontWeight: 'var(--ds-font-semibold)', color: 'var(--ds-text-primary)', marginBottom: 'var(--ds-space-1)' }}>
                Custom Templates
              </h2>
              <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)' }}>
                Create your own templates with custom names and configurations.
              </p>
            </div>
            <button onClick={handleCreateClick} className="btn btn-primary btn-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New
            </button>
          </div>

          <div className="card">
            <div className="card-body">
              {customTemplates.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--ds-space-8)' }}>
                  <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                  <p className="empty-state-description">No custom templates yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ds-space-4)' }}>
                  {customTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => setOverlayTemplate(template)}
                      className="card card-interactive"
                      style={{ padding: 'var(--ds-space-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ds-space-2)', minWidth: 100 }}
                    >
                      <div style={{ width: 48, height: 56, background: 'var(--ds-accent-primary-light)', border: '1px solid var(--ds-accent-primary-border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ds-accent-primary)" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-primary)', fontWeight: 'var(--ds-font-medium)', textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {template.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Built-in Templates */}
        <div>
          <div style={{ marginBottom: 'var(--ds-space-4)' }}>
            <h2 style={{ fontSize: 'var(--ds-text-lg)', fontWeight: 'var(--ds-font-semibold)', color: 'var(--ds-text-primary)', marginBottom: 'var(--ds-space-1)' }}>
              Built-in Templates
            </h2>
            <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)' }}>
              Pre-configured templates with fixed names but editable values.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-3)' }}>
            {builtinTemplates.map(template => (
              <div key={template.id} className="card">
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 'var(--ds-font-semibold)', fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-primary)', marginBottom: 2 }}>
                      {template.name}
                    </div>
                    <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-secondary)' }}>
                      GL {formatCurrency(template.gl_amount)}
                    </div>
                  </div>
                  <button onClick={() => handleEditClick(template)} className="btn btn-secondary btn-sm">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingTemplate && (
        <>
          <div className="panel-overlay" onClick={() => setShowEditModal(false)} />
          <div className="modal modal--lg">
            <div className="modal-header">
              <h2 className="modal-title">Edit {editingTemplate.name}</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--ds-space-6)' }}>
                {editingTemplate.is_builtin ? 'Modify coverage amounts and endorsements.' : 'Modify all settings for this custom template.'}
              </p>

              <h3 style={{ fontSize: 'var(--ds-text-md)', fontWeight: 'var(--ds-font-semibold)', marginBottom: 'var(--ds-space-4)' }}>Coverage Amounts</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ds-space-4)', marginBottom: 'var(--ds-space-6)' }}>
                <div className="form-field">
                  <label className="form-label">General Liability (GL)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                    <span style={{ color: 'var(--ds-text-secondary)' }}>$</span>
                    <input type="text" className="form-input" value={formData.gl_amount} onChange={(e) => setFormData({ ...formData, gl_amount: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Auto Insurance</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                    <span style={{ color: 'var(--ds-text-secondary)' }}>$</span>
                    <input type="text" className="form-input" value={formData.auto_amount} onChange={(e) => setFormData({ ...formData, auto_amount: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Workers Comp (WC)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                    <span style={{ color: 'var(--ds-text-secondary)' }}>$</span>
                    <input type="text" className="form-input" value={formData.wc_amount} onChange={(e) => setFormData({ ...formData, wc_amount: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Employer's Liability (EL)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                    <span style={{ color: 'var(--ds-text-secondary)' }}>$</span>
                    <input type="text" className="form-input" value={formData.el_amount} onChange={(e) => setFormData({ ...formData, el_amount: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Commercial Property (CPL)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                    <span style={{ color: 'var(--ds-text-secondary)' }}>$</span>
                    <input type="text" className="form-input" value={formData.cpl_amount} onChange={(e) => setFormData({ ...formData, cpl_amount: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Min Days to Expiry</label>
                  <input type="number" className="form-input" value={formData.min_days_to_expiry} onChange={(e) => setFormData({ ...formData, min_days_to_expiry: e.target.value })} min="0" />
                </div>
              </div>

              <h3 style={{ fontSize: 'var(--ds-text-md)', fontWeight: 'var(--ds-font-semibold)', marginBottom: 'var(--ds-space-4)' }}>Required Endorsements</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-3)' }}>
                <label className="auth-checkbox">
                  <input type="checkbox" checked={formData.additional_insured} onChange={(e) => setFormData({ ...formData, additional_insured: e.target.checked })} />
                  <span>Additional Insured</span>
                </label>
                <label className="auth-checkbox">
                  <input type="checkbox" checked={formData.waiver_of_subrogation} onChange={(e) => setFormData({ ...formData, waiver_of_subrogation: e.target.checked })} />
                  <span>Waiver of Subrogation</span>
                </label>
                <label className="auth-checkbox">
                  <input type="checkbox" checked={formData.primary_non_contributory} onChange={(e) => setFormData({ ...formData, primary_non_contributory: e.target.checked })} />
                  <span>Primary and Non-Contributory</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSaveEdit} className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <>
          <div className="panel-overlay" onClick={() => setShowCreateModal(false)} />
          <div className="modal modal--lg">
            <div className="modal-header">
              <h2 className="modal-title">Create Custom Template</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--ds-space-6)' }}>
                Define your own compliance requirements template.
              </p>

              <div className="form-field" style={{ marginBottom: 'var(--ds-space-4)' }}>
                <label className="form-label">Template Name *</label>
                <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Commercial HVAC" />
              </div>
              <div className="form-field" style={{ marginBottom: 'var(--ds-space-6)' }}>
                <label className="form-label">Description</label>
                <input type="text" className="form-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" />
              </div>

              <h3 style={{ fontSize: 'var(--ds-text-md)', fontWeight: 'var(--ds-font-semibold)', marginBottom: 'var(--ds-space-4)' }}>Coverage Amounts</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ds-space-4)', marginBottom: 'var(--ds-space-6)' }}>
                <div className="form-field">
                  <label className="form-label">General Liability (GL)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                    <span style={{ color: 'var(--ds-text-secondary)' }}>$</span>
                    <input type="text" className="form-input" value={formData.gl_amount} onChange={(e) => setFormData({ ...formData, gl_amount: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Auto Insurance</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                    <span style={{ color: 'var(--ds-text-secondary)' }}>$</span>
                    <input type="text" className="form-input" value={formData.auto_amount} onChange={(e) => setFormData({ ...formData, auto_amount: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Workers Comp (WC)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                    <span style={{ color: 'var(--ds-text-secondary)' }}>$</span>
                    <input type="text" className="form-input" value={formData.wc_amount} onChange={(e) => setFormData({ ...formData, wc_amount: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Employer's Liability (EL)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                    <span style={{ color: 'var(--ds-text-secondary)' }}>$</span>
                    <input type="text" className="form-input" value={formData.el_amount} onChange={(e) => setFormData({ ...formData, el_amount: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Commercial Property (CPL)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                    <span style={{ color: 'var(--ds-text-secondary)' }}>$</span>
                    <input type="text" className="form-input" value={formData.cpl_amount} onChange={(e) => setFormData({ ...formData, cpl_amount: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Min Days to Expiry</label>
                  <input type="number" className="form-input" value={formData.min_days_to_expiry} onChange={(e) => setFormData({ ...formData, min_days_to_expiry: e.target.value })} min="0" />
                </div>
              </div>

              <h3 style={{ fontSize: 'var(--ds-text-md)', fontWeight: 'var(--ds-font-semibold)', marginBottom: 'var(--ds-space-4)' }}>Required Endorsements</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-3)' }}>
                <label className="auth-checkbox">
                  <input type="checkbox" checked={formData.additional_insured} onChange={(e) => setFormData({ ...formData, additional_insured: e.target.checked })} />
                  <span>Additional Insured</span>
                </label>
                <label className="auth-checkbox">
                  <input type="checkbox" checked={formData.waiver_of_subrogation} onChange={(e) => setFormData({ ...formData, waiver_of_subrogation: e.target.checked })} />
                  <span>Waiver of Subrogation</span>
                </label>
                <label className="auth-checkbox">
                  <input type="checkbox" checked={formData.primary_non_contributory} onChange={(e) => setFormData({ ...formData, primary_non_contributory: e.target.checked })} />
                  <span>Primary and Non-Contributory</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCreateTemplate} className="btn btn-primary" disabled={saving || !formData.name.trim()}>
                {saving ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Compliance Overlay */}
      {overlayTemplate && (
        <ComplianceOverlay
          onClose={() => setOverlayTemplate(null)}
          initialTemplate={overlayTemplate}
          onEditTemplate={(template) => {
            setOverlayTemplate(null);
            handleEditClick(template);
          }}
          coiSettingsMode={true}
        />
      )}
    </div>
  );
}
