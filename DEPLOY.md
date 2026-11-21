# Deploy Runbook — Indian Cookbook for Students (\$0 Stack)

## 1. Local Development (\$0, Zero Docker)
```bash
npm install
npm run db:seed
npm run dev
```
Open `http://localhost:3000`. The SQLite FTS5 database is stored locally at `./data/dev.db`.

## 2. Automated Verification
```bash
npm run lint
npm test
npm run build
```

## 3. \$0 Production Deployment (Vercel / Railway / Fly.io)
- **Vercel (\$0 Hobby):** Push to `main` and import `rahulsureshy2k/indian-cookbook-for-students` in Vercel.
  - Note: For persistent Favorites across serverless invocations on Vercel, swap `DATABASE_PATH` to a \$0 **Turso** libSQL database or keep `./data/dev.db` on a persistent volume (Fly.io / Render / Railway).
- **Environment Variables:** Copy `.env.example` (no paid API keys required).
- **Health Check:** `GET /api/health` returns `200 OK` with recipe count.
- **Rollback:** Instant rollback via Vercel Deployments tab or `git revert`.
