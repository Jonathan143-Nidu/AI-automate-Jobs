import React, { useState, useRef, useEffect } from 'react';
import { FileText, LogOut, Settings, User, Mail, ChevronDown, Briefcase, CalendarClock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useProfile } from '../../hooks/useProfile';
import Link from 'next/link';

interface BuilderHeaderProps {
    resetSession: () => void;
    signOut: (options?: { callbackUrl?: string }) => void;
    openSettings?: () => void;
    openProfile?: () => void;
}

interface Subscription {
    status: 'active' | 'inactive';
    accessStart: string | null;
    accessEnd: string | null;
    role: string;
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function getDaysRemaining(accessEnd: string | null): number | null {
    if (!accessEnd) return null;
    const end = new Date(accessEnd);
    end.setHours(23, 59, 59, 999);
    const diff = end.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({ signOut, openSettings, resetSession, openProfile }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: session } = useSession();
    const { profile } = useProfile();
    const menuRef = useRef<HTMLDivElement>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch subscription info
    useEffect(() => {
        fetch('/labs/prismautomation/api/user/subscription')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.subscription) setSubscription(data.subscription);
            })
            .catch(() => {});
    }, []);

    // Identity Priority: Local Profile -> Google Session -> Default
    const userDisplayName = (profile?.firstName && profile?.lastName) 
        ? `${profile?.firstName} ${profile?.lastName}`
        : (session?.user?.name || 'Candidate');

    const userEmail = session?.user?.email || '';
    
    // Use Google image if available, otherwise use initials
    const userImage = session?.user?.image;
    const displayInitials = (profile?.firstName && profile?.lastName)
        ? `${profile?.firstName[0]}${profile?.lastName[0]}`
        : (session?.user?.name ? session.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U');

    const daysRemaining = subscription ? getDaysRemaining(subscription.accessEnd) : null;
    const isUnlimited = subscription && !subscription.accessEnd;
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
    const isExpired = daysRemaining !== null && daysRemaining <= 0;

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 md:px-6 shrink-0 z-50 shadow-sm relative">
            <div className="flex items-center gap-2">
                <svg width="28" height="28" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
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
                <span className="text-lg md:text-xl font-black tracking-tight leading-none bg-gradient-to-r from-[#7C3AED] via-[#2563EB] via-[#0891B2] to-[#059669] bg-clip-text text-transparent">
                    Prism Automation
                </span>
            </div>

            {/* CENTER NAVIGATION */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2">
                <Link
                    href="/labs/prismautomation/jobs"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 group"
                >
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    Job Portals
                </Link>
            </div>

            <div className="flex items-center gap-1.5 md:gap-3" ref={menuRef}>
                <div className="relative">
                    {/* AVATAR TRIGGER */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group"
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white overflow-hidden shadow-md shadow-indigo-200 ring-2 ring-white transition-transform group-active:scale-95">
                            {userImage ? (
                                <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-sm">{displayInitials}</span>
                            )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* DROPDOWN MENU */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 5, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden"
                            >
                                {/* User Identity */}
                                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Signed in as</p>
                                    <p className="text-sm font-bold text-gray-900 truncate">{userDisplayName}</p>
                                    {userEmail && <p className="text-[10px] text-gray-500 truncate mt-0.5">{userEmail}</p>}
                                </div>

                                {/* Subscription Badge */}
                                {subscription && (
                                    <div className={`mx-3 mb-2 px-3 py-2.5 rounded-xl border ${
                                        isExpired
                                            ? 'bg-red-50 border-red-200'
                                            : isExpiringSoon
                                            ? 'bg-amber-50 border-amber-200'
                                            : 'bg-indigo-50 border-indigo-100'
                                    }`}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <ShieldCheck className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : 'text-indigo-600'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-indigo-700'}`}>
                                                    Subscription
                                                </span>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                isExpired
                                                    ? 'bg-red-100 text-red-700'
                                                    : subscription.status === 'active'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {isExpired ? 'Expired' : subscription.status === 'active' ? '● Active' : '● Inactive'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Start</p>
                                                <p className="text-[11px] font-bold text-gray-700">{formatDate(subscription.accessStart)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">End</p>
                                                <p className={`text-[11px] font-bold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-gray-700'}`}>
                                                    {isUnlimited ? '∞ Unlimited' : formatDate(subscription.accessEnd)}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Days remaining pill */}
                                        {!isUnlimited && daysRemaining !== null && (
                                            <div className={`mt-1.5 text-center text-[9px] font-black uppercase tracking-wider py-0.5 rounded-lg ${
                                                isExpired
                                                    ? 'bg-red-100 text-red-700'
                                                    : isExpiringSoon
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-indigo-100 text-indigo-700'
                                            }`}>
                                                {isExpired ? 'Access expired' : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`}
                                            </div>
                                        )}
                                        {isUnlimited && (
                                            <div className="mt-1.5 text-center text-[9px] font-black uppercase tracking-wider py-0.5 rounded-lg bg-indigo-100 text-indigo-700">
                                                No expiry date
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={() => { openProfile?.(); setIsMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    Edit Profile
                                </button>

                                <button
                                    onClick={() => { openSettings?.(); setIsMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </button>

                                <button
                                    onClick={() => { openSettings?.(); setIsMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                >
                                    <Mail className="w-4 h-4" />
                                    Your Email Signature
                                </button>

                                <div className="h-px bg-gray-100 my-1 mx-2"></div>

                                <button
                                    onClick={() => {
                                        if (resetSession) resetSession();
                                        signOut({ callbackUrl: '/labs/prismautomation/login?signout=1' });
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Signout
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};
