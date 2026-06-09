import React from 'react';
import { Copy, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ChangeRequest } from '../../../lib/types/resume.types';
import { MarkdownText } from '../../ui/MarkdownText';

interface ProposedModificationsProps {
    changes: ChangeRequest[];
    handleCopyAll: () => void;
    handleCopyItem: (text: string, label: string) => void;
}

export const ProposedModifications: React.FC<ProposedModificationsProps> = ({
    changes, handleCopyAll, handleCopyItem
}) => {
    const [isExpanded, setIsExpanded] = React.useState(true);

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
            <div
                className="flex justify-between items-center mb-2 cursor-pointer select-none hover:bg-gray-50/50 rounded-lg p-1 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="text-xs font-bold text-green-700 uppercase tracking-widest pl-1">Proposed optimizations</span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-green-50 text-green-800 px-2 py-1 rounded-full border border-green-300 font-semibold">{changes.length} Changes</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCopyAll();
                        }}
                        className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 font-bold shadow-sm"
                        title="Copy all changes at once"
                    >
                        <Copy className="w-3 h-3" />
                        Copy All
                    </button>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar pr-2">
                    {changes.map((change, i) => (
                        <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-bold uppercase ${change.type === 'MODIFY' ? 'text-blue-400' : 'text-yellow-400'}`}>
                                    {change.section ? `${change.section} Update` : (change.type === 'MODIFY' ? 'Skill Update' : 'New Integration')}
                                </span>
                                <div className="text-[10px] text-gray-500 group-hover:text-gray-400">{change.reason?.substring(0, 30)}...</div>
                            </div>

                            {change.type === 'MODIFY' && (
                                <div className="mb-2 relative group-item">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-[10px] font-mono text-red-500/70 uppercase tracking-wider">Old:</span>
                                        <button
                                            onClick={() => handleCopyItem(change.old || '', 'Old Text')}
                                            className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Copy Old Text"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-red-400/60 line-through break-words font-mono opacity-70">
                                        {change.old?.substring(0, 80)}...
                                    </div>
                                </div>
                            )}

                            <div className="relative group-item">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className={`text-[10px] font-mono uppercase tracking-wider ${change.type === 'ADD' ? 'text-yellow-700' : 'text-green-700'}`}>
                                        {change.type === 'ADD' ? 'Additional Point:' : 'New:'}
                                    </span>
                                    <button
                                        onClick={() => handleCopyItem(change.new, 'New Text')}
                                        className={`${change.type === 'ADD' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'} p-1 opacity-0 group-hover:opacity-100 transition-opacity`}
                                        title="Copy New Text"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="text-xs text-gray-900 break-words font-semibold leading-relaxed">
                                    <MarkdownText text={change.new} />
                                    {change.type === 'ADD' && <PlusCircle className="inline w-3 h-3 ml-1 text-green-600" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
