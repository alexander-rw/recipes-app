export type Diet = "vegan" | "vegetarian" | "meat";

export type Recipe = {
  // Names the recipe's page on the site and its file in public/recipes, set by `bun details`
  id: string;
  name: string;
  href: string;
  timeTakenToCook: number;
  mealType: string;
  // Left out until someone has checked the ingredients; "meat" includes fish
  diet?: Diet;
  // Preview image from the recipe page's og:image, filled in by `bun images`
  image?: string;
  // Main ingredients, such as "Chicken" or "Tofu", for the ingredient filter; set by `bun ingredients`
  keyIngredients?: string[];
}

// A recipe's ingredients and method, saved from its page by `bun details`
export type RecipeDetails = {
  // The site or publication the recipe came from
  source: string;
  author?: string;
  servings?: string;
  ingredients: { title?: string; items: string[] }[];
  method: { title?: string; steps: string[] }[];
}
