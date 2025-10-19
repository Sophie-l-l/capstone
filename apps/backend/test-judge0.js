// Test script to verify Judge0 connectivity and functionality
const axios = require("axios");

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = "3fea58ff11msh3a34ae1c02ec47dp156a2ejsnae3140cb9e32";

// Language IDs for testing
const LANGUAGE_IDS = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54
};

class Judge0Tester {
  
  // Test 1: Check Judge0 API connectivity
  async testConnectivity() {
    console.log("🔍 Testing Judge0 API connectivity...");
    
    try {
      const response = await axios.get(
        `${JUDGE0_API_URL}/languages`,
        {
          headers: {
            "X-RapidAPI-Key": JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
          },
          timeout: 10000
        }
      );
      
      console.log("✅ Judge0 API is accessible");
      console.log(`📊 Found ${response.data.length} supported languages`);
      return true;
    } catch (error) {
      console.error("❌ Judge0 API connectivity failed:", error.message);
      return false;
    }
  }

  // Test 2: Simple code execution test
  async testSimpleExecution() {
    console.log("\n🚀 Testing simple code execution...");
    
    const testCode = 'print("Hello from Judge0!")';
    
    try {
      const response = await axios.post(
        `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: testCode,
          language_id: LANGUAGE_IDS.python,
          stdin: ""
        },
        {
          headers: {
            "X-RapidAPI-Key": JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      );

      const result = response.data;
      
      if (result.stdout && result.stdout.trim() === "Hello from Judge0!") {
        console.log("✅ Code execution successful!");
        console.log(`📄 Output: "${result.stdout.trim()}"`);
        console.log(`⏱️  Runtime: ${result.time || 'N/A'}s`);
        console.log(`💾 Memory: ${result.memory || 'N/A'}KB`);
        return true;
      } else {
        console.log("⚠️  Unexpected output:", result.stdout);
        console.log("🐛 Error:", result.stderr);
        return false;
      }
    } catch (error) {
      console.error("❌ Code execution failed:", error.message);
      return false;
    }
  }

  // Test 3: Test all supported languages
  async testAllLanguages() {
    console.log("\n🌐 Testing all supported languages...");
    
    const testCases = {
      python: {
        code: 'x = int(input())\nprint(x + 1)',
        input: '5',
        expected: '6'
      },
      javascript: {
        code: 'const input = require("fs").readFileSync(0, "utf8").trim();\nconsole.log(parseInt(input) + 1);',
        input: '5',
        expected: '6'
      },
      java: {
        code: `
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int x = sc.nextInt();
        System.out.println(x + 1);
    }
}`,
        input: '5',
        expected: '6'
      },
      cpp: {
        code: `
#include <iostream>
using namespace std;
int main() {
    int x;
    cin >> x;
    cout << x + 1 << endl;
    return 0;
}`,
        input: '5',
        expected: '6'
      }
    };

    const results = {};
    
    for (const [language, testCase] of Object.entries(testCases)) {
      try {
        console.log(`  Testing ${language}...`);
        
        const response = await axios.post(
          `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
          {
            source_code: testCase.code,
            language_id: LANGUAGE_IDS[language],
            stdin: testCase.input
          },
          {
            headers: {
              "X-RapidAPI-Key": JUDGE0_API_KEY,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
              "Content-Type": "application/json"
            },
            timeout: 30000
          }
        );

        const result = response.data;
        const success = result.stdout && result.stdout.trim() === testCase.expected;
        
        results[language] = success;
        console.log(`    ${success ? '✅' : '❌'} ${language}: ${success ? 'PASS' : 'FAIL'}`);
        
        if (!success) {
          console.log(`    Expected: "${testCase.expected}", Got: "${result.stdout?.trim() || 'null'}"`);
          if (result.stderr) console.log(`    Error: ${result.stderr}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`    ❌ ${language}: ERROR - ${error.message}`);
        results[language] = false;
      }
    }
    
    return results;
  }

  // Test 4: Backend API integration test
  async testBackendIntegration() {
    console.log("\n🔗 Testing backend API integration...");
    
    try {
      // This assumes your backend is running on port 3001
      const response = await axios.get("http://localhost:3001/health");
      
      if (response.status === 200) {
        console.log("✅ Backend API is accessible");
        console.log(`📊 Response:`, response.data);
        return true;
      }
    } catch (error) {
      console.log("❌ Backend API not accessible:", error.message);
      console.log("💡 Make sure to run: npm run dev (in backend directory)");
      return false;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log("🧪 Judge0 Connection Test Suite");
    console.log("================================\n");
    
    const connectivity = await this.testConnectivity();
    if (!connectivity) {
      console.log("\n❌ Stopping tests - Judge0 API not accessible");
      return;
    }
    
    const execution = await this.testSimpleExecution();
    const languages = await this.testAllLanguages();
    const backend = await this.testBackendIntegration();
    
    // Summary
    console.log("\n📋 Test Summary:");
    console.log("================");
    console.log(`🌐 API Connectivity: ${connectivity ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🚀 Simple Execution: ${execution ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔗 Backend Integration: ${backend ? '✅ PASS' : '❌ FAIL'}`);
    console.log("\n📊 Language Support:");
    
    Object.entries(languages).forEach(([lang, success]) => {
      console.log(`  ${lang}: ${success ? '✅ PASS' : '❌ FAIL'}`);
    });
    
    const allPassed = connectivity && execution && backend && Object.values(languages).every(Boolean);
    
    if (allPassed) {
      console.log("\n🎉 All tests passed! Judge0 integration is working perfectly.");
    } else {
      console.log("\n⚠️  Some tests failed. Check the output above for details.");
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new Judge0Tester();
  tester.runAllTests().catch(console.error);
}

module.exports = Judge0Tester;