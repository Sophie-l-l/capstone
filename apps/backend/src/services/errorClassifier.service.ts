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
  // Academic framework fields (IEEE 1044-2009 + Zehetmeier et al. 2015)
  surface_error: string;           // Lexical, Syntax, Semantic/Type, etc.
  specific_error: string;          // Detailed error description
  compiler_excerpt: string;        // Key part of error message
  cognitive_cause: string;         // MENTAL_TYPO, KNOWLEDGE_GAP, MISCONCEPTION, etc.
  bloom_level: string;             // Below Remember, Remember, Understand, Apply, Analyse, Evaluate, Create
  reasoning: string;               // AI explanation of the error
  confidence: number;              // 0.0-1.0
  embedding?: number[] | null;     // 768-dim vector for clustering
  normalized_text: string;         // Normalized error text
  source: string;                  // "rule-based" | "llm" | "llm-logic-error"
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
export async function classifyWithAI(
  text: string,
  language: string | null,
  extra?: {
    code?: string | null;
    test_case_input?: string | null;
    expected_output?: string | null;
    actual_output?: string | null;
    problem_description?: string | null;
  }
): Promise<AIClassifyResponse> {
  try {
    const payload: Record<string, any> = { text, language };
    // Pass optional academic/logic context if provided
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => {
        if (v) payload[k] = v;
      });
      // Also pass raw code separately even if we built a combined text earlier
      if (extra.code && !payload.code) payload.code = extra.code;
    }
    const response = await axios.post<AIClassifyResponse>(
      `${AI_SERVICE_URL}/errors/classify`,
      payload,
      { timeout: 30000 } // 30 seconds to handle cold starts
    );
    console.log("🎯 AI Service Response:", JSON.stringify({
      surface_error: response.data.surface_error,
      specific_error: response.data.specific_error,
      source: response.data.source,
      confidence: response.data.confidence
    }));
    return response.data;
  } catch (error: any) {
    console.error("AI classification failed:", error.message);
    // Fallback to generic classification
    return {
      surface_error: "Unknown",
      specific_error: "Unknown error",
      compiler_excerpt: text.substring(0, 100),
      cognitive_cause: "KNOWLEDGE_GAP",
      bloom_level: "Remember",
      reasoning: "Classification service unavailable",
      confidence: 0.3,
      embedding: null,
      normalized_text: normalizeError(text),
      source: "rule-based"
    };
  }
}

/**
 * Classify a pure logic error (wrong answer without compiler/runtime error).
 * We supply test case context separately so the AI service can trigger logic classification path.
 */
export async function classifyLogicErrorWithAI(params: {
  code: string;
  language: string;
  test_case_input: string;
  expected_output: string;
  actual_output: string;
  problem_description?: string | null;
}): Promise<AIClassifyResponse> {
  const syntheticText = `Logic error: expected ${params.expected_output} got ${params.actual_output}`;
  return classifyWithAI(syntheticText, params.language, {
    code: params.code,
    test_case_input: params.test_case_input,
    expected_output: params.expected_output,
    actual_output: params.actual_output,
    problem_description: params.problem_description || null
  });
}

/**
 * Upsert an error signature: find existing by hash or create new after AI classification
 */
export async function upsertErrorSignature(
  text: string,
  language: string | null
): Promise<{ id: string; label: string | null; classification: AIClassifyResponse }> {
  const normalized = normalizeError(text);
  const hash = hashError(normalized);

  // Check if signature already exists
  const existing = await prismaAny.errorSignature.findUnique({
    where: { hash },
    select: { id: true, label: true }
  });

  if (existing) {
    // For existing signatures, return academic fields if available, fallback to Unknown
    return {
      ...existing,
      classification: {
        surface_error: existing.surfaceError || "Unknown",
        specific_error: existing.specificError || "Unknown error",
        compiler_excerpt: existing.compilerExcerpt || "",
        cognitive_cause: existing.cognitiveCause || "KNOWLEDGE_GAP",
        bloom_level: existing.bloomLevel || "Remember",
        reasoning: existing.reasoning || "",
        confidence: existing.confidence || 0.5,
        embedding: null,
        normalized_text: normalized,
        source: existing.source || "cached"
      }
    };
  }

  // Classify with AI service
  const classification = await classifyWithAI(normalized, language);

  console.log("💾 Storing in database:", JSON.stringify({
    surfaceError: classification.surface_error,
    specificError: classification.specific_error,
    cognitiveCause: classification.cognitive_cause,
    bloomLevel: classification.bloom_level,
    source: classification.source
  }));

  // Create new signature with full academic fields
  const signature = await prismaAny.errorSignature.create({
    data: {
      hash,
      // Academic Framework Fields
      surfaceError: classification.surface_error,
      specificError: classification.specific_error,
      compilerExcerpt: classification.compiler_excerpt,
      cognitiveCause: classification.cognitive_cause,
      bloomLevel: classification.bloom_level,
      reasoning: classification.reasoning,
      source: classification.source,
      // Metadata fields
      confidence: classification.confidence,
      sample: normalized,
      embedding: classification.embedding ? JSON.parse(JSON.stringify(classification.embedding)) : null
    },
    select: { id: true }
  });

  console.log("✅ Stored signature with ID:", signature.id);

  return { ...signature, classification };
}

