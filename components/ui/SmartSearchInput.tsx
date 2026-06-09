"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, Zap, ChevronDown } from 'lucide-react';
import { useProfileMemory } from '../providers/ProfileMemoryProvider';

interface SmartSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export function SmartSearchInput({ value, onChange, onKeyDown, placeholder, className }: SmartSearchInputProps) {
  const { suggestedRoles, skills } = useProfileMemory();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getFilteredItems = (items: string[]) => {
    if (!value.trim()) return items;
    return items.filter(item => item.toLowerCase().includes(value.toLowerCase()));
  };

  const filteredRoles = getFilteredItems(suggestedRoles);
  const filteredSkills = getFilteredItems(skills);
  
  const hasSuggestions = filteredRoles.length > 0 || filteredSkills.length > 0;

  return (
    <div className="relative flex-1 w-full" ref={wrapperRef}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
      <input 
        ref={inputRef}
        placeholder={placeholder || "Job title, skill..."}
        value={value} 
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }} 
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setIsOpen(false);
          }
          onKeyDown(e);
        }}
        onFocus={() => setIsOpen(true)}
        className={`w-full pl-8 pr-8 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 ${className || ''}`} 
      />
      
      {/* Dropdown Indicator */}
      {(suggestedRoles.length > 0 || skills.length > 0) && (
        <button 
            type="button" 
            onClick={() => setIsOpen(!isOpen)} 
            className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600"
            tabIndex={-1}
        >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown Box */}
      {isOpen && hasSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] z-50 max-h-64 overflow-y-auto custom-scrollbar">
            
            {filteredRoles.length > 0 && (
                <div className="p-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 mb-1 text-[10px] uppercase tracking-widest font-bold text-indigo-500 bg-indigo-50/50 rounded">
                        <Zap className="w-3 h-3" />
                        AI Suggested Roles
                    </div>
                    {filteredRoles.map((role, idx) => (
                        <div 
                            key={`role-${idx}`}
                            onClick={() => handleSelect(role)}
                            className="px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer rounded-lg transition-colors flex items-center justify-between group"
                        >
                            {role}
                            <span className="text-[9px] text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                        </div>
                    ))}
                </div>
            )}
            
            {filteredRoles.length > 0 && filteredSkills.length > 0 && <div className="h-px bg-gray-100 mx-2" />}

            {filteredSkills.length > 0 && (
                <div className="p-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 mb-1 text-[10px] uppercase tracking-widest font-bold text-slate-500 bg-slate-50 rounded">
                        Extracted Skills
                    </div>
                    {filteredSkills.map((skill, idx) => (
                        <div 
                            key={`skill-${idx}`}
                            onClick={() => handleSelect(skill)}
                            className="px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-slate-100 hover:text-gray-900 cursor-pointer rounded-lg transition-colors flex items-center justify-between group"
                        >
                            {skill}
                            <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                        </div>
                    ))}
                </div>
            )}
            
        </div>
      )}
    </div>
  );
}
