import React, { useState } from 'react';
import { AlertCircle, XCircle, Copy, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { GapAnalysisItem } from '../../../lib/types/resume.types';

interface GapAnalysisTableProps {
    data: GapAnalysisItem[];
}

export const GapAnalysisTable: React.FC<GapAnalysisTableProps> = ({ data }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isCopied, setIsCopied] = useState(false);

    // Filter to show only Partial and Missing items (safety filter)
    const filteredData = data.filter(item => item.status !== 'Matched');

    if (!filteredData || filteredData.length === 0) return null;

    const formatVal = (val: string | undefined) => {
        if (!val || val === 'N/A' || val === '0M' || val === '0Y') return '-';
        return val;
    };

    const handleCopy = () => {
        const text = filteredData.map(item =>
            `${item.skill}: JD(${formatVal(item.jd_requirement)}) vs CV(${formatVal(item.resume_experience)}) - ${item.status}`
        ).join('\n');

        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Partial':
                return <AlertCircle className="w-3 h-3 text-amber-500" />;
            case 'Missing':
                return <XCircle className="w-3 h-3 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Partial':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Missing':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div
                className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="text-[10px] text-gray-700 uppercase font-bold tracking-wider">Skill Gaps</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCopy();
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500"
                        title="Copy gaps"
                    >
                        {isCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <div className="p-1 text-gray-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="overflow-x-auto animate-in slide-in-from-top-1 duration-200">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-3 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">Skill</th>
                                <th className="px-3 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">JD</th>
                                <th className="px-3 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">CV</th>
                                <th className="px-3 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-3 py-1.5">
                                        <span className="text-[12px] font-bold text-gray-900 leading-tight">{item.skill}</span>
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <span className="text-[11px] font-medium text-gray-600">{formatVal(item.jd_requirement)}</span>
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <span className="text-[11px] font-medium text-gray-600">{formatVal(item.resume_experience)}</span>
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <div className="flex justify-center">
                                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase tracking-tight ${getStatusStyles(item.status)}`}>
                                                {getStatusIcon(item.status)}
                                                {item.status}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
