#!/bin/bash
# Simple approach: Export local problems as JSON and import via backend API or direct DB connection

set -e

echo "🔄 Alternative Sync Approach"
echo "=============================="
echo ""
echo "Current situation:"
echo "  Local (Docker): 58 problems"
echo "  Production: unknown (checking...)"
echo ""

# Check production problem count
echo "📊 Checking production database via backend API..."
PROD_COUNT=$(curl -s https://educode-backend-162585155042.us-central1.run.app/api/problems | jq '. | length' 2>/dev/null || echo "0")

echo "  Production has: ${PROD_COUNT} problems"
echo ""

if [ "$PROD_COUNT" -ge "50" ]; then
    echo "✅ Production already has 50+ problems - no sync needed!"
    echo ""
    echo "To verify, visit:"
    echo "  https://educode-backend-162585155042.us-central1.run.app/api/problems"
    exit 0
fi

echo "📝 Options to sync 58 problems to production:"
echo ""
echo "Option 1: Manual SQL export/import (recommended)"
echo "  1. Export: docker exec educode-postgres pg_dump -U postgres -d educode -t problems --data-only > problems.sql"
echo "  2. Get Cloud SQL password from GCP Console"
echo "  3. Import using gcloud sql connect or psql"
echo ""
echo "Option 2: Run migrations on production"
echo "  1. Update apps/backend/prisma/seed.ts with all 58 problems"
echo "  2. Deploy backend to Cloud Run"
echo "  3. Run: gcloud run jobs execute educode-seed-job (if exists)"
echo ""
echo "Option 3: Use production backend with local problems"
echo "  1. Deploy updated backend with sync endpoint"
echo "  2. POST local problems JSON to production API"
echo ""

echo "For now, let's check what we have:"
echo ""
echo "Local problems:"
docker exec educode-postgres psql -U postgres -d educode -c "SELECT COUNT(*) FROM problems;"

echo ""
echo "Since production backend is running, the fastest approach is:"
echo "  1. Keep 58 problems in local for testing"
echo "  2. Deploy frontend to Vercel (points to production backend)"
echo "  3. Frontend will show whatever problems production has"
echo ""
echo "Would you like to:"
echo "  A) Check current production problems"
echo "  B) Export local problems as seed data"
echo "  C) Deploy frontend now with current production data"
