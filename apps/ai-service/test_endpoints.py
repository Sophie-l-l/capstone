#!/usr/bin/env python3
"""
Test script for AI service endpoints with academic error classification.
Tests: Syntax errors, Runtime errors, Logic errors (wrong output)
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_syntax_error():
    """Test syntax error classification (missing semicolon)"""
    print("\n=== Testing Syntax Error (Missing Semicolon) ===")
    payload = {
        "error_text": "error: expected ';' before 'int'",
        "language": "cpp",
        "code": "int x = 5\nint y = 10;"
    }
    response = requests.post(f"{BASE_URL}/classify", json=payload)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(json.dumps(result, indent=2))
    
    # Validate expected fields
    assert result["surface_error"] == "Syntax", f"Expected 'Syntax', got '{result['surface_error']}'"
    assert "semicolon" in result["specific_error"].lower(), f"Expected 'semicolon' in specific_error"
    assert result["cognitive_cause"] == "MENTAL_TYPO", f"Expected MENTAL_TYPO, got {result['cognitive_cause']}"
    assert result["bloom_level"] == "Below Remember", f"Expected 'Below Remember', got {result['bloom_level']}"
    print("✅ Syntax error test PASSED")
    return True

def test_type_error():
    """Test type mismatch error"""
    print("\n=== Testing Type Mismatch Error ===")
    payload = {
        "error_text": "error: cannot convert 'int' to 'std::string' in initialization",
        "language": "cpp",
        "code": 'std::string name = 42;'
    }
    response = requests.post(f"{BASE_URL}/classify", json=payload)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(json.dumps(result, indent=2))
    
    assert result["surface_error"] == "Semantic/Type", f"Expected 'Semantic/Type', got '{result['surface_error']}'"
    assert result["cognitive_cause"] in ["MISCONCEPTION", "KNOWLEDGE_GAP"], f"Expected MISCONCEPTION or KNOWLEDGE_GAP, got {result['cognitive_cause']}"
    print("✅ Type error test PASSED")
    return True

def test_runtime_error():
    """Test runtime error (array bounds)"""
    print("\n=== Testing Runtime Error (Array Index Out of Bounds) ===")
    payload = {
        "error_text": "IndexError: list index out of range",
        "language": "python",
        "code": "arr = [1, 2, 3]\nprint(arr[10])"
    }
    response = requests.post(f"{BASE_URL}/classify", json=payload)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(json.dumps(result, indent=2))
    
    assert result["surface_error"] == "Runtime/Exception", f"Expected 'Runtime/Exception', got '{result['surface_error']}'"
    assert "index" in result["specific_error"].lower() or "bounds" in result["specific_error"].lower()
    assert result["cognitive_cause"] in ["STRUCTURAL_BLINDNESS", "MENTAL_TYPO"]
    print("✅ Runtime error test PASSED")
    return True

def test_logic_error():
    """Test logic error (wrong output - off-by-one)"""
    print("\n=== Testing Logic Error (Off-by-One) ===")
    payload = {
        "language": "python",
        "code": "def sum_array(arr):\n    total = 0\n    for i in range(len(arr) - 1):  # Off-by-one!\n        total += arr[i]\n    return total",
        "test_case_input": "[1, 2, 3, 4, 5]",
        "expected_output": "15",
        "actual_output": "10",
        "problem_description": "Write a function to sum all elements in an array"
    }
    response = requests.post(f"{BASE_URL}/classify", json=payload)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(json.dumps(result, indent=2))
    
    assert result["surface_error"] == "Functional/Logic", f"Expected 'Functional/Logic', got '{result['surface_error']}'"
    assert "off-by-one" in result["specific_error"].lower() or "loop" in result["specific_error"].lower()
    assert result["cognitive_cause"] in ["STRUCTURAL_BLINDNESS", "MENTAL_TYPO", "MISCONCEPTION"]
    assert result["bloom_level"] in ["Apply", "Analyse"]
    print("✅ Logic error test PASSED")
    return True

def test_undefined_variable():
    """Test undefined variable error"""
    print("\n=== Testing Undefined Variable ===")
    payload = {
        "error_text": "NameError: name 'calculate_mean' is not defined",
        "language": "python",
        "code": "result = calculate_mean(data)"
    }
    response = requests.post(f"{BASE_URL}/classify", json=payload)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(json.dumps(result, indent=2))
    
    assert result["surface_error"] == "Semantic/Link", f"Expected 'Semantic/Link', got '{result['surface_error']}'"
    assert result["cognitive_cause"] in ["KNOWLEDGE_GAP", "MENTAL_TYPO"]
    print("✅ Undefined variable test PASSED")
    return True

def run_all_tests():
    """Run all test cases"""
    print("=" * 60)
    print("AI SERVICE ENDPOINT TESTING")
    print("Testing Academic Error Classification Framework")
    print("=" * 60)
    
    tests = [
        ("Health Check", test_health),
        ("Syntax Error", test_syntax_error),
        ("Type Error", test_type_error),
        ("Runtime Error", test_runtime_error),
        ("Logic Error", test_logic_error),
        ("Undefined Variable", test_undefined_variable)
    ]
    
    results = []
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, "PASS" if success else "FAIL"))
        except AssertionError as e:
            print(f"❌ {name} FAILED: {e}")
            results.append((name, "FAIL"))
        except Exception as e:
            print(f"❌ {name} ERROR: {e}")
            results.append((name, "ERROR"))
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    for name, status in results:
        symbol = "✅" if status == "PASS" else "❌"
        print(f"{symbol} {name}: {status}")
    
    passed = sum(1 for _, status in results if status == "PASS")
    total = len(results)
    print(f"\nPassed: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(run_all_tests())
