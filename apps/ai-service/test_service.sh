#!/bin/bash
# Test script for AI Service using curl
# Run this after starting the AI service

echo "🚀 Testing AI Service Health"
echo "=============================="

# Test health endpoint
echo "🔍 Testing health endpoint..."
health_response=$(curl -s -w "%{http_code}" http://127.0.0.1:8000/health 2>/dev/null)
http_code="${health_response: -3}"
response_body="${health_response%???}"

if [ "$http_code" = "200" ]; then
    echo "✅ Health check passed: $response_body"
else
    echo "❌ Health check failed: HTTP $http_code"
    echo "Make sure the service is running with:"
    echo "./venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
    exit 1
fi

# Test BKT endpoint
echo ""
echo "🧠 Testing BKT update endpoint..."
bkt_response=$(curl -s -w "%{http_code}" -X POST http://127.0.0.1:8000/bkt/update \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-123", "kcId": "algorithms", "correct": true}' 2>/dev/null)

http_code="${bkt_response: -3}"
response_body="${bkt_response%???}"

if [ "$http_code" = "200" ]; then
    echo "✅ BKT update successful: $response_body"
else
    echo "❌ BKT update failed: HTTP $http_code"
    echo "Response: $response_body"
fi

# Test invalid request
echo ""
echo "🚫 Testing invalid BKT request..."
invalid_response=$(curl -s -w "%{http_code}" -X POST http://127.0.0.1:8000/bkt/update \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}' 2>/dev/null)

http_code="${invalid_response: -3}"

if [ "$http_code" = "422" ]; then
    echo "✅ Invalid data properly rejected (422 validation error)"
else
    echo "⚠️  Unexpected response: HTTP $http_code"
fi

echo ""
echo "🎉 Testing complete! Check results above."