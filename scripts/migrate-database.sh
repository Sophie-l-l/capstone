#!/bin/bash

# Database Migration Script
# This script will clean the database and run the migration

set -e  # Exit on any error

echo "🚀 Starting Database Migration Process"
echo "======================================"
echo ""

# Step 1: Stop services
echo "📦 Step 1: Stopping all services..."
docker compose -f docker-compose.dev.yml down
echo "   ✅ Services stopped"
echo ""

# Step 2: Start only database
echo "💾 Step 2: Starting PostgreSQL..."
docker compose -f docker-compose.dev.yml up -d postgres
echo "   ⏳ Waiting for database to be ready..."
sleep 8
echo "   ✅ Database ready"
echo ""

# Step 3: Clean database
echo "🧹 Step 3: Cleaning old data..."
echo "   ⚠️  This will delete all submissions and errors!"
read -p "   Continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose -f docker-compose.dev.yml exec postgres \
      psql -U postgres -d educode -c "
        DELETE FROM submission_errors;
        DELETE FROM submissions;
        DELETE FROM error_signatures;
        DELETE FROM error_clusters;
        SELECT 'Deleted ' || COUNT(*) || ' rows from each table' as result;
      "
    echo "   ✅ Database cleaned"
else
    echo "   ⏭️  Skipping cleanup"
fi
echo ""

# Step 4: Generate Prisma Client
echo "🔧 Step 4: Generating Prisma Client..."
docker compose -f docker-compose.dev.yml run --rm backend \
  npm run prisma:generate
echo "   ✅ Prisma Client generated"
echo ""

# Step 5: Create migration
echo "📝 Step 5: Creating migration..."
docker compose -f docker-compose.dev.yml run --rm backend \
  npx prisma migrate dev --name add_academic_fields_to_error_signature
echo "   ✅ Migration created and applied"
echo ""

# Step 6: Restart all services
echo "🚀 Step 6: Starting all services..."
docker compose -f docker-compose.dev.yml up -d
echo "   ⏳ Waiting for services to start..."
sleep 10
echo "   ✅ All services running"
echo ""

# Step 7: Verify
echo "✅ Step 7: Verifying migration..."
docker compose -f docker-compose.dev.yml exec postgres \
  psql -U postgres -d educode -c "\d error_signatures" | grep -E "(surfaceError|cognitiveCause|bloomLevel)" && echo "   ✅ New columns found!" || echo "   ❌ Migration may have failed"
echo ""

echo "🎉 Migration Complete!"
echo "===================="
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:3000"
echo "  2. Submit code with errors"
echo "  3. Check dashboard for rich academic classification"
echo ""
echo "Verify with:"
echo "  docker compose -f docker-compose.dev.yml exec postgres \\"
echo "    psql -U postgres -d educode -c 'SELECT * FROM error_signatures LIMIT 1;'"
echo ""
