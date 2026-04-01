import toast from "react-hot-toast";

interface TTSOptions {
    onStart?: () => void;
    onEnd?: () => void;
}

// Keep a global reference to prevent garbage collection in Chrome
let activeUtterance: SpeechSynthesisUtterance | null = null;

export const speakText = (text: string, { onStart, onEnd }: TTSOptions = {}) => {
    if (!('speechSynthesis' in window)) {
        toast.error("Your browser doesn't support text-to-speech.");
        return;
    }

    // If already speaking, stop and trigger end
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        // Some browsers don't trigger onend when cancelled manually
        onEnd?.();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;

    const voices = window.speechSynthesis.getVoices();
    
    // Heuristic for voice selection
    const femaleVoice = voices.find(voice => 
        ['female', 'samantha', 'zira', 'karen', 'victoria', 'melina', 'moira'].some(name => 
            voice.name.toLowerCase().includes(name)
        )
    ) || voices.find(v => v.lang.startsWith('en'));

    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }

    // State Management Callbacks
    utterance.onstart = () => {
        console.log("Speech started");
        onStart?.();
    };
    
    utterance.onend = () => {
        console.log("Speech ended");
        onEnd?.();
        activeUtterance = null;
    };

    utterance.onerror = (event) => {
        console.error("Speech error:", event);
        onEnd?.();
        activeUtterance = null;
    };

    // Ensure voices are loaded. If voices list is empty
    window.speechSynthesis.speak(utterance);
};
