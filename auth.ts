import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { isEmailWhitelisted } from "@/lib/whitelist-check"

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
                    scope: "openid email profile https://www.googleapis.com/auth/drive.appdata",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        })
    ],
    callbacks: {
        async signIn({ profile, account }) {
            const email = profile?.email;
            if (!email) return false;

            // Super admins always allowed
            const SUPER_ADMINS = ['admin@prismopss.com', 'thotajonathan.249@gmail.com'];
            if (SUPER_ADMINS.some(a => a.toLowerCase() === email.toLowerCase())) return true;

            // Check whitelist using Edge-safe fetch-only checker
            try {
                const userToken = account?.access_token ?? '';
                const allowed = await isEmailWhitelisted(email, userToken);
                if (!allowed) {
                    console.warn(`[Auth] Blocked login attempt from non-whitelisted email: ${email}`);
                    return '/labs/prismautomation/login?error=AccessDenied';
                }
                return true;
            } catch (err) {
                // If whitelist check fails, allow login so admin isn't locked out
                console.error('[Auth] Whitelist check failed, allowing login as fail-safe:', err);
                return true;
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
        signIn: '/labs/prismautomation/login', // Custom login page
    },
    basePath: "/labs/prismautomation/api/auth",
})
