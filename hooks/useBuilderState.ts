import { useState, useRef, useEffect } from 'react';
import {
    AnalysisResult,
    ChangeRequest,
    LogEntry,
    Step as StepType
} from '../lib/types/resume.types';

export const useBuilderState = () => {
    const [step, setStep] = useState<StepType>('input');

    // Inputs
    const [file, setFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<'docx' | 'pdf' | 'txt'>('docx');
    const [resumeText, setResumeText] = useState<string>('');
    const [importedFileName, setImportedFileName] = useState<string | null>(null);
    const [jd, setJd] = useState<string>('');
    const [recruiterDetails, setRecruiterDetails] = useState<{
        name: string | null;
        email: string | null;
    }>({ name: null, email: null });

    const [jobDetails, setJobDetails] = useState<{
        role: string | null;
        location: string | null;
        rate: string | null;
        jobType: string | null;
        workStyle: string | null;
    }>({ role: null, location: null, rate: null, jobType: null, workStyle: null });

    const [threadId, setThreadId] = useState<string | null>(null);
    const [threadMetadata, setThreadMetadata] = useState<{
        messageId: string;
        subject: string;
        recruiterName: string;
        recruiterEmail: string;
        allMessageIds: string[];
        threadId: string;
    } | null>(null);
    const [isNewCandidate, setIsNewCandidate] = useState(false);


    // Results & Processing
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [rawAiResponse, setRawAiResponse] = useState<string | null>(null);
    const [isIntegrating, setIsIntegrating] = useState(false);
    const [changes, setChanges] = useState<ChangeRequest[]>([]);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [downloadFileName, setDownloadFileName] = useState<string>('Optimized_Resume.docx');
    const [isExtracting, setIsExtracting] = useState(false);

    // Auto-Pilot State
    const [isAutoPilot, setIsAutoPilot] = useState(false);
    const [shouldAutoTrigger, setShouldAutoTrigger] = useState(false);
    const hasDownloadedRef = useRef(false);

    // Score Tracking
    const [initialScore, setInitialScore] = useState<number | null>(null);
    const [optimizedScore, setOptimizedScore] = useState<number | null>(null);
    const [gapReasons, setGapReasons] = useState<string[]>([]);
    const [showGaps, setShowGaps] = useState(false);

    // Terminal Logs
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // Cover Letter State
    const [coverLetter, setCoverLetter] = useState<string | null>(null);
    const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);

    // Mobile State
    const [mobileView, setMobileView] = useState<'input' | 'preview'>('input');

    // Email Modal State
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    // Settings Modal State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Profile Modal State
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const addLog = (message: string, type: LogEntry['type'] = 'info', data?: unknown) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, type, message, data }]);
    };

    const resetSession = () => {
        setStep('input');
        setFile(null);
        setResumeText('');
        setJd('');
        setAnalysisResult(null);
        setChanges([]);
        setDownloadUrl(null);
        setLogs([]);
        setRawAiResponse(null);
        setCoverLetter(null);
        setInitialScore(null);
        setOptimizedScore(null);
        setGapReasons([]);
        setIsNewCandidate(false);
        setIsAutoPilot(false);
        setShouldAutoTrigger(false);
        hasDownloadedRef.current = false;
        setImportedFileName(null);
        setIsEmailModalOpen(false);
        setIsSettingsOpen(false);
        setIsProfileOpen(false);
        setRecruiterDetails({ name: null, email: null });
        setThreadMetadata(null);
        addLog('Session Reset', 'info');
    };

    return {
        // State
        step, setStep,
        file, setFile,
        fileType, setFileType,
        resumeText, setResumeText,
        importedFileName, setImportedFileName,
        jd, setJd,
        recruiterDetails, setRecruiterDetails,
        threadId, setThreadId,
        threadMetadata, setThreadMetadata,
        isNewCandidate, setIsNewCandidate,
        isAnalyzing, setIsAnalyzing,
        analysisResult, setAnalysisResult,
        rawAiResponse, setRawAiResponse,
        isIntegrating, setIsIntegrating,
        changes, setChanges,
        isProcessingFile, setIsProcessingFile,
        downloadUrl, setDownloadUrl,
        downloadFileName, setDownloadFileName,
        isExtracting, setIsExtracting,
        isAutoPilot, setIsAutoPilot,
        shouldAutoTrigger, setShouldAutoTrigger,
        hasDownloadedRef,
        initialScore, setInitialScore,
        optimizedScore, setOptimizedScore,
        gapReasons, setGapReasons,
        showGaps, setShowGaps,
        logs, setLogs,
        coverLetter, setCoverLetter,
        isGeneratingCoverLetter, setIsGeneratingCoverLetter,
        mobileView, setMobileView,
        isEmailModalOpen, setIsEmailModalOpen,
        isSettingsOpen, setIsSettingsOpen,
        isProfileOpen, setIsProfileOpen,
        jobDetails, setJobDetails,

        // Helpers
        addLog,
        resetSession
    };
};
