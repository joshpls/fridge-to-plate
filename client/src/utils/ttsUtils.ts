// utils/ttsUtils.ts
import toast from "react-hot-toast";

interface TTSOptions {
    onStart?: () => void;
    onEnd?: () => void;
}

export const speakText = (text: string, { onStart, onEnd }: TTSOptions = {}) => {
    if (!('speechSynthesis' in window)) {
        toast.error("Your browser doesn't support text-to-speech.");
        return;
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (onEnd) onEnd();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    const femaleVoice = voices.find(voice => 
        ['female', 'samantha', 'zira', 'karen', 'victoria', 'melina', 'moira'].some(name => 
            voice.name.toLowerCase().includes(name)
        )
    ) || voices.find(v => v.lang.startsWith('en'));

    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }

    // State Management Callbacks
    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
};
