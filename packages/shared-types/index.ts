// packages/shared-types/index.ts

/**
 * SURFACE ERROR CATEGORIES (IEEE 1044-2009)
 * These are the ONLY valid surface error types allowed in the system.
 */
export enum SurfaceErrorCategory {
  LEXICAL = 'Lexical',
  SYNTAX = 'Syntax',
  SEMANTIC_TYPE = 'Semantic/Type',
  SEMANTIC_LINK = 'Semantic/Link',
  LINK_BINDING = 'Link/Binding',
  RUNTIME_EXCEPTION = 'Runtime/Exception',
  FUNCTIONAL_LOGIC = 'Functional/Logic',
  QUALITY_NON_FUNCTIONAL = 'Quality/Non-Functional',
  CONCURRENCY_TIMING = 'Concurrency/Timing',
  ENVIRONMENT_DEPLOYMENT = 'Environment/Deployment',
  SECURITY_WEAKNESS = 'Security/Weakness',
  BUILD_CONFIGURATION = 'Build/Configuration'
}

/**
 * Helper to get all valid surface error categories as array
 */
export const SURFACE_ERROR_CATEGORIES = Object.values(SurfaceErrorCategory);

/**
 * COGNITIVE CAUSES (Zehetmeier et al. 2015)
 * These are the ONLY valid cognitive causes allowed in the system.
 */
export enum CognitiveCause {
  MENTAL_TYPO = 'MENTAL_TYPO',
  KNOWLEDGE_GAP = 'KNOWLEDGE_GAP',
  MISCONCEPTION = 'MISCONCEPTION',
  WRONG_CHOICE = 'WRONG_CHOICE',
  STRUCTURAL_BLINDNESS = 'STRUCTURAL_BLINDNESS',
  QUALITY_GAP = 'QUALITY_GAP',
  LACK_OF_INNOVATION = 'LACK_OF_INNOVATION',
  WRONG_CHOICE_MISCONCEPTION = 'WRONG_CHOICE/MISCONCEPTION'
}

/**
 * Helper to get all valid cognitive causes as array
 */
export const COGNITIVE_CAUSES = Object.values(CognitiveCause);

/**
 * BLOOM TAXONOMY LEVELS
 * These are the ONLY valid Bloom taxonomy levels allowed in the system.
 */
export enum BloomLevel {
  BELOW_REMEMBER = 'Below Remember',
  REMEMBER = 'Remember',
  UNDERSTAND = 'Understand',
  APPLY = 'Apply',
  ANALYSE = 'Analyse',
  EVALUATE = 'Evaluate',
  CREATE = 'Create'
}

/**
 * Helper to get all valid Bloom levels as array
 */
export const BLOOM_LEVELS = Object.values(BloomLevel);

/**
 * Color mapping for surface error categories (for frontend charts)
 */
export const SURFACE_ERROR_COLORS: Record<SurfaceErrorCategory, string> = {
  [SurfaceErrorCategory.LEXICAL]: '#3B82F6',
  [SurfaceErrorCategory.SYNTAX]: '#8B5CF6',
  [SurfaceErrorCategory.SEMANTIC_TYPE]: '#10B981',
  [SurfaceErrorCategory.SEMANTIC_LINK]: '#14B8A6',
  [SurfaceErrorCategory.LINK_BINDING]: '#06B6D4',
  [SurfaceErrorCategory.RUNTIME_EXCEPTION]: '#EF4444',
  [SurfaceErrorCategory.FUNCTIONAL_LOGIC]: '#F59E0B',
  [SurfaceErrorCategory.QUALITY_NON_FUNCTIONAL]: '#EC4899',
  [SurfaceErrorCategory.CONCURRENCY_TIMING]: '#8B5CF6',
  [SurfaceErrorCategory.ENVIRONMENT_DEPLOYMENT]: '#6B7280',
  [SurfaceErrorCategory.SECURITY_WEAKNESS]: '#DC2626',
  [SurfaceErrorCategory.BUILD_CONFIGURATION]: '#7C3AED'
};

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR';
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  code: string;
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR';
}

// All your types in one place!
