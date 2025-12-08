#!/bin/bash

# Database Schema Inspection Script
# Usage: ./inspect-database.sh [table_name]
# If no table specified, shows all tables

DB_HOST="localhost"
DB_PORT="5433"
DB_USER="postgres"
DB_NAME="educode"
PGPASSWORD="EduCode2025SecureDB!"

export PGPASSWORD

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}     EduCode Database Schema Inspector${NC}"
echo -e "${BLUE}==================================================${NC}\n"

if [ -z "$1" ]; then
    # Show all tables
    echo -e "${GREEN}📋 All Tables:${NC}\n"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt"
    
    echo -e "\n${GREEN}📊 Record Counts:${NC}\n"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'problems', COUNT(*) FROM problems
UNION ALL SELECT 'test_cases', COUNT(*) FROM test_cases
UNION ALL SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL SELECT 'submission_errors', COUNT(*) FROM submission_errors
UNION ALL SELECT 'error_signatures', COUNT(*) FROM error_signatures
UNION ALL SELECT 'KnowledgeComponent', COUNT(*) FROM "KnowledgeComponent"
UNION ALL SELECT 'BKTState', COUNT(*) FROM "BKTState"
UNION ALL SELECT 'classes', COUNT(*) FROM classes
UNION ALL SELECT 'class_enrollments', COUNT(*) FROM class_enrollments
UNION ALL SELECT 'problem_sets', COUNT(*) FROM problem_sets
UNION ALL SELECT 'problem_set_items', COUNT(*) FROM problem_set_items
UNION ALL SELECT 'achievements', COUNT(*) FROM achievements
UNION ALL SELECT 'user_achievements', COUNT(*) FROM user_achievements
UNION ALL SELECT 'error_clusters', COUNT(*) FROM error_clusters
ORDER BY count DESC;
EOF

else
    TABLE=$1
    
    echo -e "${GREEN}📝 Schema for table: ${YELLOW}${TABLE}${NC}\n"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d \"$TABLE\""
    
    echo -e "\n${GREEN}📊 Record count:${NC}"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as total_records FROM \"$TABLE\";"
    
    echo -e "\n${GREEN}🔍 Sample data (first 5 rows):${NC}\n"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT * FROM \"$TABLE\" LIMIT 5;"
fi

echo -e "\n${BLUE}==================================================${NC}"
echo -e "${YELLOW}💡 Usage Tips:${NC}"
echo -e "  View specific table: ./inspect-database.sh users"
echo -e "  View all tables:     ./inspect-database.sh"
echo -e "${BLUE}==================================================${NC}\n"
