interface SourceAttributionProps {
    sourceName?: string;
    sourceUrl?: string;
}

export const SourceAttribution = ({ sourceName, sourceUrl }: SourceAttributionProps) => {
    if (!sourceName && !sourceUrl) return null;

    let displayName = sourceName;
    const isLink = !!sourceUrl;

    // Extract core domain if name is missing but URL exists
    if (!displayName && sourceUrl) {
        try {
            displayName = new URL(sourceUrl).hostname.replace('www.', '');
        } catch {
            displayName = "Original Source";
        }
    }

    return (
        <div className="flex items-center gap-2 mt-2 md:mt-0 print:text-black">
            <span className="text-gray-500 dark:text-gray-400">
                Adapted from:{' '}
                {isLink ? (
                    <a 
                        href={sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 font-bold hover:underline transition-colors"
                    >
                        {displayName}
                    </a>
                ) : (
                    <span className="font-bold text-gray-700 dark:text-gray-300 print:text-black">
                        {displayName}
                    </span>
                )}
            </span>
        </div>
    );
};
