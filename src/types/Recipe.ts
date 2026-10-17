export type Recipe = {
  name: string;
  href: string;
  timeTakenToCook: number;
  mealType: string;
  // Preview image from the recipe page's og:image, filled in by `yarn images`
  image?: string;
}
