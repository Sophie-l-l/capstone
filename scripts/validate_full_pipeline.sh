#!/usr/bin/env bash
# validate_full_pipeline.sh
# Submits code to a problem, polls until a SubmissionError is recorded and an ErrorSignature (AI label) is created,
# then prints the error info and dashboard summary.
# Usage: TOKEN=... USER_ID=... [PROBLEM_ID=...] ./scripts/validate_full_pipeline.sh

set -euo pipefail
: ${TOKEN:?
  Please export TOKEN (your JWT) before running.}
: ${USER_ID:?
  Please export USER_ID before running.}
: ${PROBLEM_ID:=}

# If PROBLEM_ID is empty the script will create a dev submission to obtain a problem id.

JQ=$(command -v jq || true)
if [ -z "$JQ" ]; then
  echo "jq is required. Install it (brew install jq) or run the Python fallback." >&2
  #!/usr/bin/env bash
  # validate_full_pipeline.sh
  # Submits code to a problem, polls until a SubmissionError is recorded and an ErrorSignature (AI label) is created,
  # then prints the error info and dashboard summary.
  # Usage: TOKEN=... USER_ID=... [PROBLEM_ID=...] ./scripts/validate_full_pipeline.sh

  set -euo pipefail
  : ${TOKEN:?
    Please export TOKEN (your JWT) before running.}
  : ${USER_ID:?
    Please export USER_ID before running.}
  : ${PROBLEM_ID:=}

  JQ=$(command -v jq || true)
  if [ -z "$JQ" ]; then
    echo "jq is required. Install it (brew install jq) or run the Python fallback." >&2
    exit 1
  fi

  API_BASE=http://localhost:3001

  echo "Starting full-pipeline validation..."

  # Helper: submit code to a problem id
JQ=$(command -v jq || true)
    local pid=$1
    echo "Submitting code to problem: $pid"
    local resp
    resp=$(curl -s -X POST \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      "$API_BASE/api/problems/$pid/submit" \
      -d "$(jq -nc --arg code 'print(1/0)' --arg language 'python' '{code:$code, language:$language}')")
    echo "$resp" | jq .
    SUBMISSION_ID=$(echo "$resp" | jq -r '.submissionId // .submission_id // .id')
    if [ -z "$SUBMISSION_ID" ] || [ "$SUBMISSION_ID" = "null" ]; then
      echo "Failed to extract submission ID from response" >&2
      exit 1
    fi
    echo "Submission id: $SUBMISSION_ID"
  }

  # If no problem id provided, create a dev submission to get a problem id
  if [ -z "$PROBLEM_ID" ]; then
    echo "No PROBLEM_ID provided — creating a dev submission to obtain a problem id..."
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
      echo "Failed to obtain problem id from dev create response" >&2
      exit 1
    fi
    if [ -z "$SUBMISSION_ID" ] || [ "$SUBMISSION_ID" = "null" ]; then
      # if create-submission didn't return submission id, call submit path
      action_submit "$PROBLEM_ID"
    else
      echo "Using problem id: $PROBLEM_ID and submission id: $SUBMISSION_ID"
    fi
  else
    # PROBLEM_ID provided -> submit and get submission id
    action_submit "$PROBLEM_ID"
  fi

  # Poll for the submission error to appear in student's recentErrors
  TIMEOUT=60
  INTERVAL=2
  ELAPSED=0
  FOUND_ENTRY=""

  echo "Polling for recorded SubmissionError (timeout ${TIMEOUT}s)..."
  while [ $ELAPSED -lt $TIMEOUT ]; do
    RESP=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/students/$USER_ID/errors")
    # Try to find an entry matching our submission id
    MATCH=$(echo "$RESP" | jq -c --arg sid "$SUBMISSION_ID" '(.recentErrors // []) | map(select(.submissionId == $sid)) | .[0] // empty') || true
    if [ -n "$MATCH" ]; then
      FOUND_ENTRY="$MATCH"
      break
    fi
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
  done

  if [ -z "$FOUND_ENTRY" ]; then
    echo "Timed out waiting for submission error to be recorded. Check backend and ai-service logs." >&2
    echo "Last errors response:" >&2
    echo "$RESP" | jq .
    exit 2
  fi

  echo "Found SubmissionError entry:"
  echo "$FOUND_ENTRY" | jq .

  # Print extracted label/confidence and related fields
if [ -z "$JQ" ]; then
  echo "jq is required. Install it (brew install jq) or run the Python fallback in the README." >&2

  # Fetch dashboard summary
  exit 1
fi


API_BASE=http://localhost:3001

