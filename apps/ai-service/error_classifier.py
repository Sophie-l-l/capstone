"""
Error classification service for compiler and runtime errors.
Uses rule-based matching for common patterns, with optional LLM fallback.
"""

import re
from typing import Optional
import os
from llm_client import classify_with_llm
from pydantic import BaseModel


class ClassifyRequest(BaseModel):
    text: str
    language: Optional[str] = None


class ClassifyResponse(BaseModel):
    label: str
    confidence: float
    embedding: Optional[list[float]] = None
    normalized_text: str
    source: str = "rule-based"


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


def classify_error_rule_based(text: str, language: Optional[str] = None) -> tuple[str, float]:
    """
    Fast rule-based classification for common compiler/runtime errors.
    Returns (label, confidence).
    """
    text_lower = text.lower()
    
    # Syntax errors
    if "expected ';'" in text_lower or ("expected" in text_lower and ";" in text):
        return ("Missing semicolon", 0.95)
    
    if "expected '{'" in text_lower or "expected '}'" in text_lower:
        return ("Missing or mismatched braces", 0.92)
    
    if "expected ')'" in text_lower or "expected '('" in text_lower:
        return ("Missing or mismatched parentheses", 0.92)
    
    if "undeclared identifier" in text_lower or "was not declared" in text_lower:
        return ("Undeclared variable/function", 0.90)
    
    if "redefinition" in text_lower or "already defined" in text_lower:
        return ("Duplicate definition", 0.88)
    
    # Type errors
    if "incompatible types" in text_lower or "type mismatch" in text_lower:
        return ("Type mismatch", 0.85)
    
    if "cannot convert" in text_lower:
        return ("Invalid type conversion", 0.85)
    
    # Runtime errors
    if "null pointer" in text_lower or "nullpointerexception" in text_lower:
        return ("Null pointer dereference", 0.95)
    
    if "index out of" in text_lower or "arrayindexoutofbounds" in text_lower:
        return ("Array index out of bounds", 0.95)
    
    if "division by zero" in text_lower or "zerodivisionerror" in text_lower:
        return ("Division by zero", 0.98)
    
    if "stack overflow" in text_lower or "stackoverflowerror" in text_lower:
        return ("Stack overflow (likely infinite recursion)", 0.92)
    
    if "timeout" in text_lower or "time limit exceeded" in text_lower:
        return ("Time limit exceeded", 0.90)
    
    if "memory" in text_lower and ("limit" in text_lower or "exceeded" in text_lower):
        return ("Memory limit exceeded", 0.88)
    
    # Python-specific
    if language and "python" in language.lower():
        if "indentationerror" in text_lower:
            return ("Indentation error", 0.95)
        if "nameerror" in text_lower:
            return ("Undefined variable/function", 0.90)
        if "syntaxerror" in text_lower:
            return ("Python syntax error", 0.85)
        if "attributeerror" in text_lower:
            return ("Attribute error", 0.85)
        if "typeerror" in text_lower:
            return ("Type error", 0.85)
    
    # Java-specific
    if language and "java" in language.lower():
        if "cannot find symbol" in text_lower:
            return ("Undefined symbol (Java)", 0.92)
        if "class, interface, or enum expected" in text_lower:
            return ("Invalid class structure", 0.90)
    
    # C/C++-specific
    if language and ("cpp" in language.lower() or language.lower() == "c"):
        if "undefined reference" in text_lower:
            return ("Linker error: undefined reference", 0.88)
        if "segmentation fault" in text_lower or "sigsegv" in text_lower:
            return ("Segmentation fault", 0.95)
    
    # Generic fallback
    if "error" in text_lower:
        if "syntax" in text_lower:
            return ("Syntax error", 0.70)
        if "compile" in text_lower or "compilation" in text_lower:
            return ("Compilation error", 0.70)
        if "runtime" in text_lower:
            return ("Runtime error", 0.70)
        return ("Unknown error", 0.50)
    
    return ("Unknown issue", 0.30)


def classify_error(request: ClassifyRequest) -> ClassifyResponse:
    """
    Main classification function.
    1. Normalize the error text
    2. Try rule-based matching
    3. (Future) Fall back to LLM if confidence is low
    """
    normalized = normalize_error(request.text)
    label, confidence = classify_error_rule_based(normalized, request.language)

    source = "rule-based"
    try:
        # LLM fallback when confidence low and API key present
        if confidence < float(os.getenv("LLM_MIN_CONFIDENCE", "0.75")):
            llm_result = classify_with_llm(normalized, request.language)
            if llm_result:
                label, confidence = llm_result
                source = "llm"
    except Exception:
        # Ignore LLM errors and keep rule-based result
        pass

    return ClassifyResponse(
        label=label,
        confidence=confidence,
        embedding=None,  # TODO: Generate embeddings for clustering
        normalized_text=normalized,
        source=source,
    )
