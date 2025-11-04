#!/usr/bin/env bash
# validate_full_pipeline_v2.sh
# Safe standalone script to validate full pipeline.
# Usage: TOKEN=... USER_ID=... [PROBLEM_ID=...] ./scripts/validate_full_pipeline_v2.sh

set -euo pipefail
: ${TOKEN:?
  Please export TOKEN (your JWT) before running.}
: ${USER_ID:?
  Please export USER_ID before running.}
: ${PROBLEM_ID:=}

JQ=$(command -v jq || true)
if [ -z "$JQ" ]; then
  echo "jq is required. Install it (brew install jq)." >&2
  exit 1
fi

API_BASE="http://localhost:3001"

echo "Starting full-pipeline validation (v2)..."

submit_to_problem() {
  local pid=$1
  echo "Submitting code to problem: $pid"
  local resp
  resp=$(curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$API_BASE/api/problems/$pid/submit" \
    -d "{\"code\":\"print(1/0)\",\"language\":\"python\"}")
  echo "$resp" | jq .
  SUBMISSION_ID=$(echo "$resp" | jq -r '.submissionId // .submission_id // .id')
  if [ -z "$SUBMISSION_ID" ] || [ "$SUBMISSION_ID" = "null" ]; then
    echo "Failed to extract submission ID from response" >&2
    return 1
  fi
  echo "Submission id: $SUBMISSION_ID"
  return 0
}

# If no PROBLEM_ID provided, create a dev submission and reuse its problem id
if [ -z "$PROBLEM_ID" ]; then
  echo "No PROBLEM_ID provided — creating dev submission to obtain problem id..."
  CREATE_PAYLOAD=$(jq -nc --arg userId "$USER_ID" '{userId:$userId, language:"python", code:"print(1/0)", status:"runtime_error"}')
  CREATE_RESP=$(curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$API_BASE/api/dev/create-submission" \
    -d "$CREATE_PAYLOAD")
  echo "$CREATE_RESP" | jq .
  PROBLEM_ID=$(echo "$CREATE_RESP" | jq -r '.problemId // .problem_id // .problem.id')
  SUBMISSION_ID=$(echo "$CREATE_RESP" | jq -r '.submissionId // .submission_id // .submission.id // .id')
  if [ -z "$PROBLEM_ID" ] || [ "$PROBLEM_ID" = "null" ]; then
    echo "Failed to get problem id from dev create response" >&2
    exit 1
  fi
  if [ -z "$SUBMISSION_ID" ] || [ "$SUBMISSION_ID" = "null" ]; then
    # create-submission didn't return submission id — submit via normal endpoint
    if ! submit_to_problem "$PROBLEM_ID"; then
      echo "Submission failed" >&2
      exit 1
    fi
  else
    echo "Using problem id: $PROBLEM_ID and submission id: $SUBMISSION_ID"
  fi
else
  # PROBLEM_ID provided -> submit to it
  if ! submit_to_problem "$PROBLEM_ID"; then
    echo "Submission failed" >&2
    exit 1
  fi
fi

# Poll for submission error
TIMEOUT=60
INTERVAL=2
ELAPSED=0
FOUND=""

echo "Polling for recorded submission error (timeout ${TIMEOUT}s)..."
while [ $ELAPSED -lt $TIMEOUT ]; do
  ERR_RESP=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/students/$USER_ID/errors")
  FOUND=$(echo "$ERR_RESP" | jq -c --arg sid "$SUBMISSION_ID" '(.recentErrors // []) | map(select(.submissionId == $sid)) | .[0] // empty') || true
  if [ -n "$FOUND" ]; then
    break
  fi
  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))
done

if [ -z "$FOUND" ]; then
  echo "Timed out waiting for submission error to be recorded." >&2
  echo "Last errors response:" >&2
  echo "$ERR_RESP" | jq .
  exit 2
fi

echo "Found SubmissionError:" 
echo "$FOUND" | jq .

echo "Label/confidence and related fields:" 
echo "$FOUND" | jq '{label: .signature?.label, confidence: .signature?.confidence, submissionId: .submissionId, problemId: .submission.problemId, createdAt: .createdAt}'

echo "\nDashboard summary for user $USER_ID:"
curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/students/$USER_ID/dashboard" | jq .

echo "Done."
