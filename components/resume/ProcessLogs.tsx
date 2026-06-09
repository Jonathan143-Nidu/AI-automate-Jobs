import React from 'react';
import { LogEntry, Step } from '@/lib/types/resume.types';

interface ProcessLogsProps {
    logs: LogEntry[];
    rawAiResponse: string;
    step: Step;
}

export const ProcessLogs: React.FC<ProcessLogsProps> = ({ logs, rawAiResponse, step }) => {
    return (
        <div className="bg-gray-900 text-gray-100 font-mono text-xs p-4 h-full overflow-y-auto">
            <div className="mb-2 text-gray-400">
                └─ Process Logs [{step.toUpperCase()}]
            </div>

            {logs.length === 0 ? (
                <div className="text-gray-500 mt-4">
                    No logs yet. Start by uploading a resume and entering a job description.
                </div>
            ) : (
                logs.map((log, i) => (
                    <div key={i} className="mb-1">
                        <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
                        <span
                            className={
                                log.type === 'success'
                                    ? 'text-green-400'
                                    : log.type === 'error'
                                        ? 'text-red-400'
                                        : log.type === 'json'
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                            }
                        >
                            {log.message}
                        </span>
                        {log.data ? (
                            <pre className="text-xs text-gray-400 ml-4 mt-1">
                                {JSON.stringify(log.data, null, 2)}
                            </pre>
                        ) : null}
                    </div>
                ))
            )}

            {(step === 'analysis' || step === 'integration') && rawAiResponse && (
                <div className="mt-4 border-t border-gray-700 pt-2">
                    <div className="text-purple-400 mb-1">AI RAW RESPONSE:</div>
                    <pre className="text-gray-400 whitespace-pre-wrap">{rawAiResponse}</pre>
                </div>
            )}
        </div>
    );
};
