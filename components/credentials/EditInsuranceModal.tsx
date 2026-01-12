'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditInsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  insurance: any;
  onSuccess: () => void;
}

const INSURANCE_TYPES = [
  { value: 'general_liability', label: 'General Liability' },
  { value: 'workers_comp', label: 'Workers Compensation' },
  { value: 'auto_insurance', label: 'Auto Insurance' },
  { value: 'professional_liability', label: 'Professional Liability' },
  { value: 'umbrella', label: 'Umbrella Policy' }
];

export default function EditInsuranceModal({ isOpen, onClose, insurance, onSuccess }: EditInsuranceModalProps) {
  const [formData, setFormData] = useState({
    insurance_type: '',
    carrier: '',
    policy_number: '',
    coverage_amount: '',
    expiration_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (insurance) {
      setFormData({
        insurance_type: insurance.insurance_type || '',
        carrier: insurance.carrier || '',
        policy_number: insurance.policy_number || '',
        coverage_amount: insurance.coverage_amount?.toString() || '',
        expiration_date: insurance.expiration_date ? insurance.expiration_date.split('T')[0] : ''
      });
    }
  }, [insurance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.insurance_type || !formData.carrier || !formData.policy_number) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Use authoritative API route for insurance update
      const response = await fetch(`/api/credentials/insurance/${insurance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insurance_type: formData.insurance_type,
          provider: formData.carrier, // API expects 'provider', modal uses 'carrier'
          policy_number: formData.policy_number,
          coverage_amount: formData.coverage_amount ? parseInt(formData.coverage_amount) : null,
          expiration_date: formData.expiration_date || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update insurance');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating insurance:', err);
      setError(err.message || 'Failed to update insurance');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this insurance policy?')) return;

    setLoading(true);

    try {
      // Use authoritative API route for insurance deletion
      const response = await fetch(`/api/credentials/insurance/${insurance.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete insurance');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error deleting insurance:', err);
      setError(err.message || 'Failed to delete insurance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--spacing-xl)'
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 540,
              width: '100%',
              background: 'transparent',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              filter: 'brightness(1.3)',
              border: 'var(--modal-border)',
              borderRadius: 'var(--modal-border-radius)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--spacing-xl)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(47, 47, 47, 0.5)'
            }}>
              <h2 style={{
                fontFamily: 'var(--font-section-title)',
                fontSize: 'var(--font-2xl)',
                color: 'var(--text-primary)',
                fontWeight: 'var(--font-weight-bold)'
              }}>
                Edit Insurance
              </h2>
              <button
                onClick={onClose}
                style={{
                  width: 40,
                  height: 40,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <line x1="4" y1="4" x2="16" y2="16" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                  <line x1="16" y1="4" x2="4" y2="16" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} style={{
              flex: 1,
              overflowY: 'auto',
              padding: 'var(--spacing-xl)'
            }}>
              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #EF4444',
                  borderRadius: 'var(--btn-corner-radius)',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)',
                  color: '#EF4444',
                  fontSize: 'var(--font-sm)'
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {/* Insurance Type */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Insurance Type *
                  </label>
                  <select
                    className="select-input"
                    value={formData.insurance_type}
                    onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })}
                    required
                  >
                    <option value="">Select type...</option>
                    {INSURANCE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Carrier */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Insurance Carrier *
                  </label>
                  <input
                    type="text"
                    className="text-input"
                    value={formData.carrier}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                    required
                  />
                </div>

                {/* Policy Number */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Policy Number *
                  </label>
                  <input
                    type="text"
                    className="text-input"
                    value={formData.policy_number}
                    onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                    required
                  />
                </div>

                {/* Coverage Amount */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Coverage Amount (Optional)
                  </label>
                  <input
                    type="number"
                    className="text-input"
                    value={formData.coverage_amount}
                    onChange={(e) => setFormData({ ...formData, coverage_amount: e.target.value })}
                  />
                  <div style={{
                    fontSize: 'var(--font-xs)',
                    color: 'var(--text-secondary)',
                    marginTop: 'var(--spacing-xs)'
                  }}>
                    Enter amount in dollars (e.g., 1000000 for $1M)
                  </div>
                </div>

                {/* Expiration Date */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    className="text-input"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-xl)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(47, 47, 47, 0.5)'
            }}>
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: '1px solid #EF4444',
                  borderRadius: 'var(--btn-corner-radius)',
                  color: '#EF4444',
                  fontSize: 'var(--font-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
                disabled={loading}
              >
                Delete
              </button>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                onClick={onClose}
                className="outline-button"
                style={{ padding: '12px 24px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="primary-button"
                disabled={loading}
                style={{ padding: '12px 24px', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
