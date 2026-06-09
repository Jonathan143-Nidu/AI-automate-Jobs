import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogEntry } from '../../lib/types/resume.types';

interface TerminalPanelProps {
    logs: LogEntry[];
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ logs }) => {
    const terminalEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="bg-white border border-gray-300 rounded-[24px] overflow-hidden flex flex-col shadow-sm min-h-[150px] md:h-full">
            <div className="h-10 md:h-12 border-b border-gray-200 flex items-center px-4 gap-3 bg-gray-50/80">
                <div className="flex gap-1.5">
                    <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-red-500"></div>
                    <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-yellow-500"></div>
                    <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-green-500"></div>
                </div>
                <span className="text-[10px] md:text-xs font-mono text-gray-600 uppercase tracking-widest font-bold">Process Logs</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 md:p-5 font-mono text-[10px] md:text-xs space-y-2 md:space-y-3 custom-scrollbar">
                {logs.length === 0 && (
                    <div className="text-gray-600 italic mt-10 text-center">
                        Initializing system...<br />Waiting for file input.
                    </div>
                )}
                {logs.map((log, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 text-gray-800 font-medium">
                        <span className="text-green-500 font-bold shrink-0">❯</span>
                        <span className={log.type === 'error' ? 'text-red-400' : 'text-gray-400'}>
                            {log.message}
                        </span>
                    </motion.div>
                ))}
                <div ref={terminalEndRef} />
            </div>
        </div>
    );
};
