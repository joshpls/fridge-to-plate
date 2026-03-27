import { Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareButtonProps {
    title: string;
    text?: string;
    url?: string;
}

export const ShareButton = ({ 
    title, 
    text = "Check out this recipe!",
    url = typeof window !== 'undefined' ? window.location.href : '' 
}: ShareButtonProps) => {
    
    const handleShare = async () => {
        const shareData = { title, text, url };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                return;
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error("Native share failed, falling back to clipboard:", err);
                    fallbackCopy();
                }
            }
        } else {
            fallbackCopy();
        }
    };

    const fallbackCopy = async () => {
        // Modern approach (Requires HTTPS or localhost)
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard!', { icon: '🔗', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                return;
            } catch (err) {
                console.error("Secure clipboard copy failed:", err);
            }
        } 
        
        // Legacy approach (Works on HTTP / IP Addresses)
        try {
            const textArea = document.createElement("textarea");
            textArea.value = url;
            
            // Hide the text area off-screen
            textArea.style.position = "absolute";
            textArea.style.left = "-999999px";
            document.body.prepend(textArea);
            
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
            
            toast.success('Link copied to clipboard!', { icon: '🔗', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
        } catch (error) {
            console.error("Legacy copy failed:", error);
            toast.error('Failed to copy link. Please copy the URL from your browser.');
        }
    };
    
    return (
        <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl font-bold text-sm hover:border-orange-400 hover:text-orange-600 transition-all shadow-sm active:scale-95 shrink-0 w-full sm:w-auto"
            aria-label="Share recipe"
        >
            <Share2 size={18} /> Share
        </button>
    );
};
