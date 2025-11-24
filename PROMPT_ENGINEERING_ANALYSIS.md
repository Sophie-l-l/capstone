# Prompt Engineering Analysis: Error Classification System

## Overview

This document analyzes the sophisticated prompt engineering techniques implemented in the EduCode Adaptive Platform's AI service for automated error classification. The system uses Google Gemini 2.0-flash-exp to classify programming errors into academic frameworks with high accuracy and consistency.

## Core Architecture

### System vs User Prompt Separation

The implementation follows a **dual-prompt architecture**:

```python
# System Prompt: Persistent context and constraints
system_prompt = """You are an expert error classification assistant for CS education.

**CRITICAL CONSTRAINTS** (HALLUCINATION PREVENTION):
1. Classify ONLY based on provided error message, code, and language context
2. If error does not clearly fit a category, choose MOST LIKELY and set confidence < 0.70
..."""

# User Prompt: Task-specific input and instructions
user_prompt = f"""Error Message:
```
{error_text}
```
Language: {language}
Student Code (first 500 chars):
```
{code[:500] if code else "N/A"}
```
Classify this error following the academic framework above."""
```

**Benefits:**
- **Context Persistence**: System prompt establishes persistent expertise and constraints
- **Task Separation**: User prompt focuses on specific classification task
- **Consistency**: Academic framework rules remain constant across all requests
- **Flexibility**: Task-specific data (code, errors) varies per request

## Academic Framework Integration

### Multi-Layered Classification System

The prompt integrates three established academic frameworks:

1. **IEEE 1044-2009 Surface Categories** (12 categories)
   - Lexical, Syntax, Semantic/Type, Semantic/Link, Runtime/Exception, etc.
   
2. **Zehetmeier et al. (2015) Cognitive Causes** (8 causes)
   - MENTAL_TYPO, KNOWLEDGE_GAP, MISCONCEPTION, WRONG_CHOICE, etc.
   
3. **Bloom's Taxonomy Levels** (7 levels)
   - Below Remember → Create (cognitive complexity assessment)

### Probabilistic Inference Rules

Instead of deterministic mapping, the system uses **probabilistic guidelines**:

```markdown
**PROBABILISTIC INFERENCE GUIDELINES** (not deterministic - adapt to context):
1. Missing semicolon/brace → USUALLY MENTAL_TYPO (Below Remember) UNLESS repeated → KNOWLEDGE_GAP
2. Undefined variable → KNOWLEDGE_GAP (Remember) if never declared; MENTAL_TYPO if typo in name
3. Type mismatch → MISCONCEPTION (Understand) if fundamental confusion; MENTAL_TYPO if isolated cast error
```

**Why Probabilistic?**
- **Context Awareness**: Same surface error can have different cognitive causes
- **Flexibility**: LLM can adapt based on surrounding code context
- **Realism**: Mirrors how human educators assess student errors

## Hallucination Prevention Strategies

### 1. Explicit Constraints

```markdown
**CRITICAL CONSTRAINTS** (HALLUCINATION PREVENTION):
1. Classify ONLY based on provided error message, code, and language context
2. If error does not clearly fit a category, choose MOST LIKELY and set confidence < 0.70
3. NEVER invent error details not present in the input
4. If key information is missing, state this in reasoning and reduce confidence
5. When uncertain between two categories, choose broader category
```

### 2. Evidence-Based Reasoning

The prompt requires the LLM to:
- **Cite Specific Evidence**: Reference exact error messages and code snippets
- **Explain Decision Process**: Show reasoning for classification choices
- **Acknowledge Uncertainty**: Use confidence scores to indicate certainty levels

### 3. Self-Verification Protocol

```markdown
SELF-VERIFICATION before responding:
1. Does cognitive_cause logically match specific_error?
2. Is bloom_level appropriate for cognitive complexity?
3. Does reasoning cite specific evidence from error/code?
4. Is confidence realistic (between 0.0 and 1.0, NOT 0-100)?
5. Are you using the EXACT field names?
```

## Few-Shot Learning Implementation

### Strategic Example Selection

The system includes **3 diverse examples** per error type:

```json
Example 1 - Type Mismatch (MISCONCEPTION):
Error: "cannot convert int to string"
Code: result = "Score: " + 42
Output: {
  "surface_error": "Semantic/Type",
  "specific_error": "Type mismatch in string concatenation",
  "cognitive_cause": "MISCONCEPTION",
  "bloom_level": "Understand",
  "reasoning": "Student attempted to concatenate int directly without conversion...",
  "confidence": 0.90
}
```

