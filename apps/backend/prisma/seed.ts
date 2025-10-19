import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create sample problems with test cases
  const problems = [
    {
      id: '1',
      title: 'Two Sum',
      difficulty: 'easy',
      description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
      inputFormat: `Line 1: Space-separated integers representing the array
Line 2: Target integer`,
      outputFormat: `Two space-separated integers representing the indices`,
      constraints: [
        '2 ≤ nums.length ≤ 10^4',
        '-10^9 ≤ nums[i] ≤ 10^9',
        '-10^9 ≤ target ≤ 10^9',
        'Only one valid answer exists'
      ],
      topics: ['Array', 'Hash Table'],
      knowledgeComponents: ['arrays', 'hash_maps', 'two_pointers'],
      timeLimit: 5,
      memoryLimit: 256,
      acceptanceRate: 0,
      totalSubmissions: 0,
      testCases: [
        {
          input: '2 7 11 15\n9',
          output: '0 1',
          explanation: 'Because nums[0] + nums[1] = 2 + 7 = 9',
          isHidden: false,
          points: 20
        },
        {
          input: '3 2 4\n6',
          output: '1 2',
          explanation: 'Because nums[1] + nums[2] = 2 + 4 = 6',
          isHidden: false,
          points: 20
        },
        {
          input: '3 3\n6',
          output: '0 1',
          explanation: 'Because nums[0] + nums[1] = 3 + 3 = 6',
          isHidden: true,
          points: 20
        }
      ]
    },
    {
      id: '2',
      title: 'Reverse String',
      difficulty: 'easy',
      description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.`,
      inputFormat: `A string to reverse`,
      outputFormat: `The reversed string`,
      constraints: [
        '1 ≤ s.length ≤ 10^5',
        's[i] is a printable ascii character'
      ],
      topics: ['String', 'Two Pointers'],
      knowledgeComponents: ['strings', 'two_pointers', 'in_place_algorithms'],
      timeLimit: 5,
      memoryLimit: 256,
      acceptanceRate: 0,
      totalSubmissions: 0,
      testCases: [
        {
          input: 'hello',
          output: 'olleh',
          explanation: 'Reverse the string "hello" to get "olleh"',
          isHidden: false,
          points: 25
        },
        {
          input: 'Hannah',
          output: 'hannaH',
          explanation: 'Reverse the string "Hannah" to get "hannaH"',
          isHidden: false,
          points: 25
        },
        {
          input: 'a',
          output: 'a',
          explanation: 'Single character remains the same',
          isHidden: true,
          points: 25
        },
        {
          input: 'programming',
          output: 'gnimmargorp',
          explanation: 'Reverse the longer string',
          isHidden: true,
          points: 25
        }
      ]
    },
    {
      id: '3',
      title: 'Palindrome Number',
      difficulty: 'easy',
      description: `Given an integer x, return true if x is palindrome integer.

An integer is a palindrome when it reads the same backward as forward.`,
      inputFormat: `An integer x`,
      outputFormat: `"true" if the number is a palindrome, "false" otherwise`,
      constraints: [
        '-2^31 ≤ x ≤ 2^31 - 1'
      ],
      topics: ['Math'],
      knowledgeComponents: ['math', 'string_manipulation', 'number_theory'],
      timeLimit: 5,
      memoryLimit: 256,
      acceptanceRate: 0,
      totalSubmissions: 0,
      testCases: [
        {
          input: '121',
          output: 'true',
          explanation: '121 reads as 121 from left to right and from right to left',
          isHidden: false,
          points: 20
        },
        {
          input: '-121',
          output: 'false',
          explanation: 'From left to right, it reads -121. From right to left, it becomes 121-',
          isHidden: false,
          points: 20
        },
        {
          input: '10',
          output: 'false',
          explanation: 'Reads 01 from right to left. Therefore it is not a palindrome',
          isHidden: false,
          points: 20
        },
        {
          input: '1221',
          output: 'true',
          explanation: '1221 is a palindrome',
          isHidden: true,
          points: 20
        },
        {
          input: '0',
          output: 'true',
          explanation: 'Single digit is always a palindrome',
          isHidden: true,
          points: 20
        }
      ]
    },
    {
      id: '4',
      title: 'Valid Parentheses',
      difficulty: 'medium',
      description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
      inputFormat: `A string containing parentheses, brackets, and braces`,
      outputFormat: `"true" if the string is valid, "false" otherwise`,
      constraints: [
        '1 ≤ s.length ≤ 10^4',
        's consists of parentheses only \'()[]{}\''
      ],
      topics: ['String', 'Stack'],
      knowledgeComponents: ['stacks', 'string_parsing', 'matching_algorithms'],
      timeLimit: 5,
      memoryLimit: 256,
      acceptanceRate: 0,
      totalSubmissions: 0,
      testCases: [
        {
          input: '()',
          output: 'true',
          explanation: 'Simple valid pair',
          isHidden: false,
          points: 15
        },
        {
          input: '()[]{}',
          output: 'true',
          explanation: 'Multiple valid pairs',
          isHidden: false,
          points: 15
        },
        {
          input: '(]',
          output: 'false',
          explanation: 'Mismatched brackets',
          isHidden: false,
          points: 15
        },
        {
          input: '([)]',
          output: 'false',
          explanation: 'Wrong order of closing',
          isHidden: true,
          points: 15
        },
        {
          input: '{[]}',
          output: 'true',
          explanation: 'Nested brackets in correct order',
          isHidden: true,
          points: 15
        },
        {
          input: '',
          output: 'true',
          explanation: 'Empty string is valid',
          isHidden: true,
          points: 15
        }
      ]
    },
    {
      id: '5',
      title: 'Binary Tree Inorder Traversal',
      difficulty: 'hard',
      description: `Given the root of a binary tree, return the inorder traversal of its nodes' values.

The tree is represented as a string where each node value is separated by spaces, and null nodes are represented by 'null'.`,
      inputFormat: `Space-separated values representing the binary tree in level order`,
      outputFormat: `Space-separated values representing the inorder traversal`,
      constraints: [
        'The number of nodes in the tree is in the range [0, 100]',
        '-100 ≤ Node.val ≤ 100'
      ],
      topics: ['Tree', 'Depth-First Search', 'Stack', 'Binary Tree'],
      knowledgeComponents: ['trees', 'dfs', 'recursion', 'tree_traversal'],
      timeLimit: 5,
      memoryLimit: 256,
      acceptanceRate: 0,
      totalSubmissions: 0,
      testCases: [
        {
          input: '1 null 2 3',
          output: '1 3 2',
          explanation: 'Inorder traversal of tree with root 1, right child 2, and 2 has left child 3',
          isHidden: false,
          points: 30
        },
        {
          input: '',
          output: '',
          explanation: 'Empty tree returns empty result',
          isHidden: false,
          points: 30
        },
        {
          input: '1',
          output: '1',
          explanation: 'Single node tree',
          isHidden: false,
          points: 30
        },
        {
          input: '1 2 3 4 5',
          output: '4 2 5 1 3',
          explanation: 'Complete binary tree inorder traversal',
          isHidden: true,
          points: 30
        }
      ]
    }
  ]

  // Create problems with test cases
  for (const problemData of problems) {
    const { testCases, ...problem } = problemData
    
    console.log(`Creating problem: ${problem.title}`)
    
    await prisma.problem.upsert({
      where: { id: problem.id },
      update: {},
      create: {
        ...problem,
        testCases: {
          create: testCases
        }
      }
    })
  }

  // Create sample knowledge components
  const knowledgeComponents = [
    { name: 'arrays', description: 'Understanding and manipulating arrays' },
    { name: 'hash_maps', description: 'Using hash tables and dictionaries' },
    { name: 'two_pointers', description: 'Two-pointer technique for optimization' },
    { name: 'strings', description: 'String manipulation and processing' },
    { name: 'stacks', description: 'Stack data structure and applications' },
    { name: 'trees', description: 'Tree data structures and algorithms' },
    { name: 'dfs', description: 'Depth-First Search algorithm' },
    { name: 'recursion', description: 'Recursive problem solving' },
    { name: 'math', description: 'Mathematical problem solving' },
    { name: 'tree_traversal', description: 'Tree traversal algorithms' }
  ]

  for (const kc of knowledgeComponents) {
    console.log(`Creating knowledge component: ${kc.name}`)
    
    await prisma.knowledgeComponent.upsert({
      where: { name: kc.name },
      update: {},
      create: kc
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created ${problems.length} problems with test cases`)
  console.log(`🧠 Created ${knowledgeComponents.length} knowledge components`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })