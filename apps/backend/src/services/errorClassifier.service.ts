import axios from "axios";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
// Workaround for editor/type cache issues: cast to any for dynamic model access
// The generated Prisma client does include ErrorSignature and SubmissionError models
// (see prisma/schema.prisma). Build via `npm run build` succeeds; this cast avoids
// transient LSP complaints without changing runtime behavior.
const prismaAny = prisma as any;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

interface AIClassifyResponse {
  label: string;
  confidence: number;
  embedding?: number[] | null;
  normalized_text: string;
}

/**
 * Normalize error text before hashing (must match AI service normalization)
 */
function normalizeError(text: string): string {
  let normalized = text.trim();
  
  // Remove file paths and line numbers
  normalized = normalized.replace(/[\w\./\\]+\.(c|cpp|java|py|js|ts):\d+:\d*:?/g, '');
  normalized = normalized.replace(/\bline\s+\d+\b/gi, 'line N');
  
  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized.trim();
}

/**
 * Generate SHA-256 hash of normalized error text
 */
function hashError(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Call AI service to classify an error
 */
async function classifyWithAI(text: string, language: string | null): Promise<AIClassifyResponse> {
  try {
    const response = await axios.post<AIClassifyResponse>(
      `${AI_SERVICE_URL}/errors/classify`,
      { text, language },
      { timeout: 5000 }
    );
    return response.data;
  } catch (error: any) {
    console.error("AI classification failed:", error.message);
    // Fallback to generic classification
    return {
      label: "Unknown error",
      confidence: 0.3,
      embedding: null,
      normalized_text: normalizeError(text)
    };
  }
}

/**
 * Upsert an error signature: find existing by hash or create new after AI classification
 */
export async function upsertErrorSignature(
  text: string,
  language: string | null
): Promise<{ id: string; label: string | null }> {
  const normalized = normalizeError(text);
  const hash = hashError(normalized);

  // Check if signature already exists
  const existing = await prismaAny.errorSignature.findUnique({
    where: { hash },
    select: { id: true, label: true }
  });

  if (existing) {
    return existing;
  }

  // Classify with AI service
  const classification = await classifyWithAI(normalized, language);

  // Create new signature
  const signature = await prismaAny.errorSignature.create({
    data: {
      hash,
      label: classification.label,
      confidence: classification.confidence,
      sample: normalized,
      embedding: classification.embedding ? JSON.parse(JSON.stringify(classification.embedding)) : null
    },
    select: { id: true, label: true }
  });

  return signature;
}

/**
 * Record a submission error and link to error signature
 */
export async function recordSubmissionError(opts: {
  submissionId: string;
  language: string;
  compileOutput?: string | null;
  stderr?: string | null;
}): Promise<void> {
  const errorText = (opts.compileOutput || opts.stderr || "").trim();
  
  if (!errorText) {
    // No error to record
    return;
  }

  // Get or create error signature
  const signature = await upsertErrorSignature(errorText, opts.language);

  // Create submission error record
  await prismaAny.submissionError.create({
    data: {
      submissionId: opts.submissionId,
      language: opts.language,
      compileOutput: opts.compileOutput || null,
      stderr: opts.stderr || null,
      signatureId: signature.id
    }
  });
}

/**
 * Get top error labels for a student
 */
export async function getStudentTopErrors(userId: string, limit: number = 10) {
  const result = await prisma.$queryRaw<Array<{ label: string; count: bigint }>>`
    SELECT 
      COALESCE(es.label, 'Unknown') as label,
      COUNT(*) as count
    FROM "submission_errors" se
    JOIN "submissions" s ON s.id = se."submissionId"
    LEFT JOIN "error_signatures" es ON es.id = se."signatureId"
    WHERE s."userId" = ${userId}
    GROUP BY es.label
    ORDER BY count DESC
    LIMIT ${limit}
  `;

  return result.map(row => ({
    label: row.label,
    count: Number(row.count)
  }));
}

/**
 * Get recent submission errors for a student
 */
export async function getStudentRecentErrors(userId: string, limit: number = 20) {
  return prismaAny.submissionError.findMany({
    where: {
      submission: { userId }
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      signature: {
        select: { label: true, confidence: true }
      },
      submission: {
        select: {
          id: true,
          problemId: true,
          status: true,
          submittedAt: true,
          problem: {
            select: { title: true }
          }
        }
      }
    }
  });
}
