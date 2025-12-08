#!/bin/bash
# Comprehensive test of all fixes

echo "🧪 Testing EduCode Platform Deployment"
echo "======================================"
echo ""

# Test 1: Frontend /students route
echo "1️⃣ Testing /students route (should not 404)..."
STUDENTS_RESPONSE=$(curl -s https://educode-adaptive-platform.vercel.app/students)
if echo "$STUDENTS_RESPONSE" | grep -q "EduCode"; then
  echo "   ✅ /students route works"
else
  echo "   ❌ /students route failed"
fi
echo ""

# Test 2: Backend health
echo "2️⃣ Testing backend health..."
BACKEND_HEALTH=$(curl -s https://educode-backend-162585155042.us-central1.run.app/health)
if echo "$BACKEND_HEALTH" | grep -q "ok"; then
  echo "   ✅ Backend is healthy: $BACKEND_HEALTH"
else
  echo "   ❌ Backend health check failed"
fi
echo ""

# Test 3: Instructor login
echo "3️⃣ Testing instructor login..."
LOGIN_RESPONSE=$(curl -s -X POST https://educode-backend-162585155042.us-central1.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"instructor@example.com","password":"instructor123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo "   ✅ Instructor login successful"
  echo "   Token: ${TOKEN:0:50}..."
else
  echo "   ❌ Instructor login failed"
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
fi
echo ""

# Test 4: Get instructor classes
echo "4️⃣ Testing /api/instructor/classes endpoint..."
CLASSES_RESPONSE=$(curl -s -X GET "https://educode-backend-162585155042.us-central1.run.app/api/instructor/classes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$CLASSES_RESPONSE" | grep -q "Route not found"; then
  echo "   ❌ Instructor routes NOT deployed yet"
  echo "   Backend needs redeployment"
  echo ""
  echo "   Run: gcloud run deploy educode-backend \\"
  echo "          --image gcr.io/educode-platform-2025/educode-backend:latest \\"
  echo "          --region us-central1 --project educode-platform-2025"
  exit 1
elif echo "$CLASSES_RESPONSE" | grep -q "CS201-FALL2025"; then
  echo "   ✅ Instructor classes endpoint works!"
  echo "   Classes found:"
  echo "$CLASSES_RESPONSE" | jq -r '.[] | "      - \(.name) (\(.code)) - \(._count.enrollments) students"'
else
  echo "   ⚠️  Endpoint works but no classes found"
  echo "   Response: $CLASSES_RESPONSE"
fi
echo ""

# Test 5: Get class analytics
if echo "$CLASSES_RESPONSE" | grep -q "CS201-FALL2025"; then
  CLASS_ID=$(echo "$CLASSES_RESPONSE" | jq -r '.[0].id')
  echo "5️⃣ Testing /api/instructor/classes/$CLASS_ID/analytics..."
  
  ANALYTICS_RESPONSE=$(curl -s -X GET "https://educode-backend-162585155042.us-central1.run.app/api/instructor/classes/$CLASS_ID/analytics" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  STUDENT_COUNT=$(echo "$ANALYTICS_RESPONSE" | jq -r '.summary.totalStudents // 0')
  TOTAL_SUBMISSIONS=$(echo "$ANALYTICS_RESPONSE" | jq -r '.summary.totalSubmissions // 0')
  AT_RISK=$(echo "$ANALYTICS_RESPONSE" | jq -r '.summary.atRiskStudents // 0')
  
  echo "   📊 Analytics Summary:"
  echo "      Students: $STUDENT_COUNT"
  echo "      Total Submissions: $TOTAL_SUBMISSIONS"
  echo "      At-Risk Students: $AT_RISK"
  
  if [ "$STUDENT_COUNT" -gt 0 ]; then
    echo "   ✅ Analytics working with student data!"
    echo ""
    echo "   👥 Student Details:"
    echo "$ANALYTICS_RESPONSE" | jq -r '.studentStats[] | "      - \(.name) (\(.email)): \(.totalSubmissions) submissions, \(.acceptanceRate * 100 | floor)% accepted"'
  else
    echo "   ❌ No students found in analytics"
  fi
fi

echo ""
echo "======================================"
echo "✅ All tests completed!"
