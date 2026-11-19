# Recipes

Our recipe collection, live at **https://recipes.alexander-rw.com**.

It has four parts:

- **Recipes**: every recipe with filters for meal type, diet, main ingredients and cooking time. A recipe opens on
  the site with its ingredients and method, so there's no need to scroll past someone's life story.
- **Around the world**: a map of the countries we've eaten a meal from, at home or out, and the
  ones we're planning.
- **Places to eat** (`#eat`): our Google Maps list of places to eat in London on a map, searchable
  by name, food or area, filtered by kind of place, price and part of London, and sortable by
  distance from you.
  It's only on the main site, not the kitchen display.
- **Kitchen display** (`#display`): a full-screen slideshow of recipes for a touchscreen in the
  kitchen, with a browser for finding a recipe to cook from.

It's a Create React App project in TypeScript, with Redux Toolkit and MUI. There's no backend: the
recipes and meals are JSON files in `public/`, served with the rest of the site.

## Running it

It uses [Bun](https://bun.com) 1.4.5 as its package manager and to run the scripts in `scripts/`:

```sh
bun install
bun start        # http://localhost:3000
bun run build    # production build in build/
bun run test
```

Use `bun run build` and `bun run test`, not `bun build` or `bun test`: those are Bun's own bundler
and test runner, not this project's scripts. The Create React App commands (`start`, `build`,
`test`) still run on Node, so Node 20 or later is needed too.

## Adding a recipe

1. Add it to `public/recipes-dinner.json`:

   ```json
   {
     "name": "Sweet Potato Shepherd's Pie",
     "href": "https://www.bbcgoodfood.com/recipes/veggie-shepherds-pie-sweet-potato-mash",
     "timeTakenToCook": 60,
     "mealType": "Main",
     "diet": "vegetarian"
   }
   ```

   `diet` is `vegan`, `vegetarian` or `meat` (fish counts as meat). Leave it out until someone has
   checked the ingredients.

2. Push to `main`. The **Fetch new recipes** workflow (`.github/workflows/fetch-recipes.yml`) then:
   - gives the recipe an `id`, which names its page (`#recipe/<id>`) and its details file,
   - fetches its photo into `image` (`bun images`),
   - saves its ingredients and method to `public/recipes/<id>.json` (`bun details --chrome`),
   - tags it with its main ingredients (`keyIngredients`), for the ingredient filter,
   - and commits the results.

   If a photo or recipe can't be fetched, it opens a GitHub issue (or comments on the open one) with
   what went wrong.

You can run the same scripts locally. Both only fetch recipes that don't have the data yet:

```sh
bun images            # --force to refetch every photo
bun details           # --force to refetch everything
bun details --chrome  # also retry pages that block plain requests, through a Chrome
                      # started with --remote-debugging-port=9222
bun ingredients       # re-tag main ingredients, after changing the list in
                      # scripts/tag-ingredients.js (bun details does this too)
```

### When a recipe can't be fetched

- **No photo**: add an `image` URL to the recipe by hand.
- **No ingredients or method**: write `public/recipes/<id>.json` yourself and add
  `"addedByHand": true`, so the script never replaces it:

  ```json
  {
    "addedByHand": true,
    "source": "The Mediterranean Dish",
    "servings": "4",
    "ingredients": [{ "items": ["4 portobello mushrooms", "…"] }],
    "method": [{ "steps": ["Heat the oven to 200°C.", "…"] }]
  }
  ```

  `ingredients` and `method` are lists of groups, and each group can have a `title`, e.g.
  "For the sauce". Without a details file the recipe still shows, with a note that it's only on the
  original site.

## Adding a meal to the world map

Add an entry to `public/meals.json`:

```json
{
  "country": "BE",
  "status": "eaten",
  "dish": "Belgian Frites",
  "where": "restaurant",
  "place": "La Friterie (Brussels)",
  "mapsUrl": "https://www.google.com/maps?cid=4391615529234449270",
  "date": "2023-08-16"
}
```

- `country` is the ISO 3166-1 alpha-2 code. The countries the map knows are in
  `src/features/world/countries.ts`.
