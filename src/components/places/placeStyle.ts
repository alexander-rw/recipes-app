import { Place, PlaceType } from "../../types/Place";

export const TYPE_LABELS: Record<PlaceType, string> = {
  restaurant: "Restaurant",
  cafe: "Café",
  bakery: "Bakery",
  bar: "Bar",
  dessert: "Sweet treats",
  market: "Market",
  shop: "Shop",
  other: "Other",
};

// One colour per kind of place, for the map pins and the top of each card. Taken from the site's
// red, blue, brown, herb green and mustard, plus a berry pink and a slate for the rarer kinds.
export const TYPE_COLORS: Record<PlaceType, string> = {
  restaurant: "#b80c09",
  cafe: "#6b2b06",
  bakery: "#c98f00",
  bar: "#247ba0",
  dessert: "#c2407a",
  market: "#3d7a3a",
  shop: "#5b6770",
  other: "#5b6770",
};

export const typeColor = (place: Place) => TYPE_COLORS[place.type ?? "other"];

export const priceLabel = (price: Place["price"]) => (price ? "£".repeat(price) : null);

export const PRICE_HINTS: Record<number, string> = {
  1: "Under £15 a head",
  2: "£15–30 a head",
  3: "£30–60 a head",
  4: "Over £60 a head",
};

const CUISINE_EMOJI: Record<string, string> = {
  "Afternoon tea": "🫖", American: "🍔", Argentinian: "🥩", Bagels: "🥯", Barbecue: "🍖",
  Beer: "🍺", "Bookshop café": "📚", Bistro: "🍽️", British: "🍽️", Brunch: "🍳", "Bubble tea": "🧋",
  Burgers: "🍔", Cajun: "🦐", Cakes: "🍰", Cantonese: "🥟", Caribbean: "🌶️", Chinese: "🥢",
  Chocolate: "🍫", "Cinnamon buns": "🌀", Cocktails: "🍸", Coffee: "☕", Colombian: "🫓",
  Cookies: "🍪", Deli: "🧀", Doughnuts: "🍩", Filipino: "🍢", French: "🥐", "Frozen yoghurt": "🍦",
  Gelato: "🍨", Georgian: "🫓", German: "🥨", Greek: "🫒", "Hong Kong": "🍍", "Ice cream": "🍦",
  Indian: "🍛", "Indo-Chinese": "🍛", Indonesian: "🍢", Italian: "🍝", Japanese: "🍣", Korean: "🥘",
  Kurdish: "🥙", Lebanese: "🧆", "Live music": "🎷", Malaysian: "🍜", Matcha: "🍵",
  Mediterranean: "🫒", Mexican: "🌮", "Middle Eastern": "🧆", Nepalese: "🥟", Palestinian: "🧆",
  Pancakes: "🥞", Pastries: "🥐", Persian: "🍢", Peruvian: "🐟", "Pie and mash": "🥧", Pizza: "🍕",
  Portuguese: "🐟", Pub: "🍺", Rotisserie: "🍗", Sake: "🍶", Sandwiches: "🥪", Schnitzel: "🍖",
  Seafood: "🦪", Spanish: "🥘", "Sri Lankan": "🍛", Steak: "🥩", "Street food": "🛍️",
  "Supper club": "🚇", Swedish: "🥐", Taiwanese: "🥟", Tea: "🍵", Thai: "🌶️", Turkish: "🥙",
  Uyghur: "🍜", Vegan: "🥗", Vietnamese: "🥖", "West African": "🍲", Whisky: "🥃",
};

const TYPE_EMOJI: Record<PlaceType, string> = {
  restaurant: "🍽️", cafe: "☕", bakery: "🥐", bar: "🍸", dessert: "🍨", market: "🛍️", shop: "🛒", other: "📍",
};

export const placeEmoji = (place: Place) =>
  (place.cuisine && CUISINE_EMOJI[place.cuisine]) ?? TYPE_EMOJI[place.type ?? "other"];
