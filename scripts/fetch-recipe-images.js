// Adds an `image` preview to each recipe in public/recipes-dinner.json, using
// the og:image (or twitter:image) that the recipe's page publishes for link
// previews. Only recipes without an image are fetched, so it's cheap to re-run
// after adding recipes. Pass --force to refetch every recipe.
//
// Usage: yarn images [--force]

const fs = require("fs");
const path = require("path");

const RECIPES_FILE = path.join(__dirname, "..", "public", "recipes-dinner.json");
const CONCURRENCY = 6;
const TIMEOUT_MS = 15000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const IMAGE_META_KEYS = ["og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src"];

const decodeEntities = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x2F;/gi, "/");

// Reads <meta property|name="..." content="..."> tags, in either attribute order
const findMetaImage = (html) => {
  const metas = {};
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const key = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i);
    const content = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i);
    if (key && content && !(key[1].toLowerCase() in metas)) {
      metas[key[1].toLowerCase()] = decodeEntities(content[1].trim());
    }
  }
  const found = IMAGE_META_KEYS.map((k) => metas[k]).find(Boolean);
  return found ?? null;
};

const fetchImage = async (href) => {
  const response = await fetch(href, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const image = findMetaImage(await response.text());
  if (!image) {
    throw new Error("no og:image on page");
  }
  // Resolve relative image paths against the final page URL
  return new URL(image, response.url).toString();
};

const main = async () => {
  const force = process.argv.includes("--force");
  const data = JSON.parse(fs.readFileSync(RECIPES_FILE, "utf8"));
  const todo = data.recipes.filter((r) => force || !r.image);
  console.log(`Fetching previews for ${todo.length} of ${data.recipes.length} recipes...`);

  const failures = [];
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const recipe = todo[next++];
      try {
        recipe.image = await fetchImage(recipe.href);
      } catch (error) {
        failures.push(`${recipe.name} (${recipe.href}): ${error.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  fs.writeFileSync(RECIPES_FILE, JSON.stringify(data, null, 2) + "\n");

  console.log(`Added ${todo.length - failures.length} previews.`);
  if (failures.length > 0) {
    console.log(`\nNo preview found for ${failures.length} recipes:`);
    failures.forEach((f) => console.log(`  - ${f}`));
  }
};

main();