- `status` is `eaten` or `planned`. `dish` can be left out of a plan.
- `where` is `restaurant` (with `place` and `mapsUrl`) or `home` (with `recipeUrl`).
- `date` (`YYYY-MM-DD`) and `notes` are optional.

The file is public on the site, so don't put anything in it you wouldn't want seen.

## Updating the places to eat

The places come from [our Google Maps list](https://maps.app.goo.gl/fgfBsvrhSPUmbPjD8). After adding
places there, run:

```sh
bun places
```

This saves the list to `public/places.json`. Google doesn't say what kind of place each one is, so
that comes from `scripts/place-tags.json`, which maps each place's name on the list to
`[type, cuisine, price]`. `type` is `restaurant`, `cafe`, `bakery`, `bar`, `dessert`, `market`,
`shop` or `other`. `price` is 1 to 4 for £ to ££££, roughly what one person spends: £ under £15,
££ £15–30, £££ £30–60, ££££ over £60. The prices are our own estimates, as Google's list doesn't
include them either. `bun places` lists any places that aren't in it yet; add them and run it again. A note
added to a place on the Google Maps list shows on its card.

The area names ("Peckham") come from the postcode district, using the table in
`scripts/fetch-places.js`. `bun places` warns about any district that isn't in the table.

The map uses [OpenFreeMap](https://openfreemap.org)'s Positron style with MapLibre, which needs no
API key. `PlacesMap.tsx` hides its road names, railways and other clutter and tints it to match the
site.

## The kitchen display

`https://recipes.alexander-rw.com/#display` is built for a 1280×800 touchscreen (it runs on a
Raspberry Pi in Chromium's kiosk mode). Tap the screen to show the controls: swipe or use
**‹ Back** / **Next ›** to change recipe, **Pause** to stop on one, **Open recipe** to cook from it
and **All recipes** to search and filter. The browser goes back to the slideshow after three
minutes without a touch, unless a recipe is open.

Options in the query string (before the `#`):

| Option | Effect |
| --- | --- |
| `?interval=<seconds>` | How long each recipe stays up (default 30, minimum 5) |
| `?red=`, `?page=`, `?paper=` | Try other theme colours, as hex without the `#`, e.g. `?red=d81b16` |
| `?spotify` | Show what's playing on the kitchen speaker, with playback and volume controls |

`?spotify` connects to Spotify Soloist (Spotify's Connect speaker for devices) running on the same machine,
over its WebSocket API at `ws://127.0.0.1:3679`. Only the kitchen screen sets it, so other browsers
never try. Without Soloist running the card just doesn't appear.

## How it's put together

```
src/
  app/          Redux store and the hash router (route.ts)
  features/     Redux slices: recipes (loads recipes-dinner.json) and world (loads meals.json)
  components/
    app/        App: picks the view from the URL
    recipes/    The recipe list and its cards
    filters/    Meal type, diet, ingredient and cooking time filters
    recipe/     A recipe's page, opened over whichever view it came from
    world/      The world map and its progress panel
    places/     Places to eat in London
    display/    The kitchen slideshow, its recipe browser and the now-playing card
  styles/       MUI themes (the display has its own, brighter for the kitchen screen)
scripts/        bun images / bun details / bun ingredients / bun places (and place-tags.json)
public/
  recipes-dinner.json   The recipe list
  recipes/<id>.json     Each recipe's ingredients and method
  meals.json            Meals for the world map
  places.json           Places to eat, from bun places
```

Routes live in the URL hash, so they survive a refresh and can be bookmarked:

| Hash | Page |
| --- | --- |
| *(none)* | Recipes |
| `#world` | Around the world |
| `#eat` | Places to eat |
| `#display` | Kitchen slideshow |
| `#display/all` | Kitchen recipe browser |
| `…/recipe/<id>` | A recipe, opened over any of the above, e.g. `#world/recipe/arayes` |

## Deployment

Every push to `main` is built and deployed by Cloudflare Workers Builds as a static-assets Worker
(`wrangler.jsonc`), with single-page-app fallback for unknown paths. There's nothing to run by hand.
