#!/bin/bash
# Globiz Patholab — DB Setup Script
# Runs: prisma db push (creates all tables) + prisma generate (builds client)

set -e

export PATH="/Users/anupamsaha/.nvm/versions/node/v24.12.0/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"

PROJ="/Users/anupamsaha/Desktop/Globiz Patholab"
PRISMA="$PROJ/node_modules/.bin/prisma"

echo ""
echo "=== Globiz Patholab — DB Setup ==="
echo ""

# Verify PostgreSQL is reachable
echo "[1/3] Checking PostgreSQL connection..."
if psql "postgresql://globiz_user:globiz_secure_2024@localhost:5432/globiz_patholab" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "      ✓ PostgreSQL connected"
else
  echo "      ✗ Cannot connect to PostgreSQL. Is it running?"
  echo "        Run: brew services start postgresql@16"
  exit 1
fi

# Push schema (creates/updates all tables without migration history)
echo "[2/3] Pushing schema to database (creating tables)..."
cd "$PROJ"
"$PRISMA" db push --force-reset --accept-data-loss 2>&1
echo "      ✓ All tables created"

# Generate Prisma client
echo "[3/3] Generating Prisma client..."
"$PRISMA" generate 2>&1
echo "      ✓ Prisma client generated"

echo ""
echo "=== DONE — Database is ready ==="
echo ""
echo "Now restart the dev server:"
echo "  npm run dev"
echo ""
