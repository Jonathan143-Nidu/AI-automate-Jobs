import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, CheckCircle, Mail } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { signature, saveSignature } = useSettings();
    const [tempSignature, setTempSignature] = useState(signature);
    const [saved, setSaved] = useState(false);

    // Update local state when signature loads or modal opens
    React.useEffect(() => {
        setTempSignature(signature);
    }, [signature, isOpen]);

    const handleSave = () => {
        saveSignature(tempSignature);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            Settings
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <label className="block text-sm font-bold text-gray-700">
                                Your Email Signature
                            </label>
                            <p className="text-sm text-gray-500">
                                This signature will be automatically added to all emails sent to recruiters.
                            </p>
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                onInput={(e) => setTempSignature(e.currentTarget.innerHTML)}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    const items = e.clipboardData.items;

                                    for (let i = 0; i < items.length; i++) {
                                        if (items[i].type.indexOf('image') !== -1) {
                                            const blob = items[i].getAsFile();
                                            if (!blob) continue;

                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                const base64 = event.target?.result as string;
                                                const img = document.createElement('img');
                                                img.src = base64;
                                                img.style.maxWidth = '100%';

                                                const selection = window.getSelection();
                                                if (selection && selection.rangeCount > 0) {
                                                    const range = selection.getRangeAt(0);
                                                    range.deleteContents();
                                                    range.insertNode(img);

                                                    range.setStartAfter(img);
                                                    range.setEndAfter(img);
                                                    selection.removeAllRanges();
                                                    selection.addRange(range);
                                                    setTempSignature(e.currentTarget.innerHTML);
                                                }
                                            };
                                            reader.readAsDataURL(blob);
                                            return;
                                        }
                                    }

                                    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
                                    document.execCommand('insertHTML', false, text);
                                }}
                                dangerouslySetInnerHTML={{ __html: tempSignature }}
                                className="w-full h-32 p-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-sans text-sm overflow-y-auto bg-gray-50/30 transition-all outline-none"
                            />

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleSave}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${saved
                                        ? 'bg-green-600 shadow-green-100'
                                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 hover:-translate-y-0.5'
                                        }`}
                                >
                                    {saved ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Signature Saved!
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Signature
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Resume AI v2.4.0
                        </span>
                        <button
                            onClick={onClose}
                            className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
