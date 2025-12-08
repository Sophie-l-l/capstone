export type UserRole = "student" | "instructor"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  createdAt: string
  bio?: string
  location?: string
  githubUrl?: string
  linkedinUrl?: string
}

export interface KnowledgeComponent {
  id: string
  name: string
  mastery: number
  problemsSolved: number
  lastPracticed?: string
}

export interface Problem {
  id: string
  title: string
  difficulty: "easy" | "medium" | "hard"
  topics: string[]
  knowledgeComponents: string[]
  acceptanceRate: number
  totalSubmissions: number
  description: string
  inputFormat: string
  outputFormat: string
  constraints: string[]
  examples: TestCase[]
  timeLimit: number
  memoryLimit: number
  source?: string
}

export interface TestCase {
  input: string
  output: string
  explanation?: string
  isHidden: boolean
  points: number
}

export interface Submission {
  id: string
  userId: string
  problemId: string
  code: string
  language: "python" | "java" | "cpp" | "javascript"
  status: "accepted" | "wrong_answer" | "runtime_error" | "time_limit_exceeded" | "compilation_error"
  testCasesPassed: number
  totalTestCases: number
  runtime?: number
  memory?: number
  compileOutput?: string | null
  stderr?: string | null
  submittedAt: string
  error?: SubmissionError | null
}

export interface SubmissionError {
  id: string
  surfaceError: string
  cognitiveCause: string
  bloomLevel: string
  suggestion: string  // Maps to reasoning in DB
  errorPattern: string  // Maps to specificError in DB
}

export interface UserStats {
  problemsSolved: number
  totalProblems: number
  successRate: number
  currentStreak: number
  longestStreak: number
  rank: number
  totalStudents: number
  easyProblems: number
  mediumProblems: number
  hardProblems: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  progress?: number
  total?: number
  rarity: "common" | "rare" | "epic" | "legendary"
}

export interface StudentProgress {
  id: string
  name: string
  email: string
  avatar?: string
  problemsSolved: number
  successRate: number
  lastActive: string
  averageAttempts: number
  weakAreas: string[]
  isAtRisk: boolean
}

export interface ClassAnalytics {
  totalStudents: number
  activeStudents: number
  averageProblemsPerStudent: number
  averageSuccessRate: number
  atRiskStudents: number
  totalSubmissions: number
  problemDistribution: {
    easy: number
    medium: number
    hard: number
  }
  weeklyActivity: {
    day: string
    submissions: number
    students: number
  }[]
}
