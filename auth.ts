import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { adminService } from "@/lib/services/admin-service"

interface ExtendedToken {
    accessToken?: string;
    expiresAt?: number;
    refreshToken?: string;
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    error?: string;
}

// Helper to refresh the token
async function refreshAccessToken(token: ExtendedToken): Promise<ExtendedToken> {
    try {
        const url =
            "https://oauth2.googleapis.com/token?" +
            new URLSearchParams({
                client_id: process.env.AUTH_GOOGLE_ID!,
                client_secret: process.env.AUTH_GOOGLE_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken!,
            })

        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
        })

        const refreshedTokens = await response.json()

        if (!response.ok) {
            throw refreshedTokens
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fallback to old refresh token
        }
    } catch (error) {
        console.error("RefreshAccessTokenError", error)
        return {
            ...token,
            error: "RefreshAccessTokenError",
        }
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            authorization: {
                params: {
                    scope: "openid email profile",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        })
    ],
    callbacks: {
        async signIn({ profile, account }) {
            const superAdmin = "hiring@innovcentric.com";
            const email = profile?.email;

            if (!email) return false;

            // 1. Always allow the Super Admin
            if (email.toLowerCase() === superAdmin.toLowerCase()) {
                return true;
            }

            // 2. Check whitelist for all other users
            try {
                // Check if the user is whitelisted in the Google Sheet
                return await adminService.isWhitelisted(email, account?.access_token || "");
            } catch (error) {
                console.error("Whitelist check failed during sign-in:", error);
                return false;
            }
        },
        async jwt({ token, account, user }) {
            // Initial sign in
            if (account && user) {
                return {
                    accessToken: account.access_token,
                    expiresAt: account.expires_at,
                    refreshToken: account.refresh_token,
                    user: {
                        name: user.name,
                        email: user.email,
                        image: user.image,
                    },
                }
            }

            const extendedToken = token as unknown as ExtendedToken;

            // Return previous token if the access token has not expired yet
            // Give a 5-minute buffer (300000ms) to ensure we fetch a new token well before expiry
            if (Date.now() < ((extendedToken.expiresAt as number) * 1000 - 300000)) {
                return token
            }

            // Access token has expired, try to update it
            return await refreshAccessToken(extendedToken) as any;
        },
        async session({ session, token }) {
            const extendedToken = token as unknown as ExtendedToken;
            // Send properties to the client
            const sessionAny = session as unknown as { accessToken?: string; expiresAt?: number; error?: string; user?: any };
            sessionAny.accessToken = extendedToken.accessToken;
            sessionAny.expiresAt = extendedToken.expiresAt;
            sessionAny.error = extendedToken.error;
            if (extendedToken.user) {
                sessionAny.user = extendedToken.user;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login', // Custom login page
    }
})
