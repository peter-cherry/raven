"use client";

import { useState } from 'react';
import { CloseButton } from '@/components/CloseButton';

interface PolicyItem {
  id: number;
  name: string;
  currency: string;
  amount: string;
  checked: boolean;
}

const initialPolicies: PolicyItem[] = [
  { id: 1, name: 'GL', currency: 'USD', amount: '6,000,000', checked: true },
  { id: 2, name: 'AUTO', currency: 'USD', amount: '2,000,000', checked: false },
  { id: 3, name: 'WCRL', currency: 'USD', amount: '6,000,000', checked: false },
  { id: 4, name: 'CPL', currency: 'USD', amount: '1,500,000', checked: false },
  { id: 5, name: 'GL', currency: 'USD', amount: '7,000,000', checked: false },
  { id: 6, name: 'Endorsements', currency: 'USD', amount: '5,000,00', checked: false },
  { id: 7, name: 'Expiry', currency: 'USD', amount: '6,000,00', checked: false },
];

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (items: PolicyItem[]) => Promise<string> | Promise<void>;
}

export function PolicyModal({ isOpen, onClose, onSave }: PolicyModalProps) {
  const [items, setItems] = useState<PolicyItem[]>(initialPolicies);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="policy-modal-overlay" onClick={onClose}>
      <div className="policy-modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <CloseButton onClick={onClose} />
        </div>
        <div className="policy-list">
          {items.map((policy) => (
            <div key={policy.id} className="policy-row">
              <input
                type="checkbox"
                checked={policy.checked}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setItems((prev) => prev.map((p) => p.id === policy.id ? { ...p, checked } : p));
                }}
                className="policy-checkbox"
              />
              <span className="policy-name">{policy.name}</span>
              <span className="policy-currency">{policy.currency}</span>
              <span className="policy-divider">-</span>
              <input
                className="policy-amount-input"
                value={policy.amount}
                onChange={(e) => {
                  const raw = e.target.value;
                  // allow digits and commas only
                  const next = raw.replace(/[^0-9,]/g, '');
                  setItems((prev) => prev.map((p) => p.id === policy.id ? { ...p, amount: next } : p));
                }}
                aria-label={`${policy.name} amount`}
              />
              <button className="policy-menu-btn" aria-label="Options">
                <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
                  <circle cx="2" cy="2" r="2" fill="currentColor"/>
                  <circle cx="2" cy="8" r="2" fill="currentColor"/>
                  <circle cx="2" cy="14" r="2" fill="currentColor"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="policy-footer">
          <span className="policy-footer-text">Insert details wherever they reside on this page</span>
          {err && <span className="policy-footer-text" style={{ color: 'var(--error)' }}>{err}</span>}
          <button className="primary-button" disabled={saving} onClick={async () => {
            setErr(null);
            if (!onSave) { onClose(); return; }
            try {
              setSaving(true);
              await onSave(items);
              onClose();
            } catch (e: any) {
              setErr(e?.message || 'Failed to save');
            } finally {
              setSaving(false);
            }
          }}>{saving ? 'Saving...' : 'Done'}</button>
        </div>
      </div>
    </div>
  );
}
