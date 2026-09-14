/**
 * taxonomy.ts — the single source of truth for the whole site.
 *
 * Nothing may invent vocabulary. Every `item` on every recipe must appear
 * in INGREDIENTS below, and every `unit` must appear in UNITS. The importer
 * consults this file, the validator enforces it, the pantry filter is built
 * from it.
 *
 * Storage is imperial. Volume in tsp/tbsp/cup, weight in oz/lb,
 * temperatures in °F. Display-time conversion to metric is possible later
 * because the numbers are structured; the reverse would not be.
 */

/* ------------------------------------------------------------------ */
/* Categories — exactly one per recipe. Determines the URL.            */
/* Evaluate top to bottom; the FIRST match wins. That rule is what     */
/* keeps chicken soup out of Chicken and beef lasagna out of Beef.     */
/* ------------------------------------------------------------------ */

export const CATEGORIES = [
  {
    slug: "breakfast",
    short: "Breakfast",
    label: "Breakfast",
    blurb: "Things worth getting up for, and a few you can make the night before.",
  },
  {
    slug: "desserts",
    short: "Desserts",
    label: "Desserts",
    blurb: "Not much baking science here. Mostly butter, sugar and restraint.",
  },
  {
    slug: "appetizers",
    short: "Appetizers",
    label: "Appetizers",
    blurb: "Small things to hand round, or to eat standing up at the counter.",
  },
  {
    slug: "soups-salads-sandwiches",
    short: "Soups & Salads",
    label: "Soups, Salads & Sandwiches",
    blurb: "One-bowl food. Most of these are better the day after you make them.",
  },
  {
    slug: "pasta",
    short: "Pasta",
    label: "Pasta",
    blurb: "Sauces that come together in the time it takes the water to boil.",
  },
  {
    slug: "beef",
    short: "Beef",
    label: "Beef",
    blurb: "Mostly the cheaper cuts, which reward attention more than the expensive ones do.",
  },
  {
    slug: "chicken-pork",
    short: "Chicken & Pork",
    label: "Chicken & Pork",
    blurb: "Thighs over breasts, shoulder over loin. The fattier cut is nearly always better.",
  },
  {
    slug: "sides",
    short: "Sides & Veg",
    label: "Potatoes, Veggies & Side Dishes",
    blurb: "The dishes that make everything else on the plate worth eating.",
  },
  {
    slug: "misc",
    short: "Miscellaneous",
    label: "Miscellaneous",
    blurb: "Everything that refuses to sit tidily anywhere else.",
  },
] as const;

export type CategoryDef = (typeof CATEGORIES)[number];
export type CategorySlug = CategoryDef["slug"];
export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as CategorySlug[];

/** Cross-cutting. Many per recipe, or none. Filters only — never in a URL. */
export const ATTRIBUTES = ["vegetarian", "weeknight", "make-ahead", "spicy"] as const;
export type Attribute = (typeof ATTRIBUTES)[number];

/* ------------------------------------------------------------------ */
/* Units                                                               */
/* ------------------------------------------------------------------ */

export type UnitFamily = "volume" | "weight" | "count";

export interface UnitDef {
  name: string;
  family: UnitFamily;
  /** How many base units. Base is tsp for volume, oz for weight. */
  base: number;
  /** May the display layer normalize UP into this unit when scaling? */
  promoteTo: boolean;
  aliases: string[];
  /**
   * Fractions this unit's real measuring tools can produce, e.g. a cup set
   * gives eighths and thirds, a tablespoon gives halves and nothing finer.
   * The display layer snaps a scaled quantity to the nearest of these.
   */
  steps?: number[];
}

