#!/bin/bash
# Deploy CodeNet Import as Cloud Run Job
# This runs the import in GCP infrastructure - downloads directly to cloud

set -e

echo "🚀 Deploying CodeNet Import Job to GCP"
echo "========================================"

PROJECT_ID="educode-platform-2025"
REGION="us-central1"
JOB_NAME="codenet-import-job"
SERVICE_ACCOUNT="educode-backend@educode-platform-2025.iam.gserviceaccount.com"

# Get database connection details
DB_INSTANCE="educode-platform-2025:us-central1:educode-db"
DB_NAME="educode"

echo ""
echo "📦 Building import container..."
cd /Users/sofi/Documents/Capstone/capstone/educode-adaptive-platform/apps/backend

# Build and push container using cloudbuild config
gcloud builds submit \
  --config cloudbuild-import.yaml \
  --project ${PROJECT_ID} \
  .

echo ""
echo "☁️  Creating Cloud Run Job..."

# Create/update Cloud Run Job
gcloud run jobs create ${JOB_NAME} \
  --image gcr.io/${PROJECT_ID}/${JOB_NAME}:latest \
  --region ${REGION} \
  --service-account ${SERVICE_ACCOUNT} \
  --set-cloudsql-instances ${DB_INSTANCE} \
  --set-env-vars DATABASE_URL="postgresql://educode:EduCode2024Secure!@localhost:5432/${DB_NAME}?host=/cloudsql/${DB_INSTANCE}" \
  --memory 4Gi \
  --cpu 2 \
  --max-retries 0 \
  --task-timeout 3600 \
  --execute-now \
  2>/dev/null || \

gcloud run jobs update ${JOB_NAME} \
  --image gcr.io/${PROJECT_ID}/${JOB_NAME}:latest \
  --region ${REGION} \
  --set-env-vars DATABASE_URL="postgresql://educode:EduCode2024Secure!@localhost:5432/${DB_NAME}?host=/cloudsql/${DB_INSTANCE}" \
  --memory 4Gi \
  --cpu 2

echo ""
echo "▶️  Executing import job..."
gcloud run jobs execute ${JOB_NAME} --region ${REGION} --wait

echo ""
echo "📊 Checking execution status..."
gcloud run jobs executions list --job ${JOB_NAME} --region ${REGION} --limit 1

echo ""
echo "✅ Import job deployed and executed!"
echo ""
echo "To view logs:"
echo "  gcloud logging read \"resource.type=cloud_run_job AND resource.labels.job_name=${JOB_NAME}\" --limit 100 --format json"
echo ""
echo "To check database:"
echo "  ./check-all-services.sh"
