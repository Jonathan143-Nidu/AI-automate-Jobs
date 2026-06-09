import { useState, useEffect, useCallback } from 'react';

const PROFILE_KEY = 'resume-maker-profile-v1';

export interface UserResume {
    name: string;
    data: string; // base64
    type: 'docx' | 'pdf' | 'txt';
}

export interface UserProfile {
    firstName: string;
    lastName: string;
    role: string;
    location: string;
    email: string;
    phone: string;
    linkedinURL: string;
    bachelorDegree: string;
    masterDegree: string;
    visaType: string;
    visaExpiry: string;
    passportNumber: string;
    interviewSlots: string;
    interviewMode: string;
    resumes: UserResume[];
}

const DEFAULT_PROFILE: UserProfile = {
    firstName: '',
    lastName: '',
    role: '',
    location: '',
    email: '',
    phone: '',
    linkedinURL: '',
    bachelorDegree: '',
    masterDegree: '',
    visaType: '',
    visaExpiry: '',
    passportNumber: '',
    interviewSlots: '',
    interviewMode: '',
    resumes: []
};

// Global State Singleton to ensure all hooks stay in sync
let globalProfile: UserProfile = DEFAULT_PROFILE;
let listeners: Array<(profile: UserProfile) => void> = [];

const notifyListeners = () => {
    listeners.forEach(listener => listener(globalProfile));
};

export const useProfile = () => {
    const [profile, setProfile] = useState<UserProfile>(globalProfile);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Init from localStorage only if global is still default
        if (globalProfile === DEFAULT_PROFILE) {
            const saved = localStorage.getItem(PROFILE_KEY);
            if (saved) {
                try {
                    globalProfile = JSON.parse(saved);
                    setProfile(globalProfile);
                } catch (e) {
                    console.error('Failed to parse profile', e);
                }
            }
        } else {
            setProfile(globalProfile);
        }
        
        setIsLoaded(true);

        const handleChange = (newProfile: UserProfile) => {
            setProfile(newProfile);
        };

        listeners.push(handleChange);
        return () => {
            listeners = listeners.filter(l => l !== handleChange);
        };
    }, []);

    const saveProfile = useCallback((newProfile: UserProfile) => {
        globalProfile = newProfile;
        localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
        notifyListeners();
    }, []);

    const updateProfile = useCallback((updates: Partial<UserProfile>) => {
        const newProfile = { ...globalProfile, ...updates };
        saveProfile(newProfile);
    }, [saveProfile]);

    const addResume = useCallback((name: string, data: string, type: 'docx' | 'pdf' | 'txt') => {
        const newResume: UserResume = { name, data, type };
        updateProfile({ resumes: [newResume] });
    }, [updateProfile]);

    const deleteResume = useCallback(() => {
        updateProfile({ resumes: [] });
    }, [updateProfile]);

    const getPrimaryResume = useCallback(() => {
        return globalProfile.resumes[0];
    }, []);

    return {
        profile,
        updateProfile,
        addResume,
        deleteResume,
        getPrimaryResume,
        isLoaded,
        initials: (profile.firstName && profile.lastName) 
            ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() 
            : 'U'
    };
};