echo "Starting full-pipeline validation..."

#!/usr/bin/env bash
# validate_full_pipeline.sh
# Submits code to a problem, polls until a SubmissionError is recorded and an ErrorSignature (AI label) is created,
# then prints the error info and dashboard summary.
# Usage: TOKEN=... USER_ID=... [PROBLEM_ID=...] ./scripts/validate_full_pipeline.sh

set -euo pipefail
: ${TOKEN:?
  Please export TOKEN (your JWT) before running.}
: ${USER_ID:?
  Please export USER_ID before running.}
: ${PROBLEM_ID:=}

JQ=$(command -v jq || true)
if [ -z "$JQ" ]; then
  echo "jq is required. Install it (brew install jq) or run the Python fallback." >&2
  exit 1
fi

API_BASE=http://localhost:3001

echo "Starting full-pipeline validation..."

# Helper: submit code to a problem id
action_submit() {
  local pid=$1
  echo "Submitting code to problem: $pid"
  local resp
  resp=$(curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$API_BASE/api/problems/$pid/submit" \
    -d "$(jq -nc --arg code 'print(1/0)' --arg language 'python' '{code:$code, language:$language}')")
  echo "$resp" | jq .
  SUBMISSION_ID=$(echo "$resp" | jq -r '.submissionId // .submission_id // .id')
  if [ -z "$SUBMISSION_ID" ] || [ "$SUBMISSION_ID" = "null" ]; then
    echo "Failed to extract submission ID from response" >&2
    exit 1
  fi
  echo "Submission id: $SUBMISSION_ID"
}

# If no problem id provided, create a dev submission to get a problem id
if [ -z "$PROBLEM_ID" ]; then
  echo "No PROBLEM_ID provided — creating a dev submission to obtain a problem id..."
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
    echo "Failed to obtain problem id from dev create response" >&2
    exit 1
  fi
  if [ -z "$SUBMISSION_ID" ] || [ "$SUBMISSION_ID" = "null" ]; then
    # if create-submission didn't return submission id, call submit path
    action_submit "$PROBLEM_ID"
  else
    echo "Using problem id: $PROBLEM_ID and submission id: $SUBMISSION_ID"
  fi
else
  # PROBLEM_ID provided -> submit and get submission id
  action_submit "$PROBLEM_ID"
fi

# Poll for the submission error to appear in student's recentErrors
TIMEOUT=60
INTERVAL=2
ELAPSED=0
FOUND_ENTRY=""

echo "Polling for recorded SubmissionError (timeout ${TIMEOUT}s)..."
while [ $ELAPSED -lt $TIMEOUT ]; do
  RESP=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/students/$USER_ID/errors")
  # Try to find an entry matching our submission id
  MATCH=$(echo "$RESP" | jq -c --arg sid "$SUBMISSION_ID" '(.recentErrors // []) | map(select(.submissionId == $sid)) | .[0] // empty') || true
  if [ -n "$MATCH" ]; then
    FOUND_ENTRY="$MATCH"
    break
  fi
  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))
done

if [ -z "$FOUND_ENTRY" ]; then
  echo "Timed out waiting for submission error to be recorded. Check backend and ai-service logs." >&2
  echo "Last errors response:" >&2
  echo "$RESP" | jq .
  exit 2
fi

echo "Found SubmissionError entry:"
echo "$FOUND_ENTRY" | jq .

# Print extracted label/confidence and related fields
echo "Extracted label/confidence/problem/submission:" 
echo "$FOUND_ENTRY" | jq '{label: .signature?.label, confidence: .signature?.confidence, submissionId: .submissionId, problemId: .submission.problemId, createdAt: .createdAt}'

# Fetch dashboard summary
echo "\nDashboard summary for user $USER_ID:" 
curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/students/$USER_ID/dashboard" | jq .

echo "Full-pipeline validation complete."

  local pid=$1
  echo "Submitting code to problem: $pid"
  local resp
  resp=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    "$API_BASE/api/problems/$pid/submit" \
    -d '{"code":"print(1/0)","language":"python"}')
  echo "$resp" | jq .
  SUBMISSION_ID=$(echo "$resp" | jq -r '.submissionId // .submission_id // .id')
  echo "Submission id: $SUBMISSION_ID"
}

# If PROBLEM_ID not provided, create a dev submission to get a problemId
if [ -z "$PROBLEM_ID" ]; then
  echo "No PROBLEM_ID provided — creating a dev submission to get a problem id..."
  CREATE_RESP=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    "$API_BASE/api/dev/create-submission" \
    -d '{"userId":"'