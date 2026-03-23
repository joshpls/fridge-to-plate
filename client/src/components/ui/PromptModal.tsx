import React, { useState, useEffect, useRef } from 'react';
import { Edit2, X } from 'lucide-react';

interface PromptModalProps {
    isOpen: boolean;
    title: string;
    message?: string;
    defaultValue?: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (value: string | null) => void;
    onClose: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
    isOpen,
    title,
    message,
    defaultValue = "",
    placeholder = "Enter value...",
    confirmText = "Save",
    cancelText = "Cancel",
    onConfirm,
    onClose
}) => {
    const [inputValue, setInputValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset value and auto-focus when opened
    useEffect(() => {
        if (isOpen) {
            setInputValue(defaultValue);
            // Slight delay ensures the modal animation doesn't block focus
            setTimeout(() => inputRef.current?.focus(), 50); 
        }
    }, [isOpen, defaultValue]);

    // Handle Keyboard events (Escape to close, Enter to submit)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onConfirm(null);
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onConfirm]);

    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onConfirm(null);
            onClose();
        }
    };

    const handleSubmit = () => {
        onConfirm(inputValue);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleOverlayClick}
        >
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header/Content Area */}
                <div className="p-8 relative">
                    <button 
                        onClick={() => { onConfirm(null); onClose(); }}
                        className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col text-center items-center">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                            <Edit2 size={32} className="text-blue-500" />
                        </div>

                        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                            {title}
                        </h3>
                        
                        {message && (
                            <p className="text-gray-500 font-bold leading-relaxed mb-6">
                                {message}
                            </p>
                        )}

                        <div className="w-full mt-4">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={placeholder}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none text-gray-900 font-bold transition-all text-center"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white border-t flex gap-4">
                    <button
                        type="button"
                        onClick={() => { onConfirm(null); onClose(); }}
                        className="flex-1 px-4 py-3.5 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-colors tracking-widest uppercase text-sm"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-3.5 text-white font-black rounded-2xl shadow-xl shadow-blue-100 bg-blue-600 hover:bg-blue-700 transition-all tracking-widest uppercase text-sm transform hover:-translate-y-0.5"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
