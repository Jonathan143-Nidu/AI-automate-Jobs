import type { Metadata } from "next";
import "./globals.css";

// Standard system font stack to avoid Turbopack font resolution bugs in Next.js 16
const fontSans = "Inter, system-ui, -apple-system, sans-serif";
const fontMono = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

export const metadata: Metadata = {
    title: "Innov-AI | Intelligent Resume Optimization",
    description: "Optimize your resume for any job description using AI. Built for Innovcentric.",
};

import AuthProvider from "@/components/providers/AuthProvider";
import { ProfileMemoryProvider } from "@/components/providers/ProfileMemoryProvider";
export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className="antialiased"
                style={{ fontFamily: fontSans }}
                suppressHydrationWarning
            >
                <AuthProvider>
                    <ProfileMemoryProvider>
                        {children}
                    </ProfileMemoryProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