**Example Selection Criteria:**
- **Diversity**: Cover different error types (syntax, semantic, logic)
- **Realism**: Based on actual student code patterns
- **Complexity Range**: Simple (typos) to complex (algorithm errors)
- **Clear Reasoning**: Show how to justify classifications

### Grounding Effect

Few-shot examples provide:
- **Classification Consistency**: Examples anchor LLM responses to desired format
- **Quality Baselines**: Show expected reasoning depth and evidence citation
- **Edge Case Handling**: Demonstrate uncertainty acknowledgment and confidence calibration

## Temperature and Sampling Optimization

### Compiler/Runtime Errors (Temperature = 0.1)

```python
generation_config=genai.types.GenerationConfig(
    temperature=0.1,    # Low temperature for consistent classification
    top_p=0.90,         # Reduced from 0.95 for tighter distribution
    top_k=20,           # Reduced from 40 for more focused sampling
    response_mime_type="application/json",
)
```

**Rationale:**
- **Consistency Priority**: Compiler errors have objective characteristics
- **Deterministic Classification**: Same error should receive same classification
- **Reduced Hallucination**: Lower temperature reduces creative but incorrect outputs

### Logic Errors (Temperature = 0.15)

```python
temperature=0.15,  # Slightly higher for analytical reasoning
```

**Rationale:**
- **Analytical Flexibility**: Logic errors require code trace-through and reasoning
- **Creative Problem Solving**: Need slight creativity for algorithm analysis
- **Balance**: Higher than compiler errors but still constrained for consistency

## Confidence Calibration System

### Post-Hoc Calibration

The system implements sophisticated confidence adjustment based on evidence quality:

```python
def _calibrate_confidence(llm_result: Dict[str, Any], error_msg: str, code: str = "") -> Dict[str, Any]:
    """
    Adjusts LLM-reported confidence based on:
    1. Keyword match: Does reasoning mention keywords from error message?
    2. Code availability: Higher confidence when code is provided
    3. Reasoning length: Overly short reasoning → reduce confidence
    4. Extreme confidence claims: Reduce 0.95+ confidences to realistic levels
    """
```

### Evidence-Based Adjustments

1. **Keyword Overlap Analysis**
   ```python
   error_keywords = set(error_msg.lower().split())
   reasoning_keywords = set(reasoning.lower().split())
   overlap = len(error_keywords & reasoning_keywords) / max(len(error_keywords), 1)
   
   if overlap < 0.3:
       confidence *= 0.85  # Reduce if reasoning doesn't reference error details
   ```

2. **Code Context Bonus**
   ```python
   if code and len(code.strip()) > 20:
       confidence = min(confidence + 0.05, 1.0)  # Boost when code available
   else:
       confidence *= 0.90  # Penalize when no code context
   ```

3. **Reasoning Quality Assessment**
   ```python
   if reasoning_len < 50:
       confidence *= 0.80  # Too brief suggests shallow analysis
   elif reasoning_len > 400:
       confidence *= 0.90  # Too verbose suggests uncertainty
   ```

4. **Overconfidence Prevention**
   ```python
   if confidence > 0.92:
       confidence = 0.92  # Cap based on calibration research
   ```

## JSON Schema Enforcement

### Structured Output Guarantee

```python
response_mime_type="application/json"  # Force JSON output format
```

### Field Name Standardization

The prompt enforces **exact field names** to prevent variations:

```markdown
**CRITICAL: Use these EXACT field names in your JSON response:**
- surface_error (NOT error_type)
- specific_error
- compiler_excerpt (NOT source_code_element)
- cognitive_cause
- bloom_level
- reasoning
- confidence (MUST be 0.0-1.0 range, NOT 0-100)
```

### Validation and Fallbacks

```python
# Validate required fields
required_fields = ["surface_error", "specific_error", "compiler_excerpt", 
                  "cognitive_cause", "bloom_level", "reasoning"]
if not all(field in result for field in required_fields):
    logger.warning(f"Gemini response missing required fields: {result}")
    return None

# Ensure confidence is present
if "confidence" not in result:
    result["confidence"] = 0.75
```

## Error Type Specialization

### Compiler/Runtime Error Classification

