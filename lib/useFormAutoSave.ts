'use client';

import { useEffect, useRef, useState } from 'react';

interface UseFormAutoSaveOptions {
  key: string;
  enabled?: boolean;
  debounceMs?: number;
}

export function useFormAutoSave<T extends Record<string, any>>({
  key,
  enabled = true,
  debounceMs = 3000
}: UseFormAutoSaveOptions) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout>();

  // Check for existing draft on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const stored = localStorage.getItem(`form_draft_${key}`);
      if (stored) {
        setHasDraft(true);
        const draft = JSON.parse(stored);
        if (draft.timestamp) {
          setLastSaved(new Date(draft.timestamp));
        }
      }
    } catch (err) {
      console.error('Failed to check for draft:', err);
    }
  }, [key, enabled]);

  const saveDraft = (data: Partial<T>) => {
    if (!enabled) return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      try {
        const draft = {
          data,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`form_draft_${key}`, JSON.stringify(draft));
        setLastSaved(new Date());
        setHasDraft(true);
      } catch (err) {
        console.error('Failed to save draft:', err);
      }
    }, debounceMs);
  };

  const loadDraft = (): T | null => {
    if (!enabled) return null;

    try {
      const stored = localStorage.getItem(`form_draft_${key}`);
      if (stored) {
        const draft = JSON.parse(stored);
        return draft.data || null;
      }
    } catch (err) {
      console.error('Failed to load draft:', err);
    }
    return null;
  };

  const clearDraft = () => {
    if (!enabled) return;

    try {
      localStorage.removeItem(`form_draft_${key}`);
      setHasDraft(false);
      setLastSaved(null);
    } catch (err) {
      console.error('Failed to clear draft:', err);
    }
  };

  const getTimeSinceLastSave = (): string | null => {
    if (!lastSaved) return null;

    const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);

    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return lastSaved.toLocaleDateString();
  };

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    lastSaved,
    timeSinceLastSave: getTimeSinceLastSave()
  };
}
