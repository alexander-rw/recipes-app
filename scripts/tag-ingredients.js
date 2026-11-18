// Tags each recipe in public/recipes-dinner.json with its main ingredients
// (`keyIngredients`), read from its ingredient list in public/recipes/<id>.json,
// for the ingredient filter on the Recipes tab. Store-cupboard basics everything
// uses (salt, oil, garlic, onion, flour...) aren't tagged, as they'd filter nothing.
//
// To add an ingredient, add a line to INGREDIENTS: its name, the words that mean
// it on an ingredient line (plurals match too), and optionally words that mean a
// line isn't really it (so "chicken stock" doesn't count as chicken).
// `yarn details` runs this after fetching, so it only needs running by hand
// after changing the list.
//
// Usage: yarn ingredients

const fs = require("fs");
const path = require("path");

const RECIPES_FILE = path.join(__dirname, "..", "public", "recipes-dinner.json");
const DETAILS_DIR = path.join(__dirname, "..", "public", "recipes");

const STOCK = "stock|broth|bouillon|cubes?|granules|powder|seasoning|fat";

// [name, words that mean it, words that mean a line isn't it]
const INGREDIENTS = [
  // Meat and fish
  ["Chicken", "chicken", STOCK],
  ["Beef", "beef|steak|brisket", STOCK],
  ["Pork", "pork|pancetta|bacon|lardons?|ham|prosciutto", STOCK],
  ["Lamb", "lamb|mutton", STOCK],
  ["Sausages", "sausage|chorizo|nduja|'nduja", "vegan|vegetarian|plant"],
  ["Mince", "mince|ground (beef|pork|lamb|chicken|turkey)", "garlic|ginger|pies?"],
  ["Prawns", "prawn|shrimp", "paste|sauce|dried"],
  ["Fish", "fish|salmon|cod|haddock|tuna|mackerel|sea bass|hake|anchov(y|ies)|sardine|trout", "sauce|stock|vegan"],
  // Eggs and dairy
  ["Eggs", "eggs?|egg yolks?|yolks?", "noodles?|vegan|wash|replacer|flax"],
  ["Cheese", "cheese|parmesan|parmigiano|pecorino|cheddar|mozzarella|feta|ricotta|halloumi|gruyere|mascarpone|burrata|paneer|goat'?s cheese|monterey jack|comte|manchego", "vegan|nutritional|cashew|tofu"],
  ["Paneer", "paneer"],
  ["Feta", "feta", "vegan"],
  ["Mozzarella", "mozzarella", "vegan"],
  ["Cream", "cream|creme fraiche|double cream|single cream|heavy cream|whipping cream|sour cream|half-and-half", "ice|coconut|cashew|cheese|vegan|oat|soy|cream of tartar|creamed|creamy"],
  ["Yoghurt", "yogh?urt", "vegan|coconut|soy|oat|plant"],
  ["Milk", "milk", "coconut|oat|soy|almond|plant|vegan|buttermilk|condensed|evaporated|powder|chocolate|ricotta|bread"],
  ["Coconut milk", "coconut milk|coconut cream"],
  // Tofu, beans and pulses
  ["Tofu", "tofu"],
  ["Tempeh", "tempeh"],
  ["Chickpeas", "chickpea|garbanzo|chana"],
  ["Lentils", "lentil|dal|dhal|daal|masoor|moong|toor"],
  ["Beans", "cannellini|butter beans?|kidney beans?|black beans?|borlotti|haricot|pinto|white beans?|baked beans|edamame|broad beans?|fava", "sauce|paste|fermented"],
  ["Green beans", "green beans?|french beans?|runner beans?|string beans?"],
  // Rice, pasta, noodles and bread
  ["Rice", "rice|basmati|arborio|jasmine rice|risotto", "vinegar|wine|noodles?|paper|flour|cakes?|syrup"],
  ["Pasta", "pasta|spaghetti|penne|rigatoni|orzo|linguine|tagliatelle|fusilli|macaroni|lasagne|lasagna|pappardelle|conchiglie|orecchiette|bucatini|farfalle|paccheri|ditalini|fettuccine", "sauce|water"],
  ["Gnocchi", "gnocchi"],
  ["Noodles", "noodles?|udon|soba|ramen|vermicelli|glass noodles?"],
  ["Bread", "bread|sourdough|baguette|brioche|ciabatta|focaccia|pitt?as?|naan|flatbreads?|buns?|rolls?|toast", "crumbs|breadcrumbs|flour|panko|spring rolls?|cinnamon|penny buns?"],
  ["Tortillas", "tortillas?|tacos? shells?|wraps?"],
  ["Couscous", "couscous"],
  ["Potatoes", "potato|new potato|maris piper|yukon", "sweet|starch|flour"],
  ["Sweet potato", "sweet potato"],
  // Vegetables
  ["Tomatoes", "tomato|passata|cherry tomato|san marzano", "paste|puree|ketchup|tomatillo|sun-?dried"],
  ["Mushrooms", "mushroom|shiitake|chestnut mushrooms?|portobello|oyster mushrooms?|enoki|porcini|chanterelle", "sauce|powder|stock"],
  ["Spinach", "spinach"],
  ["Kale", "kale|cavolo nero"],
  ["Cabbage", "cabbage|savoy|napa|sauerkraut"],
  ["Kimchi", "kimchi"],
  ["Cauliflower", "cauliflower"],
  ["Broccoli", "broccoli|tenderstem|broccolini"],
  ["Pak choi", "pak choi|bok choy|bok choi|pak choy"],
  ["Carrots", "carrot"],
  ["Peppers", "(red|green|yellow|orange|bell|romano|sweet) peppers?|peppers|capsicum", "flakes|ground|black|white|cayenne|chill?i|chile|jalapeno|sichuan|szechuan|peppercorns?|paste"],
  ["Aubergine", "aubergine|eggplant|brinjal"],
  ["Courgette", "courgette|zucchini"],
  ["Squash", "squash|butternut|pumpkin|kabocha", "seeds"],
  ["Peas", "peas|petit pois|mangetout|sugar snaps?|snap peas", "chickpeas?|split"],
  ["Sweetcorn", "sweetcorn|corn|corn on the cob|corn kernels", "starch|flour|syrup|tortillas?|meal"],
  ["Leeks", "leek"],
  ["Celery", "celery|celeriac", "salt|seeds"],
  ["Fennel", "fennel", "seeds?|ground|pollen"],
  ["Cucumber", "cucumber"],
  ["Avocado", "avocado", "oil"],
  ["Asparagus", "asparagus"],
  ["Beetroot", "beetroot|beets?"],
  ["Parsnips", "parsnip"],
  ["Brussels sprouts", "brussels? sprouts?"],
  ["Lettuce", "lettuce|rocket|arugula|salad leaves|gem|romaine|watercress"],
  // Fruit
  ["Lemon", "lemon", "grass|lemongrass"],
  ["Lime", "lime", "leaves|kaffir"],
  ["Bananas", "banana"],
  ["Apples", "apple", "vinegar|cider|juice|pineapple"],
  ["Berries", "berr(y|ies)|strawberr(y|ies)|raspberr(y|ies)|blueberr(y|ies)|blackberr(y|ies)", "cranberry"],
  // Herbs
  ["Coriander", "coriander|cilantro", "seeds?|ground|powder"],
  ["Basil", "basil", "thai|dried"],
  ["Mint", "mint", "dried|sauce"],
  ["Parsley", "parsley", "dried"],
  ["Dill", "dill", "dried|pickles?"],
  // Nuts and seeds
  ["Peanuts", "peanuts?|peanut butter", "oil"],
  ["Cashews", "cashew", "cream|cheese|milk"],
  ["Almonds", "almond", "milk|extract|flour|ground"],
  ["Walnuts", "walnut", "oil"],
  ["Pine nuts", "pine nuts?|pinenuts?"],
  // Flavours worth looking for
  ["Chocolate", "chocolate|cocoa|cacao"],
  ["Miso", "miso"],
  ["Gochujang", "gochujang"],
  ["Tahini", "tahini"],
  ["Olives", "olives", "oil"],
  ["Capers", "capers?"],
];

