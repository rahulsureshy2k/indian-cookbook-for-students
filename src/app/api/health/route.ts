import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) as count FROM recipes").get() as { count: number };
    return NextResponse.json({
      status: "ok",
      app: "Indian Cookbook for Students",
      recipesCount: row.count,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: "Database health check failed" } },
      { status: 500 }
    );
  }
}
