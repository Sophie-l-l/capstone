// packages/shared-types/index.ts
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
