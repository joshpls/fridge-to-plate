// client/src/utils/instructionUtils.ts

export interface InstructionItem {
    id: string;
    isHeader?: boolean;
    text: string;
}

/**
 * DB Text -> UI List: Parses markdown instruction text with `### Section Name` headers into UI items.
 */
export const rehydrateInstructions = (instructionsText: string): InstructionItem[] => {
    if (!instructionsText) {
        return [{ id: Math.random().toString(36).substring(7), isHeader: false, text: '' }];
    }

    const lines = instructionsText.split('\n');
    const items: InstructionItem[] = [];

    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
            const headerName = trimmed.replace(/^###\s+/, '').trim();
            items.push({
                id: `header-${Math.random().toString(36).substring(7)}`,
                isHeader: true,
                text: headerName
            });
        } else if (trimmed !== '') {
            // Remove leading step numbers if present (e.g., "1. " or "1)") so the editor doesn't duplicate them
            const cleanedText = trimmed.replace(/^[0-9]+[.)]\s*/, '');
            items.push({
                id: Math.random().toString(36).substring(7),
                isHeader: false,
                text: cleanedText
            });
        }
    }

    if (items.length === 0) {
        items.push({ id: Math.random().toString(36).substring(7), isHeader: false, text: '' });
    }

    return items;
};

/**
 * UI List -> DB Text: Serializes UI instruction items into markdown text with `### Section Name` headers.
 */
export const dehydrateInstructions = (items: InstructionItem[]): string => {
    let outputLines: string[] = [];
    let stepCounter = 1;

    items.forEach((item) => {
        if (item.isHeader) {
            const headerName = item.text?.trim();
            if (headerName) {
                outputLines.push(`\n### ${headerName}`);
                stepCounter = 1; // Reset step numbering per section if desired, or keep continuous
            }
        } else if (item.text?.trim()) {
            outputLines.push(`${stepCounter}. ${item.text.trim()}`);
            stepCounter++;
        }
    });

    return outputLines.join('\n').trim();
};

/**
 * Parses instructions text into structured sections for RecipeDetail and CookMode rendering.
 */
export const parseStructuredInstructions = (instructionsText: string) => {
    if (!instructionsText) return [];

    const lines = instructionsText.split('\n');
    const sections: { sectionName: string | null; steps: string[] }[] = [];
    
    let currentSection: string | null = null;
    let currentSteps: string[] = [];

    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
            if (currentSteps.length > 0 || currentSection !== null) {
                sections.push({ sectionName: currentSection, steps: currentSteps });
                currentSteps = [];
            }
            currentSection = trimmed.replace(/^###\s+/, '').trim();
        } else if (trimmed !== '') {
            const cleanedText = trimmed.replace(/^[0-9]+[.)]\s*/, '');
            currentSteps.push(cleanedText);
        }
    }

    if (currentSteps.length > 0 || currentSection !== null) {
        sections.push({ sectionName: currentSection, steps: currentSteps });
    }

    return sections;
};
