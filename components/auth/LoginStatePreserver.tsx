'use client';

import { useEffect } from 'react';

export default function LoginStatePreserver() {
    useEffect(() => {
        // Capture hash from URL (e.g. #resumeLink=... passed by extension)
        if (typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash.substring(1); // remove #
            if (hash.length > 10) { // Simple check to avoid empty/junk hashes
                console.log("Preserving auth state hash:", hash);
                localStorage.setItem('pending_auth_hash', hash);
            }
        }
    }, []);

    return null; // Render nothing
}
