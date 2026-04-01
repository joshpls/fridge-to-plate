// utils/ttsUtils.ts
import toast from "react-hot-toast";

interface TTSOptions {
    onStart?: () => void;
    onEnd?: () => void;
    voicePreference?: 'male' | 'female';
}

// Helper to reliably grab a voice based on preference
const getPreferredVoice = (preference: 'male' | 'female'): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    const femaleNames = ['female', 'samantha', 'zira', 'karen', 'victoria', 'melina', 'moira', 'tessa', 'siri'];
    const maleNames = ['male', 'andrew', 'daniel', 'alex', 'fred', 'tomas', 'mark', 'aaron', 'arthur', 'gordon', 'ryan', 'paul', 'david', 'voice iii', 'voice iv', 'en-us-x-iom-local'];

    const targetNames = preference === 'male' ? maleNames : femaleNames;

    return voices.find(voice => 
        targetNames.some(name => voice.name.toLowerCase().includes(name))
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
};

export const speakText = (text: string, { onStart, onEnd, voicePreference = 'female' }: TTSOptions = {}) => {
    if (!('speechSynthesis' in window)) {
        toast.error("Your browser doesn't support text-to-speech.");
        return;
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        onEnd?.();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = (e) => {
        console.error("TTS Error:", e);
        onEnd?.();
    };

    const attemptSpeak = () => {
        const voice = getPreferredVoice(voicePreference);
        if (voice) {
            utterance.voice = voice;
        } else {
            utterance.lang = 'en-US'; 
        }
        window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();

    if (voices.length === 0) {
        const voiceTimeout = setTimeout(() => {
            window.speechSynthesis.onvoiceschanged = null;
            toast.error("Could not load system voices. Please check your browser audio settings.");
            onEnd?.();
        }, 1500);

        window.speechSynthesis.onvoiceschanged = () => {
            const updatedVoices = window.speechSynthesis.getVoices();
            if (updatedVoices.length > 0) {
                clearTimeout(voiceTimeout);
                attemptSpeak();
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    } else {
        attemptSpeak();
    }
};
