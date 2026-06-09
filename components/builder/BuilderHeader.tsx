import React, { useState, useRef, useEffect } from 'react';
import { FileText, LogOut, Settings, User, Mail, ChevronDown, Briefcase } from 'lucide-react';
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

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({ signOut, openSettings, resetSession, openProfile }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: session } = useSession();
    const { initials, profile } = useProfile();
    const menuRef = useRef<HTMLDivElement>(null);

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

    // Identity Priority: Local Profile -> Google Session -> Default
    const userDisplayName = (profile.firstName && profile.lastName) 
        ? `${profile.firstName} ${profile.lastName}`
        : (session?.user?.name || 'Candidate');

    const userEmail = session?.user?.email || '';
    
    // Use Google image if available, otherwise use initials
    const userImage = session?.user?.image;
    const displayInitials = (profile.firstName && profile.lastName)
        ? `${profile.firstName[0]}${profile.lastName[0]}`
        : (session?.user?.name ? session.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U');

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 md:px-6 shrink-0 z-50 shadow-sm relative">
            <div className="flex items-center gap-1 md:gap-2">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                <span className="text-lg md:text-xl font-bold tracking-tight text-gray-900 leading-none">
                    <span className="hidden sm:inline">Innov</span><span className="text-indigo-600 sm:inline">-AI</span>
                </span>
            </div>

            {/* CENTER NAVIGATION */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2">
                <Link
                    href="/jobs"
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
                                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden"
                            >
                                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Signed in as</p>
                                    <p className="text-sm font-bold text-gray-900 truncate">{userDisplayName}</p>
                                    {userEmail && <p className="text-[10px] text-gray-500 truncate mt-0.5">{userEmail}</p>}
                                </div>

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
                                        signOut({ callbackUrl: '/login' });
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
