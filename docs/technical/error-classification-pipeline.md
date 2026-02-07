# Error Classification Pipeline: From Submission to Dashboard

## Overview

This document describes the complete pipeline that transforms a student's code submission into rich academic error classification displayed on the metrics dashboard. The pipeline integrates compiler/runtime error detection, AI-powered classification using Google Gemini, and academic framework mapping based on IEEE 1044-2009 and educational psychology research.

## Architecture Overview

```
Student Code → Judge0/Compiler → Error Detection → AI Classification → Database → Dashboard
     ↓              ↓               ↓                ↓                ↓           ↓
[Frontend]    [Code Execution]  [Backend]     [AI Service]      [PostgreSQL]  [React UI]
```

---

## Stage 1: Code Submission & Execution

### 1.1 Frontend Submission
**Location**: `apps/frontend/app/problems/[id]/page.tsx`

```typescript
// User submits code through Monaco editor
const handleSubmit = async () => {
  const result = await apiClient.submitCode(problemId, code, language)
  // Creates submission record in database
}
```

**Data Flow**:
- Student writes code in Monaco editor
- Code submitted via `/api/problems/:id/submit` endpoint
- Creates `Submission` record with status "pending"

### 1.2 Code Execution (Judge0)
**Location**: `apps/backend/src/routes/codeExecution.ts`

```typescript
// Execute code against test cases using Judge0 API
const judge0Response = await fetch('https://judge0-ce.p.rapidapi.com/submissions', {
  method: 'POST',
  body: JSON.stringify({
    source_code: Buffer.from(code).toString('base64'),
    language_id: languageMap[language],
    stdin: Buffer.from(testCase.input).toString('base64'),
    expected_output: Buffer.from(testCase.output).toString('base64')
  })
})
```

**Outcomes**:
1. **Compilation Error**: `compile_output` contains error message
2. **Runtime Error**: `stderr` contains runtime exception
3. **Wrong Output**: Code runs but produces incorrect result
4. **Accepted**: All test cases pass

---

## Stage 2: Error Detection & Classification Trigger

### 2.1 Error Detection Logic
**Location**: `apps/backend/src/routes/codeExecution.ts` (lines 195-235)

```typescript
// CASE 1: Compilation/Runtime Error
if (submissionData.compile_output || submissionData.stderr) {
  await recordSubmissionError({
    submissionId: submission.id,
    language,
    compileOutput: submissionData.compile_output,
    stderr: submissionData.stderr,
    code: code
  })
}

// CASE 2: Logic Error (Wrong Output)
else if (hasFailedTestCases) {
  await recordLogicError({
    submissionId: submission.id,
    language,
    code,
    testInput: firstFailedTest.input,
    expectedOutput: firstFailedTest.expected,
    actualOutput: firstFailedTest.actual,
    problemDescription: problem.description
  })
}
```

**Classification Triggers**:
- **Compiler/Runtime Errors**: Text-based error analysis
- **Logic Errors**: Test case mismatch analysis

---

## Stage 3: AI Service Classification

### 3.1 Error Routing Logic
**Location**: `apps/ai-service/error_classifier.py` (lines 440-490)

```python
def classify_error(request: ClassifyRequest) -> ClassifyResponse:
    # CASE 1: Logic error (test case mismatch without compiler error)
    if (request.expected_output is not None and 
        request.actual_output is not None and 
        (not request.text or len(request.text.strip()) < 10)):
        
        result = classify_logic_error_with_gemini(
            code=request.code,
            test_input=request.test_case_input,
            expected=request.expected_output,
            actual=request.actual_output,
            problem_desc=request.problem_description,
            language=request.language
        )
    
    # CASE 2: Compiler/runtime error
    else:
        # Try rule-based classification first (60+ patterns)
        result = classify_error_rule_based(normalized, request.language)
        
        # Fall back to LLM if confidence < 0.75
        if result["confidence"] < 0.75:
            result = classify_with_gemini(error_text, language, code)
```

### 3.2 Prompt Engineering Architecture

#### System Prompt Design
**Location**: `apps/ai-service/llm_client.py` (lines 136-251)

