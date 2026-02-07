"""
LLM client for error classification using Google Gemini with academic framework.
IMPROVED: Enhanced prompts based on IEEE 1044-2009 + Zehetmeier et al. (2015).

Key improvements:
1. Few-shot examples for grounding (3 diverse examples per prompt)
2. Explicit hallucination prevention instructions
3. Probabilistic inference rules (not deterministic)
4. Temperature calibrated for consistency (0.1 for strict, 0.15 for logic)
5. JSON Schema enforcement via response_mime_type
6. Self-verification step in prompt
7. Confidence calibration based on evidence strength
8. TYPE SAFETY: Uses shared enums to prevent invalid values like "Unknown"
"""

import json
import os
import logging
from typing import Optional, Dict, Any

from error_types import (
    SurfaceErrorCategory,
    CognitiveCause,
    BloomLevel,
    is_valid_surface_error,
    is_valid_cognitive_cause,
    is_valid_bloom_level,
    get_all_surface_errors,
    get_all_cognitive_causes,
    get_all_bloom_levels
)

logger = logging.getLogger(__name__)


def embed_text(text: str) -> list:
    """Get text embeddings from Google's embedding model."""
    try:
        import google.generativeai as genai
    except ImportError:
        logger.warning("google.generativeai not installed")
        return []
    
    google_key = os.getenv("GOOGLE_API_KEY")
    if not google_key:
        logger.warning("GOOGLE_API_KEY not set")
        return []
    
    try:
        genai.configure(api_key=google_key)
        embedding_model = "models/text-embedding-004"
        result = genai.embed_content(
            model=embedding_model,
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        logger.exception(f"Embedding failed: {e}")
        return []


def _calibrate_confidence(llm_result: Dict[str, Any], error_msg: str, code: str = "") -> Dict[str, Any]:
    """
    IMPROVED: Confidence calibration based on evidence quality.
    
    Adjusts LLM-reported confidence based on:
    1. Keyword match: Does reasoning mention keywords from error message?
    2. Code availability: Higher confidence when code is provided
    3. Reasoning length: Overly short reasoning (hallucination risk) → reduce confidence
    4. Extreme confidence claims: Reduce 0.95+ confidences to more realistic levels
    
    Based on research: Models with external grounding show better calibration.
    Khayrallah & Thompson (2022) show post-hoc calibration improves reliability.
    """
    confidence = llm_result.get("confidence", 0.70)
    reasoning = llm_result.get("reasoning", "")
    
    # 1. Keyword match: Check if reasoning references error message terms
    error_keywords = set(error_msg.lower().split())
    reasoning_keywords = set(reasoning.lower().split())
    overlap = len(error_keywords & reasoning_keywords) / max(len(error_keywords), 1)
    
    # If reasoning has <30% keyword overlap with error message, reduce confidence
    if overlap < 0.3:
        confidence *= 0.85
        logger.debug(f"Low keyword overlap ({overlap:.2f}), reducing confidence")
    
    # 2. Code availability: Higher confidence when code is provided
    if code and len(code.strip()) > 20:
        confidence = min(confidence + 0.05, 1.0)
    else:
        confidence *= 0.90
        logger.debug("No code provided, reducing confidence")
    
    # 3. Reasoning length: Too short (<50 chars) or too long (>400 chars) is suspicious
    reasoning_len = len(reasoning)
    if reasoning_len < 50:
        confidence *= 0.80
        logger.debug(f"Reasoning too short ({reasoning_len} chars), reducing confidence")
    elif reasoning_len > 400:
        confidence *= 0.90
        logger.debug(f"Reasoning verbose ({reasoning_len} chars), slight reduction")
    
    # 4. Extreme confidence calibration: Models overestimate near 1.0
    if confidence > 0.92:
        confidence = 0.92  # Cap at 0.92 (research shows models poorly calibrated above this)
        logger.debug("Clamping extreme confidence to 0.92")
    
    # 5. Clamp to [0.0, 1.0] range
    confidence = max(0.0, min(1.0, confidence))
    
    llm_result["confidence"] = round(confidence, 2)
    return llm_result


def classify_with_gemini(error_text: str, language: str, code: str = "") -> Optional[Dict[str, Any]]:
    """
    Classify compiler/runtime errors using Gemini with IMPROVED prompt engineering.
    
    IMPROVEMENTS:
    - Few-shot examples (3 diverse examples)
    - Explicit hallucination prevention instructions
    - Probabilistic inference rules (not deterministic)
    - Temperature=0.1 for consistency
    - JSON Schema enforcement via response_mime_type
    - Self-verification prompts
    
    Uses IEEE 1044-2009 surface categories + Zehetmeier et al. cognitive causes.
    Returns dict with 6 fields or None on failure.
    """
    try:
        import google.generativeai as genai
    except ImportError:
        logger.warning("google.generativeai not installed; cannot use Gemini")
        return None

    google_key = os.getenv("GOOGLE_API_KEY")
    if not google_key:
        logger.warning("GOOGLE_API_KEY not set")
        return None

    try:
        genai.configure(api_key=google_key)
        model_name = os.getenv("GOOGLE_MODEL", "gemini-2.5-flash")
        
        # Enhanced prompt with academic framework + HALLUCINATION PREVENTION
        system_prompt = """You are an expert error classification assistant for CS education.

**CRITICAL CONSTRAINTS** (HALLUCINATION PREVENTION):
1. Classify ONLY based on provided error message, code, and language context
2. If error does not clearly fit a category, choose MOST LIKELY and set confidence < 0.70
3. NEVER invent error details not present in the input
4. If key information is missing, state this in reasoning and reduce confidence
5. When uncertain between two categories, choose broader category (e.g., Runtime/Exception over specific subtype)

**SURFACE ERROR CATEGORIES** (IEEE 1044-2009):
1. **Lexical**: Invalid tokens, illegal characters, string/comment errors
2. **Syntax**: Missing semicolons, braces, parentheses, grammatical violations
3. **Semantic/Type**: Type mismatches, invalid conversions, incompatible operations
4. **Semantic/Link**: Undefined variables/functions, scope errors, duplicate definitions
5. **Link/Binding**: Linker errors, missing libraries, unresolved references
6. **Runtime/Exception**: Null pointers, array bounds, division by zero, stack overflow
7. **Quality/Non-Functional**: TLE, MLE, inefficient algorithms
8. **Functional/Logic**: Incorrect output, wrong algorithm, edge case failures
9. **Concurrency/Timing**: Race conditions, deadlocks (rare in student code)
10. **Environment/Deployment**: Missing dependencies, wrong compiler version
11. **Security/Weakness**: Buffer overflows, injection vulnerabilities (rare)
12. **Build/Configuration:  Module/package not found, wrong language level/toolchain, dependency resolution failures.

**COGNITIVE CAUSES** (Zehetmeier et al. 2015):
- **MENTAL_TYPO**: Careless typing error, student knows the rule
- **KNOWLEDGE_GAP**: Missing fundamental knowledge (syntax rules, API usage)
- **MISCONCEPTION**: Incorrect understanding of concepts (scope, types, control flow)
- **WRONG_CHOICE**: Poor algorithm/data structure choice
- **STRUCTURAL_BLINDNESS**: Failed to anticipate edge cases, missing defensive checks
- **QUALITY_GAP**: Works but inefficient (complexity issues)
- **LACK_OF_INNOVATION**: No creative attempt or problem solving effort
_ **WRONG_CHOICE/MISCONCEPTION**

**BLOOM TAXONOMY LEVELS**:
- Below Remember: Pure typos/mechanical errors
- Remember: Recall syntax rules, API signatures
- Understand: Explain types, scope, control flow
- Apply: Use concepts in new context, implement algorithms
- Analyse: Debug complex issues, optimize algorithms
- Evaluate: Compare solutions, assess trade-offs
- Create: Design novel algorithms

**PROBABILISTIC INFERENCE GUIDELINES** (not deterministic - adapt to context):
1. Missing semicolon/brace → USUALLY MENTAL_TYPO (Below Remember) UNLESS repeated → KNOWLEDGE_GAP
2. Undefined variable → KNOWLEDGE_GAP (Remember) if never declared; MENTAL_TYPO if typo in name
3. Type mismatch → MISCONCEPTION (Understand) if fundamental confusion; MENTAL_TYPO if isolated cast error
4. Null pointer/array bounds → STRUCTURAL_BLINDNESS (Apply) usually; MISCONCEPTION if missing conceptual understanding
5. Stack overflow/infinite recursion → WRONG_CHOICE (Analyse) if wrong algorithm; MISCONCEPTION if base case error
6. TLE/MLE → WRONG_CHOICE or QUALITY_GAP (Analyse)

**EXAMPLES** (few-shot grounding for consistency):

Example 1 - Type Mismatch (MISCONCEPTION):
Error: "cannot convert int to string"
Code: result = "Score: " + 42
Output:
{
  "surface_error": "Semantic/Type",
  "specific_error": "Type mismatch in string concatenation",
  "compiler_excerpt": "cannot convert int to string",
  "cognitive_cause": "MISCONCEPTION",
  "bloom_level": "Understand",
  "reasoning": "Student attempted to concatenate int directly without conversion, indicating misunderstanding of type system. In Python/Java, implicit int→string conversion is not allowed; requires explicit str(42) or String.valueOf(42). This is a conceptual error about type safety rules.",
  "confidence": 0.90
}

Example 2 - Missing Semicolon (MENTAL_TYPO):
Error: "expected ';' before 'int'"
Code: int x = 5 int y = 10;
Output:
{
  "surface_error": "Syntax",
  "specific_error": "Missing semicolon at end of statement",
  "compiler_excerpt": "expected ';' before 'int'",
  "cognitive_cause": "MENTAL_TYPO",
  "bloom_level": "Below Remember",
  "reasoning": "Simple punctuation omission with no conceptual deficit. Student knows syntax rule but made careless typing error. Isolated incident suggests mechanical slip rather than knowledge gap.",
  "confidence": 0.95
}

Example 3 - Undefined Reference (KNOWLEDGE_GAP):
Error: "name 'calculate_mean' is not defined"
Code: result = calculate_mean(data)
Output:
{
  "surface_error": "Semantic/Link",
  "specific_error": "Undefined function reference",
  "compiler_excerpt": "name 'calculate_mean' is not defined",
  "cognitive_cause": "KNOWLEDGE_GAP",
  "bloom_level": "Remember",
  "reasoning": "Function used without being declared or imported. Suggests student forgot to define function or missed import statement. This is recall-level error about function definitions/scope rules.",
  "confidence": 0.85
}

**OUTPUT FORMAT** (JSON):
You MUST return ONLY valid JSON with these EXACT field names (no variations):
```json
{
  "surface_error": "Semantic/Type",
  "specific_error": "Type mismatch",
  "compiler_excerpt": "cannot convert int to string",
  "cognitive_cause": "MISCONCEPTION",
  "bloom_level": "Understand",
  "reasoning": "Student attempted implicit type conversion, indicating confusion about type system rules. This is a conceptual misunderstanding rather than a typo.",
  "confidence": 0.85
}
```

**CRITICAL REQUIREMENTS**:
1. Use EXACT field names: surface_error, specific_error, compiler_excerpt, cognitive_cause, bloom_level, reasoning, confidence
2. confidence MUST be a decimal number between 0.0 and 1.0 (NOT 0-100, NOT an integer)
3. surface_error MUST be one of the 12 categories listed above
4. cognitive_cause MUST be one of the 8 causes listed above
5. bloom_level MUST be one of the 7 levels listed above
6. Return ONLY the JSON object, no explanatory text before or after

**CRITICAL: Use these EXACT field names in your JSON response:**
- surface_error (NOT error_type)
- specific_error
- compiler_excerpt (NOT source_code_element)
- cognitive_cause
- bloom_level
- reasoning
- confidence (MUST be 0.0-1.0 range, NOT 0-100)
"""

        # Create model with system instruction
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt
        )

        user_prompt = f"""Error Message:
```
{error_text}
```

Language: {language}

Student Code (first 500 chars):
```
{code[:500] if code else "N/A"}
```

Classify this error following the academic framework above.

SELF-VERIFICATION before responding:
1. Does cognitive_cause logically match specific_error?
2. Is bloom_level appropriate for cognitive complexity?
3. Does reasoning cite specific evidence from error/code?
4. Is confidence realistic (between 0.0 and 1.0, NOT 0-100)?
5. Are you using the EXACT field names: surface_error, specific_error, compiler_excerpt, cognitive_cause, bloom_level, reasoning, confidence?

RESPOND WITH ONLY THE JSON OBJECT. Example format:
{{"surface_error": "Syntax", "specific_error": "Missing semicolon", "compiler_excerpt": "expected ';'", "cognitive_cause": "MENTAL_TYPO", "bloom_level": "Below Remember", "reasoning": "...", "confidence": 0.85}}"""

        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,  # IMPROVED: Low temperature for consistent classification
                top_p=0.90,       # IMPROVED: Reduced from 0.95 for tighter distribution
                top_k=20,         # IMPROVED: Reduced from 40 for more focused sampling
                max_output_tokens=600,
                response_mime_type="application/json",  # IMPROVED: Force JSON output
            ),
            safety_settings={
                "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
                "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
                "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
                "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
            }
        )

        # Extract text from response
        text = response.text.strip()
        
        # Remove markdown code fences if present
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        # Parse JSON
        result = json.loads(text)
        
        # DEBUG: Log what LLM returned
        logger.info(f"🤖 LLM returned for compiler error: surface_error={result.get('surface_error')}, specific_error={result.get('specific_error')}")
        
        # ✨ NEW: VALIDATE surface_error against allowed values
        surface_error = result.get("surface_error", "")
        if not is_valid_surface_error(surface_error):
            logger.error(f"❌ INVALID surface_error from LLM: '{surface_error}' - must be one of {get_all_surface_errors()}")
            # Try to map common mistakes
            surface_error_lower = surface_error.lower()
            if "syntax" in surface_error_lower:
                result["surface_error"] = SurfaceErrorCategory.SYNTAX.value
            elif "runtime" in surface_error_lower or "execution" in surface_error_lower:
                result["surface_error"] = SurfaceErrorCategory.RUNTIME_EXCEPTION.value
            elif "logic" in surface_error_lower or "functional" in surface_error_lower:
                result["surface_error"] = SurfaceErrorCategory.FUNCTIONAL_LOGIC.value
            elif "type" in surface_error_lower or "semantic" in surface_error_lower:
                result["surface_error"] = SurfaceErrorCategory.SEMANTIC_TYPE.value
            else:
                logger.error(f"❌ Cannot map invalid surface_error '{surface_error}', rejecting classification")
                return None
            logger.warning(f"⚠️ Auto-corrected surface_error to: {result['surface_error']}")
        
        # ✨ NEW: VALIDATE cognitive_cause against allowed values
        cognitive_cause = result.get("cognitive_cause", "")
        if not is_valid_cognitive_cause(cognitive_cause):
            logger.error(f"❌ INVALID cognitive_cause from LLM: '{cognitive_cause}' - must be one of {get_all_cognitive_causes()}")
            # Default to most common cause
            result["cognitive_cause"] = CognitiveCause.KNOWLEDGE_GAP.value
            logger.warning(f"⚠️ Defaulted cognitive_cause to: {result['cognitive_cause']}")
        
        # ✨ NEW: VALIDATE bloom_level against allowed values
        bloom_level = result.get("bloom_level", "")
        if not is_valid_bloom_level(bloom_level):
            logger.error(f"❌ INVALID bloom_level from LLM: '{bloom_level}' - must be one of {get_all_bloom_levels()}")
            # Default to Apply (most common for student errors)
            result["bloom_level"] = BloomLevel.APPLY.value
            logger.warning(f"⚠️ Defaulted bloom_level to: {result['bloom_level']}")
        
        # Validate required fields
        required_fields = ["surface_error", "specific_error", "compiler_excerpt", 
                          "cognitive_cause", "bloom_level", "reasoning"]
        if not all(field in result for field in required_fields):
            logger.warning(f"Gemini response missing required fields: {result}")
            return None
        
        # Ensure confidence is present
        if "confidence" not in result:
            result["confidence"] = 0.75
        
        # IMPROVED: Confidence calibration based on evidence strength
        result = _calibrate_confidence(result, error_text, code)
        
        logger.info(f"✅ Final compiler error classification: surface_error={result['surface_error']}, confidence={result['confidence']}")
        
        return result

    except json.JSONDecodeError as e:
        logger.exception(f"Failed to parse Gemini JSON response: {text[:500] if 'text' in locals() else 'N/A'}")
        return None
    except Exception as e:
        logger.exception(f"Gemini classification failed: {e}")
        return None


def classify_logic_error_with_gemini(
    code: str,
    test_input: str,
    expected: str,
    actual: str,
    problem_desc: str,
    language: str
) -> Dict[str, Any]:
    """
    Classify logic errors (incorrect output) using Gemini with IMPROVED test case analysis.
    
    IMPROVEMENTS:
    - Few-shot examples specific to logic errors
    - Code trace-through instructions
    - Temperature=0.15 (slightly higher for analytical reasoning)
    - Self-verification of trace logic
    - Specific logic error subtypes
    
    Logic errors have no compiler/runtime error but produce wrong output.
    Requires deeper analysis of algorithm correctness.
    """
    try:
        import google.generativeai as genai
    except ImportError:
        logger.warning("google.generativeai not installed")
        return {
            "surface_error": SurfaceErrorCategory.FUNCTIONAL_LOGIC.value,
            "specific_error": "Incorrect output",
            "compiler_excerpt": f"Expected: {expected[:50]}, Got: {actual[:50]}",
            "cognitive_cause": CognitiveCause.WRONG_CHOICE.value,
            "bloom_level": BloomLevel.APPLY.value,
            "reasoning": "Logic error detected but LLM unavailable for detailed analysis.",
            "confidence": 0.55
        }

    google_key = os.getenv("GOOGLE_API_KEY")
    if not google_key:
        logger.warning("GOOGLE_API_KEY not set")
        return {
            "surface_error": SurfaceErrorCategory.FUNCTIONAL_LOGIC.value,
            "specific_error": "Incorrect output",
            "compiler_excerpt": f"Expected: {expected[:50]}, Got: {actual[:50]}",
            "cognitive_cause": CognitiveCause.WRONG_CHOICE.value,
            "bloom_level": BloomLevel.APPLY.value,
            "reasoning": "Logic error detected but API key missing.",
            "confidence": 0.55
        }

    try:
        genai.configure(api_key=google_key)
        model_name = os.getenv("GOOGLE_MODEL", "gemini-2.5-flash")
        
        system_prompt = """You are an expert algorithm analysis assistant for CS education.

**CRITICAL CONSTRAINTS** (HALLUCINATION PREVENTION):
1. Analyze the code's EXECUTION FLOW on the given test input
2. Trace through line-by-line to identify WHERE output diverges from expected
3. NEVER guess; explain the actual bug based on code logic
4. If multiple bugs possible, choose most likely based on code structure
5. Classify as most specific logic error type possible

**LOGIC ERROR SUBTYPES** (Functional/Logic surface category):
1. **Off-by-one error**: Loop bounds ±1, array indices, boundary conditions
2. **Edge case failure**: Empty input, single element, max/min values
3. **Wrong algorithm**: Fundamentally incorrect approach
4. **Missing condition**: Incomplete if-else logic, missing case
5. **Variable confusion**: Used wrong variable in computation
6. **Math error**: Incorrect formula/calculation
7. **Order of operations**: Steps executed in wrong sequence
8. **Incorrect state transition**: Object state not updated correctly

**COGNITIVE CAUSES FOR LOGIC ERRORS**:
- **WRONG_CHOICE**: Selected wrong algorithm or data structure (O(n²) when O(n) needed)
- **STRUCTURAL_BLINDNESS**: Missed edge cases, boundary conditions, initialization
- **MISCONCEPTION**: Misunderstood problem requirements or algorithm invariants
- **MENTAL_TYPO**: Typo in variable name causing wrong value usage (rare for pure logic errors)

**BLOOM LEVELS FOR LOGIC ERRORS**:
- Apply: Basic algorithm application errors (common off-by-one, simple edge cases)
- Analyse: Complex algorithm design flaws, subtle boundary conditions
- Evaluate: Failed to optimize, chose inefficient data structure
- Create: Novel problem requiring creative algorithmic solution

**EXAMPLES** (few-shot grounding for logic errors):

Example 1 - Off-by-One (STRUCTURAL_BLINDNESS):
Problem: Sum array elements
Input: [1,2,3,4,5]
Expected: 15
Actual: 10
Code: for(int i=0; i<arr.length-1; i++) sum += arr[i];
Output:
{
  "surface_error": "Functional/Logic",
  "specific_error": "Off-by-one error in loop bound",
  "compiler_excerpt": "Expected: 15, Got: 10",
  "cognitive_cause": "STRUCTURAL_BLINDNESS",
  "bloom_level": "Apply",
  "reasoning": "Loop condition 'i<arr.length-1' terminates one iteration early. When array has 5 elements, loop runs for i=0,1,2,3 (only 4 iterations), missing last element arr[4]=5. Should be 'i<arr.length' or 'i<=arr.length-1'. Student failed to test boundary case with exact array length.",
  "confidence": 0.92
}

Example 2 - Edge Case (STRUCTURAL_BLINDNESS):
Problem: Find maximum element
Input: []
Expected: -1 (or error)
Actual: NaN / crash
Code: max = arr[0]; for(i=1;i<arr.length;i++) if(arr[i]>max) max=arr[i]; return max;
Output:
{
  "surface_error": "Functional/Logic",
  "specific_error": "Edge case failure on empty input",
  "compiler_excerpt": "Expected: -1, Got: NaN / crash",
  "cognitive_cause": "STRUCTURAL_BLINDNESS",
  "bloom_level": "Apply",
  "reasoning": "Code assumes array has at least one element. Accessing arr[0] on empty array causes out-of-bounds or returns undefined. Missing defensive check: if(arr.length==0) return -1; Student did not anticipate empty input edge case.",
  "confidence": 0.88
}

Example 3 - Wrong Algorithm (WRONG_CHOICE):
Problem: Check if array is sorted (O(n) expected)
Input: [1,2,3,4,5]
Expected: true (time <1ms)
Actual: true (time 5000ms on large input)
Code: for(i=0;i<n;i++) for(j=0;j<n;j++) if(arr[j]>arr[j+1]) return false;
Output:
{
  "surface_error": "Functional/Logic",
  "specific_error": "Wrong algorithm - O(n²) instead of O(n)",
  "compiler_excerpt": "Expected: O(n), Got: O(n²) causing TLE",
  "cognitive_cause": "WRONG_CHOICE",
  "bloom_level": "Analyse",
  "reasoning": "Student chose nested loop to check if sorted, resulting in O(n²) complexity. Correct approach: single pass checking arr[i]<=arr[i+1]. Also has bug: inner loop j+1 will overflow on last element. Student chose wrong algorithm strategy - unnecessary nested iteration.",
  "confidence": 0.85
}

**OUTPUT FORMAT**:
You MUST return ONLY valid JSON with these EXACT field names:
```json
{
  "surface_error": "Functional/Logic",
  "specific_error": "Off-by-one error in loop bound",
  "compiler_excerpt": "Expected: 15, Got: 10",
  "cognitive_cause": "STRUCTURAL_BLINDNESS",
  "bloom_level": "Apply",
  "reasoning": "Loop condition terminates one iteration early...",
  "confidence": 0.85
}
```

**CRITICAL REQUIREMENTS**:
1. Use EXACT field names: surface_error, specific_error, compiler_excerpt, cognitive_cause, bloom_level, reasoning, confidence
2. confidence MUST be decimal 0.0-1.0 (NOT 0-100)
3. surface_error should typically be "Functional/Logic" for logic errors
4. bloom_level for logic errors: Apply, Analyse, Evaluate, or Create
5. Trace through code mentally BEFORE classifying
6. Return ONLY the JSON object, no explanatory text

**CRITICAL: Use these EXACT field names in your JSON response:**
- surface_error (NOT error_type)
- specific_error
- compiler_excerpt (NOT source_code_element)
- cognitive_cause
- bloom_level
- reasoning
- confidence (MUST be 0.0-1.0 range, NOT 0-100)
"""

        # Create model with system instruction
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt
        )

        user_prompt = f"""Problem Statement: {problem_desc[:250] if problem_desc else "N/A"}

Student Code:
```{language}
{code[:1000]}
```

Test Case Analysis:
Input: {test_input[:150]}
Expected Output: {expected[:200]}
Actual Output: {actual[:200]}

Language: {language}

STEP 1: TRACE through the code execution on the given input line-by-line
STEP 2: Identify WHERE the output diverges from expected
STEP 3: Classify using the academic framework above

SELF-VERIFICATION:
1. Does your trace explain the actual vs expected mismatch?
2. Is the logic error type specific (not just "incorrect output")?
3. Are you using EXACT field names: surface_error, specific_error, compiler_excerpt, cognitive_cause, bloom_level, reasoning, confidence?
4. Is confidence between 0.0-1.0 (NOT 0-100)?

RESPOND WITH ONLY THE JSON OBJECT. Example:
{{"surface_error": "Functional/Logic", "specific_error": "Off-by-one error", "compiler_excerpt": "Expected: 15, Got: 10", "cognitive_cause": "STRUCTURAL_BLINDNESS", "bloom_level": "Apply", "reasoning": "...", "confidence": 0.85}}"""

        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.15,  # IMPROVED: Slightly higher for analytical reasoning
                top_p=0.90,
                top_k=20,
                max_output_tokens=700,
                response_mime_type="application/json",
            ),
            safety_settings={
                "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
                "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
                "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
                "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
            }
        )

        text = response.text.strip()
        
        # Remove markdown fences
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        result = json.loads(text)
        
        logger.info(f"LLM returned for logic error: surface_error={result.get('surface_error')}, specific_error={result.get('specific_error')}")
        
        # ✨ NEW: Always set to Functional/Logic for logic errors
        result["surface_error"] = SurfaceErrorCategory.FUNCTIONAL_LOGIC.value
        
        # ✨ NEW: VALIDATE cognitive_cause
        cognitive_cause = result.get("cognitive_cause", "")
        if not is_valid_cognitive_cause(cognitive_cause):
            logger.error(f"❌ INVALID cognitive_cause from LLM: '{cognitive_cause}'")
            # For logic errors, most common causes are WRONG_CHOICE or STRUCTURAL_BLINDNESS
            result["cognitive_cause"] = CognitiveCause.WRONG_CHOICE.value
            logger.warning(f"⚠️ Defaulted cognitive_cause to: {result['cognitive_cause']}")
        
        # ✨ NEW: VALIDATE bloom_level (logic errors are typically Apply+)
        bloom_level = result.get("bloom_level", "")
        valid_logic_levels = [BloomLevel.APPLY.value, BloomLevel.ANALYSE.value, 
                             BloomLevel.EVALUATE.value, BloomLevel.CREATE.value]
        if bloom_level not in valid_logic_levels:
            logger.error(f"❌ INVALID bloom_level for logic error: '{bloom_level}'")
            result["bloom_level"] = BloomLevel.APPLY.value
            logger.warning(f"⚠️ Defaulted bloom_level to: {result['bloom_level']}")
        
        if "confidence" not in result:
            result["confidence"] = 0.70
        
        # IMPROVED: Confidence calibration for logic errors
        result = _calibrate_confidence(result, f"Logic: {expected} vs {actual}", code)
        
        logger.info(f"Final logic error classification: surface_error={result['surface_error']}, specific_error={result.get('specific_error')}, confidence={result['confidence']}")
        
        return result

    except json.JSONDecodeError as e:
        logger.exception(f"Failed to parse logic error JSON: {str(e)[:200]}")
        return {
            "surface_error": SurfaceErrorCategory.FUNCTIONAL_LOGIC.value,
            "specific_error": "Incorrect output",
            "compiler_excerpt": f"Expected: {expected[:50]}, Got: {actual[:50]}",
            "cognitive_cause": CognitiveCause.WRONG_CHOICE.value,
            "bloom_level": BloomLevel.APPLY.value,
            "reasoning": "Logic error detected but JSON parsing failed during classification.",
            "confidence": 0.60
        }
    except Exception as e:
        logger.exception(f"Logic error classification failed: {e}")
        return {
            "surface_error": SurfaceErrorCategory.FUNCTIONAL_LOGIC.value,
            "specific_error": "Incorrect output",
            "compiler_excerpt": f"Expected: {expected[:50]}, Got: {actual[:50]}",
            "cognitive_cause": CognitiveCause.WRONG_CHOICE.value,
            "bloom_level": BloomLevel.APPLY.value,
            "reasoning": "Logic error detected but classification encountered exception.",
            "confidence": 0.60
        }
