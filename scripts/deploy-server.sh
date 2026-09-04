#!/usr/bin/env bash
# Zero-downtime deploy for vkcgoldikshu.com (run ON the server as vkcgoldikshu).
#
#   bash scripts/deploy-server.sh            # pull, build aside, swap, restart
#   bash scripts/deploy-server.sh --no-pull  # build what is checked out
#
# Why: `next build` in place empties .next while `next start` is still serving
# from it, so the site returned "Internal Server Error" for the whole build.
# This builds into .next-build (next.config reads NEXT_DIST_DIR), then swaps
# the two directories in a fraction of a second and restarts pm2.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/htdocs/vkcgoldikshu.com}"
PM2_NAME="${PM2_NAME:-vkcgoldikshu}"
LOG="$HOME/deploy-build.log"

cd "$APP_DIR"

# Next rewrites tsconfig.json during every build; drop that noise so the
# pull can fast-forward.
git checkout -- tsconfig.json 2>/dev/null || true
if [[ "${1:-}" != "--no-pull" ]]; then
  git pull --ff-only origin main
fi
echo "deploying $(git rev-parse --short HEAD)"

# Dependencies only when the lockfile changed since the last deploy. On the
# very first run just record the hash — node_modules is already installed.
# Never `npm ci` here: it deletes node_modules first, which takes the live
# server down for the whole install. `npm install` updates in place.
LOCK_HASH="$(md5sum package-lock.json | cut -d' ' -f1)"
if [[ ! -f .deployed-lock-hash ]]; then
  echo "$LOCK_HASH" > .deployed-lock-hash
elif [[ "$LOCK_HASH" != "$(cat .deployed-lock-hash)" ]]; then
  echo "package-lock.json changed — installing dependencies in place"
  npm install --no-audit --no-fund
  echo "$LOCK_HASH" > .deployed-lock-hash
fi

rm -rf .next-build
echo "building into .next-build (log: $LOG)"
NEXT_DIST_DIR=.next-build npm run build > "$LOG" 2>&1 || { echo "BUILD FAILED"; tail -40 "$LOG"; exit 1; }

# Swap: the live server keeps serving the old .next until this instant.
rm -rf .next-previous
[[ -d .next ]] && mv .next .next-previous
mv .next-build .next

pm2 restart "$PM2_NAME" --update-env > /dev/null
sleep 6
pm2 ls | grep -o "$PM2_NAME.*\(online\|errored\)" | head -1
curl -s -o /dev/null -w "local http %{http_code}\n" http://127.0.0.1:3000/
echo "DEPLOY_OK $(git rev-parse --short HEAD)"
