import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SEED_RECIPES } from "./recipes-data";
import type { BudgetTier, Category, Cookware, Diet, Ingredient, Recipe } from "./types";

let cachedDb: DatabaseSync | null = null;
let cachedDbPath: string | null = null;

function resolveDbPath(customPath?: string): string {
  if (customPath) return customPath;
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  if (process.env.VERCEL) return "/tmp/indian-cookbook.db";
  return path.join(process.cwd(), "data", "dev.db");
}

export function getDb(customPath?: string): DatabaseSync {
  const targetPath = resolveDbPath(customPath);
  if (cachedDb && cachedDbPath === targetPath) {
    return cachedDb;
  }

  if (targetPath !== ":memory:") {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  }

  const db = new DatabaseSync(targetPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  initSchema(db);
  ensureSeeded(db);

  cachedDb = db;
  cachedDbPath = targetPath;
  return db;
}

export function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      hindi_name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      diet TEXT NOT NULL,
      cookware TEXT NOT NULL,
      budget_tier TEXT NOT NULL,
      cost_inr INTEGER NOT NULL,
      prep_minutes INTEGER NOT NULL,
      cook_minutes INTEGER NOT NULL,
      total_minutes INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      servings INTEGER NOT NULL,
      ingredients_json TEXT NOT NULL,
      ingredients_text TEXT NOT NULL,
      steps_json TEXT NOT NULL,
      student_swap TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      tags_text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
    CREATE INDEX IF NOT EXISTS idx_recipes_diet ON recipes(diet);
    CREATE INDEX IF NOT EXISTS idx_recipes_cookware ON recipes(cookware);
    CREATE INDEX IF NOT EXISTS idx_recipes_budget ON recipes(budget_tier);
    CREATE INDEX IF NOT EXISTS idx_recipes_total_minutes ON recipes(total_minutes);

    CREATE VIRTUAL TABLE IF NOT EXISTS recipes_fts USING fts5(
      title,
      hindi_name,
      description,
      category,
      cookware,
      ingredients_text,
      tags_text,
      content='recipes',
      content_rowid='id'
    );

    CREATE TABLE IF NOT EXISTS favorites (
      recipe_slug TEXT NOT NULL,
      profile_id TEXT NOT NULL DEFAULT 'default',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (recipe_slug, profile_id),
      FOREIGN KEY (recipe_slug) REFERENCES recipes(slug) ON DELETE CASCADE
    );
  `);
}

export function ensureSeeded(db: DatabaseSync): void {
  const row = db.prepare("SELECT COUNT(*) as count FROM recipes").get() as { count: number };
  if (row.count === 0) {
    seedDatabase(db);
  }
}

export function seedDatabase(db: DatabaseSync, reset = false): number {
  if (reset) {
    db.exec("DELETE FROM favorites; DELETE FROM recipes; DELETE FROM recipes_fts;");
  }

  const upsert = db.prepare(`
    INSERT INTO recipes (
      slug, title, hindi_name, description, category, diet, cookware,
      budget_tier, cost_inr, prep_minutes, cook_minutes, total_minutes,
      difficulty, servings, ingredients_json, ingredients_text,
      steps_json, student_swap, tags_json, tags_text
    ) VALUES (
      @slug, @title, @hindi_name, @description, @category, @diet, @cookware,
      @budget_tier, @cost_inr, @prep_minutes, @cook_minutes, @total_minutes,
      @difficulty, @servings, @ingredients_json, @ingredients_text,
      @steps_json, @student_swap, @tags_json, @tags_text
    )
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      hindi_name = excluded.hindi_name,
      description = excluded.description,
      category = excluded.category,
      diet = excluded.diet,
      cookware = excluded.cookware,
      budget_tier = excluded.budget_tier,
      cost_inr = excluded.cost_inr,
      prep_minutes = excluded.prep_minutes,
      cook_minutes = excluded.cook_minutes,
      total_minutes = excluded.total_minutes,
      difficulty = excluded.difficulty,
      servings = excluded.servings,
      ingredients_json = excluded.ingredients_json,
      ingredients_text = excluded.ingredients_text,
      steps_json = excluded.steps_json,
      student_swap = excluded.student_swap,
      tags_json = excluded.tags_json,
      tags_text = excluded.tags_text
  `);

  db.exec("BEGIN");
  try {
    for (const r of SEED_RECIPES) {
      const ingredientsText = r.ingredients
        .map((i) => `${i.item} ${i.hindi ?? ""}`.trim())
        .join(" ");
      upsert.run({
        slug: r.slug,
        title: r.title,
        hindi_name: r.hindiName,
        description: r.description,
        category: r.category,
        diet: r.diet,
        cookware: r.cookware,
        budget_tier: r.budgetTier,
        cost_inr: r.costInr,
        prep_minutes: r.prepMinutes,
        cook_minutes: r.cookMinutes,
        total_minutes: r.prepMinutes + r.cookMinutes,
        difficulty: r.difficulty,
        servings: r.servings,
        ingredients_json: JSON.stringify(r.ingredients),
        ingredients_text: ingredientsText,
        steps_json: JSON.stringify(r.steps),
        student_swap: r.studentSwap,
        tags_json: JSON.stringify(r.tags),
        tags_text: r.tags.join(" "),
      });
    }
    db.exec("INSERT INTO recipes_fts(recipes_fts) VALUES('rebuild');");
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  const countRow = db.prepare("SELECT COUNT(*) as count FROM recipes").get() as { count: number };
  return countRow.count;
}

/**
 * Sanitize user search input into safe FTS5 prefix tokens.
 * Strips FTS5 operators/punctuation so malformed input can never throw a syntax error.
 */
export function buildSafeFtsQuery(raw: string): string | null {
  const tokens = raw
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .slice(0, 8);

  if (tokens.length === 0) return null;
  return tokens.map((t) => `"${t}"*`).join(" AND ");
}

interface RawRecipeRow {
  id: number;
  slug: string;
  title: string;
  hindi_name: string;
  description: string;
  category: Category;
  diet: Diet;
  cookware: Cookware;
  budget_tier: BudgetTier;
  cost_inr: number;
  prep_minutes: number;
  cook_minutes: number;
  total_minutes: number;
  difficulty: "Super Easy" | "Easy";
  servings: number;
  ingredients_json: string;
  steps_json: string;
  student_swap: string;
  tags_json: string;
  is_favorite: number;
}

function mapRow(row: RawRecipeRow): Recipe {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    hindiName: row.hindi_name,
    description: row.description,
    category: row.category,
    diet: row.diet,
    cookware: row.cookware,
    budgetTier: row.budget_tier,
    costInr: row.cost_inr,
    prepMinutes: row.prep_minutes,
    cookMinutes: row.cook_minutes,
    totalMinutes: row.total_minutes,
    difficulty: row.difficulty,
    servings: row.servings,
    ingredients: JSON.parse(row.ingredients_json) as Ingredient[],
    steps: JSON.parse(row.steps_json) as string[],
    studentSwap: row.student_swap,
    tags: JSON.parse(row.tags_json) as string[],
    isFavorite: Boolean(row.is_favorite),
  };
}

export interface SearchRecipesParams {
  q?: string;
  category?: Category;
  diet?: Diet;
  cookware?: Cookware;
  budget?: BudgetTier;
  maxTime?: number;
  favoritesOnly?: boolean;
  limit?: number;
  offset?: number;
  profileId?: string;
}

export function searchRecipes(
  db: DatabaseSync,
  params: SearchRecipesParams
): { recipes: Recipe[]; total: number } {
  const profileId = params.profileId || "default";
  const limit = params.limit ?? 24;
  const offset = params.offset ?? 0;

  const where: string[] = [];
  const bindings: (string | number)[] = [profileId];
  let fromClause = `
    FROM recipes r
    LEFT JOIN favorites f
      ON f.recipe_slug = r.slug AND f.profile_id = ?
  `;
  let orderBy = "ORDER BY r.total_minutes ASC, r.title ASC";

  const ftsQuery = params.q ? buildSafeFtsQuery(params.q) : null;
  if (ftsQuery) {
    fromClause = `
      FROM recipes_fts fts
      JOIN recipes r ON r.id = fts.rowid
      LEFT JOIN favorites f
        ON f.recipe_slug = r.slug AND f.profile_id = ?
    `;
    where.push("recipes_fts MATCH ?");
    bindings.push(ftsQuery);
    orderBy = "ORDER BY bm25(recipes_fts), r.total_minutes ASC";
  }

  if (params.category) {
    where.push("r.category = ?");
    bindings.push(params.category);
  }
  if (params.diet) {
    where.push("r.diet = ?");
    bindings.push(params.diet);
  }
  if (params.cookware) {
    where.push("r.cookware = ?");
    bindings.push(params.cookware);
  }
  if (params.budget) {
    where.push("r.budget_tier = ?");
    bindings.push(params.budget);
  }
  if (params.maxTime) {
    where.push("r.total_minutes <= ?");
    bindings.push(params.maxTime);
  }
  if (params.favoritesOnly) {
    where.push("f.recipe_slug IS NOT NULL");
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const countRow = db
    .prepare(`SELECT COUNT(*) as total ${fromClause} ${whereSql}`)
    .get(...bindings) as { total: number };

  const rows = db
    .prepare(
      `
      SELECT
        r.*,
        CASE WHEN f.recipe_slug IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      ${fromClause}
      ${whereSql}
      ${orderBy}
      LIMIT ? OFFSET ?
    `
    )
    .all(...bindings, limit, offset) as unknown as RawRecipeRow[];

  return {
    recipes: rows.map(mapRow),
    total: countRow.total,
  };
}

export function getRecipeBySlug(
  db: DatabaseSync,
  slug: string,
  profileId = "default"
): Recipe | null {
  const row = db
    .prepare(
      `
      SELECT
        r.*,
        CASE WHEN f.recipe_slug IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM recipes r
      LEFT JOIN favorites f
        ON f.recipe_slug = r.slug AND f.profile_id = ?
      WHERE r.slug = ?
    `
    )
    .get(profileId, slug) as unknown as RawRecipeRow | undefined;

  return row ? mapRow(row) : null;
}

export function toggleFavorite(
  db: DatabaseSync,
  slug: string,
  profileId = "default"
): { isFavorite: boolean; exists: boolean } {
  const existsRow = db.prepare("SELECT 1 as ok FROM recipes WHERE slug = ?").get(slug) as
    | { ok: number }
    | undefined;
  if (!existsRow) {
    return { isFavorite: false, exists: false };
  }

  const existing = db
    .prepare("SELECT 1 as ok FROM favorites WHERE recipe_slug = ? AND profile_id = ?")
    .get(slug, profileId) as { ok: number } | undefined;

  if (existing) {
    db.prepare("DELETE FROM favorites WHERE recipe_slug = ? AND profile_id = ?").run(
      slug,
      profileId
    );
    return { isFavorite: false, exists: true };
  }

  db.prepare("INSERT INTO favorites (recipe_slug, profile_id) VALUES (?, ?)").run(
    slug,
    profileId
  );
  return { isFavorite: true, exists: true };
}
