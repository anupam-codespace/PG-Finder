#!/bin/zsh
# ─────────────────────────────────────────────────────────
#  build-android.sh  — Build + sync Globiz Patholab for Android
#  Usage:  ./build-android.sh
# ─────────────────────────────────────────────────────────

# Set up Node.js / npm via nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
export PATH="$HOME/.nvm/versions/node/v24.12.0/bin:$PATH"

NPM="$HOME/.nvm/versions/node/v24.12.0/bin/npm"
NPX="$HOME/.nvm/versions/node/v24.12.0/bin/npx"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   Globiz Patholab — Android Build    ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Step 1 — Build Next.js static export
echo "▶  Step 1/3: Building Next.js (npm run build)..."
"$NPM" run build
if [ $? -ne 0 ]; then
  echo "✗  Build failed. Fix errors above and try again."
  exit 1
fi
echo "✓  Build complete."
echo ""

# Step 2 — Sync with Android
echo "▶  Step 2/3: Syncing Capacitor Android..."
"$NPX" cap sync android
if [ $? -ne 0 ]; then
  echo "✗  Cap sync failed."
  exit 1
fi
echo "✓  Sync complete."
echo ""

# Step 3 — Open Android Studio
echo "▶  Step 3/3: Opening Android Studio..."
"$NPX" cap open android
echo ""
echo "✓  Done! Press ▶ Run in Android Studio to deploy to your phone."
echo ""