**Focus Areas:**
- **Syntax Precision**: Distinguish between lexical vs. syntax errors
- **Semantic Granularity**: Separate type errors from linking errors
- **Runtime Context**: Classify based on execution phase (compile vs. runtime)

**Specialized Instructions:**
```markdown
**SURFACE ERROR CATEGORIES** (IEEE 1044-2009):
1. **Lexical**: Invalid tokens, illegal characters, string/comment errors
2. **Syntax**: Missing semicolons, braces, parentheses, grammatical violations
3. **Semantic/Type**: Type mismatches, invalid conversions, incompatible operations
...
```

### Logic Error Analysis

**Trace-Through Methodology:**
```markdown
STEP 1: TRACE through the code execution on the given input line-by-line
STEP 2: Identify WHERE the output diverges from expected
STEP 3: Classify using the academic framework above
```

**Logic-Specific Subtypes:**
- Off-by-one errors
- Edge case failures
- Wrong algorithm choice
- Missing conditions
- Variable confusion

## Quality Assurance Mechanisms

### 1. Multi-Stage Validation

1. **Prompt-Level**: Self-verification instructions
2. **Response-Level**: JSON schema validation
3. **Post-Processing**: Confidence calibration
4. **Fallback-Level**: Default classifications for failures

### 2. Logging and Monitoring

```python
logger.info(f"🤖 LLM returned for compiler error: surface_error={result.get('surface_error')}")
logger.info(f"✅ Final compiler error classification: confidence={result['confidence']}")
```

### 3. Graceful Degradation

When LLM fails, the system provides meaningful defaults:

```python
return {
    "surface_error": "Functional/Logic",
    "specific_error": "Incorrect output",
    "compiler_excerpt": f"Expected: {expected[:50]}, Got: {actual[:50]}",
    "cognitive_cause": "WRONG_CHOICE",
    "bloom_level": "Apply",
    "reasoning": "Logic error detected but LLM unavailable for detailed analysis.",
    "confidence": 0.55
}
```

## Performance Optimization

### 1. Input Truncation

```python
user_prompt = f"""Student Code (first 500 chars):
```
{code[:500] if code else "N/A"}
```"""
```

**Benefits:**
- **Token Efficiency**: Reduces API costs and latency
- **Focus**: Forces analysis on most relevant code sections
- **Consistency**: Standardized input length for fair comparison

### 2. Response Size Limits

```python
max_output_tokens=600,  # Sufficient for detailed reasoning without bloat
```

### 3. Safety Settings Optimization

```python
safety_settings={
    "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
    "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
    "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
    "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
}
```

**Rationale**: Educational code analysis doesn't require content filtering, and overly strict safety can block legitimate code discussion.

## Research-Based Design Decisions

### 1. Confidence Calibration Research

Based on **Khayrallah & Thompson (2022)**: Models with external grounding show better calibration. The system implements post-hoc calibration to improve reliability.

### 2. Few-Shot Learning Effectiveness

Research shows 3-5 examples provide optimal grounding without overwhelming context. The system uses exactly 3 diverse examples per error type.

### 3. Temperature Optimization

- **Low Temperature (0.1)** for objective classification tasks
- **Medium Temperature (0.15)** for analytical reasoning tasks
- Based on findings that temperature affects consistency vs. creativity trade-offs

## Future Enhancement Opportunities

### 1. Dynamic Example Selection

Implement context-aware example selection based on:
- Programming language
- Student experience level
- Error complexity

### 2. Confidence Threshold Tuning

Optimize confidence thresholds based on:
- Historical accuracy data
- Error type difficulty
- Student feedback on classifications

### 3. Multi-Model Ensemble

Consider ensemble approaches for high-stakes classifications:
- Multiple model consensus
- Specialized models per error type
- Human-in-the-loop validation for low-confidence cases

## Conclusion

The EduCode error classification system demonstrates sophisticated prompt engineering through:

1. **Academic Framework Integration**: Seamless combination of IEEE, cognitive, and pedagogical taxonomies
2. **Hallucination Prevention**: Multiple layers of constraints and verification
3. **Evidence-Based Reasoning**: Requirement for specific justification and confidence scoring
4. **Adaptive Classification**: Probabilistic rules that consider context
5. **Quality Assurance**: Multi-stage validation and graceful degradation
6. **Performance Optimization**: Efficient token usage and response formatting

This comprehensive approach ensures both **educational validity** (academic framework compliance) and **technical reliability** (consistent, well-calibrated outputs) for automated programming error assessment.