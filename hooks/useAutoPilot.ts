import { useEffect } from 'react';
import { useBuilderState } from './useBuilderState';
import { useHashSync } from './useHashSync';

export const useAutoPilot = (
    state: ReturnType<typeof useBuilderState>,
    actions: {
        startAnalysis: () => Promise<void>;
        startIntegration: () => Promise<void>;
        generateUpdatedResume: () => Promise<void>;
    }
) => {
    const {
        isAutoPilot, step, jd, resumeText, isAnalyzing, isExtracting,
        analysisResult, isIntegrating, changes, downloadUrl,
        downloadFileName, setIsAutoPilot, setStep, addLog
    } = state;

    // 1. Offload Hash Synchronization
    useHashSync(state);

    // 2. Domino Effect Logic
    useEffect(() => {
        if (isAutoPilot && step === 'input' && jd && resumeText && !isAnalyzing && !isExtracting) {
            const timer = setTimeout(() => {
                addLog('🤖 Auto-Pilot: Starting Analysis...', 'info');
                actions.startAnalysis();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isAutoPilot, step, jd, resumeText, isAnalyzing, isExtracting, actions, addLog]);

    useEffect(() => {
        if (isAutoPilot && step === 'analysis' && analysisResult && !isIntegrating) {
            if (analysisResult.match_percentage === 100) {
                setIsAutoPilot(false);
                addLog('🎉 100% Match!', 'success');
                return;
            }
            const timer = setTimeout(() => {
                addLog('🤖 Auto-Pilot: Triggering Skill Integration...', 'info');
                actions.startIntegration();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isAutoPilot, step, analysisResult, isIntegrating, actions, setIsAutoPilot, addLog]);

    useEffect(() => {
        if (isAutoPilot && step === 'integration_summary' && !isIntegrating && changes.length > 0) {
            const timer = setTimeout(() => {
                addLog('🤖 Auto-Pilot: Proceeding to Review...', 'info');
                setStep('review');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isAutoPilot, step, isIntegrating, changes, setStep, addLog]);

    useEffect(() => {
        if (isAutoPilot && step === 'review') {
            const timer = setTimeout(() => {
                addLog('🤖 Auto-Pilot: Accepting All Changes & Generating File...', 'info');
                actions.generateUpdatedResume();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isAutoPilot, step, actions, addLog]);

    useEffect(() => {
        if (isAutoPilot && step === 'download' && downloadUrl) {
            const timer = setTimeout(() => {
                addLog('🤖 Auto-Pilot: Downloading File...', 'success');
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = downloadFileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setIsAutoPilot(false);
                addLog('✨ Auto-Pilot Complete.', 'info');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isAutoPilot, step, downloadUrl, downloadFileName, setIsAutoPilot, addLog]);
};
