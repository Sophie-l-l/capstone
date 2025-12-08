import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CodeNetSubmission {
  problem_id: string;
  language: string;
  submission_id: string;
  cpu_time: number;
  memory: number;
  status: string;
  code_size: number;
}

async function extractProblems() {
  const samplePath = path.join(__dirname, 'data', 'sample-200.jsonl');
  
  if (!fs.existsSync(samplePath)) {
    console.error(`❌ File not found: ${samplePath}`);
    console.log('Available files:');
    const dataDir = path.join(__dirname, 'data');
    if (fs.existsSync(dataDir)) {
      fs.readdirSync(dataDir).forEach(file => console.log(`  - ${file}`));
    }
    return;
  }
  
  const content = fs.readFileSync(samplePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  const problemMap = new Map<string, any>();
  
  console.log(`📖 Reading ${lines.length} submissions...`);
  
  lines.forEach((line, index) => {
    try {
      const submission: CodeNetSubmission = JSON.parse(line);
      
      if (!problemMap.has(submission.problem_id)) {
        problemMap.set(submission.problem_id, {
          id: submission.problem_id,
          submissions: [],
          languages: new Set<string>(),
          statuses: new Set<string>()
        });
      }
      
      const problem = problemMap.get(submission.problem_id)!;
      problem.submissions.push(submission);
      problem.languages.add(submission.language);
      problem.statuses.add(submission.status);
    } catch (e) {
      console.error(`Error parsing line ${index + 1}:`, e);
    }
  });
  
  console.log(`\n📊 Found ${problemMap.size} unique problems\n`);
  
  let created = 0;
  let skipped = 0;
  
  for (const [problemId, data] of problemMap.entries()) {
    const acceptedSubmissions = data.submissions.filter((s: CodeNetSubmission) => s.status === 'Accepted');
    const acceptanceRate = acceptedSubmissions.length / data.submissions.length;
    const difficulty = acceptanceRate > 0.7 ? 'easy' : acceptanceRate > 0.4 ? 'medium' : 'hard';
    
    // Calculate average metrics from accepted submissions
    const avgCpuTime = acceptedSubmissions.length > 0 
      ? acceptedSubmissions.reduce((sum: number, s: CodeNetSubmission) => sum + s.cpu_time, 0) / acceptedSubmissions.length 
      : 0;
    const avgMemory = acceptedSubmissions.length > 0
      ? acceptedSubmissions.reduce((sum: number, s: CodeNetSubmission) => sum + s.memory, 0) / acceptedSubmissions.length
      : 0;
    
    try {
      await prisma.problem.create({
        data: {
          title: `CodeNet Problem ${problemId}`,
          description: `# Problem from IBM Project CodeNet

**Problem ID**: ${problemId}

## Statistics
- **Total Submissions**: ${data.submissions.length}
- **Acceptance Rate**: ${(acceptanceRate * 100).toFixed(1)}%
- **Languages**: ${Array.from(data.languages).join(', ')}
- **Average CPU Time**: ${avgCpuTime.toFixed(2)}ms
- **Average Memory**: ${(avgMemory / 1024).toFixed(2)}KB

## Description
This problem is part of the IBM Project CodeNet dataset, containing real competitive programming problems with verified test cases and solutions.

## Approach
Study the accepted submissions to understand the problem requirements and optimal solutions.`,
          difficulty,
          inputFormat: 'See problem description and sample test cases',
          outputFormat: 'See problem description and expected output',
          constraints: [
            `Time Limit: 2 seconds`,
            `Memory Limit: 256 MB`,
            `${data.submissions.length} submissions analyzed`,
            `${acceptedSubmissions.length} accepted solutions`
          ],
          topics: ['Algorithms', 'Data Structures', 'Problem Solving'],
          knowledgeComponents: ['problem-solving', 'algorithms'],
          timeLimit: 2,
          memoryLimit: 256,
          acceptanceRate: Math.round(acceptanceRate * 100),
          totalSubmissions: data.submissions.length,
          source: 'IBM Project CodeNet',
          testCases: {
            create: [
              {
                input: 'Sample input (refer to CodeNet for actual test cases)',
                output: 'Sample output',
                isHidden: false,
                points: 100
              }
            ]
          }
        }
      });
      created++;
      console.log(`✅ Created: ${problemId} (${difficulty}, ${(acceptanceRate * 100).toFixed(1)}% acceptance)`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        skipped++;
        console.log(`⏭️  Skipped: ${problemId} (already exists)`);
      } else {
        console.error(`❌ Error creating ${problemId}:`, e.message);
      }
    }
  }
  
  console.log(`\n========================================`);
  console.log(`✅ Import complete!`);
  console.log(`   Created: ${created} problems`);
  console.log(`   Skipped: ${skipped} (already existed)`);
  console.log(`   Total unique problems: ${problemMap.size}`);
  console.log(`========================================\n`);
  
  // Show final count
  const totalProblems = await prisma.problem.count();
  console.log(`📊 Total problems in database: ${totalProblems}`);
}

extractProblems()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
