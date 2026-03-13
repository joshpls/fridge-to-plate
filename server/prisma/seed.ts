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
// 1. Setup Categories
    const categoryNames = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks'];
    for (const name of categoryNames) {
      await tx.category.upsert({ where: { name }, update: {}, create: { name } });
    }
    const catMap = (await tx.category.findMany()).reduce((acc, c) => ({ ...acc, [c.name]: c.id }), {} as any);

    // 2. Setup Tags
    const tagsData = [
      { name: 'Vegan', code: 'V' },
      { name: 'Gluten-Free', code: 'GF' },
      { name: 'Dairy-Free', code: 'DF' },
      { name: 'Soy-Free', code: 'SF' }
    ];
    for (const t of tagsData) {
      await tx.tag.upsert({ where: { code: t.code }, update: { name: t.name }, create: t });
    }
    const tagMap = (await tx.tag.findMany()).reduce((acc, t) => ({ ...acc, [t.name]: t.id }), {} as any);

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

    const ingredientNames = ['Eggs', 'Milk', 'Butter', 'Pasta', 'Tomato Sauce', 'Garlic', 'Vegan Butter', 'Brown Sugar', 'Granulated Sugar', 'Pumpkin Puree', 'Vanilla Extract', 'All-Purpose Flour', 'Cream of Tartar', 'Baking Soda', 'Salt', 'Cinnamon', 'Pumpkin Pie Spice'];

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
      },
      {
        name: 'Vegan Pumpkin Snickerdoodles',
        instructions: "In the bowl of a stand mixer with the paddle attachment or other large bowl with a handheld mixer, beat the vegan butter and sugars together until creamy, about 2 minutes.\nAdd the pumpkin puree and vanilla and mix until combined, scraping the sides and bottom of the bowl as needed.\nStop the mixer and add the flour. Sprinkle the cream of tartar, baking soda, salt, cinnamon and pumpkin pie spice on top of the flour. Turn the mixer on low speed and mix until just combined. Scrape the bottom and sides to make sure everything is well combined.\nCover the bowl and chill the cookie dough in the refrigerator for 1 hour. If you skip this step, the cookies won't be very chewy. So chill if you can!\nPreheat the oven to 350 degrees F and line two cookie sheets with parchment paper.\nTake about 1 1/2 tablespoons of dough and roll into a ball. Repeat, and roll all the balls in the cinnamon sugar topping. Place on baking sheets at least 2 inches apart and bake for 11-13 minutes. The cookies will be very soft, but firm up as they cool so be careful not to over bake. Let them cool for 10 minutes on the pan, then transfer to a cooling rack. Enjoy!",
        items: ['Vegan Butter', 'Brown Sugar', 'Granulated Sugar', 'Pumpkin Puree', 'Vanilla Extract', 'All-Purpose Flour', 'Cream of Tartar', 'Baking Soda', 'Salt', 'Cinnamon', 'Pumpkin Pie Spice']
      }
    ];

    for (const r of recipes) {
      const slug = slugify(r.name);

      await tx.recipe.upsert({
        where: { slug: slug },
        update: {
          categoryId: catMap['Dinner'], // Updates existing rows with a category
        },
        create: {
          name: r.name,
          slug: slug,
          instructions: r.instructions,
          authorId: TEMP_USER_ID,
          categoryId: catMap['Dinner'],
          tags: {
            connect: [{ id: tagMap['Vegan'] }]
          },
          ingredients: {
            create: r.items.map(itemName => ({
              ingredientId: ingMap[itemName],
              amount: "1 unit"
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
