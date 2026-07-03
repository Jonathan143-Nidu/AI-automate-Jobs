import { signIn } from "@/auth"
import LoginStatePreserver from "@/components/auth/LoginStatePreserver"

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; signout?: string }> }) {
    return (
        <LoginPageClient searchParams={searchParams} />
    )
}

async function LoginPageClient({ searchParams }: { searchParams: Promise<{ error?: string; signout?: string }> }) {
    const params = await searchParams;
    const isAccessDenied = params?.error === 'AccessDenied';

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-slate-50/50 p-4 select-none">
            {/* Top spectrum line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#7C3AED] via-[#2563EB] via-[#0891B2] to-[#059669] z-50" />
            
            <LoginStatePreserver />
            
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient Orbs */}
                <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#7C3AED]/10 via-[#2563EB]/5 to-transparent blur-3xl" />
                <div className="absolute top-1/4 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-[#0891B2]/10 via-[#059669]/5 to-transparent blur-3xl" />
                
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:60px_60px] opacity-40" />
            </div>

            {/* Main Centered Content */}
            <div className="relative z-10 w-full max-w-[420px] mx-auto py-8">
                <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl p-8 sm:p-10 text-center flex flex-col items-center">
                    {/* Logo Section */}
                    <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
                        <svg width="44" height="44" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="nlg" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#A78BFA" />
                                    <stop offset="100%" stopColor="#38BDF8" />
                                </linearGradient>
                            </defs>
                            <line x1="2" y1="18" x2="10" y2="18" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                            <polygon points="10,4 10,32 22,18" fill="url(#nlg)" opacity="0.85" />
                            <polygon points="10,4 22,18 16,4" fill="#EDE9FE" opacity="0.6" />
                            <polygon points="10,4 10,32 22,18" fill="none" stroke="#A78BFA" strokeWidth="0.8" />
                            <line x1="22" y1="18" x2="34" y2="8" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
                            <line x1="22" y1="18" x2="34" y2="13" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
                            <line x1="22" y1="18" x2="34" y2="18" stroke="#0891B2" strokeWidth="1.8" strokeLinecap="round" />
                            <line x1="22" y1="18" x2="34" y2="23" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
                            <line x1="22" y1="18" x2="34" y2="28" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Title Section */}
                    <div className="space-y-1 mb-6">
                        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#7C3AED] via-[#2563EB] via-[#0891B2] to-[#059669] bg-clip-text text-transparent">
                            Prism Automation
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Sign in with your account
                        </p>
                    </div>

                    {/* Access Denied Banner */}
                    {isAccessDenied && (
                        <div className="w-full mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-left">
                            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            <div>
                                <p className="text-sm font-bold text-red-700">Access Restricted</p>
                                <p className="text-xs text-red-500 mt-0.5 leading-relaxed">
                                    Your account has not been approved. Contact the admin to request access.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Google Button Wrapper */}
                    <form
                        action={async () => {
                            "use server"
                            await signIn("google", { redirectTo: "/labs/prismautomation" })
                        }}
                        className="w-full"
                    >
                        <button
                            type="submit"
                            className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-bold shadow-sm transition hover:border-slate-300 hover:shadow active:scale-[0.98] cursor-pointer"
                        >
                            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Continue with Google</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <footer className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-[11px] text-slate-400 font-medium">
                    © {new Date().getFullYear()} Prism Automation. All rights reserved.
                </p>
            </footer>
        </div>
    )
}
