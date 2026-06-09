import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    label: string;
    value: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
}

export function CustomSelect({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    disabled = false,
    loading = false,
    icon
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedLabel = options.find(o => o.value === value)?.label;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-3 py-2.5 
                    bg-white border rounded-lg text-xs font-bold shadow-sm transition-all
                    ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-gray-300 hover:border-gray-400'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <div className="flex items-center gap-2 truncate">
                    {icon && <span className="text-gray-400">{icon}</span>}
                    <span className={`truncate ${!selectedLabel ? 'text-gray-500 font-medium' : 'text-gray-700'}`}>
                        {selectedLabel || placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu - Always opens below */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-[100] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1">
                        {options.length === 0 ? (
                            <div className="px-3 py-2.5 text-center text-gray-400 text-[10px] font-medium italic">
                                {loading ? 'Loading candidates...' : 'No candidates found'}
                            </div>
                        ) : (
                            options.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left
                                        transition-colors
                                        ${option.value === value
                                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                                            : 'text-gray-600 hover:bg-gray-50 font-medium'}
                                    `}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {option.value === value && (
                                        <Check className="w-3 h-3 text-indigo-600 shrink-0 ml-2" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
