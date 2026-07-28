#!/usr/bin/env bash
# Capture the demo profile screenshot for the homepage Proof section.
# Requires: local dev server on :3000 and Google Chrome (macOS path below).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/marketing/demo-satoshi-profile.png"
URL="${1:-http://localhost:3000/u/satoshi}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

mkdir -p "$ROOT/public/marketing"

if [[ ! -x "$CHROME" ]]; then
  echo "Chrome not found at $CHROME"
  echo "Open $URL, screenshot the top of the page, and save to public/marketing/demo-satoshi-profile.png"
  exit 1
fi

"$CHROME" \
  --headless \
  --disable-gpu \
  --screenshot="$OUT" \
  --window-size=1280,900 \
  --virtual-time-budget=15000 \
  "$URL"

echo "Saved $OUT"
