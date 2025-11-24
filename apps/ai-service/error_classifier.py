"""
Error classification module using academic framework (IEEE 1044-2009 + Zehetmeier et al. 2015).
Pipeline: Parse → Surface Error → Cognitive Cause → Bloom Level → Structured Output
"""

import re
import logging
from typing import Optional, Dict, Any
import os
from llm_client import classify_with_gemini, classify_logic_error_with_gemini, embed_text
from pydantic import BaseModel, root_validator

logger = logging.getLogger(__name__)


class ClassifyRequest(BaseModel):
    """Request schema for error classification."""
    text: Optional[str] = None
    error_text: Optional[str] = None
    error_message: Optional[str] = None
    language: Optional[str] = None
    code: Optional[str] = None  # NEW: Student's code for context
    
    # NEW: For logic errors (failed test cases)
    test_case_input: Optional[str] = None
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None
    problem_description: Optional[str] = None

    @root_validator(pre=True)
    def ensure_text_present(cls, values):
        # Prefer explicit 'text', otherwise fall back to common legacy keys
        if not values.get("text"):
            if values.get("error_text"):
                values["text"] = values.get("error_text")
            elif values.get("error_message"):
                values["text"] = values.get("error_message")
        
        # Allow empty text for logic errors (when test cases fail without compiler error)
        if not values.get("text") and not (values.get("expected_output") and values.get("actual_output")):
            raise ValueError("Either 'text'/'error_message' OR test case outputs must be provided")
        
        return values

class ClassifyResponse(BaseModel):
    """Enhanced response with academic error classification."""
    # Surface error (technical layer - WHAT went wrong)
    surface_error: str  # Main category: Lexical, Syntax, Semantic, Runtime, etc.
    specific_error: str  # Fine-grained subtype: "Missing semicolon", "Index out of bounds"
    compiler_excerpt: Optional[str] = ""  # Short quote from compiler/runtime message (empty for logic errors)
    
    # Cognitive cause (pedagogical layer - WHY it happened)
    cognitive_cause: str  # MENTAL_TYPO, KNOWLEDGE_GAP, MISCONCEPTION, etc.
    bloom_level: str  # Below Remember, Remember, Understand, Apply, Analyse, Evaluate, Create
    reasoning: str  # 2-3 sentences explaining the classification
    
    # Technical metadata
    confidence: float
    embedding: Optional[list[float]] = None
    normalized_text: str
    source: str = "rule-based"  # "rule-based", "llm", or "llm-logic-error"


def normalize_error(text: str) -> str:
    """
    Normalize error text for consistent hashing and classification.
    - Remove file paths and line numbers
    - Preserve core error message structure
    """
    normalized = text.strip()
    
    # Remove file paths (e.g., "main.c:3:5:" or "/path/to/file.py:42:")
    normalized = re.sub(r'[\w\./\\]+\.(c|cpp|java|py|js|ts):\d+:\d*:?', '', normalized)
    
    # Remove standalone line numbers like "line 42"
    normalized = re.sub(r'\bline\s+\d+\b', 'line N', normalized, flags=re.IGNORECASE)
    
    # Normalize multiple whitespace to single space
    normalized = re.sub(r'\s+', ' ', normalized)
    
    return normalized.strip()


def classify_error_rule_based(text: str, language: Optional[str] = None) -> Dict[str, Any]:
    """
    Enhanced rule-based classification with academic framework (IEEE 1044-2009 + Zehetmeier).
    Returns dict with: surface_error, specific_error, compiler_excerpt, 
                      cognitive_cause, bloom_level, reasoning, confidence
    """
    text_lower = text.lower()
    excerpt = text[:100]  # First 100 chars for context
    
    # ====== LEXICAL ERRORS ======
    if "expected ';'" in text_lower or ("expected" in text_lower and ";" in text) or "expected semicolon" in text_lower or "missing semicolon" in text_lower:
        return {
            "surface_error": "Syntax/Lexical",
            "specific_error": "Missing semicolon",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "MENTAL_TYPO",
            "bloom_level": "Below Remember",
            "reasoning": "Semicolon omission is typically a typing oversight. Student likely knows the rule but forgot to type it.",
            "confidence": 0.95
        }
    
    if "expected '{'" in text_lower or "expected '}'" in text_lower:
        return {
            "surface_error": "Syntax/Lexical",
            "specific_error": "Missing or mismatched braces",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "MENTAL_TYPO",
            "bloom_level": "Remember",
            "reasoning": "Brace matching errors often stem from careless typing. Student understands block structure but made a mechanical error.",
            "confidence": 0.92
        }
    
    if "expected ')'" in text_lower or "expected '('" in text_lower:
        return {
            "surface_error": "Syntax/Lexical",
            "specific_error": "Missing or mismatched parentheses",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "MENTAL_TYPO",
            "bloom_level": "Remember",
            "reasoning": "Parenthesis mismatch is typically a typo, not a conceptual misunderstanding.",
            "confidence": 0.92
        }
    
    if language and "python" in language.lower() and "indentationerror" in text_lower:
        return {
            "surface_error": "Syntax/Lexical",
            "specific_error": "Indentation error",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "KNOWLEDGE_GAP",
            "bloom_level": "Remember",
            "reasoning": "Python indentation errors suggest unfamiliarity with whitespace-based block structure, a fundamental Python rule.",
            "confidence": 0.95
        }
    
    # ====== SEMANTIC/TYPE ERRORS ======
    if "undeclared identifier" in text_lower or "was not declared" in text_lower or "cannot find symbol" in text_lower:
        return {
            "surface_error": "Semantic/Link",
            "specific_error": "Undeclared variable/function",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "KNOWLEDGE_GAP",
            "bloom_level": "Remember",
            "reasoning": "Failed to declare before use indicates incomplete understanding of variable scoping rules.",
            "confidence": 0.90
        }
    
    if "redefinition" in text_lower or "already defined" in text_lower:
        return {
            "surface_error": "Semantic/Link",
            "specific_error": "Duplicate definition",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "MISCONCEPTION",
            "bloom_level": "Understand",
            "reasoning": "Redefining entities suggests misunderstanding of variable/function scope and uniqueness rules.",
            "confidence": 0.88
        }
    
    if "incompatible types" in text_lower or "type mismatch" in text_lower:
        return {
            "surface_error": "Semantic/Type",
            "specific_error": "Type mismatch",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "MISCONCEPTION",
            "bloom_level": "Understand",
            "reasoning": "Type incompatibility suggests confusion about the type system and implicit/explicit conversions.",
            "confidence": 0.85
        }
    
    if "cannot convert" in text_lower:
        return {
            "surface_error": "Semantic/Type",
            "specific_error": "Invalid type conversion",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "KNOWLEDGE_GAP",
            "bloom_level": "Understand",
            "reasoning": "Attempted illegal type conversion indicates incomplete knowledge of type compatibility rules.",
            "confidence": 0.85
        }
    
    # ====== RUNTIME/EXCEPTION ERRORS ======
    if "null pointer" in text_lower or "nullpointerexception" in text_lower:
        return {
            "surface_error": "Runtime/Exception",
            "specific_error": "Null pointer dereference",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "STRUCTURAL_BLINDNESS",
            "bloom_level": "Apply",
            "reasoning": "Null pointer errors indicate failure to anticipate edge cases where references may be uninitialized.",
            "confidence": 0.95
        }
    
    if "index out of" in text_lower or "arrayindexoutofbounds" in text_lower:
        return {
            "surface_error": "Runtime/Exception",
            "specific_error": "Array index out of bounds",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "STRUCTURAL_BLINDNESS",
            "bloom_level": "Apply",
            "reasoning": "Index errors suggest difficulty reasoning about loop bounds and array dimensions.",
            "confidence": 0.95
        }
    
    if "division by zero" in text_lower or "zerodivisionerror" in text_lower:
        return {
            "surface_error": "Runtime/Exception",
            "specific_error": "Division by zero",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "STRUCTURAL_BLINDNESS",
            "bloom_level": "Apply",
            "reasoning": "Missing zero-check before division indicates insufficient defensive programming and edge case handling.",
            "confidence": 0.98
        }
    
    if "stack overflow" in text_lower or "stackoverflowerror" in text_lower:
        return {
            "surface_error": "Runtime/Exception",
            "specific_error": "Stack overflow (likely infinite recursion)",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "WRONG_CHOICE",
            "bloom_level": "Analyse",
            "reasoning": "Stack overflow often results from missing base case in recursion, indicating flawed algorithmic design.",
            "confidence": 0.92
        }
    
    if "timeout" in text_lower or "time limit exceeded" in text_lower:
        return {
            "surface_error": "Quality/Performance",
            "specific_error": "Time limit exceeded",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "WRONG_CHOICE",
            "bloom_level": "Analyse",
            "reasoning": "TLE suggests inefficient algorithm choice (e.g., nested loops instead of hash table).",
            "confidence": 0.90
        }
    
    if "memory" in text_lower and ("limit" in text_lower or "exceeded" in text_lower):
        return {
            "surface_error": "Quality/Performance",
            "specific_error": "Memory limit exceeded",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "QUALITY_GAP",
            "bloom_level": "Analyse",
            "reasoning": "Memory overflow indicates poor space complexity management or resource leaks.",
            "confidence": 0.88
        }
    
    # ====== PYTHON-SPECIFIC ======
    if language and "python" in language.lower():
        if "nameerror" in text_lower:
            return {
                "surface_error": "Semantic/Link",
                "specific_error": "Undefined variable/function",
                "compiler_excerpt": excerpt,
                "cognitive_cause": "KNOWLEDGE_GAP",
                "bloom_level": "Remember",
                "reasoning": "NameError indicates variable not defined in accessible scope.",
                "confidence": 0.90
            }
        if "syntaxerror" in text_lower:
            return {
                "surface_error": "Syntax",
                "specific_error": "Python syntax error",
                "compiler_excerpt": excerpt,
                "cognitive_cause": "KNOWLEDGE_GAP",
                "bloom_level": "Remember",
                "reasoning": "Generic syntax error suggests unfamiliarity with Python grammar rules.",
                "confidence": 0.85
            }
        if "attributeerror" in text_lower:
            return {
                "surface_error": "Semantic/Type",
                "specific_error": "Attribute error",
                "compiler_excerpt": excerpt,
                "cognitive_cause": "MISCONCEPTION",
                "bloom_level": "Understand",
                "reasoning": "Accessing non-existent attribute suggests confusion about object structure.",
                "confidence": 0.85
            }
        if "typeerror" in text_lower:
            return {
                "surface_error": "Semantic/Type",
                "specific_error": "Type error",
                "compiler_excerpt": excerpt,
                "cognitive_cause": "MISCONCEPTION",
                "bloom_level": "Understand",
                "reasoning": "TypeError indicates mismatched operation-type pairing.",
                "confidence": 0.85
            }
    
    # ====== JAVA-SPECIFIC ======
    if language and "java" in language.lower():
        if "class, interface, or enum expected" in text_lower:
            return {
                "surface_error": "Syntax",
                "specific_error": "Invalid class structure",
                "compiler_excerpt": excerpt,
                "cognitive_cause": "KNOWLEDGE_GAP",
                "bloom_level": "Understand",
                "reasoning": "Java requires all code inside classes; this error suggests incomplete understanding of OOP structure.",
                "confidence": 0.90
            }
    
    # ====== C/C++-SPECIFIC ======
    if language and ("cpp" in language.lower() or language.lower() == "c"):
        if "undefined reference" in text_lower:
            return {
                "surface_error": "Link/Build",
                "specific_error": "Linker error: undefined reference",
                "compiler_excerpt": excerpt,
                "cognitive_cause": "KNOWLEDGE_GAP",
                "bloom_level": "Understand",
                "reasoning": "Linker errors indicate missing function definitions or library linkage issues.",
                "confidence": 0.88
            }
        if "segmentation fault" in text_lower or "sigsegv" in text_lower:
            return {
                "surface_error": "Runtime/Exception",
                "specific_error": "Segmentation fault",
                "compiler_excerpt": excerpt,
                "cognitive_cause": "STRUCTURAL_BLINDNESS",
                "bloom_level": "Analyse",
                "reasoning": "Segfault indicates illegal memory access, often from pointer errors or buffer overflows.",
                "confidence": 0.95
            }
    
    # ====== GENERIC FALLBACK ======
    if "error" in text_lower:
        if "syntax" in text_lower:
            return {
                "surface_error": "Syntax",
                "specific_error": "Syntax error",
                "compiler_excerpt": excerpt,
                "cognitive_cause": "KNOWLEDGE_GAP",
                "bloom_level": "Remember",
                "reasoning": "Generic syntax error without specific pattern match.",
                "confidence": 0.70
            }
        if "compile" in text_lower or "compilation" in text_lower:
            return {
                "surface_error": "Build/Configuration",
                "specific_error": "Compilation error",
                "compiler_excerpt": excerpt,
                "cognitive_cause": "KNOWLEDGE_GAP",
                "bloom_level": "Remember",
                "reasoning": "Generic compilation error.",
                "confidence": 0.70
            }
        if "runtime" in text_lower:
            return {
                "surface_error": "Runtime/Exception",
                "specific_error": "Runtime error",
                "compiler_excerpt": excerpt,
                "cognitive_cause": "STRUCTURAL_BLINDNESS",
                "bloom_level": "Apply",
                "reasoning": "Generic runtime error without specific pattern match.",
                "confidence": 0.70
            }
        return {
            "surface_error": "Unknown",
            "specific_error": "Unknown error",
            "compiler_excerpt": excerpt,
            "cognitive_cause": "KNOWLEDGE_GAP",
            "bloom_level": "Remember",
            "reasoning": "Could not classify this error with rule-based patterns.",
            "confidence": 0.50
        }
    
    return {
        "surface_error": "Unknown",
        "specific_error": "Unknown issue",
        "compiler_excerpt": excerpt,
        "cognitive_cause": "KNOWLEDGE_GAP",
        "bloom_level": "Remember",
        "reasoning": "No clear error pattern detected.",
        "confidence": 0.30
    }


