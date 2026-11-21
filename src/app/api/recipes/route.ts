import { NextRequest, NextResponse } from "next/server";
import { getDb, searchRecipes } from "@/lib/db";
import { RecipeQuerySchema } from "@/lib/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const rawParams = {
    q: sp.get("q") ?? undefined,
    category: sp.get("category") || undefined,
    diet: sp.get("diet") || undefined,
    cookware: sp.get("cookware") || undefined,
    budget: sp.get("budget") || undefined,
    maxTime: sp.get("maxTime") || undefined,
    favoritesOnly: sp.get("favoritesOnly") || undefined,
    limit: sp.get("limit") || undefined,
    offset: sp.get("offset") || undefined,
  };

  const parsed = RecipeQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_QUERY",
          message: "Invalid search or filter parameters",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const db = getDb();
    const result = searchRecipes(db, parsed.data);
    return NextResponse.json({
      data: result.recipes,
      meta: {
        total: result.total,
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "SEARCH_FAILED", message: "Failed to search recipes" } },
      { status: 500 }
    );
  }
}
