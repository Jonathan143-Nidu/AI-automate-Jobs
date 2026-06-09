import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Briefcase, Mail, Phone, Linkedin, FileText, Upload, Trash2, CheckCircle, GraduationCap, ShieldCheck, CalendarClock, Video, MapPin } from 'lucide-react';
import { useProfile, UserProfile } from '../../hooks/useProfile';
import { useSession } from 'next-auth/react';
import { useProfileMemory } from '../providers/ProfileMemoryProvider';
import { Loader2, Zap, ChevronDown } from 'lucide-react';
import { parseDocxFile, parseFileViaAPI } from '../../lib/utils/file-utils';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Compact Field Helper - Creates a perfectly aligned horizontal label/input row
 */
const CompactField: React.FC<{
    label: string,
    icon: React.ElementType,
    children: React.ReactNode,
    className?: string
}> = ({ label, icon: Icon, children, className = "" }) => (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-1.5 border-b border-gray-50 last:border-0 ${className}`}>
        <div className="sm:w-28 flex items-center gap-2 shrink-0">
            <Icon className="w-3.5 h-3.5 text-indigo-700" />
            <label className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.12em] whitespace-nowrap leading-none">{label}</label>
        </div>
        <div className="flex-1 relative flex items-center min-h-[26px]">
            {children}
        </div>
    </div>
);

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
    const { data: session } = useSession();
    const { profile, updateProfile, addResume, deleteResume } = useProfile();
    const [formData, setFormData] = useState<UserProfile>(profile);
    const [saved, setSaved] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);
    const { skills, suggestedRoles, setMemory } = useProfileMemory();
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setFormData({
            ...profile,
            email: session?.user?.email || profile.email
        });
    }, [profile, isOpen, session]);

    const handleInputChange = (field: keyof UserProfile, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        updateProfile(formData);
        setIsInsightsExpanded(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const performAnalysis = async (text: string) => {
        if (!text) return;
        setIsAnalyzing(true);
        setIsInsightsExpanded(true);
        try {
            const aiRes = await fetch('/api/analyze-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText: text })
            });
            const aiData = await aiRes.json();
            console.log('[AI Profile Analysis] Full Result:', aiData);
            
            if (aiData.skills && aiData.suggestedRoles) {
                setMemory(aiData.skills, aiData.suggestedRoles);
            }

            if (aiData.personalInfo) {
                console.log('[AI Profile Analysis] Updating Personal Info:', aiData.personalInfo);
                setFormData(prev => {
                    const updated = {
                        ...prev,
                        firstName: aiData.personalInfo.firstName || prev.firstName,
                        lastName: aiData.personalInfo.lastName || prev.lastName,
                        role: aiData.personalInfo.role || prev.role,
                        location: aiData.personalInfo.location || prev.location,
                        phone: aiData.personalInfo.phone || prev.phone,
                        linkedinURL: aiData.personalInfo.linkedinURL || prev.linkedinURL,
                        bachelorDegree: aiData.personalInfo.bachelorDegree || prev.bachelorDegree,
                        masterDegree: aiData.personalInfo.masterDegree || prev.masterDegree,
                    };
                    console.log('[AI Profile Analysis] New Form Data:', updated);
                    return updated;
                });
            } else {
                console.warn('[AI Profile Analysis] No personalInfo found in AI response');
            }
        } catch (error) {
            console.error("Analysis pipeline failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const analyzeExistingResume = async () => {
        const resume = profile.resumes[0];
        if (!resume) return;

        setIsAnalyzing(true);
        setIsInsightsExpanded(true);
        try {
            // Convert base64 to Blob
            const response = await fetch(resume.data);
            const blob = await response.blob();
            const file = new File([blob], resume.name, { type: resume.type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            
            let text = '';
            if (resume.type === 'docx') {
                text = await parseDocxFile(file);
            } else {
                const apiResult = await parseFileViaAPI(file);
                text = apiResult.text;
            }

            if (text) {
                await performAnalysis(text);
            }
        } catch (error) {
            console.error("Re-analysis failed", error);
            setIsAnalyzing(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const data = event.target?.result as string;
            const extension = file.name.split('.').pop()?.toLowerCase() as any;
            const type = (['docx', 'pdf', 'txt'].includes(extension) ? extension : 'docx') as 'docx' | 'pdf' | 'txt';
            addResume(file.name, data, type);
            
            // Trigger AI Profile Generation
            try {
                let text = '';
                if (type === 'docx') {
                    text = await parseDocxFile(file);
                } else {
                    const apiResult = await parseFileViaAPI(file);
                    text = apiResult.text;
                }
                
                if (text) {
                    await performAnalysis(text);
                }
            } catch (error) {
                console.error("Analysis failed during upload", error);
            }
        };
        reader.readAsDataURL(file);
    };

    if (!isOpen) return null;

    const resume = profile.resumes[0];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4 font-['Kalinga',_sans-serif]"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.98, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.98, opacity: 0, y: 10 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
                >
                    {/* Centered Header */}
                    <div className="relative flex flex-col items-center justify-center px-5 py-4 bg-white border-b border-gray-100 shrink-0 text-center">
                        <div className="flex flex-col items-center gap-2">
                            {session?.user?.image && (
                                <div className="relative group mb-1">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-full blur-[2px] opacity-40 group-hover:opacity-100 transition duration-500"></div>
                                    <img src={session.user.image} alt="Profile" className="relative w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-lg font-black text-slate-900 leading-tight">
                                    {saved ? <span className="text-emerald-600 flex items-center justify-center gap-1"><CheckCircle className="w-5 h-5" /> Changes Saved</span> : (session?.user?.name || "User Profile")}
                                </h2>
                                <div className="flex items-center justify-center gap-2 mt-1 underline-offset-4">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest whitespace-nowrap">Upload resume</p>
                                    <div className="flex items-center gap-2 pl-3 border-l-2 border-slate-100">
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${resume ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {resume ? resume.name : 'No Resume'}
                                        </span>
                                        <div className="flex items-center gap-1.5 ml-1">
                                            {resume && (
                                                <button onClick={() => deleteResume()} className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all rounded-md" title="Delete Resume">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => fileInputRef.current?.click()} 
                                                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                                            >
                                                <Upload className="w-3 h-3" />
                                                {resume ? 'Update' : 'Upload'}
                                            </button>
                                            <input type="file" ref={fileInputRef} className="hidden" accept=".docx" onChange={handleFileChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button onClick={onClose} className="absolute right-4 top-4 p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-4 overflow-y-auto custom-scrollbar bg-slate-50/30 flex-1">
                        <div className="space-y-4">
                            
                            {/* SECTION: AI PROFILE ANALYSIS MEMORY */}
                            {(isAnalyzing || suggestedRoles.length > 0) && (
                                <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden transition-all duration-300">
                                    <button 
                                        onClick={() => {
                                            if (suggestedRoles.length === 0 && !isAnalyzing) {
                                                analyzeExistingResume();
                                            } else {
                                                setIsInsightsExpanded(!isInsightsExpanded);
                                            }
                                        }}
                                        className="w-full flex items-center justify-between p-4 hover:bg-indigo-50/80 transition-colors"
                                    >
                                        <h3 className="text-[10px] m-0 font-black text-indigo-700 uppercase tracking-[0.15em] flex items-center gap-2">
                                            <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="text-left w-full flex items-center gap-2">
                                                AI Profile Analysis
                                                {!isInsightsExpanded && <span className="normal-case opacity-70 font-bold tracking-normal text-[9px]">(Click Here)</span>}
                                            </span>
                                        </h3>
                                        <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform duration-300 ${isInsightsExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    <AnimatePresence>
                                    {isInsightsExpanded && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-4 pb-4 overflow-hidden"
                                        >
                                            <div className="pt-2 border-t border-indigo-100/50">
                                                {isAnalyzing ? (
                                                    <div className="flex flex-col items-center justify-center py-6 gap-3 text-indigo-600">
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                        <p className="text-xs font-bold uppercase tracking-widest">Generating Smart Profile...</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4 pt-1">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Optimal Search Roles</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {suggestedRoles.map((role, idx) => (
                                                                    <span key={idx} className="bg-white text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                                                                        {role}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Extracted Tech Stack & Skills</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {skills.map((skill, idx) => (
                                                                    <span key={idx} className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-medium">
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* SECTION: IDENTITY */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-indigo-600 rounded-full"></span>
                                    Identity Details
                                </h3>
                                <div className="space-y-0.5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                        <CompactField label="First Name" icon={User}>
                                            <input 
                                                value={formData.firstName}
                                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                className="w-full py-1 text-sm font-bold text-slate-900 bg-transparent border-0 border-b border-slate-200 focus:border-indigo-500 focus:ring-0 transition-all outline-none" 
                                            />
                                        </CompactField>
                                        <CompactField label="Last Name" icon={User}>
                                            <input 
                                                value={formData.lastName}
                                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                                className="w-full py-1 text-sm font-bold text-slate-900 bg-transparent border-0 border-b border-slate-200 focus:border-indigo-500 focus:ring-0 transition-all outline-none" 
                                            />
                                        </CompactField>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                        <CompactField label="Role Title" icon={Briefcase}>
                                            <input 
                                                value={formData.role}
                                                onChange={(e) => handleInputChange('role', e.target.value)}
                                                className="w-full py-1 text-sm font-bold text-slate-900 bg-transparent border-0 border-b border-slate-200 focus:border-indigo-500 focus:ring-0 transition-all outline-none" 
                                            />
                                        </CompactField>
                                        <CompactField label="Location" icon={MapPin}>
                                            <input 
                                                value={formData.location}
                                                onChange={(e) => handleInputChange('location', e.target.value)}
                                                className="w-full py-1 text-sm font-bold text-slate-900 bg-transparent border-0 border-b border-slate-200 focus:border-indigo-500 focus:ring-0 transition-all outline-none" 
                                            />
                                        </CompactField>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: CONNECTIVITY */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-indigo-600 rounded-full"></span>
                                    Connectivity
                                </h3>
                                <div className="space-y-0.5">
                                    <CompactField label="Work Email" icon={Mail}>
                                        <div className="flex items-center justify-between w-full">
                                            <span className="py-1 text-sm font-bold text-slate-500">{formData.email}</span>
                                            <span title="Google Verified Identity">
                                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                                            </span>
                                        </div>
                                    </CompactField>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                        <CompactField label="Mobile" icon={Phone}>
                                            <input 
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                className="w-full py-1 text-sm font-bold text-slate-900 bg-transparent border-0 border-b border-slate-200 focus:border-indigo-500 focus:ring-0 transition-all outline-none" 
                                            />
                                        </CompactField>
                                        <CompactField label="LinkedIn" icon={Linkedin}>
                                            <input 
                                                value={formData.linkedinURL}
                                                onChange={(e) => handleInputChange('linkedinURL', e.target.value)}
                                                className="w-full py-1 text-sm font-bold text-slate-900 bg-transparent border-0 border-b border-slate-200 focus:border-indigo-500 focus:ring-0 transition-all outline-none" 
                                            />
                                        </CompactField>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: ACADEMIC & LEGAL */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Academic */}
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                    <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                                        <span className="w-1 h-3 bg-indigo-600 rounded-full"></span>
                                        Education
                                    </h3>
                                    <div className="space-y-0.5">
                                        <CompactField label="Bachelor" icon={GraduationCap}>
                                            <input 
                                                value={formData.bachelorDegree}
                                                onChange={(e) => handleInputChange('bachelorDegree', e.target.value)}
                                                className="w-full py-1 text-sm font-bold text-slate-900 bg-transparent border-0 border-b border-slate-200 focus:border-indigo-500 focus:ring-0 transition-all outline-none" 
                                            />
                                        </CompactField>
                                        <CompactField label="Master" icon={GraduationCap}>
                                            <input 
                                                value={formData.masterDegree}
                                                onChange={(e) => handleInputChange('masterDegree', e.target.value)}
                                                className="w-full py-1 text-sm font-bold text-slate-900 bg-transparent border-0 border-b border-slate-200 focus:border-indigo-500 focus:ring-0 transition-all outline-none" 
                                            />
                                        </CompactField>
                                    </div>
                                </div>
                                {/* Legal */}
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                    <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                                        <span className="w-1 h-3 bg-indigo-600 rounded-full"></span>
                                        Legal Status
                                    </h3>
                                    <div className="space-y-0.5">
                                        <CompactField label="Visa Type" icon={ShieldCheck}>
                                            <input 
                                                value={formData.visaType}
                                                onChange={(e) => handleInputChange('visaType', e.target.value)}
                                                className="w-full py-1 text-sm font-bold text-slate-900 bg-transparent border-0 border-b border-slate-200 focus:border-indigo-500 focus:ring-0 transition-all outline-none" 
                                            />
                                        </CompactField>
                                        <CompactField label="Visa Exp" icon={CalendarClock}>
                                            <input 
                                                type="date"
                                                value={formData.visaExpiry}
                                                onChange={(e) => handleInputChange('visaExpiry', e.target.value)}
                                                className="w-full py-0.5 text-sm font-bold text-slate-900 bg-transparent border-0 outline-none" 
                                            />
                                        </CompactField>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: INTERVIEW PREFERENCES */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-indigo-600 rounded-full"></span>
                                    Preferences
                                </h3>
                                <div className="space-y-0.5">
                                    <CompactField label="Availability" icon={CalendarClock}>
                                        <input 
                                            value={formData.interviewSlots}
                                            onChange={(e) => handleInputChange('interviewSlots', e.target.value)}
                                            className="w-full py-1 text-sm font-bold text-slate-900 bg-transparent border-0 border-b border-slate-200 focus:border-indigo-500 focus:ring-0 transition-all outline-none" 
                                        />
                                    </CompactField>
                                    <CompactField label="Preferred Mode" icon={Video}>
                                        <select 
                                            value={formData.interviewMode}
                                            onChange={(e) => handleInputChange('interviewMode', e.target.value)}
                                            className="w-full py-1 text-sm font-semibold text-gray-800 bg-transparent border-0 outline-none appearance-none cursor-pointer" 
                                        >
                                            <option value="">Select Mode</option>
                                            <option value="Video/Virtual">Video/Virtual</option>
                                            <option value="Onsite/F2F/In person">Onsite/F2F/In person</option>
                                            <option value="Video and In person">Video and In person</option>
                                        </select>
                                    </CompactField>
                                </div>
                            </div>

                            </div>
                        </div>

                    {/* Footer - Mini */}
                    <div className="px-5 py-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                        <button 
                            onClick={onClose}
                            className="px-4 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                        >
                            Discard
                        </button>
                        <button 
                            onClick={handleSave}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-lg active:scale-[0.98] ${
                                saved ? 'bg-emerald-500 shadow-emerald-100' : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'
                            }`}
                        >
                            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            {saved ? 'Changes Saved' : 'Save Changes'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
