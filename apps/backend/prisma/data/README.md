# Data Import Directory

This directory contains data files and scripts for importing historical data into the database.

## Files

### `dump-original.jsonl`
Place your JSONL (JSON Lines) file here. Each line should be a valid JSON object representing a submission.

**Expected format:**
```jsonl
{"problemId":"1","code":"def solution():\n    return True","language":"python","status":"accepted","testCasesPassed":3,"totalTestCases":3,"runtime":0.05,"memory":1024,"submittedAt":"2025-11-01T10:00:00Z"}
{"problemId":"2","code":"def reverse(s):\n    return s[::-1]","language":"python","status":"accepted","testCasesPassed":4,"totalTestCases":4,"runtime":0.03,"memory":512}
```

**Supported fields:**
- `problemId` or `problem_id`: ID of the problem (required)
- `code` or `source_code`: The submitted code (required)
- `language`: Programming language (default: "python")
- `status`: Submission status (default: "accepted")
  - Options: "accepted", "wrong_answer", "runtime_error", "time_limit_exceeded", "compilation_error"
- `testCasesPassed` or `test_cases_passed`: Number of test cases passed
- `totalTestCases` or `total_test_cases`: Total number of test cases
- `runtime`: Execution time in seconds
- `memory`: Memory used in KB
- `submittedAt`, `submitted_at`, or `timestamp`: Submission timestamp (ISO format)
- `compileOutput` or `compile_output`: Compiler output
- `stderr`: Standard error output
- `judgeStatusId` or `judge_status_id`: Judge0 status ID

## Usage

### 1. Place your JSONL file
```bash
# Copy your JSONL file to this directory
cp /path/to/your/dump-original.jsonl apps/backend/prisma/data/
```

### 2. Run the import script
```bash
cd apps/backend

# For local database (via Cloud SQL Proxy)
DATABASE_URL='postgresql://postgres:EduCode2025SecureDB!@127.0.0.1:5433/educode' \
  npx ts-node prisma/import-submissions.ts prisma/data/dump-original.jsonl
```

### 3. Verify the import
```bash
# Check how many submissions were imported
DATABASE_URL='postgresql://postgres:EduCode2025SecureDB!@127.0.0.1:5433/educode' \
  npx prisma studio
```

## Notes

- All imported submissions will be assigned to the test user (`test@example.com`)
- Duplicate submissions are allowed (no uniqueness constraint)
- Invalid entries will be skipped with error messages
- The script will show progress every 10 submissions
