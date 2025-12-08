#!/bin/bash
# Quick script to check production database data

export PGPASSWORD="EduCode2025SecureDB!"
HOST="localhost"
PORT="5433"
USER="postgres"
DB="educode"

echo "=== Checking Instructor Account ==="
psql -h $HOST -p $PORT -U $USER -d $DB << 'EOF'
SELECT email, name, role FROM users WHERE email = 'instructor@example.com';
EOF

echo ""
echo "=== Checking Test Student ==="
psql -h $HOST -p $PORT -U $USER -d $DB << 'EOF'
SELECT email, name, role FROM users WHERE email = 'test@example.com';
EOF

echo ""
echo "=== Checking Classes ==="
psql -h $HOST -p $PORT -U $USER -d $DB << 'EOF'
SELECT c.id, c.name, c.code, c.semester, u.email as instructor 
FROM classes c 
JOIN users u ON c."instructorId" = u.id;
EOF

echo ""
echo "=== Checking Class Enrollments ==="
psql -h $HOST -p $PORT -U $USER -d $DB << 'EOF'
SELECT 
  ce.id,
  s.email as student_email,
  c.code as class_code,
  c.name as class_name,
  ce."enrolledAt"
FROM class_enrollments ce
JOIN users s ON ce."studentId" = s.id
JOIN classes c ON ce."classId" = c.id
ORDER BY ce."enrolledAt" DESC;
EOF

echo ""
echo "=== Class Summary ==="
psql -h $HOST -p $PORT -U $USER -d $DB << 'EOF'
SELECT 
  c.name,
  c.code,
  u.email as instructor_email,
  COUNT(ce.id) as enrolled_students
FROM classes c
JOIN users u ON c."instructorId" = u.id
LEFT JOIN class_enrollments ce ON ce."classId" = c.id
GROUP BY c.id, c.name, c.code, u.email;
EOF

echo ""
echo "=== Test Student Submissions Count ==="
psql -h $HOST -p $PORT -U $USER -d $DB << 'EOF'
SELECT 
  u.email,
  COUNT(s.id) as total_submissions,
  COUNT(CASE WHEN s.status = 'accepted' THEN 1 END) as accepted
FROM users u
LEFT JOIN submissions s ON s."userId" = u.id
WHERE u.email = 'test@example.com'
GROUP BY u.email;
EOF

unset PGPASSWORD
