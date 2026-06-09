/**
 * Custom hook for managing resume analysis state and operations
 */

import { useState } from 'react';
import { AnalysisResult, LogEntry } from '@/lib/types/resume.types';

export const useResumeAnalysis = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [rawAiResponse, setRawAiResponse] = useState('');
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = (message: string, type: LogEntry['type'] = 'info', data?: unknown) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, type, message, data }]);
    };

    const startAnalysis = async (jd: string, resumeText: string) => {
        setIsAnalyzing(true);
        setRawAiResponse('');
        setAnalysisResult(null);
        addLog('Starting resume analysis...', 'info');

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jd, resumeText }),
            });

            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response stream available');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                setRawAiResponse(prev => prev + chunk);
            }

            // Parse the complete response
            const result = JSON.parse(buffer) as AnalysisResult;
            setAnalysisResult(result);
            addLog('Analysis complete', 'success', result);

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
            addLog(errorMessage, 'error');
            throw error;
        } finally {
            setIsAnalyzing(false);
        }
    };

    const reset = () => {
        setIsAnalyzing(false);
        setAnalysisResult(null);
        setRawAiResponse('');
        setLogs([]);
    };

    return {
        isAnalyzing,
        analysisResult,
        rawAiResponse,
        logs,
        addLog,
        startAnalysis,
        reset
    };
};
