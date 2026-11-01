# Recipes

Our recipe collection, live at **https://recipes.alexander-rw.com**.

It has three parts:

- **Recipes**: every recipe with filters for meal type, diet and cooking time. A recipe opens on
  the site with its ingredients and method, so there's no need to scroll past someone's life story.
- **Around the world**: a map of the countries we've eaten a meal from, at home or out, and the
  ones we're planning.
- **Kitchen display** (`#display`): a full-screen slideshow of recipes for a touchscreen in the
  kitchen, with a browser for finding a recipe to cook from.

It's a Create React App project in TypeScript, with Redux Toolkit and MUI. There's no backend: the
recipes and meals are JSON files in `public/`, served with the rest of the site.

## Running it

```sh
yarn install
yarn start      # http://localhost:3000
yarn build      # production build in build/
yarn test
```

Node 20 or later is needed (`yarn details --chrome` needs Node 22's built-in WebSocket).

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
   - fetches its photo into `image` (`yarn images`),
   - saves its ingredients and method to `public/recipes/<id>.json` (`yarn details --chrome`),
   - and commits the results.

   If a photo or recipe can't be fetched, it opens a GitHub issue (or comments on the open one) with
   what went wrong.

You can run the same scripts locally. Both only fetch recipes that don't have the data yet:

```sh
yarn images            # --force to refetch every photo
yarn details           # --force to refetch everything
yarn details --chrome  # also retry pages that block plain requests, through a Chrome
                       # started with --remote-debugging-port=9222
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
    filters/    Meal type, diet and cooking time filters
    recipe/     A recipe's page, opened over whichever view it came from
    world/      The world map and its progress panel
    display/    The kitchen slideshow, its recipe browser and the now-playing card
  styles/       MUI themes (the display has its own, brighter for the kitchen screen)
scripts/        yarn images / yarn details
public/
  recipes-dinner.json   The recipe list
  recipes/<id>.json     Each recipe's ingredients and method
  meals.json            Meals for the world map
```

Routes live in the URL hash, so they survive a refresh and can be bookmarked:

| Hash | Page |
| --- | --- |
| *(none)* | Recipes |
| `#world` | Around the world |
| `#display` | Kitchen slideshow |
| `#display/all` | Kitchen recipe browser |
| `…/recipe/<id>` | A recipe, opened over any of the above, e.g. `#world/recipe/arayes` |

## Deployment

Every push to `main` is built and deployed by Cloudflare Workers Builds as a static-assets Worker
(`wrangler.jsonc`), with single-page-app fallback for unknown paths. There's nothing to run by hand.

There are also Dockerfiles in `docker/` for running a dev server (`yarn build:dev && yarn start:dev`,
on port 3001) or an nginx production build (`yarn start:prod`, on port 3002), from before the site
moved to Cloudflare.
