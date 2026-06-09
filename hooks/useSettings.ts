import { useState, useEffect } from 'react';

const STORAGE_KEY = 'resume-maker-signature';

export const useSettings = () => {
    const [signature, setSignature] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(STORAGE_KEY) || '';
        }
        return '';
    });
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        // Defer to next tick to avoid cascading render warning in some strict linters
        const timer = setTimeout(() => setIsLoaded(true), 0);
        return () => clearTimeout(timer);
    }, []);

    const saveSignature = (newSignature: string) => {
        setSignature(newSignature);
        localStorage.setItem(STORAGE_KEY, newSignature);
    };

    return {
        signature,
        saveSignature,
        isLoaded
    };
};
