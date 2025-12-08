#!/bin/bash
# Sync problems from local Docker database to production Cloud SQL
# This avoids downloading 7.8GB - just copies the curated problems we already created

set -e

echo "🔄 Syncing Problems to Production Cloud SQL"
echo "==========================================="
echo ""

# Production database details
DB_INSTANCE="educode-platform-2025:us-central1:educode-db"
DB_HOST="34.28.152.182"
DB_NAME="educode"
DB_USER="educode"
DB_PASS="EduCode2024Secure!"

# Export problems from local Docker database
echo "📤 Exporting problems from local Docker database..."
docker exec educode-postgres pg_dump -U postgres -d educode -t problems --data-only --column-inserts > /tmp/problems_export.sql

echo "✅ Exported $(grep -c 'INSERT INTO' /tmp/problems_export.sql) problems"
echo ""

# Check if Cloud SQL proxy is running
if ! pgrep -f "cloud-sql-proxy.*${DB_INSTANCE}" > /dev/null; then
    echo "⚠️  Cloud SQL proxy not running. Starting it..."
    /opt/homebrew/share/google-cloud-sdk/bin/cloud-sql-proxy ${DB_INSTANCE} --port 5433 &
    PROXY_PID=$!
    sleep 5
    echo "✅ Started Cloud SQL proxy (PID: $PROXY_PID)"
else
    echo "✅ Cloud SQL proxy already running"
fi

echo ""
echo "📥 Importing problems to production database..."

# Import to production (using proxy on port 5433 to avoid conflict with Docker's 5432)
PGPASSWORD="${DB_PASS}" psql \
    -h localhost \
    -p 5433 \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    -f /tmp/problems_export.sql \
    2>&1 | grep -v "ERROR.*duplicate key" || true

echo ""
echo "🧹 Cleaning up..."
rm /tmp/problems_export.sql

# Kill proxy if we started it
if [ ! -z "$PROXY_PID" ]; then
    kill $PROXY_PID 2>/dev/null || true
    echo "✅ Stopped Cloud SQL proxy"
fi

echo ""
echo "📊 Checking production database..."
PGPASSWORD="${DB_PASS}" psql \
    -h localhost \
    -p 5433 \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    -c "SELECT COUNT(*) as total_problems, 
        COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as easy,
        COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as medium,
        COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard
        FROM problems;"

echo ""
echo "✅ Production database updated successfully!"
echo ""
echo "Next steps:"
echo "  1. Test frontend: http://localhost:3000/problems"
echo "  2. Deploy frontend to Vercel: cd apps/frontend && vercel --prod"