export const UNITS: UnitDef[] = [
  { name: "", family: "count", base: 1, promoteTo: false, aliases: ["each", "whole", "ea"], steps: [] },

  { name: "pinch", family: "volume", base: 0.0625, promoteTo: false, aliases: ["pinches"], steps: [0, 0.5] },
  { name: "tsp", family: "volume", base: 1, promoteTo: true, aliases: ["teaspoon", "teaspoons", "t"], steps: [0, 0.125, 0.25, 0.5, 0.75] },
  { name: "tbsp", family: "volume", base: 3, promoteTo: true, aliases: ["tablespoon", "tablespoons", "T", "tbs", "tblsp"], steps: [0, 0.5] },
  { name: "fl oz", family: "volume", base: 6, promoteTo: false, aliases: ["fluid ounce", "fluid ounces", "floz"], steps: [0, 0.5] },
  { name: "stick", family: "volume", base: 24, promoteTo: false, aliases: ["sticks"], steps: [0, 0.25, 0.5, 0.75] },
  { name: "cup", family: "volume", base: 48, promoteTo: true, aliases: ["cups", "c"], steps: [0, 0.125, 0.25, 0.333, 0.5, 0.667, 0.75] },
  { name: "pint", family: "volume", base: 96, promoteTo: false, aliases: ["pints", "pt"], steps: [0, 0.5] },
  { name: "quart", family: "volume", base: 192, promoteTo: false, aliases: ["quarts", "qt"], steps: [0, 0.25, 0.5, 0.75] },

  { name: "oz", family: "weight", base: 1, promoteTo: true, aliases: ["ounce", "ounces"], steps: [0, 0.25, 0.5, 0.75] },
  { name: "lb", family: "weight", base: 16, promoteTo: true, aliases: ["pound", "pounds", "lbs", "#"], steps: [0, 0.25, 0.5, 0.75] },
];

export const UNIT_NAMES = UNITS.map((u) => u.name);

/* ------------------------------------------------------------------ */
/* Ingredients                                                         */
/*                                                                     */
/* `name` is canonical and is what goes in a recipe's `item`.          */
/* `aliases` is what the importer maps FROM. British spellings, US     */
/* regionalisms, and the things that turn up on old recipe cards.      */
/* Adding an alias is cheap. Adding a near-duplicate canonical name is */
/* what quietly ruins the pantry filter, so don't.                     */
/* ------------------------------------------------------------------ */

export type IngredientCategory =
  | "veg" | "fruit" | "protein" | "dairy" | "grain" | "pantry";

export const INGREDIENT_CATEGORIES: { key: IngredientCategory; label: string }[] = [
  { key: "veg", label: "Vegetables & herbs" },
  { key: "fruit", label: "Fruit" },
  { key: "protein", label: "Meat, fish & tofu" },
  { key: "dairy", label: "Dairy & eggs" },
  { key: "grain", label: "Grains & pasta" },
  { key: "pantry", label: "Pantry & spices" },
];

export interface IngredientDef {
  name: string;
  category: IngredientCategory;
  aliases?: string[];
  /** Assumed present in the pantry filter unless the cook says otherwise. */
  staple?: boolean;
}

