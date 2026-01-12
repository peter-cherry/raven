'use client'

import { useState, useEffect } from 'react'
import { InfoIcon } from './InfoIcon'

export interface SLAConfig {
  dispatch: number
  assignment: number
  arrival: number
  completion: number
}

interface SLASettingsProps {
  trade: string
  urgency: string
  onChange: (config: SLAConfig) => void
  initialConfig?: SLAConfig
}

function getDefaultSLA(trade: string, urgency: string): SLAConfig {
  const presets: Record<string, SLAConfig> = {
    'HVAC-emergency': { dispatch: 15, assignment: 30, arrival: 60, completion: 240 },
    'HVAC-same_day': { dispatch: 30, assignment: 60, arrival: 180, completion: 480 },
    'HVAC-next_day': { dispatch: 60, assignment: 120, arrival: 360, completion: 720 },
    'HVAC-within_week': { dispatch: 120, assignment: 240, arrival: 720, completion: 1440 },
    'HVAC-flexible': { dispatch: 240, assignment: 480, arrival: 1440, completion: 2880 },

    'Plumbing-emergency': { dispatch: 10, assignment: 20, arrival: 45, completion: 180 },
    'Plumbing-same_day': { dispatch: 25, assignment: 50, arrival: 150, completion: 420 },
    'Plumbing-next_day': { dispatch: 60, assignment: 120, arrival: 300, completion: 600 },
    'Plumbing-within_week': { dispatch: 120, assignment: 240, arrival: 720, completion: 1440 },
    'Plumbing-flexible': { dispatch: 240, assignment: 480, arrival: 1440, completion: 2880 },

    'Electrical-emergency': { dispatch: 15, assignment: 25, arrival: 60, completion: 240 },
    'Electrical-same_day': { dispatch: 30, assignment: 60, arrival: 180, completion: 480 },
    'Electrical-next_day': { dispatch: 60, assignment: 120, arrival: 360, completion: 720 },
    'Electrical-within_week': { dispatch: 120, assignment: 240, arrival: 720, completion: 1440 },
    'Electrical-flexible': { dispatch: 240, assignment: 480, arrival: 1440, completion: 2880 },

    'Handyman-emergency': { dispatch: 20, assignment: 40, arrival: 90, completion: 300 },
    'Handyman-same_day': { dispatch: 40, assignment: 80, arrival: 240, completion: 600 },
    'Handyman-next_day': { dispatch: 80, assignment: 160, arrival: 480, completion: 960 },
    'Handyman-within_week': { dispatch: 120, assignment: 240, arrival: 720, completion: 1440 },
    'Handyman-flexible': { dispatch: 240, assignment: 480, arrival: 1440, completion: 2880 },

    'Facilities Tech-emergency': { dispatch: 20, assignment: 40, arrival: 90, completion: 300 },
    'Facilities Tech-same_day': { dispatch: 40, assignment: 80, arrival: 240, completion: 600 },
    'Facilities Tech-next_day': { dispatch: 80, assignment: 160, arrival: 480, completion: 960 },
    'Facilities Tech-within_week': { dispatch: 120, assignment: 240, arrival: 720, completion: 1440 },
    'Facilities Tech-flexible': { dispatch: 240, assignment: 480, arrival: 1440, completion: 2880 },
  }

  return presets[`${trade}-${urgency}`] || {
    dispatch: 60,
    assignment: 120,
    arrival: 240,
    completion: 480
  }
}

export function SLASettings({ trade, urgency, onChange, initialConfig }: SLASettingsProps) {
  const defaultConfig = getDefaultSLA(trade, urgency)
  const [config, setConfig] = useState<SLAConfig>(initialConfig || defaultConfig)

  // Update config when trade/urgency changes
  useEffect(() => {
    if (!initialConfig) {
      const newDefault = getDefaultSLA(trade, urgency)
      setConfig(newDefault)
      onChange(newDefault)
    }
  }, [trade, urgency, initialConfig, onChange])

  const updateTimer = (stage: keyof SLAConfig, minutes: number) => {
    const updated = { ...config, [stage]: minutes }
    setConfig(updated)
    onChange(updated)
  }

  const resetToDefaults = () => {
    const defaults = getDefaultSLA(trade, urgency)
    setConfig(defaults)
    onChange(defaults)
  }

  const totalMinutes = config.dispatch + config.assignment + config.arrival + config.completion
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10

  return (
    <div className="container-card" style={{ padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', marginBottom: 12, gap: 12 }}>
        <div className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          SLA Timer Settings
        </div>
        <button
          type="button"
          className="outline-button"
          onClick={resetToDefaults}
          style={{ minWidth: 120 }}
        >
          Reset to Defaults
        </button>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
        Auto-configured for <strong>{trade}</strong> - <strong>{urgency}</strong>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="sla-dispatch" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            Dispatch
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> (min)</span>
            <InfoIcon tooltip="Time allowed to send the work order to technicians after creation" />
          </label>
          <input
            id="sla-dispatch"
            className="text-input"
            type="number"
            min="1"
            value={config.dispatch}
            onChange={(e) => updateTimer('dispatch', +e.target.value || 0)}
            style={{ padding: 8, fontSize: 14 }}
          />
        </div>

        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="sla-assignment" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            Assignment
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> (min)</span>
            <InfoIcon tooltip="Time allowed for a technician to accept the work order after dispatch" />
          </label>
          <input
            id="sla-assignment"
            className="text-input"
            type="number"
            min="1"
            value={config.assignment}
            onChange={(e) => updateTimer('assignment', +e.target.value || 0)}
            style={{ padding: 8, fontSize: 14 }}
          />
        </div>

        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="sla-arrival" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            Arrival
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> (min)</span>
            <InfoIcon tooltip="Time allowed for the technician to arrive on-site after accepting the job" />
          </label>
          <input
            id="sla-arrival"
            className="text-input"
            type="number"
            min="1"
            value={config.arrival}
            onChange={(e) => updateTimer('arrival', +e.target.value || 0)}
            style={{ padding: 8, fontSize: 14 }}
          />
        </div>

        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="sla-completion" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            Completion
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> (min)</span>
            <InfoIcon tooltip="Time allowed to complete the work after arriving on-site" />
          </label>
          <input
            id="sla-completion"
            className="text-input"
            type="number"
            min="1"
            value={config.completion}
            onChange={(e) => updateTimer('completion', +e.target.value || 0)}
            style={{ padding: 8, fontSize: 14 }}
          />
        </div>
      </div>

      {/* Preview total time */}
      <div style={{
        marginTop: 12,
        padding: 10,
        background: 'rgba(108,114,201,0.1)',
        border: '1px solid rgba(108,114,201,0.3)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Total SLA:</strong>
          {' '}{totalMinutes} minutes ({totalHours} hours)
        </div>
      </div>
    </div>
  )
}
