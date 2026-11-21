# Domain Glossary — Indian Cookbook for Students

- **Recipe**: A curated, beginner-friendly Indian dish tailored for college/hostel students.
  - `id`: Auto-increment primary key.
  - `slug`: Unique URL-safe identifier (e.g., `kanda-poha`).
  - `title`: Simple English dish name.
  - `hindi_name`: Familiar Hindi/regional name (e.g., `Flattened Rice / पोहा`).
  - `category`: `Breakfast` | `Lunch` | `Dinner` | `Snacks` | `Drinks`.
  - `diet`: `veg` | `egg` | `non-veg`.
  - `cookware`: `1-pot` | `kettle` | `induction` | `no-cook` | `pressure-cooker`.
  - `budget_tier`: `under-50` | `50-100` | `100-plus` (INR per serving estimate).
  - `cost_inr`: Estimated cost per serving in ₹.
  - `prep_minutes` / `cook_minutes` / `total_minutes`: Timing metadata.
  - `difficulty`: `Easy` | `Super Easy`.
  - `servings`: Default serving count (scalable in Cook Mode).
  - `ingredients_json`: Structured array of `{ item, amount, unit, hindi? }`.
  - `steps_json`: Ordered array of concise, beginner-friendly cooking steps.
  - `student_swap`: Practical hostel/pantry substitution tip.
- **Favorite**: A student's bookmarked recipe stored in SQLite (`favorites` table).
- **FTS5 Index (`recipes_fts`)**: SQLite virtual table indexing `title`, `hindi_name`, `description`, `category`, `cookware`, `ingredients_text`, and `tags` for sub-10ms BM25 search.
