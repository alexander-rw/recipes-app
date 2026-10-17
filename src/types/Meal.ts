export type MealStatus = "eaten" | "planned";

// One entry in public/meals.json
export type Meal = {
  // ISO 3166-1 alpha-2 country code, e.g. "JP"
  country: string;
  status: MealStatus;
  dish: string;
  where: "restaurant" | "home";
  // Restaurant name and its Google Maps link, for restaurant meals
  place?: string;
  mapsUrl?: string;
  // Recipe link, for home-cooked meals
  recipeUrl?: string;
  // YYYY-MM-DD
  date?: string;
  notes?: string;
}

// A country's overall progress: eaten if any meal there is eaten, planned if
// any is planned, otherwise not yet
export type CountryStatus = MealStatus | "todo";
