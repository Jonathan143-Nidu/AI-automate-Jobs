import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, X, AlertCircle } from 'lucide-react';
import { useEmailAction } from '../../hooks/useEmailAction';
import { useBuilderState } from '../../hooks/useBuilderState';

interface EmailModalProps {
    state: ReturnType<typeof useBuilderState>;
}

export const EmailModal: React.FC<EmailModalProps> = ({ state }) => {
    const { isEmailModalOpen, setIsEmailModalOpen, downloadFileName } = state;
    const { emailDetails, setEmailDetails, isSending, sendEmail } = useEmailAction(state);

    if (!isEmailModalOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-10"
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-slate-900">Email Recruiter</h2>
                                    {state.threadMetadata && (
                                        <span className="text-[10px] bg-emerald-500 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse shadow-lg shadow-emerald-200">Reply Active</span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 font-medium">
                                    {state.threadMetadata ? `Replying to: ${state.threadMetadata.subject}` : 'Send optimized resume directly'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEmailModalOpen(false)}
                            className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[70vh]">
                        {/* Recipient */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Recipient Email</label>
                            <input
                                type="email"
                                placeholder="recruiter@company.com"
                                value={emailDetails.to}
                                onChange={(e) => setEmailDetails({ ...emailDetails, to: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium outline-none"
                            />
                        </div>

                        {/* Subject */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Subject Line</label>
                            <input
                                type="text"
                                placeholder="Job Application"
                                value={emailDetails.subject}
                                onChange={(e) => setEmailDetails({ ...emailDetails, subject: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 font-medium outline-none"
                            />
                        </div>

                        {/* Message / Cover Letter */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Body (Cover Letter)</label>
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                role="textbox"
                                tabIndex={0}
                                onInput={(e) => setEmailDetails({ ...emailDetails, message: e.currentTarget.innerHTML })}
                                dangerouslySetInnerHTML={{ __html: emailDetails.message }}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-800 font-medium leading-relaxed outline-none overflow-y-auto min-h-[160px] bg-white"
                                style={{
                                    minHeight: '200px',
                                    maxHeight: '400px',
                                    whiteSpace: 'pre-wrap'
                                }}
                            />
                        </div>

                        {/* Attachment Preview */}
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <Mail className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-tight">Attachment Attached</p>
                                    <p className="text-sm font-bold text-emerald-950 truncate max-w-[250px]">{downloadFileName}</p>
                                </div>
                            </div>
                            <div className="text-[10px] font-bold text-emerald-600 px-2 py-1 bg-white rounded-md border border-emerald-200 shadow-sm">
                                DOCX
                            </div>
                        </div>

                        {/* Note */}
                        <div className="flex gap-2.5 p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <p className="text-[11px] text-amber-800 leading-normal font-medium">
                                <strong>Note:</strong> This will send from our official sender. The recruiter can reply to this email, and you&apos;ll receive it at your registered email address.
                            </p>
                        </div>
                    </div>

                    {/* Footer / Action */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                        <button
                            onClick={() => setIsEmailModalOpen(false)}
                            className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-200/50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={sendEmail}
                            disabled={isSending || !emailDetails.to}
                            className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2 group"
                        >
                            {isSending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    {state.threadMetadata ? 'Send Reply' : 'Send to Recruiter'}
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