def _sanitize_llm_result(d: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and sanitize LLM classification results.
    Ensures all categories match the allowed values from the prompt.
    """
    # Updated to match llm_client.py prompt categories exactly
    allowed_surface = {
        "Lexical", "Syntax", "Syntax/Lexical", 
        "Semantic/Type", "Semantic/Link", "Link/Binding",
        "Runtime/Exception", "Quality/Non-Functional",
        "Functional/Logic", "Concurrency/Timing", 
        "Environment/Deployment", "Security/Weakness",
        "Build/Configuration"
    }
    allowed_causes = {
        "MENTAL_TYPO", "KNOWLEDGE_GAP", "MISCONCEPTION", 
        "WRONG_CHOICE", "STRUCTURAL_BLINDNESS", "QUALITY_GAP", 
        "LACK_OF_INNOVATION", "WRONG_CHOICE/MISCONCEPTION"
    }
    allowed_bloom = {
        "Below Remember", "Remember", "Understand", 
        "Apply", "Analyse", "Evaluate", "Create"
    }
    d = dict(d or {})
    print(f'llm output is {d}')
    if d.get("surface_error") not in allowed_surface:
        
        d["surface_error"] = "Unknown"
    if d.get("cognitive_cause") not in allowed_causes:
        d["cognitive_cause"] = "KNOWLEDGE_GAP"
    if d.get("bloom_level") not in allowed_bloom:
        d["bloom_level"] = "Remember"
    try:
        c = float(d.get("confidence", 0.75))
    except Exception:
        c = 0.75
    d["confidence"] = max(0.0, min(1.0, c))
    # Ensure required fields exist
    d.setdefault("specific_error", "Unknown error")
    d.setdefault("compiler_excerpt", "")
    d.setdefault("reasoning", "")
    return d


def classify_error(request: ClassifyRequest) -> ClassifyResponse:
    """
    Main classification pipeline:
    1. Check if it's a logic error (failed test case without compiler error)
    2. Otherwise, normalize compiler/runtime error text
    3. Try rule-based classification (60+ patterns)
    4. Fall back to LLM if confidence < threshold
    5. Generate embedding for clustering
    """
    
    # CASE 1: Logic error (test case mismatch without compiler error)
    if (request.expected_output is not None and 
        request.actual_output is not None and 
        (not request.text or len(request.text.strip()) < 10)):
        
        try:
            result = classify_logic_error_with_gemini(
                code=request.code or "",
                test_input=request.test_case_input or "",
                expected=request.expected_output,
                actual=request.actual_output,
                problem_desc=request.problem_description or "",
                language=request.language or "unknown"
            )
            result = _sanitize_llm_result(result)
            
            # Generate embedding
            embedding = None
            try:
                emb_text = f"Logic error: expected {request.expected_output}, got {request.actual_output}"
                embedding = embed_text(emb_text)
            except Exception:
                pass
            
            return ClassifyResponse(
                surface_error=result.get("surface_error", "Functional/Logic"),
                specific_error=result.get("specific_error", "Incorrect output"),
                compiler_excerpt=result.get("compiler_excerpt", f"Expected: {request.expected_output[:50]}..."),
                cognitive_cause=result.get("cognitive_cause", "WRONG_CHOICE"),
                bloom_level=result.get("bloom_level", "Apply"),
                reasoning=result.get("reasoning", "Logic error detected via test case mismatch."),
                confidence=result.get("confidence", 0.75),
                embedding=embedding,
                normalized_text=f"Expected: {request.expected_output}, Actual: {request.actual_output}",
                source="llm-logic-error"
            )
        except Exception as e:
            # Fallback for logic errors
            return ClassifyResponse(
                surface_error="Functional/Logic",
                specific_error="Incorrect output",
                compiler_excerpt=f"Expected: {request.expected_output[:50] if request.expected_output else 'N/A'}",
                cognitive_cause="WRONG_CHOICE",
                bloom_level="Apply",
                reasoning="Test case failed but LLM classification unavailable.",
                confidence=0.60,
                embedding=None,
                normalized_text=f"Expected: {request.expected_output}, Actual: {request.actual_output}",
                source="rule-based"
            )
    
    # CASE 2: Compiler/runtime error
    normalized = normalize_error(request.text)
    result = classify_error_rule_based(normalized, request.language)
    
    source = "rule-based"
    confidence = result["confidence"]
    
    # LLM fallback when confidence low and API key present
    if confidence < float(os.getenv("LLM_MIN_CONFIDENCE", "0.75")):
        logger.info(f"Confidence {confidence} < threshold, attempting LLM fallback...")
        try:
            llm_result = classify_with_gemini(
                error_text=normalized,
                language=request.language or "unknown",
                code=request.code or ""
            )
            if llm_result:
                result = _sanitize_llm_result(llm_result)
                source = "llm"
                logger.info(f"LLM classification successful: {result['surface_error']}")
            else:
                logger.warning("LLM returned None, keeping rule-based result")
        except Exception as e:
            # Keep rule-based result if LLM fails
            logger.warning(f"LLM fallback failed: {e}")
            pass
    
    # Generate embedding for clustering
    embedding = None
    try:
        embedding = embed_text(normalized)
    except Exception:
        pass
    
    print(f"📦 Creating ClassifyResponse:")
    print(f"   surface_error: {result['surface_error']}")
    print(f"   specific_error: {result['specific_error']}")
    print(f"   cognitive_cause: {result['cognitive_cause']}")
    print(f"   bloom_level: {result['bloom_level']}")
    print(f"   confidence: {result['confidence']}")
    print(f"   source: {source}")
    logger.info(f"📦 Creating ClassifyResponse with: surface_error={result['surface_error']}, specific_error={result['specific_error']}, source={source}")
    
    # OVERRIDE: If LLM returned "Unknown" but we have logic error indicators, fix it
    if result['surface_error'] == "Unknown" and (
        request.expected_output is not None or 
        request.actual_output is not None or
        "incorrect" in result.get('specific_error', '').lower() or
        "wrong" in result.get('specific_error', '').lower()
    ):
        print(f"⚠️ Overriding Unknown -> Functional/Logic (logic error indicators detected)")
        result['surface_error'] = "Functional/Logic"
    
    return ClassifyResponse(
        surface_error=result["surface_error"],
        specific_error=result["specific_error"],
        compiler_excerpt=result.get("compiler_excerpt") or "",  # Default to empty string if None
        cognitive_cause=result["cognitive_cause"],
        bloom_level=result["bloom_level"],
        reasoning=result["reasoning"],
        confidence=result["confidence"],
        embedding=embedding,
        normalized_text=normalized,
        source=source
    )
