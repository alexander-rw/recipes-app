export type PlaceType = "restaurant" | "cafe" | "bakery" | "bar" | "dessert" | "market" | "shop" | "other";

export type Region = "Central" | "North" | "East" | "South" | "West";

// One entry in public/places.json, made by `bun places` from our Google Maps list
export type Place = {
  // Google Maps place id (the "cid"), for a link to the place
  id: string;
  name: string;
  type: PlaceType | null;
  cuisine: string | null;
  // 1 to 4, for £ to ££££: roughly what one person spends, from under £15 to over £60
  price: 1 | 2 | 3 | 4 | null;
  address: string | null;
  // Postcode district, e.g. "SE15"
  outcode: string | null;
  // Neighbourhood for the postcode district, e.g. "Peckham"
  area: string | null;
  region: Region | null;
  lat: number;
  lng: number;
  // Note added on the Google Maps list
  note: string | null;
  // YYYY-MM-DD, when it went on the list
  added: string | null;
};