export const INGREDIENTS: IngredientDef[] = [
  /* --- vegetables & herbs --- */
  { name: "mushrooms", category: "veg", aliases: ["cremini", "button mushrooms", "chestnut mushrooms", "mixed mushrooms", "shiitake", "shiitake mushrooms"] },
  { name: "garlic cloves", category: "veg", aliases: ["garlic", "garlic clove", "cloves garlic", "cloves of garlic", "garlic paste"] },
  { name: "green cabbage", category: "veg", aliases: ["cabbage", "white cabbage"] },
  { name: "shallots", category: "veg", aliases: ["shallot", "eschalot"] },
  { name: "scallions", category: "veg", aliases: ["spring onions", "green onions", "salad onions", "scallion"] },
  { name: "onions", category: "veg", aliases: ["onion", "yellow onion", "brown onion", "white onion", "red onion", "red onions"] },
  { name: "spinach", category: "veg", aliases: ["baby spinach"] },
  { name: "red bell peppers", category: "veg", aliases: ["red peppers", "red capsicum", "bell peppers", "red bell pepper"] },
  { name: "broccoli", category: "veg", aliases: ["broccoli florets"] },
  { name: "thyme sprigs", category: "veg", aliases: ["thyme", "fresh thyme"] },
  { name: "parsley", category: "veg", aliases: ["flat-leaf parsley", "italian parsley", "flat leaf parsley"] },
  { name: "dill", category: "veg", aliases: ["fresh dill", "dill weed"] },
  { name: "cilantro", category: "veg", aliases: ["coriander", "fresh coriander", "coriander leaf", "chinese parsley"] },
  { name: "basil", category: "veg", aliases: ["basil leaves", "fresh basil"] },
  { name: "ginger", category: "veg", aliases: ["fresh ginger", "root ginger", "gingerroot"] },
  { name: "asparagus", category: "veg", aliases: ["fresh asparagus"] },
  { name: "celery", category: "veg", aliases: ["celery ribs", "ribs celery"] },
  { name: "carrots", category: "veg", aliases: [] },
  { name: "sweet potatoes", category: "veg", aliases: ["sweet potato"] },
  { name: "cucumber", category: "veg", aliases: ["cucumbers", "english cucumber"] },
  { name: "poblano peppers", category: "veg", aliases: ["poblano pepper", "poblanos"] },
  { name: "anaheim chile peppers", category: "veg", aliases: ["anaheim chiles", "anaheim peppers"] },
  { name: "cherry tomatoes", category: "veg", aliases: [] },
  { name: "arugula", category: "veg", aliases: ["baby arugula", "rocket"] },
  { name: "beets", category: "veg", aliases: ["beet", "cooked beets"] },
  { name: "shishito peppers", category: "veg", aliases: ["shishito"] },
  { name: "fresno chiles", category: "veg", aliases: ["fresno chile", "fresno chili"] },
  { name: "lettuce", category: "veg", aliases: ["boston lettuce", "romaine", "romaine lettuce", "gem romaine"] },
  { name: "fennel", category: "veg", aliases: ["fennel bulb"] },
  { name: "radishes", category: "veg", aliases: ["radish"] },
  { name: "bean sprouts", category: "veg", aliases: ["fresh bean sprouts"] },
  { name: "corn", category: "veg", aliases: ["frozen corn", "corn kernels"] },
  { name: "potatoes", category: "veg", aliases: ["potato", "yukon gold potatoes", "russet potatoes"] },

  /* --- fruit --- */
  { name: "lemon", category: "fruit", aliases: ["lemons"] },
  { name: "lime", category: "fruit", aliases: ["limes"] },
  { name: "bananas", category: "fruit", aliases: ["banana", "ripe bananas"] },
  { name: "blueberries", category: "fruit", aliases: ["fresh blueberries"] },

  /* --- meat, fish & tofu --- */
  { name: "ground beef", category: "protein", aliases: ["beef mince", "minced beef", "hamburger", "hamburger meat", "ground chuck"] },
  { name: "chicken thighs", category: "protein", aliases: ["chicken thigh", "bone-in chicken thighs"] },
  { name: "chicken breasts", category: "protein", aliases: ["chicken breast", "boneless skinless chicken breasts", "chicken breast cutlets", "chicken cutlets", "chicken breast halves"] },
  { name: "pork chops", category: "protein", aliases: ["pork chop", "thin cut pork chops"] },
  { name: "bacon", category: "protein", aliases: ["bacon slices"] },
  { name: "ground chicken", category: "protein", aliases: ["ground chicken breast", "ground dark meat chicken"] },
  { name: "ground turkey", category: "protein", aliases: [] },
  { name: "smoked herring", category: "protein", aliases: ["smoked trout", "pickled herring"] },
  { name: "anchovy fillets", category: "protein", aliases: ["anchovies", "anchovy", "tinned anchovies"] },
  { name: "firm tofu", category: "protein", aliases: ["bean curd", "extra firm tofu", "extra-firm tofu"] },
  { name: "salami", category: "protein", aliases: ["hard salami", "uncured salami", "dry salami"] },
  { name: "chicken sausage", category: "protein", aliases: [] },

  /* --- dairy & eggs --- */
  { name: "butter", category: "dairy", aliases: ["unsalted butter", "salted butter", "oleo", "margarine", "sweet butter"] },
  { name: "eggs", category: "dairy", aliases: ["egg", "large eggs", "large egg"] },
  { name: "parmesan", category: "dairy", aliases: ["parmigiano reggiano", "parmesan cheese", "parmigiano"] },
  { name: "feta", category: "dairy", aliases: ["feta cheese"] },
  { name: "mozzarella", category: "dairy", aliases: ["mozzarella cheese", "fresh mozzarella"] },
  { name: "cheese slices", category: "dairy", aliases: ["american cheese", "sliced cheese", "burger cheese"] },
  { name: "yogurt", category: "dairy", aliases: ["yoghurt", "plain yogurt", "greek yogurt", "natural yogurt"] },
  { name: "evaporated milk", category: "dairy", aliases: [] },
  { name: "gruyere", category: "dairy", aliases: ["gruyere cheese"] },
  { name: "cheddar", category: "dairy", aliases: ["sharp cheddar", "mild cheddar", "cheddar cheese", "shredded cheddar"] },
  { name: "heavy cream", category: "dairy", aliases: ["heavy whipping cream"] },
  { name: "sour cream", category: "dairy", aliases: [] },
  { name: "manchego", category: "dairy", aliases: ["manchego cheese"] },
  { name: "milk", category: "dairy", staple: true, aliases: ["whole milk"] },
  { name: "egg whites", category: "dairy", aliases: ["egg white"] },
  { name: "blue cheese", category: "dairy", aliases: ["crumbled blue cheese"] },
  { name: "cream cheese", category: "dairy", aliases: ["spreadable cheese"] },
  { name: "ricotta", category: "dairy", aliases: ["ricotta cheese"] },

  /* --- grains & pasta --- */
  { name: "linguine", category: "grain", aliases: ["linguini"] },
  { name: "rotini", category: "grain", aliases: ["fusilli"] },
  { name: "orzo", category: "grain", aliases: ["orzo pasta"] },
  { name: "basmati rice", category: "grain", aliases: ["long grain rice", "long-grain rice", "long grain white rice"] },
  { name: "breadcrumbs", category: "grain", aliases: ["bread crumbs", "fresh breadcrumbs", "dried breadcrumbs", "panko", "panko breadcrumbs", "dry breadcrumbs"] },
  { name: "spaghetti", category: "grain", aliases: [] },
  { name: "elbow macaroni", category: "grain", aliases: ["macaroni"] },
  { name: "fettuccine", category: "grain", aliases: [] },
  { name: "bread", category: "grain", aliases: ["whole-meal bread", "german-style bread", "sliced bread", "toast", "baguette"] },
  { name: "burger buns", category: "grain", aliases: ["hamburger buns", "brioche buns", "buns"] },
  { name: "all-purpose flour", category: "grain", staple: true, aliases: ["plain flour", "ap flour", "all purpose flour", "flour"] },
  { name: "cornstarch", category: "grain", staple: true, aliases: ["cornflour", "corn starch", "corn flour"] },

  /* --- pantry & spices --- */
  { name: "salt", category: "pantry", staple: true, aliases: ["kosher salt", "sea salt", "table salt", "fine salt", "flaky sea salt"] },
  { name: "water", category: "pantry", staple: true, aliases: [] },
  { name: "olive oil", category: "pantry", staple: true, aliases: ["extra virgin olive oil", "evoo", "oil", "basil-flavored oil", "basil oil"] },
  { name: "vegetable oil", category: "pantry", staple: true, aliases: [] },
  { name: "granulated sugar", category: "pantry", staple: true, aliases: ["sugar", "white sugar", "caster sugar", "superfine sugar"] },
  { name: "brown sugar", category: "pantry", staple: true, aliases: ["light brown sugar", "dark brown sugar", "soft brown sugar"] },
  { name: "baking soda", category: "pantry", staple: true, aliases: ["bicarbonate of soda", "bicarb", "sodium bicarbonate"] },
  { name: "vanilla extract", category: "pantry", staple: true, aliases: ["vanilla", "vanilla essence"] },
  { name: "almond extract", category: "pantry", aliases: [] },
  { name: "baking powder", category: "pantry", staple: true, aliases: [] },
  { name: "powdered sugar", category: "pantry", staple: true, aliases: ["icing sugar", "confectioners sugar"] },
  { name: "sprinkles", category: "pantry", aliases: ["jimmies", "christmas sprinkles"] },
  { name: "food coloring", category: "pantry", aliases: [] },
  { name: "chocolate chips", category: "pantry", aliases: [] },
  { name: "white chocolate chips", category: "pantry", aliases: [] },
  { name: "fig jam", category: "pantry", aliases: ["fig spread"] },
  { name: "pistachios", category: "pantry", aliases: ["chopped pistachios"] },
  { name: "black peppercorns", category: "pantry", staple: true, aliases: ["black pepper", "peppercorns", "pepper"] },
  { name: "red pepper flakes", category: "pantry", aliases: ["chilli flakes", "chili flakes", "crushed red pepper", "red chilli flakes", "pepperoncini", "ground pepperoncini", "crushed or ground red pepper"] },
  { name: "cumin seeds", category: "pantry", aliases: ["cumin", "whole cumin", "ground cumin"] },
  { name: "smoked paprika", category: "pantry", aliases: ["pimenton", "pimentón", "spanish paprika"] },
  { name: "paprika", category: "pantry", aliases: [] },
  { name: "italian seasoning", category: "pantry", aliases: ["italian herb blend"] },
  { name: "star anise", category: "pantry", aliases: [] },
  { name: "soy sauce", category: "pantry", aliases: ["light soy sauce", "shoyu", "dark soy", "dark soy sauce", "tamari", "reduced-sodium tamari"] },
  { name: "white miso", category: "pantry", aliases: ["miso", "shiro miso", "miso paste"] },
  { name: "rice vinegar", category: "pantry", aliases: ["rice wine vinegar"] },
  { name: "white wine vinegar", category: "pantry", aliases: ["wine vinegar", "red wine vinegar"] },
  { name: "mustard", category: "pantry", aliases: ["yellow mustard", "dijon", "dijon mustard"] },
  { name: "dry mustard", category: "pantry", aliases: ["mustard powder", "ground mustard"] },
  { name: "mayonnaise", category: "pantry", aliases: ["mayo", "homemade mayo"] },
  { name: "pickles", category: "pantry", aliases: ["dill pickles", "gherkins", "pickle spears"] },
  { name: "black olives", category: "pantry", aliases: ["sliced black olives", "ripe olives", "canned black olives", "kalamata olives", "kalamata olive"] },
  { name: "tomato paste", category: "pantry", aliases: ["tomato purée", "tomato puree", "double concentrate"] },
  { name: "canned tomatoes", category: "pantry", aliases: ["tinned tomatoes", "chopped tomatoes", "crushed tomatoes", "plum tomatoes", "diced tomatoes"] },
  { name: "chickpeas", category: "pantry", aliases: ["garbanzo beans", "garbanzos", "ceci beans"] },
  { name: "chicken stock", category: "pantry", aliases: ["chicken broth", "chicken bouillon"] },
  { name: "vegetable stock", category: "pantry", aliases: ["vegetable broth", "veg stock"] },
  { name: "hoisin sauce", category: "pantry", aliases: [] },
  { name: "hot sauce", category: "pantry", aliases: [] },
  { name: "ground coriander", category: "pantry", aliases: ["coriander powder"] },
  { name: "garlic powder", category: "pantry", staple: true, aliases: ["granulated garlic"] },
  { name: "onion powder", category: "pantry", staple: true, aliases: ["granulated onion"] },
  { name: "water chestnuts", category: "pantry", aliases: ["sliced water chestnuts", "canned water chestnuts"] },
  { name: "white wine", category: "pantry", aliases: ["dry white wine"] },
  { name: "red wine", category: "pantry", aliases: ["red vermouth"] },
  { name: "dried oregano", category: "pantry", staple: true, aliases: ["oregano", "dried oregano leaves", "mexican oregano", "dried mexican oregano"] },
  { name: "sun-dried tomatoes", category: "pantry", aliases: ["sundried tomatoes", "sundried tomato paste", "julienne-cut sun-dried tomatoes"] },
  { name: "honey", category: "pantry", aliases: [] },
  { name: "balsamic glaze", category: "pantry", aliases: ["balsamic reduction"] },
  { name: "bay leaves", category: "pantry", aliases: ["bay leaf"] },
  { name: "cashews", category: "pantry", aliases: ["chopped cashews"] },
  { name: "sesame oil", category: "pantry", aliases: ["toasted sesame oil", "dark sesame oil"] },
  { name: "black vinegar", category: "pantry", aliases: ["chinese black vinegar"] },
  { name: "chili oil", category: "pantry", aliases: ["chinese chili oil"] },
  { name: "sichuan peppercorns", category: "pantry", aliases: ["ground sichuan peppercorns"] },
  { name: "sesame seeds", category: "pantry", aliases: ["toasted sesame seeds"] },
  { name: "red pepper jelly", category: "pantry", aliases: [] },
  { name: "gochujang", category: "pantry", aliases: ["gochujang korean chili sauce"] },
  { name: "apple cider vinegar", category: "pantry", aliases: ["apple cider flavored vinegar"] },
  { name: "cayenne pepper", category: "pantry", aliases: ["cayenne"] },
  { name: "fennel seeds", category: "pantry", aliases: ["fennel seed", "fennel pollen"] },
  { name: "nutmeg", category: "pantry", aliases: ["grated nutmeg", "ground nutmeg"] },
  { name: "pickled cherry peppers", category: "pantry", aliases: ["cherry pepper rings", "hot cherry pepper rings", "peppadews", "peruvian drop peppers", "drop peppers"] },
  { name: "marsala wine", category: "pantry", aliases: ["dry marsala wine", "marsala"] },
  { name: "buffalo sauce", category: "pantry", aliases: ["cayenne pepper sauce", "frank's red hot"] },
  { name: "sweet chili sauce", category: "pantry", aliases: ["thai sweet chili sauce"] },
];

