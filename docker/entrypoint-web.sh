#!/bin/sh
set -e
echo "[web] applying migrations…"
npx prisma migrate deploy
echo "[web] ensuring seed data…"
npx tsx prisma/seed.ts || echo "[web] seed skipped/failed (non-fatal)"
echo "[web] starting Next.js…"
exec node server.js
