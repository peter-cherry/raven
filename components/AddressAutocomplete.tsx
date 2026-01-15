'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, geocoded?: { lat: number; lng: number; city?: string; state?: string }) => void;
  onValidated?: (isValid: boolean) => void;
  placeholder?: string;
  error?: string;
}

interface Suggestion {
  description: string;
  place_id: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onValidated,
  placeholder = 'Enter street address',
  error
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | 'pending' | null>(null);
  const [geocodedInfo, setGeocodedInfo] = useState<{ city?: string; state?: string } | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced geocoding validation
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (!inputValue || inputValue.length < 10) {
      setValidationStatus(null);
      setGeocodedInfo(null);
      setSuggestions([]);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      setIsValidating(true);
      setValidationStatus('pending');

      try {
        // Note: Google Places Autocomplete is disabled due to CORS restrictions
        // The direct browser API call is blocked by Google's CORS policy
        // Using server-side geocoding validation only

        // Validate address by geocoding
        const geocodeUrl = `/api/maps/geocode-nominatim?q=${encodeURIComponent(inputValue)}`;
        console.log('[AddressAutocomplete] Validating address:', inputValue);
        const geocodeRes = await fetch(geocodeUrl);

        if (geocodeRes.ok) {
          const geocodeData = await geocodeRes.json();
          console.log('[AddressAutocomplete] Geocode response:', geocodeData);
          if (geocodeData.lat && geocodeData.lng) {
            console.log('[AddressAutocomplete] ✓ Valid address:', geocodeData);
            setValidationStatus('valid');
            setGeocodedInfo({ city: geocodeData.city, state: geocodeData.state });
            onValidated?.(true);
          } else {
            console.log('[AddressAutocomplete] ✗ Invalid - missing lat/lng:', geocodeData);
            setValidationStatus('invalid');
            setGeocodedInfo(null);
            onValidated?.(false);
          }
        } else {
          console.log('[AddressAutocomplete] ✗ API error - status:', geocodeRes.status);
          setValidationStatus('invalid');
          setGeocodedInfo(null);
          onValidated?.(false);
        }
      } catch (err) {
        console.error('Address validation error:', err);
        setValidationStatus('invalid');
        setGeocodedInfo(null);
        onValidated?.(false);
      } finally {
        setIsValidating(false);
      }
    }, 800);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [inputValue]);

  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    setInputValue(suggestion.description);
    setShowSuggestions(false);
    setIsValidating(true);
    setValidationStatus('pending');

    try {
      // Geocode the selected address
      const geocodeUrl = `/api/maps/geocode-nominatim?q=${encodeURIComponent(suggestion.description)}`;
      const geocodeRes = await fetch(geocodeUrl);

      if (geocodeRes.ok) {
        const geocodeData = await geocodeRes.json();
        if (geocodeData.lat && geocodeData.lng) {
          setValidationStatus('valid');
          setGeocodedInfo({ city: geocodeData.city, state: geocodeData.state });
          onChange(suggestion.description, {
            lat: geocodeData.lat,
            lng: geocodeData.lng,
            city: geocodeData.city,
            state: geocodeData.state
          });
          onValidated?.(true);
        } else {
          setValidationStatus('invalid');
          onChange(suggestion.description);
          onValidated?.(false);
        }
      } else {
        setValidationStatus('invalid');
        onChange(suggestion.description);
        onValidated?.(false);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setValidationStatus('invalid');
      onChange(suggestion.description);
      onValidated?.(false);
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = () => {
    if (isValidating || validationStatus === 'pending') {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--ds-warning)"
          strokeWidth="2"
          style={{ animation: 'spin 1s linear infinite' }}
        >
          <circle cx="12" cy="12" r="10" opacity="0.3"/>
          <path d="M12 2 A10 10 0 0 1 22 12" strokeLinecap="round"/>
        </svg>
      );
    }

    if (validationStatus === 'valid') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ds-success)" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      );
    }

    if (validationStatus === 'invalid' && inputValue.length >= 10) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ds-error)" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      );
    }

    return null;
  };

  return (
    <div style={{ position: 'relative' }}>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Input with validation icon */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          className="form-input"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          style={{
            width: '100%',
            paddingRight: 40,
            background: 'var(--ds-bg-surface)',
            border: '1px solid',
            borderColor: error ? 'var(--ds-error)' : validationStatus === 'valid' ? 'var(--ds-success)' : 'var(--ds-border-default)',
            borderRadius: 'var(--ds-radius-lg)',
            color: 'var(--ds-text-primary)',
            padding: '12px 16px'
          }}
        />
        <div style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none'
        }}>
          {getStatusIcon()}
        </div>
      </div>

      {/* Geocoded location info */}
      {validationStatus === 'valid' && geocodedInfo && (
        <div style={{
          marginTop: 'var(--ds-space-2)',
          fontSize: 'var(--ds-text-sm)',
          color: 'var(--ds-success-text)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--ds-space-2)'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {geocodedInfo.city && geocodedInfo.state ? `${geocodedInfo.city}, ${geocodedInfo.state}` : 'Location verified'}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          marginTop: 'var(--ds-space-2)',
          fontSize: 'var(--ds-text-sm)',
          color: 'var(--ds-error-text)'
        }}>
          {error}
        </div>
      )}

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="dropdown-menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 1000,
              background: 'var(--ds-bg-surface)',
              border: '1px solid var(--ds-border-default)',
              borderRadius: 'var(--ds-radius-lg)',
              boxShadow: 'var(--ds-shadow-lg)',
              overflow: 'hidden'
            }}
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="dropdown-item"
                style={{
                  width: '100%',
                  padding: 'var(--ds-space-3) var(--ds-space-4)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ds-text-primary)',
                  textAlign: 'left',
                  fontSize: 'var(--ds-text-sm)',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--ds-border-subtle)',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--ds-bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ds-text-secondary)" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{suggestion.description}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
