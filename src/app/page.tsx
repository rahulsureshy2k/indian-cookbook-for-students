import CookbookClient from "@/components/CookbookClient";
import { getDb, searchRecipes } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const db = getDb();
  const { recipes, total } = searchRecipes(db, { limit: 50, offset: 0 });
  return <CookbookClient initialRecipes={recipes} initialTotal={total} />;
}