/* ------------------------------------------------------------------ */
/* Derived lookups                                                     */
/* ------------------------------------------------------------------ */

export const IS_CANONICAL = new Set(INGREDIENTS.map((i) => i.name));

export const DEFAULT_STAPLES = INGREDIENTS.filter((i) => i.staple).map((i) => i.name);

/** alias -> canonical name. Built once; used by the importer and validator. */
export const ALIAS_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const ing of INGREDIENTS) {
    for (const a of ing.aliases ?? []) {
      const key = a.toLowerCase().trim();
      if (map[key] && map[key] !== ing.name) {
        throw new Error(
          `Alias "${a}" is claimed by both "${map[key]}" and "${ing.name}". ` +
            `An alias must point at exactly one canonical ingredient.`
        );
      }
      map[key] = ing.name;
    }
  }
  return map;
})();

export const INGREDIENT_CATEGORY: Record<string, IngredientCategory> =
  Object.fromEntries(INGREDIENTS.map((i) => [i.name, i.category]));

/**
 * Resolve a raw string from an import to a canonical ingredient.
 * Returns null when it can't — which is the signal to STOP and ask the
 * human, never to write the raw string into a recipe file.
 */
export function resolveIngredient(raw: string): string | null {
  const key = raw.toLowerCase().trim().replace(/\s+/g, " ");
  if (IS_CANONICAL.has(key)) return key;
  if (ALIAS_MAP[key]) return ALIAS_MAP[key];
  // singular/plural nudge, e.g. "shallot" -> "shallots"
  const alt = key.endsWith("s") ? key.slice(0, -1) : key + "s";
  if (IS_CANONICAL.has(alt)) return alt;
  if (ALIAS_MAP[alt]) return ALIAS_MAP[alt];
  return null;
}

export function resolveUnit(raw: string): string | null {
  const key = raw.toLowerCase().trim();
  if (key === "") return "";
  const hit = UNITS.find(
    (u) => u.name.toLowerCase() === key || u.aliases.some((a) => a.toLowerCase() === key)
  );
  return hit ? hit.name : null;
}
