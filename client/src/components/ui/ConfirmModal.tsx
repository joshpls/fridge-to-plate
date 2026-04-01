import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onClose: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title = "Are you sure?",
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onClose,
    variant = 'danger'
}) => {
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const theme = {
        danger: {
            iconBg: "bg-red-50",
            iconColor: "text-red-500",
            button: "bg-red-600 hover:bg-red-700 shadow-red-100"
        },
        warning: {
            iconBg: "bg-orange-50 dark:bg-orange-500/15",
            iconColor: "text-orange-500",
            button: "bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 shadow-orange-100"
        },
        info: {
            iconBg: "bg-blue-50",
            iconColor: "text-blue-500",
            button: "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
        }
    }[variant];

    return (
        <div 
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={handleOverlayClick}
        >
            <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl dark:border-gray-800 dark:shadow-none transform transition-all">
                
                {/* Header/Content Area */}
                <div className="p-8 relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${theme.iconBg}`}>
                            <AlertTriangle size={32} className={theme.iconColor} />
                        </div>

                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                            {title}
                        </h3>
                        
                        <p className="text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-gray-900 border-t flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3.5 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 rounded-2xl transition-colors tracking-widest uppercase text-sm"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 px-4 py-3.5 text-white font-black rounded-2xl shadow-xl dark:border-gray-800 dark:shadow-none transition-all tracking-widest uppercase text-sm transform hover:-translate-y-0.5 ${theme.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
