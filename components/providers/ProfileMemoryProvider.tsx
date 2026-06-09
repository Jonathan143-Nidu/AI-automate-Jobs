"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ProfileMemory {
  skills: string[];
  suggestedRoles: string[];
  setMemory: (skills: string[], suggestedRoles: string[]) => void;
  clearMemory: () => void;
}

const ProfileMemoryContext = createContext<ProfileMemory | undefined>(undefined);

export function ProfileMemoryProvider({ children }: { children: React.ReactNode }) {
  const [skills, setSkills] = useState<string[]>([]);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);

  useEffect(() => {
    // Load from local storage on mount
    try {
      const stored = localStorage.getItem('profile_memory');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.skills) setSkills(parsed.skills);
        if (parsed.suggestedRoles) setSuggestedRoles(parsed.suggestedRoles);
      }
    } catch (e) {
      console.error("Failed to load profile memory", e);
    }
  }, []);

  const setMemory = (newSkills: string[], newRoles: string[]) => {
    setSkills(newSkills);
    setSuggestedRoles(newRoles);
    try {
      localStorage.setItem('profile_memory', JSON.stringify({ skills: newSkills, suggestedRoles: newRoles }));
    } catch (e) {
      console.error("Failed to save profile memory", e);
    }
  };

  const clearMemory = () => {
    setSkills([]);
    setSuggestedRoles([]);
    localStorage.removeItem('profile_memory');
  };

  return (
    <ProfileMemoryContext.Provider value={{ skills, suggestedRoles, setMemory, clearMemory }}>
      {children}
    </ProfileMemoryContext.Provider>
  );
}

export function useProfileMemory() {
  const context = useContext(ProfileMemoryContext);
  if (context === undefined) {
    throw new Error('useProfileMemory must be used within a ProfileMemoryProvider');
  }
  return context;
}
