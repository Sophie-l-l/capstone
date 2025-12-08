#!/bin/bash

# Sync instructor, class, and enrollment to production Cloud SQL

echo "🔄 Syncing instructor account to production..."

# Get the IDs we need
echo "Getting instructor and student IDs..."
INSTRUCTOR_DATA=$(docker exec -i educode-postgres psql -U postgres -d educode -t -A -F'|' -c \
  "SELECT id, email, name, \"passwordHash\", role, \"createdAt\", \"updatedAt\" FROM users WHERE email = 'instructor@example.com';")

STUDENT_ID=$(docker exec -i educode-postgres psql -U postgres -d educode -t -A -c \
  "SELECT id FROM users WHERE email = 'test@example.com';")

CLASS_DATA=$(docker exec -i educode-postgres psql -U postgres -d educode -t -A -F'|' -c \
  "SELECT id, name, code, semester, \"instructorId\", \"createdAt\", \"updatedAt\" FROM classes WHERE code = 'CS201-FALL2025';")

ENROLLMENT_DATA=$(docker exec -i educode-postgres psql -U postgres -d educode -t -A -F'|' -c \
  "SELECT id, \"studentId\", \"classId\", \"enrolledAt\" FROM class_enrollments WHERE \"classId\" = (SELECT id FROM classes WHERE code = 'CS201-FALL2025');")

# Parse the data
IFS='|' read -r INSTRUCTOR_ID INSTRUCTOR_EMAIL INSTRUCTOR_NAME INSTRUCTOR_PASS INSTRUCTOR_ROLE INSTRUCTOR_CREATED INSTRUCTOR_UPDATED <<< "$INSTRUCTOR_DATA"
IFS='|' read -r CLASS_ID CLASS_NAME CLASS_CODE CLASS_SEMESTER CLASS_INSTRUCTOR_ID CLASS_CREATED CLASS_UPDATED <<< "$CLASS_DATA"
IFS='|' read -r ENROLLMENT_ID ENROLLMENT_STUDENT_ID ENROLLMENT_CLASS_ID ENROLLMENT_DATE <<< "$ENROLLMENT_DATA"

echo "✅ Retrieved local data"
echo "   Instructor ID: $INSTRUCTOR_ID"
echo "   Student ID: $STUDENT_ID"
echo "   Class ID: $CLASS_ID"
echo "   Enrollment ID: $ENROLLMENT_ID"
echo ""
echo "Syncing to production..."

# Sync to production via proxy
PGPASSWORD=EduCode2025SecureDB! psql -h localhost -p 5433 -U postgres -d educode <<EOF
-- Sync instructor user
INSERT INTO users (id, email, name, username, "passwordHash", role, "createdAt", "updatedAt")
VALUES ('$INSTRUCTOR_ID', '$INSTRUCTOR_EMAIL', '$INSTRUCTOR_NAME', '$INSTRUCTOR_EMAIL', '$INSTRUCTOR_PASS', '$INSTRUCTOR_ROLE', '$INSTRUCTOR_CREATED', '$INSTRUCTOR_UPDATED')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  "passwordHash" = EXCLUDED."passwordHash",
  role = EXCLUDED.role,
  "updatedAt" = EXCLUDED."updatedAt";

-- Sync class
INSERT INTO classes (id, name, code, semester, "instructorId", "createdAt", "updatedAt")
VALUES ('$CLASS_ID', '$CLASS_NAME', '$CLASS_CODE', '$CLASS_SEMESTER', '$CLASS_INSTRUCTOR_ID', '$CLASS_CREATED', '$CLASS_UPDATED')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  "instructorId" = EXCLUDED."instructorId",
  semester = EXCLUDED.semester,
  "updatedAt" = EXCLUDED."updatedAt";

-- Sync enrollment
INSERT INTO class_enrollments (id, "studentId", "classId", "enrolledAt")
VALUES ('$ENROLLMENT_ID', '$ENROLLMENT_STUDENT_ID', '$ENROLLMENT_CLASS_ID', '$ENROLLMENT_DATE')
ON CONFLICT ("studentId", "classId") DO NOTHING;
EOF

echo "✅ Sync complete!"
echo ""
echo "Verifying production data..."

# Verify in production
PGPASSWORD=EduCode2025SecureDB! psql -h localhost -p 5433 -U postgres -d educode -c "
SELECT 
  'Instructor' as type,
  email,
  name,
  role
FROM users
WHERE email = 'instructor@example.com'
UNION ALL
SELECT 
  'Class' as type,
  code as email,
  name,
  semester as role
FROM classes
WHERE code = 'CS201-FALL2025'
UNION ALL
SELECT 
  'Enrollment' as type,
  u.email,
  u.name,
  c.code as role
FROM class_enrollments e
JOIN users u ON u.id = e.\"studentId\"
JOIN classes c ON c.id = e.\"classId\"
WHERE c.code = 'CS201-FALL2025'
;"

echo ""
echo "🎉 Production sync verified!"
