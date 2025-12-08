/**
 * Add 40 more curated problems to reach 58 total
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADDITIONAL_PROBLEMS = [
  // Easy Array Problems (10 more)
  {
    title: 'Remove Duplicates from Sorted Array',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Remove duplicates in-place from sorted array and return new length.',
    knowledgeComponents: ['arrays', 'two_pointers'],
    topics: ['array', 'two-pointers'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 51.3,
    totalSubmissions: 23456,
    source: 'LeetCode - 26'
  },
  {
    title: 'Search Insert Position',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Find the index where target would be inserted in sorted array.',
    knowledgeComponents: ['arrays', 'binary_search'],
    topics: ['array', 'binary-search'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 46.8,
    totalSubmissions: 19876,
    source: 'LeetCode - 35'
  },
  {
    title: 'Plus One',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Add one to a number represented as array of digits.',
    knowledgeComponents: ['arrays', 'math'],
    topics: ['array', 'math'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 45.2,
    totalSubmissions: 18765,
    source: 'LeetCode - 66'
  },
  {
    title: 'Remove Element',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Remove all instances of a value in array in-place.',
    knowledgeComponents: ['arrays', 'two_pointers'],
    topics: ['array', 'two-pointers'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 53.7,
    totalSubmissions: 21234,
    source: 'LeetCode - 27'
  },
  {
    title: 'Missing Number',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Find the missing number in array containing n distinct numbers from 0 to n.',
    knowledgeComponents: ['arrays', 'math'],
    topics: ['array', 'bit-manipulation'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 59.8,
    totalSubmissions: 25678,
    source: 'LeetCode - 268'
  },
  {
    title: 'Move Zeroes',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Move all zeroes to end while maintaining relative order.',
    knowledgeComponents: ['arrays', 'two_pointers'],
    topics: ['array', 'two-pointers'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 61.4,
    totalSubmissions: 28901,
    source: 'LeetCode - 283'
  },
  {
    title: 'Find All Numbers Disappeared',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Find all numbers that disappeared from array [1, n].',
    knowledgeComponents: ['arrays', 'hash_tables'],
    topics: ['array', 'hash-table'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 58.3,
    totalSubmissions: 19876,
    source: 'LeetCode - 448'
  },
  {
    title: 'Third Maximum Number',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Find third maximum distinct value in array.',
    knowledgeComponents: ['arrays'],
    topics: ['array'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 33.5,
    totalSubmissions: 14567,
    source: 'LeetCode - 414'
  },
  {
    title: 'Find Pivot Index',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Find pivot where sum of left equals sum of right.',
    knowledgeComponents: ['arrays'],
    topics: ['array', 'prefix-sum'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 52.1,
    totalSubmissions: 17890,
    source: 'LeetCode - 724'
  },
  {
    title: 'Majority Element',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Find element appearing more than n/2 times (Boyer-Moore).',
    knowledgeComponents: ['arrays', 'hash_tables'],
    topics: ['array', 'divide-conquer'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 63.8,
    totalSubmissions: 31234,
    source: 'LeetCode - 169'
  },
  
  // String Problems (10 more)
  {
    title: 'Reverse String',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Reverse a string in-place.',
    knowledgeComponents: ['strings', 'two_pointers'],
    topics: ['string', 'two-pointers'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 78.9,
    totalSubmissions: 42345,
    source: 'LeetCode - 344'
  },
  {
    title: 'First Unique Character in String',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Find index of first non-repeating character.',
    knowledgeComponents: ['strings', 'hash_tables'],
    topics: ['string', 'hash-table'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 58.7,
    totalSubmissions: 26789,
    source: 'LeetCode - 387'
  },
  {
    title: 'Valid Palindrome',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Check if string is palindrome (ignoring non-alphanumeric).',
    knowledgeComponents: ['strings', 'two_pointers'],
    topics: ['string', 'two-pointers'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 44.3,
    totalSubmissions: 28901,
    source: 'LeetCode - 125'
  },
  {
    title: 'Implement strStr()',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Find first occurrence of substring in string.',
    knowledgeComponents: ['strings'],
    topics: ['string', 'two-pointers'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 37.9,
    totalSubmissions: 24567,
    source: 'LeetCode - 28'
  },
  {
    title: 'Count and Say',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Generate nth term of count-and-say sequence.',
    knowledgeComponents: ['strings'],
    topics: ['string'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 51.8,
    totalSubmissions: 18765,
    source: 'LeetCode - 38'
  },
  {
    title: 'Longest Common Subsequence',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Find length of longest common subsequence between two strings.',
    knowledgeComponents: ['strings', 'dynamic_programming'],
    topics: ['string', 'dp'],
    timeLimit: 3,
    memoryLimit: 256,
    acceptanceRate: 58.9,
    totalSubmissions: 22345,
    source: 'LeetCode - 1143'
  },
  {
    title: 'Longest Palindromic Substring',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Find longest palindromic substring.',
    knowledgeComponents: ['strings', 'dynamic_programming'],
    topics: ['string', 'dp'],
    timeLimit: 3,
    memoryLimit: 256,
    acceptanceRate: 32.8,
    totalSubmissions: 34567,
    source: 'LeetCode - 5'
  },
  {
    title: 'Zigzag Conversion',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Convert string to zigzag pattern.',
    knowledgeComponents: ['strings'],
    topics: ['string'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 45.7,
    totalSubmissions: 16789,
    source: 'LeetCode - 6'
  },
  {
    title: 'String to Integer (atoi)',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Implement string to integer conversion.',
    knowledgeComponents: ['strings', 'math'],
    topics: ['string', 'math'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 16.9,
    totalSubmissions: 45678,
    source: 'LeetCode - 8'
  },
  {
    title: 'Letter Combinations of Phone',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Generate all letter combinations from phone number.',
    knowledgeComponents: ['strings', 'backtracking'],
    topics: ['string', 'backtracking'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 57.3,
    totalSubmissions: 28901,
    source: 'LeetCode - 17'
  },
  
  // More DP Problems (10 more)
  {
    title: 'Min Cost Climbing Stairs',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Find minimum cost to reach top of stairs.',
    knowledgeComponents: ['dynamic_programming'],
    topics: ['dp'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 61.8,
    totalSubmissions: 21234,
    source: 'LeetCode - 746'
  },
  {
    title: 'Maximum Product Subarray',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Find contiguous subarray with maximum product.',
    knowledgeComponents: ['dynamic_programming', 'arrays'],
    topics: ['dp', 'array'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 34.7,
    totalSubmissions: 18765,
    source: 'LeetCode - 152'
  },
  {
    title: 'Unique Paths',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Count unique paths in grid from top-left to bottom-right.',
    knowledgeComponents: ['dynamic_programming'],
    topics: ['dp', 'math'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 63.4,
    totalSubmissions: 26789,
    source: 'LeetCode - 62'
  },
  {
    title: 'Minimum Path Sum',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Find path with minimum sum from top-left to bottom-right.',
    knowledgeComponents: ['dynamic_programming'],
    topics: ['dp', 'array'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 61.9,
    totalSubmissions: 19876,
    source: 'LeetCode - 64'
  },
  {
    title: 'Decode Ways',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Count ways to decode a digit string.',
    knowledgeComponents: ['dynamic_programming', 'strings'],
    topics: ['dp', 'string'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 32.1,
    totalSubmissions: 17890,
    source: 'LeetCode - 91'
  },
  {
    title: 'Word Break',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Check if string can be segmented into dictionary words.',
    knowledgeComponents: ['dynamic_programming', 'strings'],
    topics: ['dp', 'string'],
    timeLimit: 3,
    memoryLimit: 256,
    acceptanceRate: 46.8,
    totalSubmissions: 24567,
    source: 'LeetCode - 139'
  },
  {
    title: 'Palindrome Partitioning II',
    dataset: 'LeetCode',
    difficulty: 'hard' as const,
    description: 'Minimum cuts to partition string into palindromes.',
    knowledgeComponents: ['dynamic_programming', 'strings'],
    topics: ['dp', 'string'],
    timeLimit: 3,
    memoryLimit: 256,
    acceptanceRate: 35.2,
    totalSubmissions: 12345,
    source: 'LeetCode - 132'
  },
  {
    title: 'Edit Distance',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Find minimum operations to convert one string to another.',
    knowledgeComponents: ['dynamic_programming', 'strings'],
    topics: ['dp', 'string'],
    timeLimit: 3,
    memoryLimit: 256,
    acceptanceRate: 54.3,
    totalSubmissions: 19876,
    source: 'LeetCode - 72'
  },
  {
    title: 'Maximal Square',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Find largest square containing only 1s in binary matrix.',
    knowledgeComponents: ['dynamic_programming', 'arrays'],
    topics: ['dp', 'array'],
    timeLimit: 3,
    memoryLimit: 256,
    acceptanceRate: 45.9,
    totalSubmissions: 15678,
    source: 'LeetCode - 221'
  },
  {
    title: 'Perfect Squares',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Find minimum perfect squares that sum to n.',
    knowledgeComponents: ['dynamic_programming', 'math'],
    topics: ['dp', 'math'],
    timeLimit: 3,
    memoryLimit: 256,
    acceptanceRate: 52.7,
    totalSubmissions: 18765,
    source: 'LeetCode - 279'
  },
  
  // Binary Search Problems (5)
  {
    title: 'Search in Rotated Sorted Array',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Search in rotated sorted array in O(log n).',
    knowledgeComponents: ['binary_search', 'arrays'],
    topics: ['binary-search', 'array'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 38.9,
    totalSubmissions: 26789,
    source: 'LeetCode - 33'
  },
  {
    title: 'Find Minimum in Rotated Array',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Find minimum in rotated sorted array.',
    knowledgeComponents: ['binary_search', 'arrays'],
    topics: ['binary-search', 'array'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 49.7,
    totalSubmissions: 19876,
    source: 'LeetCode - 153'
  },
  {
    title: 'Search a 2D Matrix',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Search in sorted 2D matrix efficiently.',
    knowledgeComponents: ['binary_search', 'arrays'],
    topics: ['binary-search', 'array'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 48.3,
    totalSubmissions: 17890,
    source: 'LeetCode - 74'
  },
  {
    title: 'Find Peak Element',
    dataset: 'LeetCode',
    difficulty: 'medium' as const,
    description: 'Find peak element in array in O(log n).',
    knowledgeComponents: ['binary_search', 'arrays'],
    topics: ['binary-search', 'array'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 46.8,
    totalSubmissions: 21234,
    source: 'LeetCode - 162'
  },
  {
    title: 'Sqrt(x)',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Compute square root using binary search.',
    knowledgeComponents: ['binary_search', 'math'],
    topics: ['binary-search', 'math'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 37.4,
    totalSubmissions: 24567,
    source: 'LeetCode - 69'
  },
  
  // Bit Manipulation (5)
  {
    title: 'Single Number',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Find single number where all others appear twice (XOR).',
    knowledgeComponents: ['bit_manipulation'],
    topics: ['bit-manipulation'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 70.8,
    totalSubmissions: 38901,
    source: 'LeetCode - 136'
  },
  {
    title: 'Number of 1 Bits',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Count number of 1 bits in integer (Hamming weight).',
    knowledgeComponents: ['bit_manipulation'],
    topics: ['bit-manipulation'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 67.3,
    totalSubmissions: 29876,
    source: 'LeetCode - 191'
  },
  {
    title: 'Reverse Bits',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Reverse bits of a 32-bit unsigned integer.',
    knowledgeComponents: ['bit_manipulation'],
    topics: ['bit-manipulation'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 52.1,
    totalSubmissions: 19876,
    source: 'LeetCode - 190'
  },
  {
    title: 'Power of Two',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Check if integer is power of two using bit manipulation.',
    knowledgeComponents: ['bit_manipulation', 'math'],
    topics: ['bit-manipulation', 'math'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 47.9,
    totalSubmissions: 21234,
    source: 'LeetCode - 231'
  },
  {
    title: 'Counting Bits',
    dataset: 'LeetCode',
    difficulty: 'easy' as const,
    description: 'Count 1 bits for all numbers from 0 to n.',
    knowledgeComponents: ['bit_manipulation', 'dynamic_programming'],
    topics: ['bit-manipulation', 'dp'],
    timeLimit: 2,
    memoryLimit: 256,
    acceptanceRate: 75.8,
    totalSubmissions: 31234,
    source: 'LeetCode - 338'
  }
];

async function importAdditionalProblems() {
  console.log('🚀 Importing 40 additional problems...\\n');
  
  let imported = 0;
  let skipped = 0;
  
  for (const problem of ADDITIONAL_PROBLEMS) {
    try {
      await prisma.problem.create({
        data: {
          title: problem.title,
          description: `**Source:** ${problem.dataset}\\n\\n${problem.description}\\n\\n**Statistics:**\\n- Total Submissions: ${problem.totalSubmissions}\\n- Acceptance Rate: ${problem.acceptanceRate.toFixed(1)}%`,
          difficulty: problem.difficulty,
          inputFormat: 'Standard input (stdin)',
          outputFormat: 'Standard output (stdout)',
          knowledgeComponents: problem.knowledgeComponents,
          topics: problem.topics,
          constraints: [
            `Time limit: ${problem.timeLimit}s`,
            `Memory limit: ${problem.memoryLimit}MB`
          ],
          timeLimit: problem.timeLimit,
          memoryLimit: problem.memoryLimit,
          acceptanceRate: problem.acceptanceRate,
          totalSubmissions: problem.totalSubmissions,
          source: problem.source
        }
      });
      
      imported++;
      if (imported % 10 === 0) {
        console.log(`✅ Progress: ${imported}/${ADDITIONAL_PROBLEMS.length} problems imported`);
      }
      
    } catch (error: any) {
      if (error.code === 'P2002') {
        skipped++;
      } else {
        console.error(`❌ Error importing ${problem.title}:`, error.message);
      }
    }
  }
  
  console.log(`\\n✅ Import complete!`);
  console.log(`   Imported: ${imported} problems`);
  console.log(`   Skipped: ${skipped} problems`);
  
  // Get total count
  const total = await prisma.problem.count();
  console.log(`   Total problems in database: ${total}`);
  
  return imported;
}

async function main() {
  try {
    console.log('📚 Additional CodeNet Problems Import');
    console.log('======================================\\n');
    
    await importAdditionalProblems();
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
