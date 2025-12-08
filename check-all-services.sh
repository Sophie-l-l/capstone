#!/bin/bash

echo "=========================================="
echo "🔍 EduCode Platform Status Check"
echo "=========================================="
echo ""

# 1. Backend Health
echo "📡 Backend API:"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://educode-backend-162585155042.us-central1.run.app/health)
if [ "$BACKEND_STATUS" = "200" ]; then
  echo "  ✅ Running (HTTP $BACKEND_STATUS)"
else
  echo "  ❌ Error (HTTP $BACKEND_STATUS)"
fi

# 2. AI Service Health
echo "🤖 AI Service:"
AI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://educode-ai-162585155042.us-central1.run.app/health)
if [ "$AI_STATUS" = "200" ]; then
  echo "  ✅ Running (HTTP $AI_STATUS)"
else
  echo "  ❌ Error (HTTP $AI_STATUS)"
fi

# 3. Database Status
echo "🗄️  Database:"
DB_STATE=$(gcloud sql instances describe educode-db --project=educode-platform-2025 --format="value(state)" 2>/dev/null)
if [ "$DB_STATE" = "RUNNABLE" ]; then
  echo "  ✅ Running ($DB_STATE)"
else
  echo "  ❌ Error ($DB_STATE)"
fi

# 4. Quick DB Stats
echo ""
echo "📊 Database Quick Stats:"
cloud-sql-proxy educode-platform-2025:us-central1:educode-db --port=5433 &>/dev/null &
PROXY_PID=$!
sleep 2

PGPASSWORD=EduCode2025SecureDB! psql -h localhost -p 5433 -U postgres -d educode -t -c "SELECT '  Problems: ' || COUNT(*) FROM problems;" 2>/dev/null
PGPASSWORD=EduCode2025SecureDB! psql -h localhost -p 5433 -U postgres -d educode -t -c "SELECT '  Users: ' || COUNT(*) FROM users;" 2>/dev/null
PGPASSWORD=EduCode2025SecureDB! psql -h localhost -p 5433 -U postgres -d educode -t -c "SELECT '  Submissions: ' || COUNT(*) FROM submissions;" 2>/dev/null

kill $PROXY_PID 2>/dev/null

echo ""
echo "=========================================="
