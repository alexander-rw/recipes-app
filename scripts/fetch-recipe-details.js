// Saves each recipe's ingredients and method to public/recipes/<id>.json, so
// recipes can be read on the site instead of on the creator's page. It reads
// the schema.org Recipe data most recipe sites publish for search engines, and
// falls back to the "Ingredients" and "Method" sections of the page for sites
// that don't (mostly Substack posts). Each recipe also gets an `id` in
// public/recipes-dinner.json, which names its file and its page on the site.
//
// Only recipes without a saved file are fetched, so it's cheap to re-run
// after adding recipes. Pass --force to refetch every recipe. Pass --chrome to
// retry pages that refuse plain requests in a running Chrome (see
// loadWithChrome). For a page nothing can read, write its file by hand and
// add "addedByHand": true so it's kept.
//
// Usage: yarn details [--force] [--chrome]

const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const RECIPES_FILE = path.join(__dirname, "..", "public", "recipes-dinner.json");
const DETAILS_DIR = path.join(__dirname, "..", "public", "recipes");
const CONCURRENCY = 6;
const TIMEOUT_MS = 20000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const slugify = (name) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Gives every recipe a unique id, keeping any it already has
const assignIds = (recipes) => {
  const taken = new Set(recipes.map((r) => r.id).filter(Boolean));
  recipes.forEach((recipe) => {
    if (recipe.id) {
      return;
    }
    const base = slugify(recipe.name) || "recipe";
    let id = base;
    for (let n = 2; taken.has(id); n++) {
      id = `${base}-${n}`;
    }
    taken.add(id);
    recipe.id = id;
  });
};

// Turns an HTML fragment (or text with entities in it) into plain text
const toText = (value) => {
  if (value == null) {
    return "";
  }
  const html = String(value).replace(/<br\s*\/?>/gi, "\n");
  const text = JSDOM.fragment(`<div>${html}</div>`).textContent ?? "";
  return text.replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
};

const asArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);

const hasType = (node, type) => asArray(node?.["@type"]).some((t) => String(t).toLowerCase() === type.toLowerCase());

// Finds the first schema.org Recipe in the page's JSON-LD, wherever it's nested
const findRecipeData = (document) => {
  const queue = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
    try {
      queue.push(JSON.parse(script.textContent));
    } catch {
      // Some sites publish broken JSON-LD; the HTML fallback covers them
    }
  });
  while (queue.length > 0) {
    const node = queue.shift();
    if (Array.isArray(node)) {
      queue.push(...node);
    } else if (node && typeof node === "object") {
      if (hasType(node, "Recipe")) {
        return node;
      }
      queue.push(...Object.values(node).filter((v) => v && typeof v === "object"));
    }
  }
  return null;
};

// Splits "1. Heat the oven.2. Mix the dough." into steps, dropping the numbers,
// which the site shows anyway
const splitNumberedSteps = (text) =>
  text
    .split(/(?<=[.!?)])\s*(?=\d{1,2}\.\s*[A-Z])/)
    .map((step) => step.replace(/^(step\s*)?\d{1,2}[.):]\s*/i, "").trim())
    .filter(Boolean);

const stepTexts = (step) => {
  if (typeof step === "string") {
    return toText(step).split("\n").flatMap(splitNumberedSteps);
  }
  if (hasType(step, "HowToSection") || step?.itemListElement) {
    return asArray(step.itemListElement).flatMap(stepTexts);
  }
  return splitNumberedSteps(toText(step?.text ?? step?.name));
};

const methodFromData = (instructions) => {
  const groups = [];
  let loose = null;
  asArray(instructions).forEach((item) => {
    if (item && typeof item === "object" && hasType(item, "HowToSection")) {
      loose = null;
      groups.push({ title: toText(item.name) || undefined, steps: stepTexts(item) });
    } else {
      if (loose == null) {
        loose = { steps: [] };
        groups.push(loose);
      }
      loose.steps.push(...stepTexts(item));
    }
  });
  return groups.filter((g) => g.steps.length > 0);
};

const personName = (value) =>
  asArray(value)
    .map((a) => (typeof a === "string" ? a : a?.name))
    .filter(Boolean)
    .map(toText)
    .join(", ") || undefined;

const servingsFrom = (value) => {
  // Sites often give both "4" and "4 servings"; the longer one reads better
  const yields = asArray(value).map((v) => toText(v)).filter(Boolean);
  return yields.sort((a, b) => b.length - a.length)[0];
};

const detailsFromData = (data) => ({
  author: personName(data.author),
  servings: servingsFrom(data.recipeYield),
  ingredients: [{ items: asArray(data.recipeIngredient ?? data.ingredients).map(toText).filter(Boolean) }],
  method: methodFromData(data.recipeInstructions),
});

const INGREDIENTS_HEADING = /^ingredients?\b/i;
const METHOD_HEADING = /^(method|instructions|directions|steps|how to make( it)?|preparation)\b/i;

// Without recipe data, reads the lists under the page's "Ingredients" and
// "Method" headings (or bold paragraphs used as headings)
const detailsFromPage = (document) => {
  const body = document.querySelector("article .body, .available-content, article, main") ?? document.body;
  const blocks = Array.from(body.querySelectorAll("h1, h2, h3, h4, h5, p, ul, ol"))
    // Lists inside lists are read as part of their parent
    .filter((el) => !el.parentElement?.closest("ul, ol"));
  const headingText = (el) => {
    if (/^H\d$/.test(el.tagName)) {
      return toText(el.textContent);
    }
    // A paragraph that is only bold text acts as a heading
    const strong = el.tagName === "P" && el.querySelector("strong, b");
    return strong && toText(strong.textContent) === toText(el.textContent) ? toText(el.textContent) : null;
  };

  // A short paragraph ending in a colon, like "For the sauce:", names a group
  const colonHeading = (el) => {
    const text = el.tagName === "P" ? toText(el.textContent) : "";
    return text.endsWith(":") && text.length < 60 ? text : null;
  };

  const ingredients = [];
  const method = [];
  let section = null;
  let subtitle;
  const paragraphSteps = [];
  // The group that ingredients written as paragraphs are being added to
  let paragraphGroup = null;
  blocks.forEach((el) => {
    const heading = headingText(el) ?? (section === "ingredients" ? colonHeading(el) : null);
    if (heading != null && heading.length < 60) {
      if (INGREDIENTS_HEADING.test(heading)) {
        section = "ingredients";
        subtitle = undefined;
      } else if (METHOD_HEADING.test(heading)) {
        section = "method";
        subtitle = undefined;
      } else if (section) {
        // A heading inside a section names a group, e.g. "For the sauce"
        subtitle = heading.replace(/:$/, "");
      }
      paragraphGroup = null;
      return;
    }
    if (section == null) {
      return;
    }
    if (el.tagName === "UL" || el.tagName === "OL") {
      const items = Array.from(el.querySelectorAll(":scope > li")).map((li) => toText(li.textContent)).filter(Boolean);
      const target = section === "ingredients" ? ingredients : method;
      target.push(section === "ingredients" ? { title: subtitle, items } : { title: subtitle, steps: items });
      subtitle = undefined;
    } else if (el.tagName === "P" && section === "ingredients") {
      // Some posts write each ingredient as its own paragraph
      const text = toText(el.textContent);
      if (text) {
        if (paragraphGroup == null) {
          paragraphGroup = { title: subtitle, items: [] };
          ingredients.push(paragraphGroup);
          subtitle = undefined;
        }
        paragraphGroup.items.push(text);
      }
    } else if (el.tagName === "P" && section === "method") {
      // Some posts write the method as paragraphs rather than a list
      const text = toText(el.textContent);
      if (text) {
        paragraphSteps.push(text);
      }
    }
  });
  // Paragraphs only count when there's no method list
  if (method.length === 0 && paragraphSteps.length > 0) {
    method.push({ steps: paragraphSteps });
  }
  return { ingredients, method };
};

// Loads a page in a Chrome started with --remote-debugging-port=9222, for
// sites whose bot protection turns away plain requests. Node 20 needs
// --experimental-websocket for this.
const CHROME = "http://127.0.0.1:9222";

const loadWithChrome = async (href) => {
  if (typeof WebSocket === "undefined") {
    throw new Error("--chrome needs Node 22+, or node --experimental-websocket");
  }
  const target = await (await fetch(`${CHROME}/json/new?about:blank`, { method: "PUT" })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  let lastId = 0;
  const waiting = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    waiting.get(message.id)?.resolve(message.result);
    waiting.delete(message.id);
  };
  // Nothing else keeps Node running while a reply is awaited, so a lost reply must fail rather than hang
  socket.onclose = () => waiting.forEach(({ reject }) => reject(new Error("Chrome closed the connection")));
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++lastId;
      const timer = setTimeout(() => reject(new Error(`Chrome didn't answer ${method}`)), TIMEOUT_MS);
      waiting.set(id, {
        resolve: (result) => { clearTimeout(timer); resolve(result); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true }))?.result?.value;
  try {
    await new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = reject;
    });
    // Headless Chrome names itself in its user agent, which some sites refuse
    await send("Network.setUserAgentOverride", { userAgent: USER_AGENT });
    await send("Page.navigate", { url: href });
    // Wait out bot checks ("Just a moment...") until the page has loaded
    const deadline = Date.now() + TIMEOUT_MS * 2;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const ready = await evaluate(
        `document.readyState === "complete" && !/just a moment|attention required/i.test(document.title)`
      );
      if (ready) {
        return { html: await evaluate("document.documentElement.outerHTML"), url: await evaluate("location.href") };
      }
    }
    throw new Error("page didn't finish loading in Chrome");
  } finally {
    socket.close();
    await fetch(`${CHROME}/json/close/${target.id}`).catch(() => {});
  }
};

const loadPage = async (href, useChrome) => {
  try {
    const response = await fetch(href, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return { html: await response.text(), url: response.url };
  } catch (error) {
    if (!useChrome) {
      throw error;
    }
    return loadWithChrome(href);
  }
};

const metaContent = (document, key) =>
  document.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute("content") ?? undefined;

const fetchDetails = async (href, useChrome) => {
  const page = await loadPage(href, useChrome);
  // A silent console, so pages' CSS and script errors aren't printed
  const { document } = new JSDOM(page.html, { virtualConsole: new VirtualConsole() }).window;
  const data = findRecipeData(document);
  const details = data ? detailsFromData(data) : { author: metaContent(document, "author"), ...detailsFromPage(document) };
  const ingredientCount = details.ingredients.reduce((n, g) => n + g.items.length, 0);
  const stepCount = details.method.reduce((n, g) => n + g.steps.length, 0);
  if (ingredientCount === 0 || stepCount === 0) {
    throw new Error(`found ${ingredientCount} ingredients and ${stepCount} steps`);
  }
  return {
    source: toText(metaContent(document, "og:site_name")) || new URL(page.url).hostname.replace(/^www\./, ""),
    ...details,
    ingredients: details.ingredients.filter((g) => g.items.length > 0),
  };
};

const main = async () => {
  const force = process.argv.includes("--force");
  const useChrome = process.argv.includes("--chrome");
  const data = JSON.parse(fs.readFileSync(RECIPES_FILE, "utf8"));
  assignIds(data.recipes);
  fs.mkdirSync(DETAILS_DIR, { recursive: true });

  const fileFor = (recipe) => path.join(DETAILS_DIR, `${recipe.id}.json`);
  // Files marked "addedByHand" are for pages this script can't read, so they're never replaced
  const isHandWritten = (recipe) => JSON.parse(fs.readFileSync(fileFor(recipe), "utf8")).addedByHand === true;
  const todo = data.recipes.filter((r) => !fs.existsSync(fileFor(r)) || (force && !isHandWritten(r)));
  console.log(`Fetching ingredients and method for ${todo.length} of ${data.recipes.length} recipes...`);

  const failures = [];
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const recipe = todo[next++];
      try {
        const details = await fetchDetails(recipe.href, useChrome);
        fs.writeFileSync(fileFor(recipe), JSON.stringify(details, null, 2) + "\n");
      } catch (error) {
        failures.push(`${recipe.name} (${recipe.href}): ${error.message}`);
      }
    }
  };
  // Chrome is slower and heavier, so it gets fewer pages at once
  await Promise.all(Array.from({ length: useChrome ? 3 : CONCURRENCY }, worker));

  fs.writeFileSync(RECIPES_FILE, JSON.stringify(data, null, 2) + "\n");

  console.log(`Saved ${todo.length - failures.length} recipes.`);
  if (failures.length > 0) {
    console.log(`\nCouldn't read ${failures.length} recipes (they still link to the creator's page):`);
    failures.forEach((f) => console.log(`  - ${f}`));
    // Lets the GitHub workflow know to raise an issue
    process.exitCode = 1;
  }
};

main();
