// src/components/recipes/CookMode.tsx
import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, List, PlaySquare, Volume2, Square } from 'lucide-react';
import { speakText } from '../../utils/ttsUtils';
import { useAuth } from '../../context/AuthContext';

interface CookModeProps {
    recipeName: string;
    instructions: string[];
    ingredients: Array<{
        id: string;
        name: string;
        displayAmount: string;
        modifier?: string;
    }>;
    onClose: () => void;
    checkedIngredients: Set<string>;
    setCheckedIngredients: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const CookMode = ({ recipeName, instructions, ingredients, onClose, checkedIngredients, setCheckedIngredients }: CookModeProps) => {
    const { user } = useAuth();
    const prefs = user?.preferences 
        ? (typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences) 
        : {};
    
    const [currentStep, setCurrentStep] = useState(0);
    const [view, setView] = useState<'step' | 'ingredients'>('step');
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // Swipe detection states
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    const toggleIngredient = (id: string) => {
        const newChecked = new Set(checkedIngredients);
        if (newChecked.has(id)) {
            newChecked.delete(id);
        } else {
            newChecked.add(id);
        }
        setCheckedIngredients(newChecked);
    };

    // Prevent body scrolling while modal is open and cleanup speech
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { 
            document.body.style.overflow = 'auto'; 
            window.speechSynthesis.cancel();
        };
    }, []);

    // Stop speech when changing steps
    useEffect(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, [currentStep, view]);

    const handleToggleSpeech = (text: string) => {
        speakText(text, {
            onStart: () => setIsSpeaking(true),
            onEnd: () => setIsSpeaking(false),
            voicePreference: prefs.ttsVoice || 'female'
        });
    };

    const handleNext = () => {
        if (currentStep < instructions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onClose(); // Exit modal if on the last step
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    // Swipe Handlers
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) handleNext();
        if (isRightSwipe) handlePrev();
    };

    return (
        <div 
            className="fixed inset-0 z-100 bg-white dark:bg-gray-900 flex flex-col"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Header */}
            <header className="shrink-0 p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-500 mb-1">Cooking Mode</p>
                    <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white line-clamp-1">{recipeName}</h2>
                </div>
                <button 
                    onClick={onClose}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors text-gray-400"
                >
                    <X size={24} />
                </button>
            </header>

            {/* Progress Bar */}
            <div className="shrink-0 h-1.5 w-full bg-gray-100 dark:bg-gray-800">
                <div 
                    className="h-full bg-orange-500 transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / instructions.length) * 100}%` }}
                />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-3 sm:p-12 flex flex-col items-center">
                <div className="w-full max-w-2xl">
                    {view === 'step' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-4 mb-6">
                                <span className="h-10 w-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-orange-200 dark:shadow-none">
                                    {currentStep + 1}
                                </span>
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                    Step {currentStep + 1} of {instructions.length}
                                </span>
                            </div>
                            <p className="text-2xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 leading-tight sm:leading-tight">
                                {instructions[currentStep]}
                            </p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8">Ingredients Checklist</h3>
                            <div className="space-y-4">
                                {ingredients.map((ing) => (
                                    <li key={ing.id} className="flex items-center gap-3 p-4 border-b dark:border-gray-800">
                                        <input
                                            type="checkbox"
                                            className="w-6 h-6 rounded-lg border-2 border-orange-500 checked:bg-orange-500"
                                            checked={checkedIngredients.has(ing.id)}
                                            onChange={() => toggleIngredient(ing.id)}
                                        />
                                        <div className="flex flex-col">
                                            <div>
                                            <span className={checkedIngredients.has(ing.id) ? 'line-through text-gray-400' : ''}>
                                                <span className="font-bold">{ing.displayAmount}</span> {ing.name}
                                            </span>
                                            {ing.modifier && <span className="text-xs text-gray-400 font-medium italic">, {ing.modifier}</span>}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer Actions */}
            <footer className="shrink-0 p-4 sm:p-8 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 space-y-4">
                {view === 'step' && (
                    <div className="flex gap-3 h-16 sm:h-20">
                        <button 
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-black disabled:opacity-30 flex justify-center items-center active:scale-95 transition-all"
                        >
                            <ChevronLeft size={32} />
                        </button>

                        <button 
                            onClick={() => handleToggleSpeech(instructions[currentStep])}
                            className={`flex-1 flex flex-col justify-center items-center rounded-2xl font-black active:scale-95 transition-all border-2 ${
                                isSpeaking 
                                ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900/50' 
                                : 'bg-orange-50 border-orange-100 text-orange-600 dark:bg-orange-900/20 dark:border-orange-900/50'
                            }`}
                        >
                            {isSpeaking ? <Square size={24} fill="currentColor" /> : <Volume2 size={24} />}
                            <span className="text-[10px] uppercase mt-1 tracking-tighter">
                                {isSpeaking ? 'Stop' : 'Read'}
                            </span>
                        </button>
                        
                        <button 
                            onClick={handleNext}
                            className="flex-3 bg-orange-600 dark:bg-orange-500 text-white rounded-2xl font-black flex justify-center items-center gap-2 active:scale-95 transition-all shadow-lg shadow-orange-500/30"
                        >
                            <span className="text-xl">{currentStep === instructions.length - 1 ? 'Finish' : 'Next'}</span> 
                            <ChevronRight size={32} />
                        </button>
                    </div>
                )}

                {/* View Toggle Pill */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl flex">
                    <button 
                        onClick={() => setView('step')}
                        className={`flex-1 py-3 rounded-xl font-black flex justify-center items-center gap-2 text-sm transition-all ${view === 'step' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <PlaySquare size={18} /> Steps
                    </button>
                    <button 
                        onClick={() => setView('ingredients')}
                        className={`flex-1 py-3 rounded-xl font-black flex justify-center items-center gap-2 text-sm transition-all ${view === 'ingredients' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <List size={18} /> Ingredients
                    </button>
                </div>
            </footer>
        </div>
    );
};
