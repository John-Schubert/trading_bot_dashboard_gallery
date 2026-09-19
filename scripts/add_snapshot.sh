#!/usr/bin/env bash
# Adds a new dated snapshot to the gallery from the current dashboard
# screenshots, and appends one entry to manifest.json.
#
# Usage: scripts/add_snapshot.sh ["optional note describing what changed"]
#
# Does NOT commit or push - review the changes yourself, then run the
# git commands this script prints at the end.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="/home/pi5/trading_bot/screenshots"
NOTE="${1:-}"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Source screenshots directory not found: $SOURCE_DIR" >&2
  exit 1
fi

DATE="$(date +%F)"
FOLDER="$DATE"
SUFFIX_CHARS=(b c d e f g h)
i=0
while [ -d "$REPO_ROOT/snapshots/$FOLDER" ]; do
  FOLDER="${DATE}${SUFFIX_CHARS[$i]}"
  i=$((i + 1))
  if [ $i -ge ${#SUFFIX_CHARS[@]} ]; then
    echo "Too many snapshots for $DATE already - pick a different name manually." >&2
    exit 1
  fi
done

mkdir -p "$REPO_ROOT/snapshots/$FOLDER"
cp "$SOURCE_DIR"/*.png "$REPO_ROOT/snapshots/$FOLDER/"
echo "Copied screenshots into snapshots/$FOLDER/"

python3 - "$REPO_ROOT/manifest.json" "$DATE" "$FOLDER" "$NOTE" <<'PYEOF'
import json
import sys

manifest_path, date, folder, note = sys.argv[1:5]

with open(manifest_path) as f:
    manifest = json.load(f)

view_keys = [v["key"] for v in manifest["views"]]
entry = {
    "date": date,
    "folder": folder,
    "images": {key: f"{key}.png" for key in view_keys},
}
if note:
    entry["note"] = note

manifest["entries"].append(entry)

with open(manifest_path, "w") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")

print(f"Appended manifest entry for {date} (folder: {folder})")
PYEOF

echo
echo "Done. Review the changes, then run:"
echo "  cd $REPO_ROOT"
echo "  git add snapshots/$FOLDER manifest.json"
echo "  git commit -m \"Add $FOLDER snapshot${NOTE:+: $NOTE}\""
echo "  git push"
