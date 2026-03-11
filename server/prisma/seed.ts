import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

// Simple helper to create URL-friendly slugs
const slugify = (text: string) => 
  text.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

async function main() {
  await prisma.$transaction(async (tx) => {
    console.log('🚀 Upserting Dev User...');
    await tx.user.upsert({
      where: { id: TEMP_USER_ID },
      update: {},
      create: { 
        id: TEMP_USER_ID, 
        email: "dev@example.com",
        password: "secure_dev_password" // Added mandatory password [cite: 1]
      },
    });

    const ingredientNames = ['Eggs', 'Milk', 'Butter', 'Pasta', 'Tomato Sauce', 'Garlic'];
    
    console.log('🌿 Syncing Ingredients...');
    const ingredients = await Promise.all(
      ingredientNames.map(name => 
        tx.ingredient.upsert({ where: { name }, update: {}, create: { name } })
      )
    );
    
    const ingMap = Object.fromEntries(ingredients.map(i => [i.name, i.id]));

    console.log('👨‍🍳 Creating Recipes with Slugs...');
    const recipes = [
      {
        name: 'Scrambled Eggs',
        instructions: 'Whisk eggs and milk, cook in butter.',
        items: ['Eggs', 'Milk', 'Butter']
      },
      {
        name: 'Pasta Marinara',
        instructions: 'Boil pasta, add sauce and garlic.',
        items: ['Pasta', 'Tomato Sauce', 'Garlic']
      }
    ];

    for (const r of recipes) {
      const slug = slugify(r.name);
      
      await tx.recipe.upsert({
        where: { slug: slug }, // Use slug for unique identification
        update: {
          name: r.name,
          instructions: r.instructions,
        },
        create: {
          name: r.name,
          slug: slug,
          instructions: r.instructions,
          authorId: TEMP_USER_ID, // Added mandatory author link [cite: 5]
          ingredients: {
            create: r.items.map(itemName => ({ 
              ingredientId: ingMap[itemName],
              amount: "1 unit" // Added mandatory amount [cite: 7]
            }))
          }
        }
      });
    }
  });

  console.log('✨ Seeded successfully.');
}

main()
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
  