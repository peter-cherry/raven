'use client';

import { useEffect, useState } from 'react';

export interface Draft {
  id: string;
  title: string;
  description: string;
  data: any;
  timestamp: string;
  lastModified: string;
}

interface UseMultipleDraftsOptions {
  key: string;
  maxDrafts?: number;
}

export function useMultipleDrafts({
  key,
  maxDrafts = 10
}: UseMultipleDraftsOptions) {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Load drafts on mount
  useEffect(() => {
    loadDrafts();
  }, [key]);

  const loadDrafts = () => {
    try {
      const stored = localStorage.getItem(`drafts_${key}`);
      if (stored) {
        const parsedDrafts = JSON.parse(stored);
        setDrafts(parsedDrafts);
        return parsedDrafts;
      }
    } catch (err) {
      console.error('Failed to load drafts:', err);
    }
    return [];
  };

  const saveDraft = (data: any, title?: string, description?: string) => {
    try {
      const existingDrafts = loadDrafts();

      // Create draft object
      const draft: Draft = {
        id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: title || data.job_title || 'Untitled Draft',
        description: description || data.description || 'No description',
        data,
        timestamp: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      // Add new draft to beginning of list
      let updatedDrafts = [draft, ...existingDrafts];

      // Limit number of drafts
      if (updatedDrafts.length > maxDrafts) {
        updatedDrafts = updatedDrafts.slice(0, maxDrafts);
      }

      localStorage.setItem(`drafts_${key}`, JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);

      return draft;
    } catch (err) {
      console.error('Failed to save draft:', err);
      return null;
    }
  };

  const updateDraft = (draftId: string, data: any, title?: string, description?: string) => {
    try {
      const existingDrafts = loadDrafts();
      const draftIndex = existingDrafts.findIndex((d: Draft) => d.id === draftId);

      if (draftIndex === -1) {
        // If draft doesn't exist, create a new one
        return saveDraft(data, title, description);
      }

      // Update existing draft
      existingDrafts[draftIndex] = {
        ...existingDrafts[draftIndex],
        title: title || data.job_title || existingDrafts[draftIndex].title,
        description: description || data.description || existingDrafts[draftIndex].description,
        data,
        lastModified: new Date().toISOString()
      };

      localStorage.setItem(`drafts_${key}`, JSON.stringify(existingDrafts));
      setDrafts(existingDrafts);

      return existingDrafts[draftIndex];
    } catch (err) {
      console.error('Failed to update draft:', err);
      return null;
    }
  };

  const deleteDraft = (draftId: string) => {
    try {
      const existingDrafts = loadDrafts();
      const updatedDrafts = existingDrafts.filter((d: Draft) => d.id !== draftId);

      localStorage.setItem(`drafts_${key}`, JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);

      return true;
    } catch (err) {
      console.error('Failed to delete draft:', err);
      return false;
    }
  };

  const clearAllDrafts = () => {
    try {
      localStorage.removeItem(`drafts_${key}`);
      setDrafts([]);
      return true;
    } catch (err) {
      console.error('Failed to clear drafts:', err);
      return false;
    }
  };

  const getDraft = (draftId: string): Draft | null => {
    const draft = drafts.find(d => d.id === draftId);
    return draft || null;
  };

  const getTimeSince = (timestamp: string): string => {
    const date = new Date(timestamp);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  return {
    drafts,
    saveDraft,
    updateDraft,
    deleteDraft,
    clearAllDrafts,
    getDraft,
    loadDrafts,
    getTimeSince,
    hasDrafts: drafts.length > 0,
    draftCount: drafts.length
  };
}