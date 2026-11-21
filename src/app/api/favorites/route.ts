import { NextRequest, NextResponse } from "next/server";
import { getDb, toggleFavorite } from "@/lib/db";
import { FavoriteBodySchema } from "@/lib/types";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } },
      { status: 400 }
    );
  }

  const parsed = FavoriteBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Valid recipe slug is required" } },
      { status: 400 }
    );
  }

  try {
    const db = getDb();
    const result = toggleFavorite(db, parsed.data.slug);
    if (!result.exists) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Recipe not found" } },
        { status: 404 }
      );
    }
    return NextResponse.json({
      data: { slug: parsed.data.slug, isFavorite: result.isFavorite },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "FAVORITE_FAILED", message: "Failed to update favorite" } },
      { status: 500 }
    );
  }
}
