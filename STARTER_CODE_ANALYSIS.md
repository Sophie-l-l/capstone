# Starter Code Analysis & Comparison

## Current Starter Code (EduCode Platform)

### Python
```python
class Solution:
    def solve(self, nums):
        """
        Write your solution here.
        Args:
            nums: Input parameter (adjust based on problem)
        Returns:
            The result according to problem requirements
        """
        # Write your code here
        pass

# The system will call Solution().solve(test_input) for each test case
```

### JavaScript
```javascript
class Solution {
    solve(nums) {
        /*
         * Write your solution here.
         * @param {any} nums - Input parameter (adjust based on problem)
         * @return {any} The result according to problem requirements
         */
        // Write your code here
    }
}

// The system will call new Solution().solve(test_input) for each test case
```

### Java
```java
class Solution {
    /**
     * Write your solution here.
     * @param nums Input parameter (adjust based on problem)
     * @return The result according to problem requirements
     */
    public Object solve(Object nums) {
        // Write your code here
        return null;
    }
}

// The system will call new Solution().solve(test_input) for each test case
```

### C++
```cpp
#include <iostream>
#include <vector>
#include <string>
using namespace std;

class Solution {
public:
    /**
     * Write your solution here.
     * @param nums Input parameter (adjust based on problem)
     * @return The result according to problem requirements
     */
    auto solve(auto nums) {
        // Write your code here
        return nums;
    }
};

// The system will call Solution().solve(test_input) for each test case
```

---

## Comparison with Other Platforms

### LeetCode

**Python:**
```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        pass
```

**Advantages:**
- ✅ Type hints (List[int], -> List[int])
- ✅ Problem-specific method name (twoSum instead of generic solve)
- ✅ Specific parameter names matching problem description
- ✅ Can import typing module

**JavaScript:**
```javascript
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    
};
```

**Advantages:**
- ✅ JSDoc type annotations
- ✅ Function-based (not class-based)
- ✅ Problem-specific function name

### HackerRank

**Python:**
```python
#!/bin/python3

import math
import os
import random
import re
import sys

#
# Complete the 'solve' function below.
#
# The function is expected to return an INTEGER.
# The function accepts INTEGER_ARRAY arr as parameter.
#

def solve(arr):
    # Write your code here

if __name__ == '__main__':
    fptr = open(os.environ['OUTPUT_PATH'], 'w')
    arr = list(map(int, input().rstrip().split()))
    result = solve(arr)
    fptr.write(str(result) + '\n')
    fptr.close()
```

**Advantages:**
- ✅ Pre-imported common libraries (math, os, random, re, sys)
- ✅ Function-based approach
- ✅ Clear return type documentation
- ✅ Input/output handling provided

### Codeforces

**Python:**
```python
# No template - completely blank
# Users write everything from scratch including:
# - Import statements
# - Input reading (input(), int(input()), etc.)
# - Output printing (print())
```

**Advantages:**
- ✅ Maximum flexibility
- ✅ Users learn full problem-solving flow
- ❌ More error-prone for beginners

### CodeChef

**Python:**
```python
# cook your dish here
```

**Similar to Codeforces - minimal template**

---

## Issues with Current EduCode Starter Code

### ❌ **Problem 1: Class-based approach doesn't match Judge0 execution**
- Current code uses `Solution().solve(test_input)`
- But Judge0 executes code directly with stdin/stdout
- The class wrapper is never actually called!

### ❌ **Problem 2: Missing imports**
- No standard library imports included
- Users need to manually add `import sys`, `import math`, etc.
- Common typing imports not available

### ❌ **Problem 3: Generic method names**
- Using `solve()` for everything
- LeetCode uses problem-specific names (twoSum, reverseString, etc.)
- Makes code less self-documenting

### ❌ **Problem 4: Incorrect execution model**
The comment says "The system will call Solution().solve(test_input)" but Judge0 actually:
1. Takes stdin input
2. Executes the entire file
3. Captures stdout output

So for a "Two Sum" problem, the actual execution should be:
```python
# Input from stdin
n = int(input())
nums = list(map(int, input().split()))
target = int(input())

# User writes solution here
result = twoSum(nums, target)

# Output to stdout
print(' '.join(map(str, result)))
```

---

## Recommended Improvements

