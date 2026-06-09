import React, { useRef } from 'react';
import { MarkdownText } from '../../ui/MarkdownText';
import { ChangeRequest } from '../../../lib/types/resume.types';
import { escapeRegExp } from '../../../lib/utils/text-utils';

interface ComparisonPreviewProps {
    resumeText: string;
    changes: ChangeRequest[];
    toggleChange: (index: number) => void;
}

export const ComparisonPreview: React.FC<ComparisonPreviewProps> = ({
    resumeText, changes, toggleChange
}) => {
    const originalPanelRef = useRef<HTMLDivElement>(null);
    const previewPanelRef = useRef<HTMLDivElement>(null);
    const isScrolling = useRef<'original' | 'preview' | null>(null);

    const handleScroll = (source: 'original' | 'preview') => {
        const original = originalPanelRef.current;
        const preview = previewPanelRef.current;
        if (!original || !preview) return;

        if (isScrolling.current && isScrolling.current !== source) return;
        isScrolling.current = source;

        if (source === 'original') {
            const percentage = original.scrollTop / (original.scrollHeight - original.clientHeight);
            preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
        } else {
            const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
            original.scrollTop = percentage * (original.scrollHeight - original.clientHeight);
        }

        setTimeout(() => { isScrolling.current = null; }, 50);
    };

    const renderHighlightedText = (text: string, changes: ChangeRequest[], type: 'original' | 'new') => {
        let parts: { text: string; type?: 'normal' | 'del' | 'add' | 'anchor'; changeIndex?: number }[] = [{ text, type: 'normal' }];

        changes.forEach((change, i) => {
            if (!change.selected) return;

            const search = (change.old || change.anchor);
            if (!search) return;

            const newParts: typeof parts = [];
            const pattern = escapeRegExp(search).replace(/\s+/g, '\\s+');
            const regex = new RegExp(pattern);

            parts.forEach(part => {
                if (part.type !== 'normal') {
                    newParts.push(part);
                    return;
                }

                const match = regex.exec(part.text);
                if (match) {
                    const matchIndex = match.index;
                    const matchLength = match[0].length;
                    const matchedText = part.text.substring(matchIndex, matchIndex + matchLength);

                    if (matchIndex > 0) {
                        newParts.push({ text: part.text.substring(0, matchIndex), type: 'normal' });
                    }

                    if (type === 'original') {
                        if (change.type === 'MODIFY') {
                            newParts.push({ text: matchedText, type: 'del', changeIndex: i });
                        } else {
                            newParts.push({ text: matchedText, type: 'anchor', changeIndex: i });
                        }
                    } else {
                        if (change.type === 'MODIFY') {
                            newParts.push({ text: change.new, type: 'add', changeIndex: i });
                        } else {
                            newParts.push({ text: matchedText + '\n', type: 'normal' });
                            newParts.push({ text: change.new, type: 'add', changeIndex: i });
                        }
                    }

                    const remainder = part.text.substring(matchIndex + matchLength);
                    if (remainder) {
                        newParts.push({ text: remainder, type: 'normal' });
                    }
                } else {
                    newParts.push(part);
                }
            });
            parts = newParts;
        });

        return parts.map((part, idx) => {
            if (part.type === 'del') {
                return (
                    <span key={idx} onClick={() => toggleChange(part.changeIndex!)} className="bg-red-200 text-red-900 font-bold line-through cursor-pointer px-1 rounded hover:bg-red-300 border border-red-300 mx-0.5 transition-colors" title="Click to Reject Change">
                        <MarkdownText text={part.text} />
                    </span>
                );
            }
            if (part.type === 'add') {
                return (
                    <span key={idx} onClick={() => toggleChange(part.changeIndex!)} className="bg-green-200 text-green-900 font-bold cursor-pointer px-1 rounded hover:bg-green-300 border border-green-300 mx-0.5 transition-colors" title="Click to Reject Change">
                        <MarkdownText text={part.text} />
                    </span>
                );
            }
            if (part.type === 'anchor') {
                return <span key={idx} className="bg-yellow-500/10 text-gray-500 border-b-2 border-yellow-500/20" title="Anchor Point">{part.text}</span>;
            }
            return <span key={idx}>{part.text}</span>;
        });
    };

    return (
        <div className="flex flex-1 overflow-hidden min-h-0">
            {/* ORIGINAL */}
            <div className="flex-1 border-r border-gray-200 flex flex-col min-w-0">
                <div className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50/50 border-b border-red-200 flex justify-between items-center">
                    <span>ORIGINAL (Click Red to Toggle)</span>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400/50"></div>
                    </div>
                </div>
                <div
                    className="flex-1 overflow-y-auto p-3 font-sans text-[10px] leading-relaxed text-gray-700 custom-scrollbar whitespace-pre-wrap break-words bg-gray-50/50"
                    ref={originalPanelRef}
                    onScroll={() => handleScroll('original')}
                >
                    {renderHighlightedText(resumeText, changes, 'original')}
                </div>
            </div>

            {/* PREVIEW */}
            <div className="flex-1 flex flex-col bg-green-50/40 min-w-0">
                <div className="px-4 py-2 text-xs font-bold text-green-700 bg-green-50/80 border-b border-green-200 flex justify-between items-center">
                    <span>PREVIEW</span>
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                </div>
                <div
                    className="flex-1 overflow-y-auto p-3 font-sans text-[10px] leading-relaxed text-gray-900 custom-scrollbar whitespace-pre-wrap break-words"
                    ref={previewPanelRef}
                    onScroll={() => handleScroll('preview')}
                >
                    {renderHighlightedText(resumeText, changes, 'new')}
                </div>
            </div>
        </div>
    );
};
