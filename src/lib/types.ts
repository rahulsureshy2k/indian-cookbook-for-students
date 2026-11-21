import { z } from "zod";

export const CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snacks", "Drinks"] as const;
export const DIETS = ["veg", "egg", "non-veg"] as const;
export const COOKWARE = ["1-pot", "kettle", "induction", "no-cook", "pressure-cooker"] as const;
export const BUDGET_TIERS = ["under-50", "50-100", "100-plus"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Diet = (typeof DIETS)[number];
export type Cookware = (typeof COOKWARE)[number];
export type BudgetTier = (typeof BUDGET_TIERS)[number];

export interface Ingredient {
  item: string;
  amount: number | null;
  unit: string;
  hindi?: string;
}

export interface RecipeSeed {
  slug: string;
  title: string;
  hindiName: string;
  description: string;
  category: Category;
  diet: Diet;
  cookware: Cookware;
  budgetTier: BudgetTier;
  costInr: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: "Super Easy" | "Easy";
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  studentSwap: string;
  tags: string[];
}

export interface Recipe extends RecipeSeed {
  id: number;
  totalMinutes: number;
  isFavorite: boolean;
}

export const RecipeQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  category: z.enum(CATEGORIES).optional(),
  diet: z.enum(DIETS).optional(),
  cookware: z.enum(COOKWARE).optional(),
  budget: z.enum(BUDGET_TIERS).optional(),
  maxTime: z.coerce.number().int().min(1).max(180).optional(),
  favoritesOnly: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  limit: z.coerce.number().int().min(1).max(50).optional().default(24),
  offset: z.coerce.number().int().min(0).max(500).optional().default(0),
});

export const FavoriteBodySchema = z.object({
  slug: z.string().trim().min(1).max(120),
});
