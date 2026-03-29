interface ModifiersSeedItem {
    name: string;
}

const modifiers = [
    // Knife Skills
    'Minced', 'Chopped', 'Diced', 'Sliced', 'Slivered',
    'Shredded', 'Grated', 'Julienned', 'Chiffonade', 'Crushed', 'Smashed',
    // Processing
    'Peeled', 'Pitted', 'Seeded', 'Stemmed', 'Zested',
    'Cored', 'Trimmed', 'Deveined', 'Shucked',
    // State/Temp
    'Softened', 'Melted', 'Chilled', 'Frozen', 'Room Temperature',
    'Toasted', 'Roasted', 'Pureed', 'Mashed',
    // Protein
    'Boneless', 'Skinless', 'Bone-in', 'Skin-on', 'Thin-cut',
    'Butterfly-cut', 'Ground',
    // Measurement
    'Packed', 'Heaping', 'Level', 'Scant'
];




export const modifiersToSeed = (): ModifiersSeedItem[] => {
    return [
        ...modifiers.map(name => ({ name }))
    ];
};
