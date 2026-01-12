'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractorId: string;
  onSuccess: () => void;
}

const COMMON_CERTIFICATIONS = [
  'EPA 608 - Universal',
  'EPA 608 - Type I',
  'EPA 608 - Type II',
  'EPA 608 - Type III',
  'OSHA 10',
  'OSHA 30',
  'NATE Certification',
  'Journeyman License',
  'Master Technician',
  'Other'
];

export default function AddCertificationModal({ isOpen, onClose, contractorId, onSuccess }: AddCertificationModalProps) {
  const [formData, setFormData] = useState({
    certification_name: '',
    certification_number: '',
    expiration_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.certification_name) {
      setError('Please enter a certification name');
      return;
    }

    setLoading(true);

    try {
      // Use authoritative API route for certification creation
      const response = await fetch('/api/credentials/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor_id: contractorId,
          certification_name: formData.certification_name,
          issuing_organization: 'N/A', // Required by API, not captured in modal
          certification_number: formData.certification_number || null,
          expiration_date: formData.expiration_date || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add certification');
      }

      setFormData({
        certification_name: '',
        certification_number: '',
        expiration_date: ''
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error adding certification:', err);
      setError(err.message || 'Failed to add certification');
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
                Add Certification
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
                {/* Certification Name */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Certification Name *
                  </label>
                  <select
                    className="select-input"
                    value={formData.certification_name}
                    onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
                    required
                  >
                    <option value="">Select certification...</option>
                    {COMMON_CERTIFICATIONS.map(cert => (
                      <option key={cert} value={cert}>
                        {cert}
                      </option>
                    ))}
                  </select>
                  {formData.certification_name === 'Other' && (
                    <input
                      type="text"
                      className="text-input"
                      placeholder="Enter certification name"
                      style={{ marginTop: 'var(--spacing-sm)' }}
                      onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
                    />
                  )}
                </div>

                {/* Certification Number */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Certification Number (Optional)
                  </label>
                  <input
                    type="text"
                    className="text-input"
                    value={formData.certification_number}
                    onChange={(e) => setFormData({ ...formData, certification_number: e.target.value })}
                    placeholder="e.g., 12345678"
                  />
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
                onClick={onClose}
                className="outline-button"
                style={{ flex: 1, padding: '12px 24px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="primary-button"
                disabled={loading}
                style={{ flex: 1, padding: '12px 24px', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? 'Adding...' : 'Add Certification'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
