# Clean-Room Reverse-Engineering Brief — Indian Cookbook for Students

## 1. Public Market Leaders & Open-Source Equivalents Studied
- **Hebbar's Kitchen** (4.5★+ Indian recipe leader): Loved for step-by-step clarity, bookmarks, and category browsing. Weaknesses: long SEO intros before ingredients, ads, and no student-specific filters (cookware/budget/time).
- **Cookpad India**: Loved for home-style recipes and personal notes. Weaknesses: inconsistent formatting and noisy social feed.
- **Mealie / Cooklang** (Open-source recipe managers): Clean structured recipe schema (`slug`, `prep_time`, `cook_time`, `servings`, `ingredients[]`, `steps[]`, `tags[]`) and distraction-free Cook Mode.

## 2. Beat-the-Leader Matrix
| Dimension | Market Leaders | Indian Cookbook for Students |
|---|---|---|
| Time to Recipe | Scroll past ads & blog story | Instant: Ingredients & steps at top |
| Search Speed | Server round-trip / basic LIKE | Sub-10ms SQLite FTS5 BM25 full-text search |
| Student Filters | Generic cuisine/course only | Cookware (`1-pot`, `kettle`, `induction`, `no-cook`), Budget (`under-50`, `50-100`, `100-plus`), Time (`≤15m`, `≤30m`), Diet (`veg`, `egg`, `non-veg`) |
| Ingredient Clarity | Regional names without swaps | English + Hindi names (*jeera / cumin*) + Student Pantry Swaps |
| Cooking Experience | Static text | Interactive Cook Mode (step checkboxes + serving scaler) |

## 3. Core API Contracts
- `GET /api/health` — DB connectivity & recipe count check (`200 OK`).
- `GET /api/recipes?q=&category=&diet=&cookware=&budget=&maxTime=&favoritesOnly=&limit=&offset=` — FTS5 search + multi-facet filtering + pagination.
- `GET /api/recipes/[slug]` — Full recipe detail with ingredients, steps, and student swaps.
- `POST /api/favorites` / `DELETE /api/favorites` — Persistent SQLite favorites toggle (scoped by anonymous student session cookie or `default` local profile).
