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
    console.log("Available voices on this system:", voices.map(v => v.name));
    if (voices.length === 0) return null;

    const femaleNames = ['female', 'female voice 1 (us)', 'samantha', 'zira', 'karen', 'victoria', 'melina', 'moira', 'tessa', 'siri'];
    const maleNames = ['male', 'andrew', 'daniel', 'alex', 'fred', 'tomas', 'mark', 'aaron', 'arthur', 'gordon', 'ryan', 'paul', 'david', 'voice iii', 'voice iv', 'en-us-x-iom-local'];

    const targetNames = preference === 'male' ? maleNames : femaleNames;

    // Try to find a matched voice from our preference arrays
    let foundVoice = voices.find(voice => 
        targetNames.some(name => voice.name.toLowerCase().includes(name))
    );

    // Fallback to any English voice if a specific preferred voice isn't found
    if (!foundVoice) {
        foundVoice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    }

    // fallback to the first available hardware engine voice
    if (!foundVoice) {
        foundVoice = voices[0];
    }

    return foundVoice;
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
            // toast.success(`Found Voice: ${voice.name}`);
        } else {
            utterance.lang = 'en-US';
            // toast.success("Found Voice: System Default (en-US)");
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
