#!/bin/sh
set -e
echo "[web] applying migrations…"
npx prisma migrate deploy
echo "[web] starting Next.js…"
exec node server.js