```python
system_prompt = """You are an expert error classification assistant for CS education.

**CRITICAL CONSTRAINTS** (HALLUCINATION PREVENTION):
1. Classify ONLY based on provided error message, code, and language context
2. If error does not clearly fit a category, choose MOST LIKELY and set confidence < 0.70
3. NEVER invent error details not present in the input
4. If key information is missing, state this in reasoning and reduce confidence

**SURFACE ERROR CATEGORIES** (IEEE 1044-2009):
1. **Lexical**: Invalid tokens, illegal characters
2. **Syntax**: Missing semicolons, braces, parentheses
3. **Semantic/Type**: Type mismatches, invalid conversions
4. **Semantic/Link**: Undefined variables/functions, scope errors
5. **Runtime/Exception**: Null pointers, array bounds, division by zero
6. **Functional/Logic**: Incorrect output, wrong algorithm
...

**COGNITIVE CAUSES** (Zehetmeier et al. 2015):
- **MENTAL_TYPO**: Careless typing error, student knows the rule
- **KNOWLEDGE_GAP**: Missing fundamental knowledge
- **MISCONCEPTION**: Incorrect understanding of concepts
- **WRONG_CHOICE**: Poor algorithm/data structure choice
- **STRUCTURAL_BLINDNESS**: Failed to anticipate edge cases
...

**BLOOM TAXONOMY LEVELS**:
- Below Remember: Pure typos/mechanical errors
- Remember: Recall syntax rules, API signatures
- Understand: Explain types, scope, control flow  
- Apply: Use concepts in new context, implement algorithms
- Analyse: Debug complex issues, optimize algorithms
- Evaluate: Compare solutions, assess trade-offs
- Create: Design novel algorithms
"""
```

#### Few-Shot Learning Examples
```python
**EXAMPLES** (few-shot grounding for consistency):

Example 1 - Type Mismatch (MISCONCEPTION):
Error: "cannot convert int to string"
Code: result = "Score: " + 42
Output: {
  "surface_error": "Semantic/Type",
  "specific_error": "Type mismatch in string concatenation",
  "cognitive_cause": "MISCONCEPTION",
  "bloom_level": "Understand",
  "reasoning": "Student attempted implicit type conversion...",
  "confidence": 0.90
}
```

#### User Prompt Structure
```python
user_prompt = f"""Error Message:
```
{error_text}
```

Language: {language}
Student Code (first 500 chars): {code[:500]}

SELF-VERIFICATION before responding:
1. Does cognitive_cause logically match specific_error?
2. Is bloom_level appropriate for cognitive complexity?
3. Does reasoning cite specific evidence from error/code?
4. Is confidence realistic (between 0.0 and 1.0)?

RESPOND WITH ONLY THE JSON OBJECT."""
```

### 3.3 LLM Configuration & Safety
```python
response = model.generate_content(
    user_prompt,
    generation_config=genai.types.GenerationConfig(
        temperature=0.1,      # Low for consistency
        top_p=0.90,          # Reduced for focused sampling
        top_k=20,            # Limited vocabulary
        max_output_tokens=600,
        response_mime_type="application/json"  # Force JSON
    ),
    safety_settings={
        "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
        "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
        # ... (Allow educational content)
    }
)
```

---

## Stage 4: Output Sanitization & Standardization

### 4.1 JSON Parsing & Validation
**Location**: `apps/ai-service/llm_client.py` (lines 315-350)

```python
# Extract and clean response
text = response.text.strip()

# Remove markdown fences if present
if text.startswith("```json"):
    text = text[7:]
if text.endswith("```"):
    text = text[:-3]

# Parse JSON
result = json.loads(text)

# Validate required fields
required_fields = ["surface_error", "specific_error", "compiler_excerpt", 
                  "cognitive_cause", "bloom_level", "reasoning"]
if not all(field in result for field in required_fields):
    logger.warning(f"Missing required fields: {result}")
    return None
```

### 4.2 Post-Hoc Confidence Calibration
**Location**: `apps/ai-service/llm_client.py` (lines 49-95)

```python
def _calibrate_confidence(llm_result: Dict[str, Any], error_msg: str, code: str = ""):
    confidence = llm_result.get("confidence", 0.70)
    reasoning = llm_result.get("reasoning", "")
    
    # 1. Keyword overlap: Does reasoning reference error terms?
    error_keywords = set(error_msg.lower().split())
    reasoning_keywords = set(reasoning.lower().split())
    overlap = len(error_keywords & reasoning_keywords) / max(len(error_keywords), 1)
    
    if overlap < 0.3:
        confidence *= 0.85  # Reduce if poor grounding
    
    # 2. Code availability: Higher confidence with context
    if code and len(code.strip()) > 20:
        confidence = min(confidence + 0.05, 1.0)
    
    # 3. Reasoning length validation
    reasoning_len = len(reasoning)
    if reasoning_len < 50:
        confidence *= 0.80  # Too brief
    elif reasoning_len > 400:
        confidence *= 0.90  # Too verbose
    
    # 4. Research-based confidence ceiling
    if confidence > 0.92:
        confidence = 0.92  # Models poorly calibrated above this
    
    return max(0.0, min(1.0, confidence))
