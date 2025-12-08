# ADR 003: Judge0 for Secure Code Execution

## Status
Accepted

## Date
2024-11-18

## Context
The platform needs to execute untrusted student code submissions in multiple languages (Python, Java, C++, JavaScript) and return results including:
- Execution status (accepted, wrong answer, runtime error, etc.)
- Test case results
- Compilation errors
- Runtime/memory usage

Security is critical - we cannot execute untrusted code directly on our servers.

## Decision
We will use **Judge0 CE (Community Edition)** via RapidAPI as the code execution engine.

### Configuration
- **API Endpoint**: `https://judge0-ce.p.rapidapi.com`
- **API Key**: Stored in Google Secret Manager
- **Supported Languages**:
  - Python 3 (language_id: 71)
  - Java (language_id: 62)
  - C++ (language_id: 54)
  - JavaScript (Node.js) (language_id: 63)

### Execution Flow
1. Backend receives submission from frontend
2. Format code + test case input for Judge0
3. POST to `/submissions` with base64-encoded source
4. Poll `/submissions/{token}` until status not "Processing"
5. Parse results and store in database
6. Update problem statistics
7. Trigger BKT update for knowledge components

### Test Case Evaluation
- Run code against each test case separately
- Compare output (string match, trimmed)
- Calculate: `testCasesPassed / totalTestCases`
- Status: "accepted" only if all test cases pass

## Alternatives Considered

### 1. Self-hosted Docker Sandboxing
- **Rejected**: Complex infrastructure management
- **Why**: Requires Docker security hardening, resource limits, cleanup
- **Cost**: High development and maintenance overhead

### 2. AWS Lambda Code Execution
- **Rejected**: Cold start latency, complex setup
- **Why**: Need to package each language runtime, handle timeouts
- **Cost**: More expensive than Judge0 API at our scale

### 3. Repl.it API
- **Rejected**: Expensive pricing for our use case
- **Why**: Optimized for full IDE features we don't need

## Consequences

### Positive
- **Security**: Code runs in isolated containers (Judge0 handles sandboxing)
- **Multi-language**: Support 4 languages without managing runtimes
- **Reliability**: Judge0 is battle-tested (100K+ users)
- **Scalability**: API handles load bursting automatically
- **Detailed Output**: Get compilation errors, stderr, runtime stats

### Negative
- **Network Dependency**: Relies on external service availability
- **API Limits**: RapidAPI free tier has rate limits
- **Latency**: Network round-trip adds 500ms-2s per submission
- **Cost**: Paid tier needed for high volume

### Mitigations
- **Error Handling**: Graceful degradation if Judge0 is down
- **Rate Limiting**: Frontend shows queue status during peak usage
- **Caching**: Store problem test case results to avoid re-execution
- **Monitoring**: Alert if Judge0 error rate exceeds threshold

## Implementation Details

### Request Format
```javascript
{
  source_code: base64Encode(userCode),
  language_id: 71, // Python
  stdin: base64Encode(testInput),
  expected_output: base64Encode(expectedOutput),
  cpu_time_limit: 5, // seconds
  memory_limit: 256000, // KB
}
```

### Response Handling
```javascript
{
  status: { id: 3, description: "Accepted" },
  stdout: base64Decode(...),
  stderr: base64Decode(...),
  compile_output: base64Decode(...),
  time: "0.023", // seconds
  memory: 4096 // KB
}
```

### Status Mapping
- `1-2`: Processing → keep polling
- `3`: Accepted → testPassed = true
- `4`: Wrong Answer → testPassed = false
- `5`: Time Limit Exceeded
- `6`: Compilation Error
- `7-14`: Various runtime errors

### Environment Variables
```yaml
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=${JUDGE0_API_KEY} # From Secret Manager
```
