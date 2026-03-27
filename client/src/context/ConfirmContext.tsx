import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { PromptModal } from '../components/ui/PromptModal';
import type { ConfirmContextType, ConfirmOptions, PromptOptions } from '../models/Utils';

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // State for Confirm
    const [confirmConfig, setConfirmConfig] = useState<ConfirmOptions & { isOpen: boolean } | null>(null);
    const [confirmResolve, setConfirmResolve] = useState<(value: boolean) => void>(() => {});

    // State for Prompt
    const [promptConfig, setPromptConfig] = useState<PromptOptions & { isOpen: boolean } | null>(null);
    const [promptResolve, setPromptResolve] = useState<(value: string | null) => void>(() => {});

    const confirm = useCallback((options: ConfirmOptions) => {
        setConfirmConfig({ ...options, isOpen: true });
        return new Promise<boolean>((res) => {
            setConfirmResolve(() => res);
        });
    }, []);

    const prompt = useCallback((options: PromptOptions) => {
        setPromptConfig({ ...options, isOpen: true });
        return new Promise<string | null>((res) => {
            setPromptResolve(() => res);
        });
    }, []);

    return (
        <ConfirmContext.Provider value={{ confirm, prompt }}>
            {children}
            
            {/* Render Confirm Modal */}
            {confirmConfig && (
                <ConfirmModal
                    isOpen={confirmConfig.isOpen}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    confirmText={confirmConfig.confirmText}
                    cancelText={confirmConfig.cancelText}
                    variant={confirmConfig.variant}
                    onConfirm={() => { setConfirmConfig(null); confirmResolve(true); }}
                    onClose={() => { setConfirmConfig(null); confirmResolve(false); }}
                />
            )}

            {/* Render Prompt Modal */}
            {promptConfig && (
                <PromptModal
                    isOpen={promptConfig.isOpen}
                    title={promptConfig.title}
                    message={promptConfig.message}
                    defaultValue={promptConfig.defaultValue}
                    placeholder={promptConfig.placeholder}
                    confirmText={promptConfig.confirmText}
                    cancelText={promptConfig.cancelText}
                    onConfirm={(val) => { setPromptConfig(null); promptResolve(val); }}
                    onClose={() => { setPromptConfig(null); promptResolve(null); }}
                />
            )}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
    return context;
};
