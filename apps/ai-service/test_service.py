#!/usr/bin/env python3
"""
Test script for AI Service endpoints
Run this after starting the AI service to verify it's working
"""

import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test the health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: Status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_bkt_update():
    """Test the BKT update endpoint"""
    print("\n🧠 Testing BKT update endpoint...")
    test_data = {
        "userId": "test-user-123",
        "kcId": "algorithms",
        "correct": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/bkt/update",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ BKT update successful: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ BKT update failed: Status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ BKT update failed: {e}")
        return False

def test_invalid_bkt_request():
    """Test BKT endpoint with invalid data"""
    print("\n🚫 Testing BKT with invalid data...")
    invalid_data = {"invalid": "data"}
    
    try:
        response = requests.post(
            f"{BASE_URL}/bkt/update",
            json=invalid_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code == 422:  # FastAPI validation error
            print("✅ Invalid data properly rejected (422 error expected)")
            return True
        else:
            print(f"⚠️  Unexpected status code: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting AI Service Tests")
    print("=" * 50)
    
    # Check if service is running
    health_ok = test_health()
    if not health_ok:
        print("\n❌ Service is not running or not responding")
        print("Make sure to start it with:")
        print("./venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload")
        sys.exit(1)
    
    # Test BKT functionality
    bkt_ok = test_bkt_update()
    validation_ok = test_invalid_bkt_request()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print(f"Health endpoint: {'✅' if health_ok else '❌'}")
    print(f"BKT update: {'✅' if bkt_ok else '❌'}")
    print(f"Input validation: {'✅' if validation_ok else '❌'}")
    
    if all([health_ok, bkt_ok, validation_ok]):
        print("\n🎉 All tests passed! AI Service is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")

if __name__ == "__main__":
    main()