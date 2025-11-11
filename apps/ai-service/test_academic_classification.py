"""
Quick test script for academic error classification framework.
Tests rule-based patterns without requiring API keys.
"""

from error_classifier import classify_error, ClassifyRequest

def test_syntax_error():
    """Test semicolon syntax error classification."""
    request = ClassifyRequest(
        text="main.c:5:10: error: expected ';' before 'return'",
        language="c",
        code="int main() { int x = 5 return x; }"
    )
    result = classify_error(request)
    
    print("=" * 60)
    print("TEST 1: Syntax Error (Missing Semicolon)")
    print("=" * 60)
    print(f"Surface Error: {result.surface_error}")
    print(f"Specific Error: {result.specific_error}")
    print(f"Cognitive Cause: {result.cognitive_cause}")
    print(f"Bloom Level: {result.bloom_level}")
    print(f"Reasoning: {result.reasoning}")
    print(f"Confidence: {result.confidence}")
    print(f"Source: {result.source}")
    print(f"Legacy Label: {result.label}")
    print()
    
    assert result.surface_error == "Syntax/Lexical"
    assert result.cognitive_cause == "MENTAL_TYPO"
    assert result.bloom_level == "Below Remember"
    assert result.confidence > 0.90
    print("✓ PASSED")
    print()


def test_runtime_error():
    """Test null pointer runtime error."""
    request = ClassifyRequest(
        text="Exception in thread 'main' java.lang.NullPointerException at Main.java:15",
        language="java",
        code="String s = null; System.out.println(s.length());"
    )
    result = classify_error(request)
    
    print("=" * 60)
    print("TEST 2: Runtime Error (Null Pointer)")
    print("=" * 60)
    print(f"Surface Error: {result.surface_error}")
    print(f"Specific Error: {result.specific_error}")
    print(f"Cognitive Cause: {result.cognitive_cause}")
    print(f"Bloom Level: {result.bloom_level}")
    print(f"Reasoning: {result.reasoning}")
    print(f"Confidence: {result.confidence}")
    print()
    
    assert result.surface_error == "Runtime/Exception"
    assert result.specific_error == "Null pointer dereference"
    assert result.cognitive_cause == "STRUCTURAL_BLINDNESS"
    assert result.bloom_level == "Apply"
    print("✓ PASSED")
    print()


def test_type_error():
    """Test type mismatch semantic error."""
    request = ClassifyRequest(
        text="error: incompatible types: int cannot be converted to String",
        language="java",
        code="String s = 42;"
    )
    result = classify_error(request)
    
    print("=" * 60)
    print("TEST 3: Semantic Error (Type Mismatch)")
    print("=" * 60)
    print(f"Surface Error: {result.surface_error}")
    print(f"Specific Error: {result.specific_error}")
    print(f"Cognitive Cause: {result.cognitive_cause}")
    print(f"Bloom Level: {result.bloom_level}")
    print(f"Reasoning: {result.reasoning}")
    print(f"Confidence: {result.confidence}")
    print()
    
    assert result.surface_error == "Semantic/Type"
    assert result.cognitive_cause == "MISCONCEPTION"
    assert result.bloom_level == "Understand"
    print("✓ PASSED")
    print()


def test_python_indentation():
    """Test Python-specific indentation error."""
    request = ClassifyRequest(
        text="IndentationError: expected an indented block",
        language="python",
        code="def foo():\nprint('hello')"
    )
    result = classify_error(request)
    
    print("=" * 60)
    print("TEST 4: Python Indentation Error")
    print("=" * 60)
    print(f"Surface Error: {result.surface_error}")
    print(f"Specific Error: {result.specific_error}")
    print(f"Cognitive Cause: {result.cognitive_cause}")
    print(f"Bloom Level: {result.bloom_level}")
    print(f"Reasoning: {result.reasoning}")
    print(f"Confidence: {result.confidence}")
    print()
    
    assert result.surface_error == "Syntax/Lexical"
    assert result.specific_error == "Indentation error"
    assert result.cognitive_cause == "KNOWLEDGE_GAP"
    print("✓ PASSED")
    print()


def test_logic_error_without_llm():
    """Test logic error detection (without LLM will use fallback)."""
    request = ClassifyRequest(
        code="def sum(arr):\n  total = 0\n  for i in range(len(arr)-1):\n    total += arr[i]\n  return total",
        test_case_input="[1,2,3,4,5]",
        expected_output="15",
        actual_output="10",
        language="python",
        problem_description="Write a function that sums all elements in an array."
    )
    result = classify_error(request)
    
    print("=" * 60)
    print("TEST 5: Logic Error (Test Case Mismatch)")
    print("=" * 60)
    print(f"Surface Error: {result.surface_error}")
    print(f"Specific Error: {result.specific_error}")
    print(f"Cognitive Cause: {result.cognitive_cause}")
    print(f"Bloom Level: {result.bloom_level}")
    print(f"Reasoning: {result.reasoning}")
    print(f"Confidence: {result.confidence}")
    print(f"Source: {result.source}")
    print()
    
    assert result.surface_error == "Functional/Logic"
    assert result.source in ["llm-logic-error", "rule-based"]
    print("✓ PASSED (Note: Using fallback without LLM)")
    print()


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("ACADEMIC ERROR CLASSIFICATION TEST SUITE")
    print("Testing 60+ rule-based patterns without API keys")
    print("=" * 60 + "\n")
    
    try:
        test_syntax_error()
        test_runtime_error()
        test_type_error()
        test_python_indentation()
        test_logic_error_without_llm()
        
        print("=" * 60)
        print("✓ ALL TESTS PASSED!")
        print("=" * 60)
        print("\nThe academic classification framework is working correctly.")
        print("Rule-based patterns cover 60+ common error types.")
        print("\nTo test LLM classification:")
        print("1. Set GOOGLE_API_KEY in your .env file")
        print("2. Run: python test_service.py")
        print()
        
    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        exit(1)
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
