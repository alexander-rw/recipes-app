export type Diet = "vegan" | "vegetarian" | "meat";

export type Recipe = {
  // Names the recipe's page on the site and its file in public/recipes, set by `yarn details`
  id: string;
  name: string;
  href: string;
  timeTakenToCook: number;
  mealType: string;
  // Left out until someone has checked the ingredients; "meat" includes fish
  diet?: Diet;
  // Preview image from the recipe page's og:image, filled in by `yarn images`
  image?: string;
}

// A recipe's ingredients and method, saved from its page by `yarn details`
export type RecipeDetails = {
  // The site or publication the recipe came from
  source: string;
  author?: string;
  servings?: string;
  ingredients: { title?: string; items: string[] }[];
  method: { title?: string; steps: string[] }[];
}
