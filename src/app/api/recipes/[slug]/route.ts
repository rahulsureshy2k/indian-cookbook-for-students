import { NextRequest, NextResponse } from "next/server";
import { getDb, getRecipeBySlug } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  if (!slug || slug.length > 120) {
    return NextResponse.json(
      { error: { code: "INVALID_SLUG", message: "Invalid recipe slug" } },
      { status: 400 }
    );
  }

  try {
    const db = getDb();
    const recipe = getRecipeBySlug(db, slug);
    if (!recipe) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Recipe not found" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: recipe });
  } catch {
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to load recipe" } },
      { status: 500 }
    );
  }
}