### Option 1: Function-based with I/O handling (Recommended)

**Python:**
```python
import sys
import math
from typing import List, Dict, Set, Tuple, Optional

def solve(nums: List[int]) -> List[int]:
    """
    Write your solution here.
    
    Args:
        nums: Input parameter (adjust type based on problem)
    
    Returns:
        The result according to problem requirements
    """
    # Write your code here
    pass


if __name__ == "__main__":
    # Read input
    nums = list(map(int, input().split()))
    
    # Call your solution
    result = solve(nums)
    
    # Print output
    print(result)
```

**Advantages:**
- ✅ Matches Judge0 execution model
- ✅ Common imports pre-loaded
- ✅ Type hints included
- ✅ Clear I/O separation
- ✅ Users can import additional libraries

### Option 2: LeetCode-style (Class-based but executable)

**Python:**
```python
from typing import List, Dict, Set, Tuple, Optional

class Solution:
    def solve(self, nums: List[int]) -> List[int]:
        """
        Write your solution here.
        """
        pass


# Test code (modify based on problem)
if __name__ == "__main__":
    solution = Solution()
    nums = list(map(int, input().split()))
    result = solution.solve(nums)
    print(result)
```

### Option 3: Minimal (Codeforces-style)

**Python:**
```python
# Write your solution here
# Remember to:
# - Read input using input()
# - Print output using print()

```

---

## Enabling User Imports

### Current Status: ✅ **Imports ARE Supported**

Judge0 already supports user imports! Users can:

**Python:**
```python
import collections
import heapq
import bisect
from typing import List
import itertools
import functools

def solve(nums):
    counter = collections.Counter(nums)
    # ... use any standard library
```

**JavaScript:**
```javascript
// No imports needed for built-in objects
// But can't use ES6 modules in Judge0 (no npm packages)
const _ = require('lodash'); // ❌ Won't work in Judge0
```

**Java:**
```java
import java.util.*;
import java.util.stream.*;

class Solution {
    // Can use ArrayList, HashMap, etc.
}
```

### Limitations:
- ❌ **Cannot install external packages** (no pip, npm, maven dependencies)
- ✅ **CAN use all standard library modules**
- ✅ **CAN import built-in modules** (collections, itertools, math, etc.)

---

## Implementation Plan

### 1. Add `starterCode` field to Problem model

```prisma
model Problem {
  // ... existing fields
  starterCodePython     String?
  starterCodeJavascript String?
  starterCodeJava       String?
  starterCodeCpp        String?
  // ... rest of model
}
```

### 2. Update problem creation to include starter code

Allow instructors to customize starter code per problem, or use improved defaults.

### 3. Improve default templates

Use Option 1 (Function-based with I/O) for better Judge0 compatibility.

### 4. Update frontend to use database starter code

```typescript
// In problem page
const defaultCode = problem.starterCodePython || languageTemplates.python;
setCode(defaultCode);
```

---

## Migration Script to Update All Problems

```typescript
// scripts/update-starter-code.ts
const improvedPythonTemplate = `import sys
from typing import List, Dict, Set, Optional

def solve(input_data):
    """Write your solution here."""
    pass

if __name__ == "__main__":
    # Read and process input
    input_data = input()
    result = solve(input_data)
    print(result)
`;

// Update all problems with improved starter code
await prisma.problem.updateMany({
  data: {
    starterCodePython: improvedPythonTemplate
  }
});
```

---

## Summary

### Current Issues:
1. ❌ Class-based template doesn't match Judge0 stdin/stdout model
2. ❌ No pre-imported libraries
3. ❌ No type hints
4. ❌ Generic method names instead of problem-specific
5. ❌ Starter code not stored in database (hardcoded in frontend)

### What Works:
1. ✅ Users CAN import standard library modules
2. ✅ Basic structure is clean and understandable
3. ✅ Multi-language support

### Recommendations:
1. **Short-term:** Update frontend templates to use function-based I/O model
2. **Medium-term:** Add starter code fields to database schema
3. **Long-term:** Allow per-problem custom starter code for instructors

### Import Support:
- ✅ **Standard library imports WORK** (already supported)
- ❌ **External packages DON'T WORK** (Judge0 limitation, would need custom Docker setup)
- 💡 **For most educational purposes, standard library is sufficient**
