import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Generate realistic coding problems and test cases
 * This creates a diverse set of problems suitable for an adaptive learning platform
 */

const problems = [
  {
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers that add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    difficulty: "easy",
    inputFormat: "Line 1: Array of integers\nLine 2: Target integer",
    outputFormat: "Array of two indices",
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Only one valid answer exists"],
    topics: ["Arrays", "Hash Tables"],
    knowledgeComponents: ["array-manipulation", "hash-table-usage"],
    timeLimit: 2,
    memoryLimit: 256,
    tags: ["array", "hash-table"],
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isHidden: false },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]", isHidden: false },
      { input: "[3,3]\n6", expectedOutput: "[0,1]", isHidden: true },
    ]
  },
  {
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
    difficulty: "easy",
    timeLimit: 1,
    memoryLimit: 128,
    tags: ["string", "two-pointers"],
    testCases: [
      { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false },
      { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isHidden: false },
      { input: '["a"]', expectedOutput: '["a"]', isHidden: true },
    ]
  },
  {
    title: "Valid Parentheses",
    description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    difficulty: "easy",
    timeLimit: 2,
    memoryLimit: 128,
    tags: ["string", "stack"],
    testCases: [
      { input: "()", expectedOutput: "true", isHidden: false },
      { input: "()[]{}", expectedOutput: "true", isHidden: false },
      { input: "(]", expectedOutput: "false", isHidden: false },
      { input: "([)]", expectedOutput: "false", isHidden: true },
      { input: "{[]}", expectedOutput: "true", isHidden: true },
    ]
  },
  {
    title: "Maximum Subarray",
    description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
    difficulty: "medium",
    timeLimit: 3,
    memoryLimit: 256,
    tags: ["array", "dynamic-programming", "divide-and-conquer"],
    testCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", isHidden: false },
      { input: "[1]", expectedOutput: "1", isHidden: false },
      { input: "[5,4,-1,7,8]", expectedOutput: "23", isHidden: false },
      { input: "[-1]", expectedOutput: "-1", isHidden: true },
      { input: "[-2,-1]", expectedOutput: "-1", isHidden: true },
    ]
  },
  {
    title: "Merge Two Sorted Lists",
    description: "You are given the heads of two sorted linked lists `list1` and `list2`.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.",
    difficulty: "easy",
    timeLimit: 2,
    memoryLimit: 128,
    tags: ["linked-list", "recursion"],
    testCases: [
      { input: "[1,2,4]\n[1,3,4]", expectedOutput: "[1,1,2,3,4,4]", isHidden: false },
      { input: "[]\n[]", expectedOutput: "[]", isHidden: false },
      { input: "[]\n[0]", expectedOutput: "[0]", isHidden: true },
    ]
  },
  {
    title: "Binary Search",
    description: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.",
    difficulty: "easy",
    timeLimit: 2,
    memoryLimit: 128,
    tags: ["array", "binary-search"],
    testCases: [
      { input: "[-1,0,3,5,9,12]\n9", expectedOutput: "4", isHidden: false },
      { input: "[-1,0,3,5,9,12]\n2", expectedOutput: "-1", isHidden: false },
      { input: "[5]\n5", expectedOutput: "0", isHidden: true },
      { input: "[2,5]\n5", expectedOutput: "1", isHidden: true },
    ]
  },
  {
    title: "Climbing Stairs",
    description: "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    difficulty: "easy",
    timeLimit: 2,
    memoryLimit: 128,
    tags: ["dynamic-programming", "math", "memoization"],
    testCases: [
      { input: "2", expectedOutput: "2", isHidden: false },
      { input: "3", expectedOutput: "3", isHidden: false },
      { input: "1", expectedOutput: "1", isHidden: true },
      { input: "5", expectedOutput: "8", isHidden: true },
    ]
  },
  {
    title: "Longest Palindromic Substring",
    description: "Given a string `s`, return the longest palindromic substring in `s`.",
    difficulty: "medium",
    timeLimit: 3,
    memoryLimit: 256,
    tags: ["string", "dynamic-programming"],
    testCases: [
      { input: "babad", expectedOutput: "bab", isHidden: false },
      { input: "cbbd", expectedOutput: "bb", isHidden: false },
      { input: "a", expectedOutput: "a", isHidden: true },
      { input: "ac", expectedOutput: "a", isHidden: true },
    ]
  },
  {
    title: "3Sum",
    description: "Given an integer array nums, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.\n\nNotice that the solution set must not contain duplicate triplets.",
    difficulty: "medium",
    timeLimit: 4,
    memoryLimit: 256,
    tags: ["array", "two-pointers", "sorting"],
    testCases: [
      { input: "[-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]", isHidden: false },
      { input: "[0,1,1]", expectedOutput: "[]", isHidden: false },
      { input: "[0,0,0]", expectedOutput: "[[0,0,0]]", isHidden: true },
    ]
  },
  {
    title: "Container With Most Water",
    description: "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `ith` line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.",
    difficulty: "medium",
    timeLimit: 3,
    memoryLimit: 256,
    tags: ["array", "two-pointers", "greedy"],
    testCases: [
      { input: "[1,8,6,2,5,4,8,3,7]", expectedOutput: "49", isHidden: false },
      { input: "[1,1]", expectedOutput: "1", isHidden: false },
      { input: "[4,3,2,1,4]", expectedOutput: "16", isHidden: true },
    ]
  },
  {
    title: "Fibonacci Number",
    description: "The Fibonacci numbers, commonly denoted `F(n)` form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. That is,\n\nF(0) = 0, F(1) = 1\nF(n) = F(n - 1) + F(n - 2), for n > 1.\n\nGiven `n`, calculate `F(n)`.",
    difficulty: "easy",
    timeLimit: 1,
    memoryLimit: 128,
    tags: ["math", "dynamic-programming", "recursion", "memoization"],
    testCases: [
      { input: "2", expectedOutput: "1", isHidden: false },
      { input: "3", expectedOutput: "2", isHidden: false },
      { input: "4", expectedOutput: "3", isHidden: false },
      { input: "0", expectedOutput: "0", isHidden: true },
      { input: "10", expectedOutput: "55", isHidden: true },
    ]
  },
  {
    title: "Product of Array Except Self",
    description: "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nThe product of any prefix or suffix of `nums` is guaranteed to fit in a 32-bit integer.\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.",
    difficulty: "medium",
    timeLimit: 3,
    memoryLimit: 256,
    tags: ["array", "prefix-sum"],
    testCases: [
      { input: "[1,2,3,4]", expectedOutput: "[24,12,8,6]", isHidden: false },
      { input: "[-1,1,0,-3,3]", expectedOutput: "[0,0,9,0,0]", isHidden: false },
      { input: "[2,3,4,5]", expectedOutput: "[60,40,30,24]", isHidden: true },
    ]
  },
  {
    title: "Find Minimum in Rotated Sorted Array",
    description: "Suppose an array of length `n` sorted in ascending order is rotated between 1 and `n` times. For example, the array `nums = [0,1,2,4,5,6,7]` might become:\n\n- `[4,5,6,7,0,1,2]` if it was rotated 4 times.\n- `[0,1,2,4,5,6,7]` if it was rotated 7 times.\n\nNotice that rotating an array `[a[0], a[1], a[2], ..., a[n-1]]` 1 time results in the array `[a[n-1], a[0], a[1], a[2], ..., a[n-2]]`.\n\nGiven the sorted rotated array `nums` of unique elements, return the minimum element of this array.\n\nYou must write an algorithm that runs in O(log n) time.",
    difficulty: "medium",
    timeLimit: 2,
    memoryLimit: 128,
    tags: ["array", "binary-search"],
    testCases: [
      { input: "[3,4,5,1,2]", expectedOutput: "1", isHidden: false },
      { input: "[4,5,6,7,0,1,2]", expectedOutput: "0", isHidden: false },
      { input: "[11,13,15,17]", expectedOutput: "11", isHidden: true },
      { input: "[2,1]", expectedOutput: "1", isHidden: true },
    ]
  },
  {
    title: "Valid Anagram",
    description: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
    difficulty: "easy",
    timeLimit: 2,
    memoryLimit: 128,
    tags: ["hash-table", "string", "sorting"],
    testCases: [
      { input: "anagram\nnagaram", expectedOutput: "true", isHidden: false },
      { input: "rat\ncar", expectedOutput: "false", isHidden: false },
      { input: "a\na", expectedOutput: "true", isHidden: true },
      { input: "ab\nba", expectedOutput: "true", isHidden: true },
    ]
  },
  {
    title: "Group Anagrams",
    description: "Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
    difficulty: "medium",
    timeLimit: 3,
    memoryLimit: 256,
    tags: ["array", "hash-table", "string", "sorting"],
    testCases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]', isHidden: false },
      { input: '[""]', expectedOutput: '[[""]]', isHidden: false },
      { input: '["a"]', expectedOutput: '[["a"]]', isHidden: true },
    ]
  },
]

async function seedProblemsWithTestCases() {
  console.log('🌱 Seeding problems with test cases...\n')

  for (const problemData of problems) {
    const { testCases, ...problemFields } = problemData
    
    console.log(`📝 Creating problem: ${problemFields.title}`)
    
    const problem = await prisma.problem.create({
      data: {
        ...problemFields,
        testCases: {
          create: testCases.map((tc, index) => ({
            input: tc.input,
            output: tc.expectedOutput,
            isHidden: tc.isHidden,
            points: 10,
          }))
        }
      }
    })
    
    console.log(`   ✅ Created with ${testCases.length} test cases`)
  }

  console.log('\n📊 Seed Summary:')
  const problemCount = await prisma.problem.count()
  const testCaseCount = await prisma.testCase.count()
  console.log(`   Problems: ${problemCount}`)
  console.log(`   Test Cases: ${testCaseCount}`)
  console.log('\n✅ Seeding complete!')
}

seedProblemsWithTestCases()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