// Accent-insensitive, so "crème fraîche" matches "creme fraiche"
const normalise = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Whole words only, with plurals ("tomato" matches "tomatoes")
const wordsRegex = (words) => new RegExp(`(^|[^a-z])(${words})(e?s)?(?![a-z])`);

const MATCHERS = INGREDIENTS.map(([name, words, notWords]) => ({
  name,
  words: wordsRegex(words),
  notWords: notWords ? wordsRegex(notWords) : null,
}));

const tagRecipe = (lines) =>
  MATCHERS.filter(({ words, notWords }) =>
    lines.some((line) => words.test(line) && !(notWords && notWords.test(line)))
  ).map(({ name }) => name);

const tagIngredients = () => {
  const data = JSON.parse(fs.readFileSync(RECIPES_FILE, "utf8"));
  const counts = new Map();
  const untagged = [];
  data.recipes.forEach((recipe) => {
    const file = path.join(DETAILS_DIR, `${recipe.id}.json`);
    if (!recipe.id || !fs.existsSync(file)) {
      delete recipe.keyIngredients;
      return;
    }
    const details = JSON.parse(fs.readFileSync(file, "utf8"));
    const lines = details.ingredients.flatMap((group) => group.items).map(normalise);
    const tags = tagRecipe(lines);
    recipe.keyIngredients = tags;
    tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    if (tags.length === 0) {
      untagged.push(recipe.name);
    }
  });
  fs.writeFileSync(RECIPES_FILE, JSON.stringify(data, null, 2) + "\n");

  const summary = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag, n]) => `${tag} ${n}`)
    .join(", ");
  console.log(`Tagged ${data.recipes.length - untagged.length} recipes: ${summary}`);
  if (untagged.length > 0) {
    console.log(`No main ingredients found for: ${untagged.join(", ")}`);
  }
};

if (require.main === module) {
  tagIngredients();
}

module.exports = { tagIngredients };
