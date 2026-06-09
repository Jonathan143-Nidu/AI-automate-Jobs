/**
 * Text rendering and formatting utilities
 * Extracted from ResumeBuilder.tsx
 */

import React from 'react';
import { ChangeRequest } from '../types/resume.types';

/**
 * Escape special regex characters
 */
export const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Render markdown text with bold formatting
 */
export const renderMarkdownText = (text: string): React.ReactNode[] => {
    if (!text) return [];
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <strong key={idx} className="font-bold text-purple-600">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return <span key={idx}>{part}</span>;
    });
};

/**
 * Render text with highlighted changes
 */
export const renderHighlightedText = (
    text: string,
    changes: ChangeRequest[],
    type: 'original' | 'new'
): React.ReactNode => {
    if (!text) return null;

    let highlightedText = text;
    const highlights: { start: number; end: number; isNew: boolean }[] = [];

    changes.forEach((change) => {
        if (!change.selected) return;

        if (type === 'original' && change.type === 'MODIFY' && change.old) {
            const pattern = escapeRegExp(change.old).replace(/\s+/g, '\\s+');
            const regex = new RegExp(pattern, 'gi');
            let match;

            while ((match = regex.exec(text)) !== null) {
                highlights.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    isNew: false
                });
            }
        } else if (type === 'new' && change.new) {
            if (change.type === 'MODIFY' && change.old) {
                const pattern = escapeRegExp(change.old).replace(/\s+/g, '\\s+');
                const regex = new RegExp(pattern, 'gi');

                highlightedText = highlightedText.replace(regex, () => {
                    return `__NEW_START__${change.new}__NEW_END__`;
                });
            } else if (change.type === 'ADD' && change.anchor) {
                const pattern = escapeRegExp(change.anchor).replace(/\s+/g, '\\s+');
                const regex = new RegExp(pattern, 'gi');

                highlightedText = highlightedText.replace(regex, () => {
                    return `${change.anchor}\n__NEW_START__${change.new}__NEW_END__`;
                });
            }
        }
    });

    // For new text, replace markers with highlighted spans
    if (type === 'new' && highlightedText.includes('__NEW_START__')) {
        const parts = highlightedText.split(/(__NEW_START__|__NEW_END__)/);
        let isHighlight = false;

        return (
            <>
                {parts.map((part, idx) => {
                    if (part === '__NEW_START__') {
                        isHighlight = true;
                        return null;
                    }
                    if (part === '__NEW_END__') {
                        isHighlight = false;
                        return null;
                    }
                    if (isHighlight) {
                        return (
                            <span key={idx} className="bg-green-200 text-green-900 font-semibold">
                                {part}
                            </span>
                        );
                    }
                    return <span key={idx}>{part}</span>;
                })}
            </>
        );
    }

    // For original text with highlights  
    if (type === 'original' && highlights.length > 0) {
        highlights.sort((a, b) => a.start - b.start);

        const segments: React.ReactNode[] = [];
        let lastIndex = 0;

        highlights.forEach((highlight, idx) => {
            if (highlight.start > lastIndex) {
                segments.push(
                    <span key={`text-${idx}`}>
                        {text.substring(lastIndex, highlight.start)}
                    </span>
                );
            }

            segments.push(
                <span key={`highlight-${idx}`} className="bg-red-200 text-red-900 line-through">
                    {text.substring(highlight.start, highlight.end)}
                </span>
            );

            lastIndex = highlight.end;
        });

        if (lastIndex < text.length) {
            segments.push(<span key="text-end">{text.substring(lastIndex)}</span>);
        }

        return <>{segments}</>;
    }

    return <span>{text}</span>;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (
    text: string,
    label: string
): Promise<{ success: boolean; message: string }> => {
    try {
        await navigator.clipboard.writeText(text);
        return { success: true, message: `${label} copied!` };
    } catch (err) {
        console.error('Failed to copy:', err);
        return { success: false, message: 'Failed to copy' };
    }
};
