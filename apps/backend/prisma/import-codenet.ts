import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface ProblemListEntry {
  id: string;
  name: string;
  dataset: string;
  time_limit: string;
  memory_limit: string;
  rating: string;
  tags: string;
}

interface SubmissionEntry {
  submission_id: string;
  problem_id: string;
  user_id: string;
  date: string;
  language: string;
  original_language: string;
  filename_ext: string;
  status: string;
  cpu_time: string;
  memory: string;
  code_size: string;
}

async function importCodeNetProblems() {
  const codenetDir = path.join(__dirname, 'codenet');
  const problemListPath = path.join(codenetDir, 'problem_list.csv');

  if (!fs.existsSync(problemListPath)) {
    console.error('❌ problem_list.csv not found!');
    console.log('Run: ./download-codenet.sh first');
    return;
  }

  // Read problem list
  const problemListContent = fs.readFileSync(problemListPath, 'utf-8');
  const problemList: ProblemListEntry[] = parse(problemListContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`📖 Found ${problemList.length} problems in catalog\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const problem of problemList) {
    const problemMetadataPath = path.join(codenetDir, `${problem.id}.csv`);

    // Skip if metadata file doesn't exist
    if (!fs.existsSync(problemMetadataPath)) {
      skipped++;
      continue;
    }

    try {
      // Read submission metadata for this problem
      const metadataContent = fs.readFileSync(problemMetadataPath, 'utf-8');
      const submissions: SubmissionEntry[] = parse(metadataContent, {
        columns: true,
        skip_empty_lines: true,
      });

      // Calculate statistics from submissions
      const acceptedSubmissions = submissions.filter(s => s.status === 'Accepted');
      const acceptanceRate = submissions.length > 0 
        ? (acceptedSubmissions.length / submissions.length) * 100 
        : 0;

      // Determine difficulty based on acceptance rate and rating
      let difficulty = 'medium';
      const rating = parseInt(problem.rating) || 0;
      
      if (rating > 0) {
        if (rating < 1200) difficulty = 'easy';
        else if (rating > 1600) difficulty = 'hard';
      } else if (acceptanceRate > 70) {
        difficulty = 'easy';
      } else if (acceptanceRate < 30) {
        difficulty = 'hard';
      }

      // Extract unique languages
      const languages = [...new Set(submissions.map(s => s.original_language))].slice(0, 5);

      // Parse time and memory limits
      const timeLimit = parseFloat(problem.time_limit) || 2;
      const memoryLimit = parseInt(problem.memory_limit) / (1024 * 1024) || 256; // Convert to MB

      // Parse tags
      const tags = problem.tags ? problem.tags.split(',').map(t => t.trim()) : [];
      const topics = tags.length > 0 ? tags.slice(0, 5) : ['Algorithms', 'Problem Solving'];

      // Map tags to knowledge components
      const knowledgeComponents = tags
        .map(tag => tag.toLowerCase().replace(/\s+/g, '-'))
        .slice(0, 3);
      if (knowledgeComponents.length === 0) {
        knowledgeComponents.push('problem-solving');
      }

      // Create problem description
      const description = `# ${problem.name}

**Source**: ${problem.dataset} (IBM Project CodeNet)  
**Problem ID**: ${problem.id}  
**Difficulty Rating**: ${rating > 0 ? rating : 'Unrated'}

## Statistics
- **Total Submissions**: ${submissions.length.toLocaleString()}
- **Accepted Solutions**: ${acceptedSubmissions.length.toLocaleString()}
- **Acceptance Rate**: ${acceptanceRate.toFixed(1)}%
- **Supported Languages**: ${languages.join(', ')}

## Tags
${topics.map(t => `\`${t}\``).join(' ')}

## Description
This problem is from the ${problem.dataset} competitive programming platform, part of IBM's Project CodeNet dataset containing over 14 million submissions from real programming contests.

${tags.length > 0 ? `\n**Categories**: ${tags.join(', ')}` : ''}

## Constraints
- **Time Limit**: ${timeLimit} second${timeLimit !== 1 ? 's' : ''}
- **Memory Limit**: ${memoryLimit.toFixed(0)} MB

## Approach
Study the problem requirements and develop an efficient solution. Reference the ${acceptedSubmissions.length} accepted solutions in the dataset for guidance.
`;

      // Create sample test case from submission stats
      const avgCpuTime = acceptedSubmissions.length > 0
        ? acceptedSubmissions.reduce((sum, s) => sum + parseFloat(s.cpu_time || '0'), 0) / acceptedSubmissions.length
        : 0;

      // Create problem in database
      await prisma.problem.create({
        data: {
          title: problem.name,
          description,
          difficulty,
          inputFormat: 'See problem description on original platform',
          outputFormat: 'See problem description on original platform',
          constraints: [
            `Time Limit: ${timeLimit} second${timeLimit !== 1 ? 's' : ''}`,
            `Memory Limit: ${memoryLimit.toFixed(0)} MB`,
            `${submissions.length} total submissions`,
            `${acceptedSubmissions.length} accepted solutions`,
            `Average runtime: ${avgCpuTime.toFixed(2)}ms`
          ],
          topics,
          knowledgeComponents,
          timeLimit,
          memoryLimit,
          acceptanceRate: Math.round(acceptanceRate),
          totalSubmissions: submissions.length,
          source: `${problem.dataset} - CodeNet`,
          testCases: {
            create: [
              {
                input: 'Sample input (refer to original problem on platform)',
                output: 'Expected output',
                isHidden: false,
                points: 100,
                explanation: `Based on ${acceptedSubmissions.length} accepted submissions from the dataset`
              }
            ]
          }
        }
      });

      created++;
      console.log(`✅ ${created}. ${problem.name} (${problem.id}) - ${difficulty} - ${acceptanceRate.toFixed(1)}% acceptance`);

    } catch (e: any) {
      if (e.code === 'P2002') {
        skipped++;
        console.log(`⏭️  Skipped: ${problem.name} (${problem.id}) - already exists`);
      } else {
        errors++;
        console.error(`❌ Error importing ${problem.id}:`, e.message);
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`✅ Import Complete!`);
  console.log(`   Created: ${created} problems`);
  console.log(`   Skipped: ${skipped} (already existed or no metadata)`);
  console.log(`   Errors:  ${errors}`);
  console.log(`========================================\n`);

  const totalProblems = await prisma.problem.count();
  console.log(`📊 Total problems in database: ${totalProblems}`);
}

importCodeNetProblems()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
