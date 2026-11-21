import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
  buildSafeFtsQuery,
  getRecipeBySlug,
  initSchema,
  searchRecipes,
  seedDatabase,
  toggleFavorite,
} from "../src/lib/db";
import { FavoriteBodySchema, RecipeQuerySchema } from "../src/lib/types";

function createTestDb(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  initSchema(db);
  seedDatabase(db);
  return db;
}

test("seedDatabase is idempotent and loads 20 authentic student recipes", () => {
  const db = createTestDb();
  const firstCount = seedDatabase(db);
  const secondCount = seedDatabase(db);
  assert.equal(firstCount, 20);
  assert.equal(secondCount, 20);
});

test("FTS5 search finds recipes by English title, Hindi name, and ingredients", () => {
  const db = createTestDb();

  const poha = searchRecipes(db, { q: "poha" });
  assert.ok(poha.recipes.some((r) => r.slug === "kanda-poha"));

  const kettle = searchRecipes(db, { q: "kettle" });
  assert.ok(kettle.recipes.length >= 2);

  const jeera = searchRecipes(db, { q: "jeera" });
  assert.ok(jeera.recipes.some((r) => r.slug === "jeera-rice"));
});

test("adversarial FTS5 and SQL injection payloads never crash or leak data", () => {
  const db = createTestDb();
  const payloads = [
    "' OR 1=1 --",
    `"""***()^NEAR/0`,
    "; DROP TABLE recipes; --",
    "   ",
    "!!!@@@###",
  ];

  for (const payload of payloads) {
    const res = searchRecipes(db, { q: payload });
    assert.ok(Array.isArray(res.recipes));
  }

  // Ensure recipes table is completely intact after SQLi attempts
  const all = searchRecipes(db, {});
  assert.equal(all.total, 20);
  assert.equal(buildSafeFtsQuery("!!!"), null);
});

test("multi-facet filters narrow by diet, cookware, budget, category, and maxTime", () => {
  const db = createTestDb();

  const quickVegKettle = searchRecipes(db, {
    diet: "veg",
    cookware: "kettle",
    budget: "under-50",
    maxTime: 15,
  });
  assert.ok(quickVegKettle.recipes.length >= 1);
  for (const r of quickVegKettle.recipes) {
    assert.equal(r.diet, "veg");
    assert.equal(r.cookware, "kettle");
    assert.equal(r.budgetTier, "under-50");
    assert.ok(r.totalMinutes <= 15);
  }

  const nonVeg = searchRecipes(db, { diet: "non-veg" });
  assert.ok(nonVeg.recipes.length >= 1);
  assert.ok(nonVeg.recipes.every((r) => r.diet === "non-veg"));
});

test("favorites toggle persists and filters correctly, and rejects missing slugs", () => {
  const db = createTestDb();

  const missing = toggleFavorite(db, "does-not-exist");
  assert.equal(missing.exists, false);

  const added = toggleFavorite(db, "kanda-poha");
  assert.equal(added.exists, true);
  assert.equal(added.isFavorite, true);

  const favList = searchRecipes(db, { favoritesOnly: true });
  assert.equal(favList.total, 1);
  assert.equal(favList.recipes[0].slug, "kanda-poha");

  const detail = getRecipeBySlug(db, "kanda-poha");
  assert.equal(detail?.isFavorite, true);

  const removed = toggleFavorite(db, "kanda-poha");
  assert.equal(removed.isFavorite, false);
  assert.equal(searchRecipes(db, { favoritesOnly: true }).total, 0);
});

test("Zod schemas validate valid queries and reject invalid filters", () => {
  const ok = RecipeQuerySchema.safeParse({ q: "dal", diet: "veg", maxTime: "15" });
  assert.equal(ok.success, true);

  const badDiet = RecipeQuerySchema.safeParse({ diet: "alien-food" });
  assert.equal(badDiet.success, false);

  const badFav = FavoriteBodySchema.safeParse({ slug: "" });
  assert.equal(badFav.success, false);
});
