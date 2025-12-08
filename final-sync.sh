#!/bin/bash
# Final sync approach: Use psql through Cloud SQL proxy

set -e

echo "🔄 Syncing 58 Problems to Production"
echo "====================================="
echo ""

# Check if proxy is running
if ! pgrep -f "cloud-sql-proxy.*educode-db" > /dev/null; then
    echo "❌ Cloud SQL proxy not running!"
    echo "Start it with:"
    echo "  /opt/homebrew/share/google-cloud-sdk/bin/cloud-sql-proxy educode-platform-2025:us-central1:educode-db --port 5433 &"
    exit 1
fi

echo "✅ Cloud SQL proxy is running"
echo ""

# Export from local Docker
echo "📤 Exporting from local Docker database..."
docker exec educode-postgres pg_dump -U postgres -d educode -t problems --data-only --column-inserts > /tmp/problems_sync.sql

PROBLEM_COUNT=$(grep -c "INSERT INTO" /tmp/problems_sync.sql)
echo "✅ Exported ${PROBLEM_COUNT} problems"
echo ""

# Import to production via proxy
echo "📥 Importing to production Cloud SQL..."
echo "Using password: EduCode2025SecureDB!"
echo ""

PGPASSWORD="EduCode2025SecureDB!" psql \
    -h localhost \
    -p 5433 \
    -U postgres \
    -d educode \
    -f /tmp/problems_sync.sql \
    2>&1 | grep -E "(INSERT|ERROR)" | head -20

echo ""
echo "📊 Checking production database..."
PGPASSWORD="EduCode2025SecureDB!" psql \
    -h localhost \
    -p 5433 \
    -U postgres \
    -d educode \
    -t -c "SELECT COUNT(*) FROM problems;"

echo ""
echo "Distribution:"
PGPASSWORD="EduCode2025SecureDB!" psql \
    -h localhost \
    -p 5433 \
    -U postgres \
    -d educode \
    -c "SELECT difficulty, COUNT(*) as count FROM problems GROUP BY difficulty ORDER BY difficulty;"

echo ""
echo "🧹 Cleaning up..."
rm /tmp/problems_sync.sql

echo ""
echo "✅ Sync complete!"
echo ""
echo "Verify via API:"
echo "  curl -s https://educode-backend-162585155042.us-central1.run.app/api/problems | jq 'length'"
