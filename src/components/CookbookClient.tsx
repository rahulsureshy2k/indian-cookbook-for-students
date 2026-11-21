"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  ChefHat,
  Clock,
  Flame,
  IndianRupee,
  RotateCcw,
  Search,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import {
  CATEGORIES,
  COOKWARE,
  DIETS,
  type BudgetTier,
  type Category,
  type Cookware,
  type Diet,
  type Recipe,
} from "@/lib/types";

interface CookbookClientProps {
  initialRecipes: Recipe[];
  initialTotal: number;
}

const COOKWARE_LABELS: Record<Cookware, string> = {
  "1-pot": "1-Pot",
  kettle: "Kettle",
  induction: "Induction",
  "no-cook": "No-Cook",
  "pressure-cooker": "Pressure Cooker",
};

const DIET_STYLES: Record<Diet, { dot: string; label: string }> = {
  veg: { dot: "bg-emerald-600", label: "Veg" },
  egg: { dot: "bg-amber-600", label: "Egg" },
  "non-veg": { dot: "bg-red-600", label: "Non-Veg" },
};

function formatAmount(amount: number | null, multiplier: number): string {
  if (amount === null) return "";
  const scaled = amount * multiplier;
  return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(2).replace(/\.?0+$/, "");
}

export default function CookbookClient({ initialRecipes, initialTotal }: CookbookClientProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [total, setTotal] = useState<number>(initialTotal);
  const [query, setQuery] = useState<string>("");
  const [category, setCategory] = useState<Category | "">("");
  const [diet, setDiet] = useState<Diet | "">("");
  const [cookware, setCookware] = useState<Cookware | "">("");
  const [budget, setBudget] = useState<BudgetTier | "">("");
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cook Mode Modal state
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [servingMultiplier, setServingMultiplier] = useState<number>(1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  // Keyboard shortcuts: Cmd+K / Ctrl+K to focus search, Escape to close modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && activeRecipe) {
        setActiveRecipe(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeRecipe]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      if (query.trim()) sp.set("q", query.trim());
      if (category) sp.set("category", category);
      if (diet) sp.set("diet", diet);
      if (cookware) sp.set("cookware", cookware);
      if (budget) sp.set("budget", budget);
      if (maxTime) sp.set("maxTime", String(maxTime));
      if (favoritesOnly) sp.set("favoritesOnly", "true");

      const res = await fetch(`/api/recipes?${sp.toString()}`);
      if (!res.ok) {
        throw new Error("Could not load recipes");
      }
      const json = (await res.json()) as { data: Recipe[]; meta: { total: number } };
      setRecipes(json.data);
      setTotal(json.meta.total);
    } catch {
      setError("Failed to fetch recipes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query, category, diet, cookware, budget, maxTime, favoritesOnly]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void fetchRecipes();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchRecipes]);

  const handleToggleFavorite = async (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    // Optimistic update
    setRecipes((prev) =>
      prev.map((r) => (r.slug === slug ? { ...r, isFavorite: !r.isFavorite } : r))
    );
    if (activeRecipe?.slug === slug) {
      setActiveRecipe((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) throw new Error("Favorite failed");
      if (favoritesOnly) {
        void fetchRecipes();
      }
    } catch {
      // Rollback on failure
      setRecipes((prev) =>
        prev.map((r) => (r.slug === slug ? { ...r, isFavorite: !r.isFavorite } : r))
      );
    }
  };

  const openCookMode = (recipe: Recipe) => {
    setActiveRecipe(recipe);
    setCheckedSteps({});
    setServingMultiplier(1);
  };

  const resetFilters = () => {
    setQuery("");
    setCategory("");
    setDiet("");
    setCookware("");
    setBudget("");
    setMaxTime(null);
    setFavoritesOnly(false);
  };

  const hasActiveFilters = Boolean(
    query.trim() || category || diet || cookware || budget || maxTime || favoritesOnly
  );

  const favCount = useMemo(
    () => recipes.filter((r) => r.isFavorite).length,
    [recipes]
  );

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      {/* Sticky Minimal Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-15 max-w-5xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-700 text-white">
              <ChefHat className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              Indian Cookbook for Students
            </span>
          </button>

          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFavoritesOnly(false)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                !favoritesOnly
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              All Recipes
            </button>
            <button
              type="button"
              onClick={() => setFavoritesOnly(true)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                favoritesOnly
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Saved</span>
              {favCount > 0 && !favoritesOnly && (
                <span className="font-mono text-[11px] opacity-75">({favCount})</span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        {/* Hero & Instant Search */}
        <section className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            Easy Indian recipes for hostel &amp; college life.
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-neutral-600">
            Zero clutter. Search by dish or ingredient, filter by cookware, time, or budget, and
            open Cook Mode for step-by-step instructions.
          </p>

          <div className="relative mt-5 max-w-2xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 'poha', 'dal', 'egg', 'kettle', 'paneer', 'chai'..."
              aria-label="Search Indian student recipes"
              className="h-11 w-full rounded-lg border border-neutral-300 bg-white pl-10 pr-16 text-sm text-neutral-950 placeholder:text-neutral-400 transition-shadow focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/10"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[11px] text-neutral-500 sm:inline-block">
                ⌘K
              </kbd>
            )}
          </div>
        </section>

        {/* Category Tabs */}
        <section
          aria-label="Recipe categories"
          className="flex flex-wrap items-center gap-1.5 border-b border-neutral-200 pb-4"
        >
          <button
            type="button"
            onClick={() => setCategory("")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              category === ""
                ? "bg-neutral-950 text-white"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
            }`}
          >
            All Meals
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(category === cat ? "" : cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
              }`}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* Student Filter Pills */}
        <section
          aria-label="Student filters"
          className="flex flex-wrap items-center gap-2 border-b border-neutral-200 py-4"
        >
          {DIETS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDiet(diet === d ? "" : d)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                diet === d
                  ? "border-orange-300 bg-orange-50 text-orange-800"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-950"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${DIET_STYLES[d].dot}`} />
              {DIET_STYLES[d].label}
            </button>
          ))}

          <span className="mx-1 hidden h-4 w-px bg-neutral-200 sm:inline-block" />

          <button
            type="button"
            onClick={() => setMaxTime(maxTime === 15 ? null : 15)}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              maxTime === 15
                ? "border-orange-300 bg-orange-50 text-orange-800"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-950"
            }`}
          >
            <Clock className="h-3 w-3" /> ≤ 15 min
          </button>

          <button
            type="button"
            onClick={() => setBudget(budget === "under-50" ? "" : "under-50")}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              budget === "under-50"
                ? "border-orange-300 bg-orange-50 text-orange-800"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-950"
            }`}
          >
            <IndianRupee className="h-3 w-3" /> Under ₹50
          </button>

          <span className="mx-1 hidden h-4 w-px bg-neutral-200 sm:inline-block" />

          {COOKWARE.map((cw) => (
            <button
              key={cw}
              type="button"
              onClick={() => setCookware(cookware === cw ? "" : cw)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                cookware === cw
                  ? "border-orange-300 bg-orange-50 text-orange-800"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-950"
              }`}
            >
              <Utensils className="h-3 w-3" /> {COOKWARE_LABELS[cw]}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-950"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
        </section>

        {/* Results Count */}
        <div className="flex items-center justify-between py-4 text-xs text-neutral-500">
          <span>
            {loading
              ? "Searching..."
              : `Showing ${recipes.length} of ${total} Indian student recipe${total === 1 ? "" : "s"}`}
          </span>
          <span className="hidden sm:inline">Click any recipe to open Cook Mode</span>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Recipe Grid */}
        {recipes.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 py-16 text-center">
            <p className="text-sm font-medium text-neutral-900">No recipes match your filters.</p>
            <p className="mt-1 text-xs text-neutral-500">
              Try clearing a filter or searching for a simpler term like &quot;dal&quot; or &quot;egg&quot;.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-md bg-neutral-950 px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-800"
            >
              Show all recipes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <article
                key={recipe.slug}
                onClick={() => openCookMode(recipe)}
                className="group flex cursor-pointer flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-neutral-950 hover:shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded border border-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${DIET_STYLES[recipe.diet].dot}`}
                        />
                        {DIET_STYLES[recipe.diet].label}
                      </span>
                      <span className="font-mono text-[11px] text-neutral-500">
                        {recipe.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label={
                        recipe.isFavorite
                          ? `Remove ${recipe.title} from saved`
                          : `Save ${recipe.title}`
                      }
                      onClick={(e) => handleToggleFavorite(e, recipe.slug)}
                      className={`rounded-md p-1 transition-colors ${
                        recipe.isFavorite
                          ? "text-orange-700 hover:bg-orange-50"
                          : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                      }`}
                    >
                      <Bookmark
                        className="h-4 w-4"
                        fill={recipe.isFavorite ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  <h2 className="mt-3 text-base font-semibold tracking-tight text-neutral-950 group-hover:text-orange-800">
                    {recipe.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-500">{recipe.hindiName}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-600">
                    {recipe.description}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-neutral-100 pt-3 font-mono text-[11px] text-neutral-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {recipe.totalMinutes}m
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Flame className="h-3 w-3" /> {COOKWARE_LABELS[recipe.cookware]}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-neutral-700">
                    ₹{recipe.costInr}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Cook Mode Modal */}
      {activeRecipe && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cook-mode-title"
          onClick={() => setActiveRecipe(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-[2px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${DIET_STYLES[activeRecipe.diet].dot}`}
                    />
                    {DIET_STYLES[activeRecipe.diet].label}
                  </span>
                  <span className="font-mono text-xs text-neutral-500">
                    {activeRecipe.category} • {activeRecipe.totalMinutes} min •{" "}
                    {COOKWARE_LABELS[activeRecipe.cookware]} • ₹{activeRecipe.costInr}
                  </span>
                </div>
                <h2
                  id="cook-mode-title"
                  className="mt-2 text-xl font-semibold tracking-tight text-neutral-950"
                >
                  {activeRecipe.title}
                </h2>
                <p className="text-xs text-neutral-500">{activeRecipe.hindiName}</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleToggleFavorite(e, activeRecipe.slug)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    activeRecipe.isFavorite
                      ? "border-orange-200 bg-orange-50 text-orange-800"
                      : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {activeRecipe.isFavorite ? "Saved" : "Save"}
                </button>
                <button
                  type="button"
                  aria-label="Close Cook Mode"
                  onClick={() => setActiveRecipe(null)}
                  className="rounded-md border border-neutral-200 p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Serving Scaler + Ingredients */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-950">Ingredients</h3>
                <div className="flex items-center gap-1 rounded-md border border-neutral-200 p-0.5 text-xs">
                  <span className="px-2 text-neutral-500">
                    Serves {activeRecipe.servings * servingMultiplier}
                  </span>
                  {[1, 2, 3].map((mult) => (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => setServingMultiplier(mult)}
                      className={`rounded px-2 py-0.5 font-mono text-[11px] font-medium transition-colors ${
                        servingMultiplier === mult
                          ? "bg-neutral-950 text-white"
                          : "text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>

              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {activeRecipe.ingredients.map((ing, idx) => (
                  <li
                    key={idx}
                    className="flex items-baseline justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50/70 px-3 py-2 text-xs"
                  >
                    <span className="text-neutral-900">
                      {ing.item}
                      {ing.hindi && (
                        <span className="ml-1.5 text-neutral-500">({ing.hindi})</span>
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] font-medium text-neutral-700">
                      {formatAmount(ing.amount, servingMultiplier)} {ing.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Step-by-Step Cook Mode Checklist */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-950">
                  Cook Mode Steps
                </h3>
                <span className="font-mono text-xs text-neutral-500">
                  {Object.values(checkedSteps).filter(Boolean).length} /{" "}
                  {activeRecipe.steps.length} done
                </span>
              </div>

              <ol className="mt-3 space-y-2">
                {activeRecipe.steps.map((step, idx) => {
                  const done = Boolean(checkedSteps[idx]);
                  return (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() =>
                          setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }))
                        }
                        className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                          done
                            ? "border-emerald-200 bg-emerald-50/60 text-neutral-500 line-through"
                            : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                            done
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-neutral-300 bg-white text-neutral-500"
                          }`}
                        >
                          {done ? <Check className="h-3 w-3" /> : idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Student Pantry Swap */}
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50/80 p-3.5 text-xs text-orange-950">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" />
              <div>
                <span className="font-semibold">Student Pantry Swap: </span>
                {activeRecipe.studentSwap}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
