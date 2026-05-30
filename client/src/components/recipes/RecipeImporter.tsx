import React, { useState } from 'react';
import { Sparkles, Clipboard, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SkippedItem {
    section: string;
    line: string;
}

interface MissingUnitItem {
    ingredientName: string;
    line: string;
}

interface RecipeImporterProps {
    taxonomy: any;
    onImport: (parsedData: any, skipped: SkippedItem[], missingUnits: MissingUnitItem[]) => void;
}

export const RecipeImporter = ({ taxonomy, onImport }: RecipeImporterProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [skippedItems, setSkippedItems] = useState<SkippedItem[]>([]);
    const [missingUnitsList, setMissingUnitsList] = useState<MissingUnitItem[]>([]);
    const [hasImported, setHasImported] = useState(false);

    const handleParse = () => {
        if (!pasteText.trim()) {
            toast.error('Please paste recipe text content!');
            return;
        }

        const lines = pasteText.split('\n').map(l => l.trim());
        const filteredLines = lines.filter(Boolean);
        if (filteredLines.length === 0) return;

        const fullText = pasteText;

        // 1. Identify Title
        let title = '';
        let titleIndex = -1;
        for (let i = 0; i < filteredLines.length; i++) {
            if (filteredLines[i].length > 3 && !/^(print|pin|share|★|\d|http|course|cuisine|author|prep|cook|total|yield|category)/i.test(filteredLines[i])) {
                title = filteredLines[i].replace(/\|.*$/, '').trim(); // strip site suffixes
                titleIndex = i;
                break;
            }
        }

        // 2. Extrapolate Description (Scanning lines immediately following the title)
        let description = '';
        if (titleIndex !== -1) {
            for (let i = titleIndex + 1; i < Math.min(filteredLines.length, titleIndex + 6); i++) {
                const line = filteredLines[i];
                // Break loop if we hit common metadata, rating stars, or section headers
                if (/^(prep|cook|total|yield|servings|ingredients|instructions|directions|course|cuisine|author|nutrition)/i.test(line) || 
                    line.includes('★') || 
                    /^\d+\.?\d*\s*from\s*\d+\s*reviews/i.test(line)) {
                    break;
                }
                // If it looks like a substantive sentence, append it
                if (line.length > 25 && !line.includes(':') && !line.includes('Author')) {
                    description += (description ? ' ' : '') + line;
                }
            }
        }

        // 3. Meta Targets
        let prepTime = fullText.match(/(?:Prep\s*Time|Prep)[:\s]*(\d+)/i)?.[1] || '';
        let cookTime = fullText.match(/(?:Cook\s*Time|Cook)[:\s]*(\d+)/i)?.[1] || '';
        let servings = fullText.match(/(?:Serving|Servings|Yield|Serves)[:\s]*(\d+(?:\s*-\s*\d+)?|\d+)/i)?.[1] || '';
        let author = fullText.match(/(?:Author|Adapted\s*from)[:\s]*(.*)/i)?.[1] || '';
        let method = fullText.match(/(?:Method)[:\s]*(.*)/i)?.[1] || '';
        let extractedCategory = fullText.match(/(?:Category|Course)[:\s]*(.*)/i)?.[1] || '';
        
        let sourceUrl = '';
        const urlMatch = fullText.match(/https?:\/\/[^\s]+/i);
        if (urlMatch) {
            sourceUrl = urlMatch[0];
        } else if (fullText.includes('www.dotenvx.com')) {
            sourceUrl = ''; // Safe filter
        }

        // Category matching
        let matchedCategoryId = '';
        if (extractedCategory && taxonomy?.recipeCategories) {
            const foundCat = taxonomy.recipeCategories.find((c: any) => 
                c.name.toLowerCase().includes(extractedCategory.trim().toLowerCase()) ||
                extractedCategory.trim().toLowerCase().includes(c.name.toLowerCase())
            );
            if (foundCat) matchedCategoryId = foundCat.id;
        }

        // --- Nutrition Matrix ---
        const nutrition: any = {
            calories: '', carbohydrates: '', protein: '', fat: '', fiber: '', sugar: '', sodium: '', potassium: '',
            vitaminA: '', vitaminB6: '', vitaminC: '', vitaminE: '', calcium: '', iron: '', zinc: '', saturatedFat: '', polyunsaturatedFat: '', monounsaturatedFat: '', transFat: '', omega3: '', omega6: ''
        };

        const parseNutritionField = (regexes: RegExp[], targetKey: string) => {
            for (const rx of regexes) {
                const match = fullText.match(rx);
                if (match && match[1]) {
                    const rawValue = match[1].trim();
                    
                    if (targetKey === 'calories') {
                        // Keep calories as a clean string/number without any units attached
                        nutrition[targetKey] = rawValue;
                    } else {
                        // Extract and normalize the trailing unit string
                        const rawUnit = match[2] ? match[2].trim().toLowerCase() : '';
                        let standardAbbreviation = 'g'; // Standard metric macro fallback

                        if (rawUnit.includes('milligram') || rawUnit.startsWith('mg')) {
                            standardAbbreviation = 'mg';
                        } else if (rawUnit.includes('gram') || rawUnit.startsWith('g')) {
                            standardAbbreviation = 'g';
                        } else if (rawUnit.includes('%') || rawUnit.includes('dv') || rawUnit.includes('percent')) {
                            standardAbbreviation = '% DV';
                        } else {
                            // Smart fallback default configurations if no specific match is inferred
                            if (['sodium'].includes(targetKey)) {
                                standardAbbreviation = 'mg';
                            } else if (targetKey.startsWith('vitamin') || ['calcium', 'iron', 'potassium', 'magnesium', 'zinc'].includes(targetKey)) {
                                standardAbbreviation = '% DV';
                            }
                        }
                        nutrition[targetKey] = `${rawValue}${standardAbbreviation}`;
                    }
                    break;
                }
            }
        };

        parseNutritionField([/Calories[:\s]*(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*calories/i], 'calories');
        parseNutritionField([/Carbohydrates[:\s]*(\d+(?:\.\d+)?)\s*(g|grams?|%)?/i, /Carbs[:\s]*(\d+(?:\.\d+)?)\s*(g|grams?|%)?/i], 'carbohydrates');
        parseNutritionField([/Protein[:\s]*(\d+(?:\.\d+)?)\s*(g|grams?)?/i], 'protein');
        parseNutritionField([/(?:Total\s*)?Fat[:\s]*(\d+(?:\.\d+)?)\s*(g|grams?)?/i], 'fat');
        parseNutritionField([/Fiber[:\s]*(\d+(?:\.\d+)?)\s*(g|grams?)?/i], 'fiber');
        parseNutritionField([/Sugar[:\s]*(\d+(?:\.\d+)?)\s*(g|grams?)?/i], 'sugar');
        parseNutritionField([/Sodium[:\s]*(\d+(?:\.\d+)?)\s*(mg|milligrams?|g|grams?)?/i], 'sodium');
        parseNutritionField([/Potassium[:\s]*(\d+(?:\.\d+)?)\s*(mg|milligrams?|%\s*DV|%)?/i], 'potassium');
        parseNutritionField([/Calcium[:\s]*(\d+(?:\.\d+)?)\s*(mg|milligrams?|%\s*DV|%)?/i], 'calcium');
        parseNutritionField([/Iron[:\s]*(\d+(?:\.\d+)?)\s*(mg|milligrams?|%\s*DV|%)?/i], 'iron');
        parseNutritionField([/Zinc[:\s]*(\d+(?:\.\d+)?)\s*(mg|milligrams?|%\s*DV|%)?/i], 'zinc');
        parseNutritionField([/Vitamin\s*A[:\s]*(\d+(?:\.\d+)?)\s*(%\s*DV|%|iu|ui)?/i], 'vitaminA');
        parseNutritionField([/Vitamin\s*B6[:\s]*(\d+(?:\.\d+)?)\s*(%\s*DV|%|mg)?/i], 'vitaminB6');
        parseNutritionField([/Vitamin\s*C[:\s]*(\d+(?:\.\d+)?)\s*(%\s*DV|%|mg)?/i], 'vitaminC');
        parseNutritionField([/Vitamin\s*E[:\s]*(\d+(?:\.\d+)?)\s*(%\s*DV|%|mg)?/i], 'vitaminE');
        parseNutritionField([/Saturated\s*Fat[:\s]*(\d+(?:\.\d+)?)\s*(g|grams?)?/i], 'saturatedFat');
        parseNutritionField([/Polyunsaturated\s*Fat[:\s]*(\d+(?:\.\d+)?)\s*(g|grams?)?/i], 'polyunsaturatedFat');
        parseNutritionField([/Monounsaturated\s*Fat[:\s]*(\d+(?:\.\d+)?)\s*(g|grams?)?/i], 'monounsaturatedFat');
        parseNutritionField([/Trans\s*Fat[:\s]*(\d+(?:\.\d+)?)\s*(g|grams?)?/i], 'transFat');
        parseNutritionField([/Omega\s*3[:\s]*(\d+(?:\.\d+)?)\s*(mg|g|%\s*DV)?/i], 'omega3');
        parseNutritionField([/Omega\s*6[:\s]*(\d+(?:\.\d+)?)\s*(mg|g|%\s*DV)?/i], 'omega6');


        // --- Arrays ---
        const parsedInstructions: string[] = [];
        const parsedNotes: string[] = [];
        const parsedIngredients: any[] = [];
        const unparsed: SkippedItem[] = [];
        const missingUnits: MissingUnitItem[] = [];

        let currentSection = 'Ingredients';
        let currentMode: 'NONE' | 'INGREDIENTS' | 'INSTRUCTIONS' | 'NOTES' = 'NONE';

        // Pre-sort taxonomy units by length descending (so "fluid ounce" matches before "ounce")
        const sortedUnits = [...(taxonomy?.units || [])].sort((a: any, b: any) => {
            const aLen = Math.max(a.name?.length || 0, a.abbreviation?.length || 0);
            const bLen = Math.max(b.name?.length || 0, b.abbreviation?.length || 0);
            return bLen - aLen;
        });

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (/^Ingredients/i.test(line)) { currentMode = 'INGREDIENTS'; continue; }
            if (/^(Instructions|Directions|Preparation|Method)/i.test(line)) { currentMode = 'INSTRUCTIONS'; continue; }
            if (/^(Notes|Recipe Notes)/i.test(line)) { currentMode = 'NOTES'; continue; }
            if (/^(Nutrition|Nutrition Information)/i.test(line)) { currentMode = 'NONE'; continue; }

            if (currentMode === 'INGREDIENTS') {
                if (line.endsWith(':') || /^(For the|Topping|Base|Sauce|Filling|Dressing|For pasta)/i.test(line)) {
                    if (line.toLowerCase() !== 'scale') {
                        currentSection = line.replace(/:$/, '').trim();
                    }
                    continue;
                }
                if (line.toLowerCase() === 'scale') continue;

                const cleanLine = line.replace(/^[\s•\-\d\.]+\.\s+/, '').replace(/^[\s•\-\*]+/, '').trim();
                
                // 1. Extract Quantity first (handles whole numbers, decimals, and fractions)
                const qtyRegex = /^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+\.\d+|\d+(?:\s*-\s*\d+)?))\s*(.*)/i;
                const qtyMatch = cleanLine.match(qtyRegex);

                let amount = '';
                let restOfLine = cleanLine;

                if (qtyMatch) {
                    amount = qtyMatch[1].trim();
                    restOfLine = qtyMatch[2].trim();
                }

                // 2. Dynamically extract Unit from taxonomy
                let matchedUnit: any = null;
                let searchIngredientText = restOfLine;

                for (const u of sortedUnits) {
                    const name = u.name?.toLowerCase() || '';
                    const abbr = u.abbreviation?.toLowerCase() || '';
                    
                    // Generate plurals to check against the string
                    const forms = [name, name + 's', name + 'es', abbr, abbr + 's'].filter(Boolean);
                    
                    let found = false;
                    for (const form of forms) {
                        // Regex matches whole word at the start of the remaining string
                        const regex = new RegExp(`^${form}\\b`, 'i');
                        if (regex.test(restOfLine)) {
                            matchedUnit = u;
                            searchIngredientText = restOfLine.replace(regex, '').trim();
                            found = true;
                            break;
                        }
                    }
                    if (found) break; // Break out of unit checking once we found a match
                }

                // Cleanup search text (remove commas, parentheses, etc)
                searchIngredientText = searchIngredientText.replace(/\([^)]+\)/g, '').replace(/,\s*.*$/, '').trim().toLowerCase();

                // 3. Match Ingredient Name prioritizing Exact match or Closest length match
                const searchLower = searchIngredientText.trim();
                let matchedIngredient = null;

                if (taxonomy?.ingredients) {
                    // Pass A: Try to find a strict, precise exact match first
                    matchedIngredient = taxonomy.ingredients.find((ing: any) => 
                        ing.name.toLowerCase() === searchLower
                    );

                    // Pass B: If no exact match found, query partial tokens and prefer the closest text length footprint
                    if (!matchedIngredient) {
                        const potentialMatches = taxonomy.ingredients.filter((ing: any) => {
                            const ingNameLower = ing.name.toLowerCase();
                            return searchLower.includes(ingNameLower) || ingNameLower.includes(searchLower);
                        });

                        if (potentialMatches.length > 0) {
                            // Sort descending by name length (e.g. "Garlic Powder" matches before "Garlic")
                            potentialMatches.sort((a: any, b: any) => b.name.length - a.name.length);
                            matchedIngredient = potentialMatches[0];
                        }
                    }
                }

                const matchedModifier = taxonomy?.modifiers?.find((m: any) => 
                    cleanLine.toLowerCase().includes(m.name.toLowerCase())
                );

                if (matchedIngredient) {
                    // Track if the unit wasn't matched so the user knows they need to fill it in
                    if (amount && !matchedUnit) {
                        missingUnits.push({ ingredientName: matchedIngredient.name, line: cleanLine });
                    }

                    parsedIngredients.push({
                        id: `imported-${Math.random().toString(36).substring(7)}`,
                        ingredientId: matchedIngredient.id,
                        amount: amount || '1',
                        unitId: matchedUnit ? matchedUnit.id : '', // Intentionally left blank to force user selection
                        modifierId: matchedModifier ? matchedModifier.id : '',
                        sectionName: currentSection === 'Ingredients' ? '' : currentSection,
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

            if (currentMode === 'NOTES') {
                const cleanNote = line.replace(/^[\s•\-\*]+/, '').trim();
                if (cleanNote && !/^(nutrition)/i.test(cleanNote)) {
                    parsedNotes.push(cleanNote);
                }
            }
        }

        const aggregatedResult = {
            name: title,
            description: description,
            prepTime: prepTime,
            cookTime: cookTime,
            servings: servings,
            originalAuthor: author.trim(),
            sourceUrl: sourceUrl.trim(),
            method: method.trim(),
            categoryId: matchedCategoryId,
            instructions: parsedInstructions.join('\n\n'),
            notes: parsedNotes.join('\n\n'),
            ingredients: parsedIngredients,
            nutrition
        };

        setSkippedItems(unparsed);
        setMissingUnitsList(missingUnits);
        setHasImported(true);
        onImport(aggregatedResult, unparsed, missingUnits);
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
                        Copy text details from standard recipe configurations. The importer auto-detects descriptions, macros, missing unit mismatches, custom notes sections, and system ingredients.
                    </p>
                    
                    <div className="relative">
                        <textarea
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            placeholder="Paste text contents here..."
                            className="w-full h-44 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 focus:border-orange-500 outline-none font-medium text-sm text-gray-700 dark:text-gray-300 transition-colors"
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
                        Parse & Populate Content
                    </button>

                    {hasImported && (
                        <div className="mt-4 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 bg-gray-50 dark:bg-gray-950/40">
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Synchronization Status Summary
                            </h4>
                            
                            {/* Skipped Ingredients Alert */}
                            {skippedItems.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    <div className="flex gap-2 items-start bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 p-3 rounded-xl text-xs font-semibold leading-relaxed">
                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="font-bold block mb-0.5">Unmapped items requiring review:</strong>
                                            The items below didn't match anything in your ingredient database and were skipped. Please select or add them manually:
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
                            )}

                            {/* Missing Units Alert */}
                            {missingUnitsList.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex gap-2 items-start bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 text-blue-800 dark:text-blue-400 p-3 rounded-xl text-xs font-semibold leading-relaxed">
                                        <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="font-bold block mb-0.5">Missing Units:</strong>
                                            We found the ingredients below, but couldn't match their measurement unit. We added the ingredient, but left the unit blank for you to fill in:
                                        </div>
                                    </div>
                                    
                                    <div className="max-h-36 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 text-xs text-gray-600 dark:text-gray-400 font-bold">
                                        {missingUnitsList.map((item, idx) => (
                                            <div key={idx} className="p-2 flex items-center justify-between gap-3">
                                                <span className="truncate italic">{item.line}</span>
                                                <span className="shrink-0 text-blue-600 dark:text-blue-400 font-black">
                                                    {item.ingredientName}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {skippedItems.length === 0 && missingUnitsList.length === 0 && (
                                <p className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                    🎉 Perfect Sync! All components, ingredients, and units parsed successfully.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
