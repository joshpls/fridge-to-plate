import { useState } from 'react';
import { Sparkles, Clipboard, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SkippedItem {
    section: string;
    line: string;
}

interface RecipeImporterProps {
    taxonomy: any; // Receives your loaded taxonomy data (ingredients, units, modifiers)
    onImport: (parsedData: any, skipped: SkippedItem[]) => void;
}

export const RecipeImporter = ({ taxonomy, onImport }: RecipeImporterProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [skippedItems, setSkippedItems] = useState<SkippedItem[]>([]);
    const [hasImported, setHasImported] = useState(false);

    const handleParse = () => {
        if (!pasteText.trim()) {
            toast.error('Please paste some recipe text first!');
            return;
        }

        const lines = pasteText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return;

        // Guess the title (First line is usually the title unless it's a menu button)
        let title = '';
        for (const line of lines) {
            if (line.length > 3 && !/^(print|pin|share|★|\d|http)/i.test(line)) {
                title = line;
                break;
            }
        }

        let prepTime = '';
        let cookTime = '';
        let servings = '';
        const parsedInstructions: string[] = [];
        const parsedNutrition: any = { calories: '', carbohydrates: '', protein: '', fat: '' };
        const parsedIngredients: any[] = [];
        const unparsed: SkippedItem[] = [];

        // Parsing state machine
        let currentSection = 'Main Ingredients';
        let currentMode: 'NONE' | 'INGREDIENTS' | 'INSTRUCTIONS' | 'NUTRITION' = 'NONE';

        // Direct scan for standard meta patterns across the full block
        const textBlock = pasteText;
        const pMatch = textBlock.match(/Prep\s*(?:Time)?[:\s]*(\d+)/i);
        if (pMatch) prepTime = pMatch[1];
        
        const cMatch = textBlock.match(/Cook\s*(?:Time)?[:\s]*(\d+)/i);
        if (cMatch) cookTime = cMatch[1];

        const sMatch = textBlock.match(/(?:Servings|Yield|Serves)[:\s]*(\d+)/i);
        if (sMatch) servings = sMatch[1];

        // Line-by-line loop for structured elements
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Mode switches
            if (/^Ingredients/i.test(line)) {
                currentMode = 'INGREDIENTS';
                continue;
            }
            if (/^(Instructions|Directions|Preparation|Method)/i.test(line)) {
                currentMode = 'INSTRUCTIONS';
                continue;
            }
            if (/^(Nutrition|Nutrition Information)/i.test(line)) {
                currentMode = 'NUTRITION';
                continue;
            }

            if (currentMode === 'INGREDIENTS') {
                // Identify subsection text headers (e.g., "Topping:", "For the pasta")
                if (line.endsWith(':') || 
                    /^(For the|Topping|Base|Sauce|Filling|Dressing)/i.test(line) || 
                    (line.length < 30 && !/\d/.test(line) && line.toLowerCase() !== 'scale')
                ) {
                    if (line.toLowerCase() !== 'scale') {
                        currentSection = line.replace(/:$/, '').trim();
                    }
                    continue;
                }

                if (line.toLowerCase() === 'scale') continue;

                // Strip common bullet formats
                const cleanLine = line.replace(/^[\s•\-\d\.]+\.\s+/, '').replace(/^[\s•\-\*]+/, '').trim();

                // Regex matcher for [Amount] [Unit] [Ingredient text]
                const qtyRegex = /^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+\.\d+|\d+(?:\s*-\s*\d+)?))\s*(?:(cups?|c\b|tbsp?|tablespoons?|tsps?|teaspoons?|g|grams?|oz|ounces?|ml|milliliters?|lbs?|pounds?|can\b|cans\b|cloves?|stalks?|packages?|leaves?|slices?|jars?|bags?)\b)?\s*(.*)/i;
                const qtyMatch = cleanLine.match(qtyRegex);

                let amount = '1';
                let unitText = '';
                let searchIngredientText = cleanLine;

                if (qtyMatch) {
                    amount = qtyMatch[1] || '1';
                    unitText = qtyMatch[2] || '';
                    searchIngredientText = qtyMatch[3] || cleanLine;
                }

                // Clean extraneous notes like trailing punctuation or parentheses tags
                searchIngredientText = searchIngredientText.replace(/\([^)]+\)/g, '').replace(/,\s*.*$/, '').trim().toLowerCase();

                // Match against your client taxonomy
                const matchedIngredient = taxonomy?.ingredients?.find((ing: any) => 
                    searchIngredientText.includes(ing.name.toLowerCase()) || 
                    ing.name.toLowerCase().includes(searchIngredientText)
                );

                const matchedUnit = unitText && taxonomy?.units?.find((u: any) => 
                    u.name.toLowerCase().startsWith(unitText.toLowerCase()) ||
                    u.abbreviation.toLowerCase() === unitText.toLowerCase()
                );

                const matchedModifier = taxonomy?.modifiers?.find((m: any) => 
                    cleanLine.toLowerCase().includes(m.name.toLowerCase())
                );

                // Requirements: If ingredient doesn't pop in, skip adding to live form rows
                if (matchedIngredient) {
                    parsedIngredients.push({
                        id: `imported-${Math.random().toString(36).substring(7)}`,
                        ingredientId: matchedIngredient.id,
                        amount: amount,
                        unitId: matchedUnit ? matchedUnit.id : (taxonomy?.units?.[0]?.id || ''),
                        modifierId: matchedModifier ? matchedModifier.id : '',
                        sectionName: currentSection === 'Main Ingredients' ? '' : currentSection,
                    });
                } else {
                    unparsed.push({ section: currentSection, line: line });
                }
            }

            if (currentMode === 'INSTRUCTIONS') {
                const cleanIns = line.replace(/^\d+[\.\s\-]+/, '').trim();
                if (cleanIns && cleanIns.length > 5 && !/^(notes|nutrition)/i.test(cleanIns)) {
                    parsedInstructions.push(cleanIns);
                }
            }

            if (currentMode === 'NUTRITION') {
                const calMatch = line.match(/Calories[:\s]*(\d+)/i);
                if (calMatch) parsedNutrition.calories = parseInt(calMatch[1]);

                const carbMatch = line.match(/(?:Carbohydrates|Carbs)[:\s]*(\d+)/i);
                if (carbMatch) parsedNutrition.carbohydrates = parseInt(carbMatch[1]);

                const proteinMatch = line.match(/Protein[:\s]*(\d+)/i);
                if (proteinMatch) parsedNutrition.protein = parseInt(proteinMatch[1]);

                const fatMatch = line.match(/(?:Total )?Fat[:\s]*(\d+)/i);
                if (fatMatch) parsedNutrition.fat = parseInt(fatMatch[1]);
            }
        }

        // Aggregate gathered fields
        const finalizedData = {
            name: title,
            prepTime: prepTime,
            cookTime: cookTime,
            servings: servings,
            instructions: parsedInstructions.join('\n\n'),
            ingredients: parsedIngredients,
            nutrition: parsedNutrition
        };

        setSkippedItems(unparsed);
        setHasImported(true);
        onImport(finalizedData, unparsed);
        toast.success('Fields auto-populated from paste data!');
    };

    return (
        <div className="w-full bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-5 mb-6 transition-all shadow-sm">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-left font-black text-gray-800 dark:text-gray-100 text-base sm:text-lg focus:outline-none"
            >
                <div className="flex items-center gap-2.5 text-orange-500 dark:text-orange-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span>⚡ Paste & Auto-Populate Recipe</span>
                </div>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg text-gray-500 font-bold">
                    {isOpen ? 'Collapse' : 'Expand'}
                </span>
            </button>

            {isOpen && (
                <div className="mt-4 animate-in fade-in duration-200">
                    <p className="text-xs text-gray-400 font-medium mb-3">
                        Copy a full page or a card from any recipe website and paste it directly below. We'll attempt to automatically map out titles, times, directions, and cross-reference ingredients against your database.
                    </p>
                    
                    <div className="relative">
                        <textarea
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            placeholder="Paste full text here... (Including Title, Times, Ingredients, and Steps)"
                            className="w-full h-40 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 focus:border-orange-500 outline-none font-medium text-sm text-gray-700 dark:text-gray-300 transition-colors"
                        />
                        {pasteText && (
                            <button
                                type="button"
                                onClick={() => setPasteText('')}
                                className="absolute bottom-3 right-3 text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleParse}
                        className="w-full mt-3 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.99] transition-all"
                    >
                        <Clipboard className="w-4 h-4" />
                        Parse Data & Fill Form
                    </button>

                    {/* Notice box stating what could not be automatically matched */}
                    {hasImported && (
                        <div className="mt-4 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 bg-gray-50 dark:bg-gray-950/40">
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Import Summary
                            </h4>
                            
                            {skippedItems.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex gap-2 items-start bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 p-3 rounded-xl text-xs font-semibold leading-relaxed">
                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="font-bold block mb-0.5">Not all items could be populated:</strong>
                                            The following items weren't found in your system inventory. Please add them or check your spelling manually:
                                        </div>
                                    </div>
                                    
                                    <div className="max-h-36 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 text-xs text-gray-600 dark:text-gray-400 font-bold">
                                        {skippedItems.map((item, idx) => (
                                            <div key={idx} className="p-2 flex items-center justify-between gap-3">
                                                <span className="truncate italic">{item.line}</span>
                                                <span className="shrink-0 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black px-1.5 py-0.5 rounded text-[10px] uppercase">
                                                    {item.section}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                    🎉 Perfect Sync! All listed fields and ingredients were successfully matched.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