```

### 4.3 Override Logic for Edge Cases
**Location**: `apps/ai-service/error_classifier.py` (lines 524-535)

```python
# Override: If LLM returned "Unknown" but we have logic error indicators
if result['surface_error'] == "Unknown" and (
    request.expected_output is not None or 
    request.actual_output is not None or
    "incorrect" in result.get('specific_error', '').lower()):
    
    print(f"⚠️ Overriding Unknown -> Functional/Logic")
    result['surface_error'] = "Functional/Logic"
```

---

## Stage 5: Database Storage

### 5.1 Error Signature Creation
**Location**: `apps/backend/src/services/errorClassifier.service.ts` (lines 173-190)

```typescript
const signature = await prismaAny.errorSignature.create({
  data: {
    hash,  // SHA-256 of normalized error text
    // Academic Framework Fields
    surfaceError: classification.surface_error,
    specificError: classification.specific_error,
    compilerExcerpt: classification.compiler_excerpt,
    cognitiveCause: classification.cognitive_cause,
    bloomLevel: classification.bloom_level,
    reasoning: classification.reasoning,
    source: classification.source,
    // Metadata
    confidence: classification.confidence,
    sample: normalized,
    embedding: classification.embedding
  }
})
```

### 5.2 Submission Error Linking
```typescript
await prismaAny.submissionError.create({
  data: {
    submissionId: opts.submissionId,
    language: opts.language,
    compileOutput: opts.compileOutput,
    stderr: opts.stderr,
    signatureId: signatureResult.id  // Link to classification
  }
})
```

### 5.3 Database Schema (Academic Framework)
```sql
-- Error Signatures Table
CREATE TABLE "error_signatures" (
  id TEXT PRIMARY KEY,
  hash TEXT UNIQUE,
  
  -- Academic Framework Fields (IEEE 1044 + Zehetmeier)
  "surfaceError" TEXT,     -- "Functional/Logic", "Syntax", etc.
  "specificError" TEXT,    -- Detailed description
  "compilerExcerpt" TEXT,  -- Code/error excerpt
  "cognitiveCause" TEXT,   -- "STRUCTURAL_BLINDNESS", etc.
  "bloomLevel" TEXT,       -- "Apply", "Understand", etc.
  reasoning TEXT,          -- Full AI explanation
  source TEXT,             -- "llm", "rule-based", etc.
  
  -- Metadata
  confidence REAL,
  embedding JSON,          -- 768-dim vector for clustering
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Stage 6: API Data Retrieval

### 6.1 Student Error Analytics
**Location**: `apps/backend/src/routes/studentErrors.ts` (lines 16-35)

```typescript
router.get("/:id/errors", async (req: Request, res: Response) => {
  const [topErrors, recentErrors] = await Promise.all([
    getStudentTopErrors(userId, limit),
    getStudentRecentErrors(userId, 20)
  ])
  
  res.json({
    topErrors,  // Aggregated error counts by surface type
    recentErrors: recentErrors.map((err: any) => ({
      id: err.id,
      // Academic fields from signature
      surface_error: sig?.surfaceError,
      specific_error: sig?.specificError,
      compiler_excerpt: sig?.compilerExcerpt,
      cognitive_cause: sig?.cognitiveCause,
      bloom_level: sig?.bloomLevel,
      reasoning: sig?.reasoning,
      source: sig?.source,
      confidence: sig?.confidence,
      // Submission context
      problemTitle: err.submission.problem?.title,
      submissionId: err.submission.id,
      language: err.language,
      createdAt: err.createdAt
    }))
  })
})
```

### 6.2 Top Errors Aggregation (SQL)
```typescript
const result = await prisma.$queryRaw`
  SELECT 
    CONCAT(
      COALESCE(es."surfaceError", 'Unknown'),
      ': ',
      COALESCE(es."specificError", 'Unknown error')
    ) as label,
    COUNT(*) as count
  FROM "submission_errors" se
  JOIN "submissions" s ON s.id = se."submissionId"
  LEFT JOIN "error_signatures" es ON es.id = se."signatureId"
  WHERE s."userId" = ${userId}
  GROUP BY es."surfaceError", es."specificError"
  ORDER BY count DESC
`
```

---

## Stage 7: Dashboard Visualization

### 7.1 Recent Errors Display
**Location**: `apps/frontend/app/metrics/student/page.tsx` (lines 810-860)

```tsx
{errorData.recentErrors.map((error) => (
  <a href={`/metrics/submission/${error.submissionId}`} 
     key={error.id} 
     className="block border rounded-lg p-4 hover:bg-muted/40">
    
    <div className="flex items-center gap-2 flex-wrap">
      {/* Surface Error (Red Badge) */}
      <span className="font-semibold text-destructive">
        {error.surface_error || "Unknown"}
      </span>
      
      {/* Specific Error (Arrow) */}
      {error.specific_error && (
        <span className="text-sm text-muted-foreground">
          → {error.specific_error}
        </span>
      )}
      
      {/* Cognitive Cause (Blue Badge) */}
      {error.cognitive_cause && (
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
          {error.cognitive_cause.replace(/_/g, ' ')}
        </span>
      )}
      
      {/* Bloom Level (Purple Badge) */}
      {error.bloom_level && (
        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
          {error.bloom_level}
        </span>
      )}
      
      {/* Source (Gray Badge) */}
      {error.source && (
        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
          {error.source}
        </span>
      )}
    </div>
    
    {/* Compiler Excerpt */}
    {error.compiler_excerpt && (
      <pre className="mt-2 p-2 rounded bg-muted text-xs">
        {error.compiler_excerpt}
      </pre>
    )}
    
    {/* AI Reasoning */}
    {error.reasoning && (
      <p className="mt-2 text-sm text-muted-foreground italic border-l-2 pl-3">
        {error.reasoning}
      </p>
    )}
  </a>
))}
```

### 7.2 Academic Analysis Charts
```tsx
{/* Surface Error Categories Bar Chart */}
<BarChart data={surfaceErrorData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
  <YAxis />
  <Tooltip />
  <Bar dataKey="count" fill="#22c55e" />
</BarChart>

{/* Cognitive Causes Pie Chart */}
<PieChart>
  <Pie data={cognitiveData} dataKey="count" nameKey="name" outerRadius={80}>
    {cognitiveData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>

{/* Bloom Levels Bar Chart */}
<BarChart data={bloomData}>
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="count" fill="#8b5cf6" />
</BarChart>
```

### 7.3 Submission Detail Deep Dive (Clickable Errors)
**Location**: `apps/frontend/app/metrics/submission/[id]/page.tsx`

When users click on a Recent Error, they navigate to a detailed view showing:
- **Problem Description**: Full problem statement, constraints, examples
- **Student Code**: Read-only Monaco editor with syntax highlighting
- **Error Classification**: All academic fields with badges
- **Compiler Output**: Raw stderr/compile_output
- **AI Reasoning**: Full explanation of the error and suggested fixes

---

## Quality Assurance & Monitoring

### Debug Logging Pipeline
```python
# AI Service Debug Prints
print(f"🤖 LLM RAW RESPONSE for logic error:")
print(f"   surface_error: {result.get('surface_error')}")
print(f"   confidence: {result.get('confidence')}")

# Backend Debug Logging  
console.log("💾 Storing in database:", JSON.stringify({
  surfaceError: classification.surface_error,
  specificError: classification.specific_error,
  confidence: classification.confidence
}))

# Override Detection
print(f"⚠️ Overriding Unknown -> Functional/Logic (logic error indicators detected)")
```

### Confidence Calibration Research
- **Khayrallah & Thompson (2022)**: Post-hoc calibration improves reliability
- **Research Finding**: Models poorly calibrated above 0.92 confidence
- **Keyword Overlap**: Grounding check prevents hallucination
- **Reasoning Length**: Heuristics for response quality

---

## Pipeline Performance

### Latency Breakdown
1. **Code Execution**: 2-5 seconds (Judge0 API)
2. **Error Detection**: <100ms (rule-based patterns)
3. **LLM Classification**: 1-3 seconds (Gemini API)
4. **Database Storage**: <200ms (PostgreSQL)
5. **Dashboard Load**: <500ms (API + React)

**Total**: ~3-9 seconds end-to-end

### Accuracy Metrics
- **Rule-based Coverage**: 60+ common error patterns
- **LLM Fallback**: Confidence threshold 0.75
- **Post-hoc Calibration**: Evidence-based confidence adjustment
- **Academic Mapping**: IEEE 1044 + Educational Psychology integration

---

## Future Enhancements

### 1. Clustering & Pattern Recognition
- Use 768-dim embeddings for error clustering
- Identify common student misconception patterns
- Personalized remediation recommendations

### 2. Temporal Analysis
- Track student progress over time
- Bloom level advancement detection
- Cognitive cause pattern evolution

### 3. Multi-Modal Analysis
- Incorporate execution traces
- Runtime behavior analysis
- Test case coverage patterns

### 4. Peer Comparison
- Class-wide error pattern analysis
- Difficulty calibration by error frequency
- Collaborative debugging suggestions

---

This pipeline represents a comprehensive integration of compiler technology, AI-powered classification, educational psychology, and modern web development to provide students with rich, actionable feedback on their programming errors.