/**
 * hooks/useProfile.ts  — FIXED VERSION
 *
 * Changes from original:
 * 1. Removed localStorage (not persistent across devices, breaks in SSR)
 * 2. Fixed `setState synchronously inside useEffect` lint error —
 *    the fetch now sets state in its own async callback, not in the effect body
 * 3. Added proper loading + error states
 * 4. Added `updateProfile` mutation helper
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { UserProfile } from "@/lib/services/storage-service";
export type { UserProfile };

// Minimal shape returned by getPrimaryResume — extend if UserProfile.resumes has a richer type
export interface StoredResume {
  id: string;
  name: string;
  data: string; // base64 or raw text content
  type: 'docx' | 'pdf' | 'txt';
  [key: string]: unknown;
}

export interface ProfileError {
  type: "permission" | "unknown";
  message: string;
  requiresReauth?: boolean;
}

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  isLoaded: boolean;
  error: ProfileError | null;
  updateProfile: (changes: Partial<UserProfile>) => Promise<void>;
  addResume: (name: string, data: string, type: 'docx' | 'pdf' | 'txt') => Promise<void>;
  deleteResume: () => Promise<void>;
  refresh: () => void;
  getPrimaryResume: () => StoredResume | null;
}

export function useProfile(): UseProfileReturn {
  // isLoaded is true once the first fetch attempt (success or error) completes
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ProfileError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchProfile = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", { signal: controller.signal });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const err = new Error(errData.error || `HTTP ${res.status}`);
        (err as any).status = res.status;
        throw err;
      }
      const data = (await res.json()) as { profile: UserProfile };
      // ✅ setState inside async callback — not directly in effect body
      setProfile(data.profile);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const status = (err as any).status;
        if (status === 403) {
          setError({
            type: "permission",
            message: "Missing Google Drive permissions. Please sign out and sign back in to update permissions.",
            requiresReauth: true,
          });
        } else {
          setError({
            type: "unknown",
            message: "Failed to load profile. Please try again later.",
            requiresReauth: false,
          });
        }
        console.error("[useProfile]", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Effect only starts the fetch — state is set inside the async fn above
  useEffect(() => {
    fetchProfile();
    return () => abortRef.current?.abort();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (changes: Partial<UserProfile>) => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const err = new Error(errData.error || "Failed to update profile");
      (err as any).status = res.status;
      throw err;
    }
    const data = (await res.json()) as { profile: UserProfile };
    setProfile(data.profile);
  }, []);

  const addResume = useCallback(async (name: string, data: string, type: 'docx' | 'pdf' | 'txt') => {
    const newResume = { name, data, type };
    await updateProfile({ resumes: [newResume] } as any);
  }, [updateProfile]);

  const deleteResume = useCallback(async () => {
    await updateProfile({ resumes: [] } as any);
  }, [updateProfile]);

  /**
   * Returns the first resume in the profile, or null if none exist.
   * Stable reference — safe to call during render (does not trigger re-renders).
   */
  const getPrimaryResume = useCallback((): StoredResume | null => {
    const resumes = (profile as unknown as { resumes?: StoredResume[] })?.resumes;
    if (!resumes || resumes.length === 0) return null;
    return resumes[0];
  }, [profile]);

  return {
    profile,
    loading,
    isLoaded: !loading,
    error,
    updateProfile,
    addResume,
    deleteResume,
    refresh: fetchProfile,
    getPrimaryResume,
  };
}
