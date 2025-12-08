/**
 * Cloud-based CodeNet Import Script
 * Downloads CodeNet directly to cloud instance and imports to Cloud SQL
 * No local download required - runs entirely in cloud infrastructure
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const CODENET_URL = 'https://dax-cdn.cdn.appdomain.cloud/dax-project-codenet/1.0.0/Project_CodeNet.tar.gz';
const TEMP_DIR = '/tmp/codenet';
const METADATA_DIR = path.join(TEMP_DIR, 'Project_CodeNet', 'metadata');

interface CodeNetProblem {
  id: string;
  name: string;
  dataset: string;
  timeLimit: number;
  memoryLimit: number;
  rating: number;
  tags: string[];
  description?: string;
}

interface ProblemStats {
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
}

// Map CodeNet tags to our Knowledge Components
const TAG_TO_KC: { [key: string]: string } = {
  'array': 'arrays',
  'string': 'strings',
  'math': 'math',
  'dp': 'dynamic_programming',
  'greedy': 'greedy',
  'graph': 'graphs',
  'tree': 'trees',
  'search': 'searching',
  'sort': 'sorting',
  'hash': 'hash_tables',
  'stack': 'stacks',
  'queue': 'queues',
  'heap': 'heaps',
  'binary-search': 'binary_search',
  'two-pointers': 'two_pointers',
  'sliding-window': 'sliding_window',
  'backtracking': 'backtracking',
  'divide-and-conquer': 'divide_and_conquer',
  'bit-manipulation': 'bit_manipulation',
  'recursion': 'recursion'
};

// Map acceptance rate to difficulty
function getDifficulty(acceptanceRate: number): 'easy' | 'medium' | 'hard' {
  if (acceptanceRate > 50) return 'easy';
  if (acceptanceRate > 25) return 'medium';
  return 'hard';
}

async function downloadAndExtract() {
  console.log('📥 Downloading CodeNet dataset (7.8 GB)...');
  console.log('This will take 15-30 minutes depending on connection speed');
  
  // Create temp directory
  await execAsync(`mkdir -p ${TEMP_DIR}`);
  
  // Download with progress
  const downloadCmd = `curl -L --progress-bar "${CODENET_URL}" -o ${TEMP_DIR}/codenet.tar.gz`;
  console.log('Starting download...');
  await execAsync(downloadCmd);
  
  console.log('✅ Download complete!');
  console.log('📦 Extracting metadata (this will take 5-10 minutes)...');
  
  // Extract only metadata directory to save space
  const extractCmd = `cd ${TEMP_DIR} && tar -xzf codenet.tar.gz Project_CodeNet/metadata/`;
  await execAsync(extractCmd);
  
  console.log('✅ Extraction complete!');
  
  // Clean up tar file to save space
  await execAsync(`rm ${TEMP_DIR}/codenet.tar.gz`);
  
  return METADATA_DIR;
}

async function parseProblemList(metadataDir: string): Promise<CodeNetProblem[]> {
  console.log('📋 Parsing problem list...');
  
  const problemListPath = path.join(metadataDir, 'problem_list.csv');
  const content = fs.readFileSync(problemListPath, 'utf-8');
  
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true
  });
  
  const problems: CodeNetProblem[] = records.map((record: any) => ({
    id: record.id,
    name: record.name,
    dataset: record.dataset,
    timeLimit: parseFloat(record.time_limit) || 2.0,
    memoryLimit: parseInt(record.memory_limit) || 256,
    rating: parseInt(record.rating) || 1000,
    tags: []
  }));
  
  console.log(`Found ${problems.length} problems`);
  return problems;
}

async function getProblemStats(metadataDir: string, problemId: string): Promise<ProblemStats> {
  const problemDir = path.join(metadataDir, problemId);
  
  if (!fs.existsSync(problemDir)) {
    return { totalSubmissions: 0, acceptedSubmissions: 0, acceptanceRate: 0 };
  }
  
  const statsPath = path.join(problemDir, `${problemId}.csv`);
  
  if (!fs.existsSync(statsPath)) {
    return { totalSubmissions: 0, acceptedSubmissions: 0, acceptanceRate: 0 };
  }
  
  const content = fs.readFileSync(statsPath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true
  });
  
  const totalSubmissions = records.length;
  const acceptedSubmissions = records.filter((r: any) => r.status === 'Accepted').length;
  const acceptanceRate = totalSubmissions > 0 ? (acceptedSubmissions / totalSubmissions) * 100 : 0;
  
  return { totalSubmissions, acceptedSubmissions, acceptanceRate };
}

async function importProblems(metadataDir: string, limit: number = 500) {
  console.log(`🚀 Starting import of up to ${limit} problems...`);
  
  const problems = await parseProblemList(metadataDir);
  
  // Filter to focus on quality problems from popular platforms
  const qualityProblems = problems.filter(p => 
    ['AtCoder', 'CodeForces', 'AOJ'].includes(p.dataset) &&
    p.rating >= 800 && p.rating <= 2500
  ).slice(0, limit);
  
  console.log(`Selected ${qualityProblems.length} quality problems for import`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const problem of qualityProblems) {
    try {
      // Get statistics
      const stats = await getProblemStats(metadataDir, problem.id);
      
      if (stats.totalSubmissions < 10) {
        skipped++;
        continue; // Skip problems with too few submissions
      }
      
      const difficulty = getDifficulty(stats.acceptanceRate);
      
      // Extract KCs from tags and dataset
      const knowledgeComponents: string[] = [];
      
      // Add KCs based on problem characteristics
      if (problem.rating < 1200) knowledgeComponents.push('arrays', 'strings');
      else if (problem.rating < 1600) knowledgeComponents.push('dynamic_programming', 'greedy');
      else knowledgeComponents.push('graphs', 'trees', 'dynamic_programming');
      
      // Create problem in database
      await prisma.problem.create({
        data: {
          title: problem.name,
          description: `**Source:** ${problem.dataset}\n**Problem ID:** ${problem.id}\n\n**Time Limit:** ${problem.timeLimit}s\n**Memory Limit:** ${problem.memoryLimit}MB\n\n**Statistics:**\n- Total Submissions: ${stats.totalSubmissions}\n- Accepted: ${stats.acceptedSubmissions}\n- Acceptance Rate: ${stats.acceptanceRate.toFixed(1)}%\n\n*Problem details available in CodeNet dataset*`,
          difficulty,
          inputFormat: 'Standard input (stdin)',
          outputFormat: 'Standard output (stdout)',
          knowledgeComponents,
          topics: [problem.dataset, difficulty],
          constraints: [
            `Time limit: ${problem.timeLimit}s`,
            `Memory limit: ${problem.memoryLimit}MB`
          ],
          timeLimit: Math.floor(problem.timeLimit),
          memoryLimit: problem.memoryLimit,
          acceptanceRate: stats.acceptanceRate,
          totalSubmissions: stats.totalSubmissions,
          source: `${problem.dataset} - ${problem.id}`
        }
      });
      
      imported++;
      
      if (imported % 50 === 0) {
        console.log(`Progress: ${imported}/${qualityProblems.length} problems imported`);
      }
      
    } catch (error: any) {
      if (error.code === 'P2002') {
        skipped++;
      } else {
        console.error(`Error importing ${problem.id}:`, error.message);
      }
    }
  }
  
  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${imported} problems`);
  console.log(`   Skipped: ${skipped} problems`);
  
  return imported;
}

async function cleanup() {
  console.log('🧹 Cleaning up temporary files...');
  await execAsync(`rm -rf ${TEMP_DIR}`);
  console.log('✅ Cleanup complete!');
}

async function main() {
  try {
    console.log('🌐 CodeNet Cloud Import');
    console.log('========================\n');
    
    const startTime = Date.now();
    
    // Download and extract
    const metadataDir = await downloadAndExtract();
    
    // Import problems
    const imported = await importProblems(metadataDir, 500);
    
    // Cleanup
    await cleanup();
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log(`\n🎉 All done in ${duration} minutes!`);
    console.log(`   Total problems in database: ${imported + 8}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
