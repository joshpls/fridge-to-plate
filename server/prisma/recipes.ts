    export const recipes = [
      {
        name: 'Scrambled Eggs',
        instructions: 'Whisk eggs and milk, cook in butter.',
        category: 'Breakfast & Brunch',
        subcategory: 'Eggs',
        items: [
          { name: 'Eggs', amount: 2, unit: 'Whole' },
          { name: 'Milk', amount: 0.25, unit: 'Cup' },
          { name: 'Butter', amount: 1, unit: 'Tablespoon' },
        ],
        tags: []
      },
      {
        name: 'Pasta Marinara',
        instructions: 'Boil pasta, add sauce and garlic.',
        category: 'Main Dishes',
        subcategory: 'Pasta',
        items: [
          { name: 'Pasta', amount: 1, unit: 'Cup' },
          { name: 'Tomato Sauce', amount: 0.5, unit: 'Cup' },
          { name: 'Garlic', amount: 1, unit: 'Whole' },
        ],
        tags: []
      },
      {
        name: 'Vegan Pumpkin Snickerdoodles',
        summary: 'Make these soft and thick Vegan Pumpkin Snickerdoodles for a fall treat! They’re easy to make in 1 bowl with real pumpkin, cream of tartar, and pumpkin pie spices, then rolled in cinnamon sugar for extra sweetness.',
        instructions: "In the bowl of a stand mixer with the paddle attachment or other large bowl with a handheld mixer, beat the vegan butter and sugars together until creamy, about 2 minutes.\nAdd the pumpkin puree and vanilla and mix until combined, scraping the sides and bottom of the bowl as needed.\nStop the mixer and add the flour. Sprinkle the cream of tartar, baking soda, salt, cinnamon and pumpkin pie spice on top of the flour. Turn the mixer on low speed and mix until just combined. Scrape the bottom and sides to make sure everything is well combined.\nCover the bowl and chill the cookie dough in the refrigerator for 1 hour. If you skip this step, the cookies won't be very chewy. So chill if you can!\nPreheat the oven to 350 degrees F and line two cookie sheets with parchment paper.\nTake about 1 1/2 tablespoons of dough and roll into a ball. Repeat, and roll all the balls in the cinnamon sugar topping. Place on baking sheets at least 2 inches apart and bake for 11-13 minutes. The cookies will be very soft, but firm up as they cool so be careful not to over bake. Let them cool for 10 minutes on the pan, then transfer to a cooling rack. Enjoy!",
        prepTime: 20,
        cookTime: 12,
        totalTime: 92,     
        servings: 18,
        category: 'Desserts',
        subcategory: 'Cookies',
        items: [
          { name: 'Vegan Butter', amount: 0.5, unit: 'Cup' },
          { name: 'Brown Sugar', amount: 0.5, unit: 'Cup' },
          { name: 'Granulated Sugar', amount: 0.5, unit: 'Cup' },
          { name: 'Pumpkin Puree', amount: 6, unit: 'Tablespoon' },
          { name: 'Vanilla Extract', amount: 2, unit: 'Teaspoon' },
          { name: 'All-Purpose Flour', amount: 1.75, unit: 'Cup' },
          { name: 'Cream of Tartar', amount: 1, unit: 'Teaspoon' },
          { name: 'Baking Soda', amount: 0.5, unit: 'Teaspoon' },
          { name: 'Salt', amount: 0.25, unit: 'Teaspoon' },
          { name: 'Cinnamon', amount: 1, unit: 'Teaspoon' },
          { name: 'Pumpkin Pie Spice', amount: 1, unit: 'Teaspoon' },
        ],
        tags: ['V', 'VG', 'DF', 'NF', 'SF'],
        nutrition: {
          "calories": 151,
          "carbohydrates": "24g",
          "protein": "1g",
          "fat": {
            "total": "4g",
            "saturated": "1g",
            "polyunsaturated": "1g",
            "monounsaturated": "2g"
          },
          "sodium": "106mg",
          "potassium": "63mg",
          "fiber": "1g",
          "sugar": "15g",
          "vitamins": {
            "vitaminA": "1019IU",
            "vitaminC": "0.2mg"
          },
          "minerals": {
            "calcium": "11mg",
            "iron": "1mg"
          }
        }
      },
      {
        name: 'Black Bean Stew',
        summary: 'This cozy Black Bean Stew is a Hispanic-inspired dish with bold flavors. Sautéed vegetables, canned black beans, Mexican herbs and spices, and masa harina are simmered in a thick and comforting vegetable broth.',
        instructions: "Sauté: Warm the oil in a large pot or dutch oven over medium-high heat. Add the onion and bell peppers and sauté for 7 to 9 minutes, stirring occasionally, until the onion is beginning to brown. Reduce the heat to medium.\nAromatics: Add the garlic, finely diced cilantro stems, cumin, oregano, and cayenne pepper, if using. Mix well and sauté for 2 to 3 minutes, until the spices begin to stick to the bottom of the pot.\nSimmer: Add the black beans, tomatoes, and vegetable broth. Mix well and bring to a boil over high heat, then reduce the heat to medium and simmer for 20 minutes, stirring occasionally. If the soup begins to splatter, reduce the heat to medium-low, but maintain a simmer.\nThicken the Stew: Add the masa harina to a small bowl. Whisk 1/2 cup of warm water into the masa harina, add . Add the paste to the simmering soup and stir well. Simmer the soup for an additional 5 to 10 minutes, until it has thickened to your liking; stir frequently to prevent anything from sticking to the bottom of the pot. If the soup gets too thick, thin it out with water in 1/2 cup increments.\nFinal Touches: Turn the heat off and stir in the lime juice and 2 tablespoons of the chopped cilantro leaves. Add salt or additional seasonings to taste, as necessary.\nServe: Serve warm, topped with the remaining cilantro leaves. Store any leftovers in the refrigerator for up to to 5 days. You can also store this stew in the freezer for up to 2 months.",
        prepTime: 10,
        cookTime: 50,
        totalTime: 60,     
        servings: 4,
        notes: 'Masa Harina Substitute: Masa harina adds a unique texture and flavor to this recipe, so I recommend using it if you can. However, if you do not have it, I’d recommend either (1) sprinkling 2 tablespoons of all purpose flour over the aromatics at the end of step 2, or (2) Mixing 1 tablespoons of cornstarch with 1/4 cup of water in step 4 in place of the masa paste – add this to the pot and stir well, and repeat one more time if the stew is still too thin for your liking.',
        category: 'Soups & Stews',
        subcategory: 'Stew',
        items: [
          { name: 'Avocado Oil', amount: 2, unit: 'Tablespoon' },
          { name: 'Yellow Onion', amount: 1, unit: 'Whole' },
          { name: 'Red Bell Pepper', amount: 1, unit: 'Whole' },
          { name: 'Poblano Pepper', amount: 1, unit: 'Whole' },
          { name: 'Garlic', amount: 1, unit: 'Cup' },
          { name: 'Cayenne Pepper', amount: 1, unit: 'Cup' },
          { name: 'Cilantro', amount: 1, unit: 'Cup' },
          { name: 'Diced Tomatoes', amount: 1, unit: 'Cup' },
          { name: 'Vegetable Broth', amount: 1, unit: 'Cup' },
          { name: 'Black Beans', amount: 1, unit: 'Cup' },
          { name: 'Masa Harina', amount: 1, unit: 'Cup' },
          { name: 'Lime Juice', amount: 1, unit: 'Cup' },
          { name: 'Cumin', amount: 1, unit: 'Cup' },
          { name: 'Oregeno', amount: 1, unit: 'Cup' },
        ],
        tags: ['GF', 'V', 'VG', 'DF', 'NF', 'SF'],
        nutrition: {
          "calories": 577,
          "carbohydrates": "96g",
          "protein": "32g",
          "fat": {
            "total": "10g",
            "saturated": "1g",
            "polyunsaturated": "2g",
            "monounsaturated": "5g"
          },
          "sodium": "19mg",
          "potassium": "1544mg",
          "fiber": "32g",
          "sugar": "7g",
          "vitamins": {
            "vitaminA": "1325IU",
            "vitaminC": "76mg"
          },
          "minerals": {
            "calcium": "163mg",
            "iron": "9mg"
          }
        }
      },
    ];