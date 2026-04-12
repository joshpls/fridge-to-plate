import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { generateUniqueSlug } from '../src/utils/helperFunctions.js';
import { categoryNames, subCategories, tagsData } from './taxonomy.js';
import { ingredientsToSeed } from './ingredients.js';
import { ingredientCategories } from './IngredientCategories.js'
import { recipes } from './recipes.js';
import bcrypt from 'bcrypt';
import { modifiersToSeed } from './modifiers.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

async function main() {
  await prisma.$transaction(async (tx) => {
    // 1. Setup Recipe Categories
    console.log('📂 Syncing Recipe Categories...');
    // for (const name of categoryNames) {
    //   await tx.category.upsert({ where: { name }, update: {}, create: { name } });
    // }
    // const catMap = (await tx.category.findMany()).reduce((acc, c) => ({ ...acc, [c.name]: c.id }), {} as any);

    // 2. Setup Recipe Subcategories
    console.log('📂 Syncing Recipe Subcategories...');
    // const subCatMap: Record<string, string> = {};
    // for (const sub of subCategories) {
    //     if (!sub.name) continue;
    //     const created = await tx.subcategory.upsert({
    //         where: { name: sub.name },
    //         update: { categoryId: catMap[sub.parent] },
    //         create: { name: sub.name, categoryId: catMap[sub.parent] }
    //     });
    //     subCatMap[sub.name] = created.id;
    // }
    
    // 3. Setup Ingredient Categories
    console.log('📂 Syncing Ingredient Categories...');
    for (const name of ingredientCategories) {
        await tx.ingredientCategory.upsert({ where: { name }, update: {}, create: { name } });
    }
    const ingCatMap = (await tx.ingredientCategory.findMany()).reduce((acc, c) => ({ ...acc, [c.name]: c.id }), {} as any);

    // 4. Setup Tags
    console.log('📂 Syncing Tags...');
    // for (const t of tagsData) {
    //   await tx.tag.upsert({ where: { code: t.code }, update: { name: t.name }, create: t });
    // }
    // const tagMap = (await tx.tag.findMany()).reduce((acc, t) => ({ ...acc, [t.code]: t.id }), {} as any);

    // 5. User Setup
    console.log('🚀 Upserting Dev User...');
    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    // await tx.user.upsert({
    //   where: { id: TEMP_USER_ID },
    //   update: { password: hashedAdminPassword, role: 'ADMIN' },
    //   create: { id: TEMP_USER_ID, email: "dev@example.com", password: hashedAdminPassword, role: 'ADMIN' },
    // });
    
    // 6. Sync Units
    console.log('📏 Syncing Units...');
    // const units = [
    //     { name: 'Cup', abbreviation: 'c' },
    //     { name: 'Teaspoon', abbreviation: 'tsp' },
    //     { name: 'Tablespoon', abbreviation: 'tbsp' },
    //     { name: 'Whole', abbreviation: 'unit' },
    //     { name: 'Gram', abbreviation: 'g' }
    // ];
    // const unitMap: Record<string, string> = {};
    // for (const u of units) {
    //     const created = await tx.unit.upsert({ where: { name: u.name }, update: { abbreviation: u.abbreviation }, create: u });
    //     unitMap[u.name] = created.id;
    // }

    // 7. Sync Ingredients (with Categories)
    console.log('🌿 Syncing Ingredients...');
    const ingredientData = ingredientsToSeed();
    const seededIngredients = await Promise.all(
      ingredientData.map(item =>
        tx.ingredient.upsert({
          where: { name: item.name },
          update: { isDefaultStaple: item.isStaple, categoryId: ingCatMap[item.category] || null },
          create: { name: item.name, isDefaultStaple: item.isStaple, categoryId: ingCatMap[item.category] || null }
        })
      )
    );
    const ingMap = seededIngredients.reduce((acc, ing) => { acc[ing.name] = ing.id; return acc; }, {} as Record<string, string>);

    // 8. Sync Modifiers
    console.log('🌿 Syncing Modifiers...');
    // const modifierData = modifiersToSeed();
    // for (const item of modifierData) {
    //     await tx.modifier.upsert({
    //         where: { name: item.name },
    //         update: {},
    //         create: { name: item.name }
    //     });
    // }

    // 9. Create Recipes
    console.log('👨‍🍳 Creating Recipes...');
    // for (const r of recipes) {
    //   const slug = generateUniqueSlug(r.name);
    //   await tx.recipe.upsert({
    //     where: { slug },
    //     update: {},
    //     create: {
    //       name: r.name,
    //       slug,
    //       summary: r.summary,
    //       instructions: r.instructions,
    //       prepTime: r.prepTime,
    //       cookTime: r.cookTime,
    //       totalTime: (r.prepTime || 0) + (r.cookTime || 0),
    //       servings: r.servings,
    //       notes: r.notes,
    //       nutrition: r.nutrition || {},
    //       authorId: TEMP_USER_ID,
    //       categoryId: catMap[r.category] || null,
    //       subcategoryId: subCatMap[r.subcategory] || null,
    //       tags: { connect: r.tags.map(code => ({ id: tagMap[code] })).filter(t => t.id) },
    //       ingredients: {
    //         create: r.items.map(item => {
    //             const ingredientId = ingMap[item.name];
    //             const unitId = unitMap[item.unit];
    //             if (!ingredientId || !unitId) {
    //                 console.warn(`Skipping ingredient ${item.name} for recipe ${r.name} due to missing ID`);
    //                 return null;
    //             }
    //             return {
    //                 amount: item.amount,
    //                 ingredient: { connect: { id: ingredientId } },
    //                 unit: { connect: { id: unitId } }
    //             };
    //         }).filter(Boolean) as any
    //       }
    //     }
    //   });
    // }

  });
  console.log('✨ Seeded successfully.');
}

main()
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
