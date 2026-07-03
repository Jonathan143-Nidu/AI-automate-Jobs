"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TerminalPanel } from './builder/TerminalPanel';
import { InputSection } from './builder/InputSection';
import { AnalysisPanel } from './builder/AnalysisPanel';
import { PreviewEditor } from './builder/PreviewEditor';
import { BuilderHeader } from './builder/BuilderHeader';
import { OptimizationControl } from './builder/OptimizationControl';
import { CoverLetterModal } from './builder/CoverLetterModal';
import { EmailModal } from './builder/EmailModal';
import { SettingsModal } from './builder/SettingsModal';
import { UserProfileModal } from './builder/UserProfileModal';
import { Activity, Edit } from 'lucide-react';
import { signOut } from 'next-auth/react';

// Utility imports
import { useBuilderState } from '../hooks/useBuilderState';
import { useFileOperations } from '../hooks/useFileOperations';
import { useAnalysisLogic } from '../hooks/useAnalysisLogic';
import { useIntegrationLogic } from '../hooks/useIntegrationLogic';
import { useAutoPilot } from '../hooks/useAutoPilot';
import { useProfile } from '../hooks/useProfile';

export default function ResumeBuilder() {
    // 1. Initialize State Master Hook
    const state = useBuilderState();
    const {
        step, setStep, file, resumeText, jd, setJd, isAnalyzing,
        analysisResult, isIntegrating, changes, setChanges,
        isProcessingFile, downloadUrl, isExtracting, initialScore,
        optimizedScore, gapReasons, showGaps, setShowGaps, logs,
        coverLetter, setCoverLetter, isGeneratingCoverLetter,
        mobileView, setMobileView, addLog,
        isNewCandidate, importedFileName, setIsEmailModalOpen,
        isSettingsOpen, setIsSettingsOpen,
        isProfileOpen, setIsProfileOpen, setIsAutoPilot, isAutoPilot
    } = state;

    // 2. Initialize Logic Action Hooks
    const fileOps = useFileOperations(state);
    const analysisLogic = useAnalysisLogic(state);
    const integrationLogic = useIntegrationLogic(state);
    const { profile, getPrimaryResume, isLoaded: isProfileLoaded, error: profileError, refresh: refreshProfile } = useProfile();

    // Compute once per render — used in effects below instead of calling getPrimaryResume() inside dep arrays
    const primaryResume = getPrimaryResume();

    const { handleFileChange: handleFileUpload, loadStoredResume } = fileOps;
    const { extractJd: handleManualClean, startAnalysis, cancelAnalysis } = analysisLogic;
    const { startIntegration, generateUpdatedResume, generateCoverLetter } = integrationLogic;

    // Auto-Pilot Hook coordinates between others
    useAutoPilot(state, {
        startAnalysis: analysisLogic.startAnalysis,
        startIntegration: integrationLogic.startIntegration,
        generateUpdatedResume: integrationLogic.generateUpdatedResume
    });

    // 3. Extension Deep-Link Handler (Incoming JD from Chrome Extension)
    React.useEffect(() => {
        if (!isProfileLoaded) return;
        
        const handleDeepLink = async () => {
            const hash = window.location.hash.substring(1);
            if (!hash) return;
            
            const params = new URLSearchParams(hash);
            const extJd = params.get('ext_jd');
            const extResumeId = params.get('ext_resume');
            
            if (extJd) {
                addLog('Incoming Job Description from Chrome Extension...', 'info');
                
                // 1. Set the JD
                setJd(decodeURIComponent(extJd));
                
                // 2. Load the only available resume
                const targetResume = primaryResume;
                if (targetResume) {
                    await loadStoredResume(targetResume);
                } else {
                    addLog(`Note: No resume found in profile. Please upload one in settings.`, 'info');
                }
                
                // 3. Clear hash to prevent re-triggering
                window.location.hash = '';
                
                // 4. Auto-trigger analysis after a small delay to ensure state is settled
                setTimeout(() => {
                    addLog('Auto-triggering AI Analysis...', 'success');
                    startAnalysis();
                }, 1000);
            }
        };

        handleDeepLink();
        
        // Also listen for hash changes while the app is already open
        window.addEventListener('hashchange', handleDeepLink);
        return () => window.removeEventListener('hashchange', handleDeepLink);
    }, [isProfileLoaded, primaryResume?.data, setJd, loadStoredResume, startAnalysis, addLog]);

    // 4. Auto-load Primary Resume from Profile (Standard Entry)
    const lastLoadedResumeRef = React.useRef<string | null>(null);

    // Enhanced resetSession to clear our reload guard and cancel active tasks
    const originalResetSession = state.resetSession;
    const resetSession = React.useCallback(() => {
        cancelAnalysis(); // Kill any active AI requests
        lastLoadedResumeRef.current = null; // Clean the reload memory
        originalResetSession();
    }, [originalResetSession, cancelAnalysis]);

    React.useEffect(() => {
        if (isProfileLoaded && step === 'input' && !window.location.hash.includes('ext_jd')) {
            const primary = primaryResume;
            
            if (primary && primary.data !== lastLoadedResumeRef.current) {
                lastLoadedResumeRef.current = primary.data;
                loadStoredResume(primary);
            } else if (!primary && lastLoadedResumeRef.current === null) {
                // Initial load with no resume - log once
                lastLoadedResumeRef.current = ""; // Use empty string to indicate we've logged 'empty'
                addLog('No Resume', 'error');
            } else if (!primary && lastLoadedResumeRef.current !== "" && lastLoadedResumeRef.current !== null) {
                // Resume was removed
                lastLoadedResumeRef.current = "";
                resetSession();
                addLog('No Resume', 'error');
            }
        }
    }, [isProfileLoaded, primaryResume?.data, step, primaryResume, loadStoredResume, resetSession, addLog]);

    if (profileError?.type === 'permission') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-8 font-sans">
                <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md shadow-xl text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-6">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Google Drive Permission Required</h3>
                    <p className="text-gray-600 mb-6">{profileError.message}</p>
                    <button
                        onClick={() => signOut({ callbackUrl: '/labs/prismautomation/login?signout=1' })}
                        className="w-full bg-red-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-700 transition shadow-md hover:shadow-lg cursor-pointer"
                    >
                        Sign Out & Re-authenticate
                    </button>
                </div>
            </div>
        );
    }

    if (profileError?.type === 'unknown') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-8 font-sans">
                <div className="bg-white border border-yellow-200 rounded-2xl p-8 max-w-md shadow-xl text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-6">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Profile</h3>
                    <p className="text-gray-600 mb-6">{profileError.message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-yellow-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-yellow-700 transition shadow-md hover:shadow-lg cursor-pointer"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-gray-900">
            {/* 1. TOP NAVIGATION BAR */}
            <BuilderHeader
                resetSession={resetSession}
                signOut={signOut}
                openSettings={() => setIsSettingsOpen(true)}
                openProfile={() => setIsProfileOpen(true)}
            />

            {/* 2. MAIN CONTENT AREA */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative mb-16 md:mb-0">


                {/* ----------------- LEFT PANEL: INPUTS ----------------- */}
                <motion.div
                    initial={{ x: -40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                    className={`shrink-0 flex flex-col gap-5 p-6 border-r border-gray-300 bg-white z-20 h-full overflow-y-auto w-full md:w-[320px] ${mobileView === 'input' ? 'flex' : 'hidden md:flex'}`}
                >
                    <InputSection
                        step={step}
                        file={file}
                        importedFileName={importedFileName}
                        jd={jd}
                        isExtracting={isExtracting}
                        isAnalyzing={isAnalyzing}
                        isNewCandidate={isNewCandidate}
                        resumeText={resumeText}

                        handleFileUpload={handleFileUpload}
                        setJd={setJd}
                        handleManualClean={handleManualClean}
                        startAnalysis={startAnalysis}
                        addLog={addLog}
                        resetSession={resetSession}
                        setIsAutoPilot={setIsAutoPilot}
                        isAutoPilot={isAutoPilot}
                    />

                    <OptimizationControl
                        step={step}
                        analysisResult={analysisResult}
                        initialScore={initialScore}
                        optimizedScore={optimizedScore}
                        isIntegrating={isIntegrating}
                        gapReasons={gapReasons}
                        showGaps={showGaps}
                        setShowGaps={setShowGaps}
                        startIntegration={startIntegration}
                        setStep={setStep}
                    />
                </motion.div>


                {/* ----------------- RIGHT PANEL: DUAL TERMINALS ----------------- */}
                <motion.div
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
                    className={`flex-1 p-0 md:p-2 flex-col relative h-full min-w-0 ${state.mobileView === 'preview' ? 'flex' : 'hidden md:flex'}`}
                >
                    {(step === 'review' || step === 'download') ? (
                        <PreviewEditor
                            step={step}
                            file={file}
                            resumeText={resumeText}
                            changes={changes}
                            setChanges={setChanges}
                            downloadUrl={downloadUrl}
                            isGeneratingCoverLetter={isGeneratingCoverLetter}
                            isProcessingFile={isProcessingFile}
                            setStep={setStep}
                            resetSession={resetSession}
                            generateCoverLetter={generateCoverLetter}
                            generateUpdatedResume={generateUpdatedResume}
                            addLog={addLog}
                            setIsEmailModalOpen={setIsEmailModalOpen}
                        />
                    ) : (
                        /* DUAL TERMINAL VIEW (Input / Analysis / Integration Summary) */
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-[0.8fr_1.5fr] gap-4 h-full overflow-y-auto md:overflow-hidden">

                            {/* 1. PROCESS LOGS */}
                            <TerminalPanel logs={logs} />

                            {/* 2. INTELLIGENCE DASHBOARD (Rich UI) */}
                            <AnalysisPanel
                                step={step}
                                changes={changes}
                                analysisResult={analysisResult}
                                isAnalyzing={isAnalyzing}
                                addLog={addLog}
                                setStep={setStep}
                                fileName={importedFileName}
                            />
                        </div>
                    )}
                </motion.div>

                <CoverLetterModal
                    coverLetter={coverLetter}
                    setCoverLetter={setCoverLetter}
                    addLog={addLog}
                />
                <EmailModal state={state} />
                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                />
                <UserProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    onSave={() => {
                        // Force the resume-load guard to reset so the new resume is detected
                        lastLoadedResumeRef.current = null;
                        refreshProfile();
                    }}
                />
            </div>

            {/* 3. MOBILE BOTTOM NAVIGATION */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-safe">
                <button
                    onClick={() => setMobileView('input')}
                    className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 ${mobileView === 'input' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Edit className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Editor</span>
                </button>
                <button
                    onClick={() => setMobileView('preview')}
                    className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 ${mobileView === 'preview' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Activity className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Results</span>
                </button>
            </div>
        </div>
    );
}