/**
 * Record a submission error and link to error signature
 */
export async function recordSubmissionError(opts: {
  submissionId: string;
  language: string;
  compileOutput?: string | null;
  stderr?: string | null;
  code?: string | null;
}): Promise<void> {
  // Include the submitted code alongside the compile/runtime output to give the
  // AI more context for deep analysis. The combined text will be used for
  // classification and embedding generation.
  const outputText = (opts.compileOutput || opts.stderr || "").trim();
  const codeText = (opts.code || "").trim();
  const errorText = (codeText ? `Code:\n${codeText}\n\nError:\n${outputText}` : outputText).trim();
  
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
 * Record a logic (wrong_answer) submission error when there is no compile/runtime stderr.
 * Selects first failing test case context for classification.
 */
export async function recordLogicError(opts: {
  submissionId: string;
  language: string;
  code: string;
  failingInput: string;
  expectedOutput: string;
  actualOutput: string;
  problemDescription?: string | null;
}): Promise<void> {
  try {
    const classification = await classifyLogicErrorWithAI({
      code: opts.code,
      language: opts.language,
      test_case_input: opts.failingInput,
      expected_output: opts.expectedOutput,
      actual_output: opts.actualOutput,
      problem_description: opts.problemDescription || null
    });

    // Hash based on a stable normalized representation (ignore code to cluster by error pattern)
    const baseText = `LogicMismatch\nInput:${opts.failingInput}\nExpected:${opts.expectedOutput}\nActual:${opts.actualOutput}`;
    const normalized = normalizeError(baseText);
    const hash = hashError(normalized);

    // Upsert signature manually (since upsertErrorSignature currently expects raw text)
    const existing = await prismaAny.errorSignature.findUnique({ where: { hash }, select: { id: true, label: true } });
    let signatureId: string;
    const combinedLabel = `${classification.surface_error}: ${classification.specific_error}`;
    
    if (existing) {
      signatureId = existing.id;
    } else {
      const created = await prismaAny.errorSignature.create({
        data: {
          hash,
          // Academic Framework Fields
          surfaceError: classification.surface_error,
          specificError: classification.specific_error,
          compilerExcerpt: classification.compiler_excerpt,
          cognitiveCause: classification.cognitive_cause,
          bloomLevel: classification.bloom_level,
          reasoning: classification.reasoning,
          source: classification.source,
          // Legacy fields (for backward compatibility)
          label: combinedLabel,
          confidence: classification.confidence,
          sample: normalized,
          embedding: classification.embedding ? JSON.parse(JSON.stringify(classification.embedding)) : null
        },
        select: { id: true }
      });
      signatureId = created.id;
    }

    await prismaAny.submissionError.create({
      data: {
        submissionId: opts.submissionId,
        language: opts.language,
        compileOutput: null,
        stderr: null,
        signatureId
      }
    });
  } catch (e) {
    console.error("Failed to record logic error:", (e as any).message);
  }
}

/**
 * Get top error labels for a student
 */
export async function getStudentTopErrors(userId: string, limit: number = 10) {
  const result = await prisma.$queryRaw<Array<{ label: string; count: bigint }>>`
    SELECT 
      CONCAT(
        COALESCE(es."surfaceError", 'Unknown'),
        ': ',
        COALESCE(es."specificError", 'Unknown error')
      ) as label,
      COUNT(*) as count
    FROM "submission_errors" se
    JOIN "submissions" s ON s.id = se."submissionId"
    LEFT JOIN "error_signatures" es ON es.id = se."signatureId"
    WHERE s."userId" = ${userId}
    GROUP BY es."surfaceError", es."specificError"
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
        select: {
          // Metadata fields
          confidence: true,
          embedding: true,
          // Academic framework fields
          surfaceError: true,
          specificError: true,
          compilerExcerpt: true,
          cognitiveCause: true,
          bloomLevel: true,
          reasoning: true,
          source: true
        }
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
