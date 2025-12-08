#!/bin/bash
# Deploy backend to Cloud Run

gcloud run deploy educode-backend \
  --image gcr.io/educode-platform-2025/educode-backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --update-env-vars="DATABASE_URL=postgresql://postgres:EduCode2025SecureDB!@34.28.152.182:5432/educode,JWT_SECRET=educode_super_secret_jwt_key_2025" \
  --project educode-platform-2025
