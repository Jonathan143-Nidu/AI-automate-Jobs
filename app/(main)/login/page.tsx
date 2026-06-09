import { signIn } from "@/auth"
import Image from "next/image"
import logo from "../../assets/innovcentric-logo-transparent.png"

import LoginStatePreserver from "@/components/auth/LoginStatePreserver"

export default function LoginPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-4">
            <LoginStatePreserver />
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Gradient Orbs */}
                <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/30 via-chart-2/20 to-transparent blur-3xl animate-float" />
                <div className="absolute top-1/4 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-chart-1/25 via-chart-2/15 to-transparent blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute -bottom-40 right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-t from-accent/40 via-chart-2/20 to-transparent blur-3xl animate-pulse-glow" />

                {/* Rotating Ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-primary/10 animate-rotate-slow" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-chart-2/10 animate-rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute h-2 w-2 rounded-full bg-primary/40 animate-float"
                        style={{
                            left: `${15 + i * 15}%`,
                            top: `${20 + (i % 3) * 25}%`,
                            animationDelay: `${i * 0.8}s`,
                            animationDuration: `${5 + i}s`,
                        }}
                    />
                ))}
            </div>

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-lg opacity-0 animate-fade-in-up">
                <div className="glass-strong rounded-3xl card-glow p-8 sm:p-12">
                    {/* Logo Section */}
                    <div className="text-center mb-10 opacity-0 animate-scale-in stagger-1">
                        <div className="relative inline-block">
                            <Image
                                src={logo}
                                alt="Innovcentric - Where Innovation Meets Opportunity"
                                width={160}
                                height={160}
                                className="h-32 md:h-40 w-auto mx-auto relative z-10 drop-shadow-lg"
                                priority
                            />
                        </div>
                    </div>

                    {/* Title Section */}
                    <div className="text-center space-y-3 mb-10 opacity-0 animate-fade-in stagger-2">
                        <h1 className="text-3xl sm:text-4xl font-bold text-black">
                            Innov-AI
                        </h1>
                        <p className="text-gray-500 text-base">
                            Sign in with your account
                        </p>
                    </div>

                    {/* Login Options */}
                    <div className="space-y-6 opacity-0 animate-fade-in stagger-3">
                        {/* Google Button */}
                        <form
                            action={async () => {
                                "use server"
                                await signIn("google", { redirectTo: "/" })
                            }}
                            className="w-full"
                        >
                            <button
                                type="submit"
                                className="w-full h-14 flex items-center justify-center gap-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl text-base font-bold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                            >
                                <svg className="h-6 w-6" viewBox="0 0 24 24">
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
            </div>

            {/* Footer */}
            <footer className="absolute bottom-6 left-0 right-0 text-center opacity-0 animate-fade-in stagger-5">
                <p className="text-sm text-gray-500">
                    © {new Date().getFullYear()} Innovcentric. All rights reserved.
                </p>
            </footer>
        </div>
    )
}
