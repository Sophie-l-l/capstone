#!/bin/bash
# Monitor backend deployment and test when ready

echo "🚀 Deploying Backend to Cloud Run..."
echo ""

# Deploy backend
cd /Users/sofi/Documents/Capstone/capstone/educode-adaptive-platform

gcloud builds submit \
  --config cloudbuild-backend.yaml \
  --project=educode-platform-2025

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Build completed successfully!"
  echo ""
  echo "🔄 Deploying to Cloud Run..."
  
  gcloud run deploy educode-backend \
    --image gcr.io/educode-platform-2025/educode-backend:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars="DATABASE_URL=postgresql://postgres:EduCode2025SecureDB!@34.28.152.182:5432/educode" \
    --set-env-vars="JWT_SECRET=educode_super_secret_jwt_key_2025" \
    --project=educode-platform-2025
  
  echo ""
  echo "🧪 Testing instructor endpoints..."
  sleep 5
  
  # Test login
  TOKEN=$(curl -s -X POST https://educode-backend-162585155042.us-central1.run.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"instructor@example.com","password":"instructor123"}' | jq -r '.token')
  
  echo "Token received: ${TOKEN:0:50}..."
  
  # Test get classes
  echo ""
  echo "📚 Fetching instructor classes..."
  curl -s -X GET "https://educode-backend-162585155042.us-central1.run.app/api/instructor/classes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" | jq '.'
  
  echo ""
  echo "✅ Deployment complete!"
else
  echo "❌ Build failed!"
  exit 1
fi
