
'use client';

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

function SessionGuard({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    useEffect(() => {
        if ((session as { error?: string })?.error === "RefreshAccessTokenError") {
            console.error("Session Refresh Failed. Force signing out.");
            signOut({ callbackUrl: "/labs/prismautomation/login?signout=1" });
        }
    }, [session]);

    return <>{children}</>;
}

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider refetchInterval={300} basePath="/labs/prismautomation/api/auth">
            <SessionGuard>{children}</SessionGuard>
        </SessionProvider>
    );
}
