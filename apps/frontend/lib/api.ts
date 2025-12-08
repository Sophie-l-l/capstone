// API client for backend integration
import { config, shouldUseMock } from './config'
import { 
  mockProblems, 
  mockKnowledgeComponents, 
  mockUserStats, 
  mockSubmissions,
  mockUser 
} from './mock-data'

const API_BASE_URL = config.apiUrl

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('educode_token')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('educode_token', token)
      } else {
        localStorage.removeItem('educode_token')
      }
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network request failed')
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    if (response.token) {
      this.setToken(response.token)
    }
    
    return response
  }

  async register(email: string, password: string, name: string, role: 'student' | 'instructor') {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    })
    
    if (response.token) {
      this.setToken(response.token)
    }
    
    return response
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' })
    this.setToken(null)
  }

  async getCurrentUser() {
    if (shouldUseMock('auth')) {
      return Promise.resolve({ user: mockUser })
    }
    return this.request('/api/auth/me')
  }

  // Problem endpoints
  async getProblems(params?: { 
    difficulty?: string
    topic?: string
    search?: string
    page?: number
    limit?: number
  }) {
    if (shouldUseMock('problems')) {
      // Filter mock problems based on params
      let filteredProblems = [...mockProblems]
      
      if (params?.difficulty) {
        filteredProblems = filteredProblems.filter(p => p.difficulty === params.difficulty)
      }
      if (params?.search) {
        filteredProblems = filteredProblems.filter(p => 
          p.title.toLowerCase().includes(params.search!.toLowerCase())
        )
      }
      
      return Promise.resolve({ problems: filteredProblems })
    }
    
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const query = searchParams.toString()
    return this.request(`/api/problems${query ? `?${query}` : ''}`)
  }

  async getProblem(id: string) {
    if (shouldUseMock('problems')) {
      const problem = mockProblems.find(p => p.id === id)
      if (!problem) {
        throw new Error('Problem not found')
      }
      return Promise.resolve(problem) // Return the problem directly, not wrapped
    }
    return this.request(`/api/problems/${id}`)
  }

  // Code execution endpoints
  async runCode(problemId: string, code: string, language: string) {
    if (shouldUseMock('problems')) {
      // Mock successful code run
      return Promise.resolve({
        status: 'success',
        results: [
          {
            testCaseId: '1',
            passed: true,
            input: '1 2',
            expectedOutput: '3',
            actualOutput: '3',
            runtime: 0.05,
            memory: 1024
          }
        ],
        totalRuntime: 0.05,
        totalMemory: 1024
      })
    }
    return this.request(`/api/problems/${problemId}/run`, {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    })
  }

  async submitCode(problemId: string, code: string, language: string) {
    if (shouldUseMock('problems')) {
      // Mock successful submission
      return Promise.resolve({
        submissionId: 'mock-submission-' + Date.now(),
        status: 'accepted',
        testCasesPassed: 3,
        totalTestCases: 3,
        runtime: 0.1,
        memory: 2048,
        score: 100,
        submittedAt: new Date().toISOString()
      })
    }
    return this.request(`/api/problems/${problemId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    })
  }

  // Submission endpoints
  async getSubmissions(params?: {
    problemId?: string
    status?: string
    page?: number
    limit?: number
  }) {
    if (shouldUseMock('analytics')) {
      // Filter mock submissions based on params
      let filteredSubmissions = [...mockSubmissions]
      
      if (params?.problemId) {
        filteredSubmissions = filteredSubmissions.filter(s => s.problemId === params.problemId)
      }
      if (params?.status) {
        filteredSubmissions = filteredSubmissions.filter(s => s.status === params.status)
      }
      
      return Promise.resolve({ submissions: filteredSubmissions })
    }
    
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const query = searchParams.toString()
    return this.request(`/api/submissions${query ? `?${query}` : ''}`)
  }

  async getSubmissionDetail(submissionId: string) {
    return this.request(`/api/students/submissions/${submissionId}/detail`)
  }

  // Analytics endpoints
  async getUserStats() {
    if (shouldUseMock('analytics')) {
      return Promise.resolve(mockUserStats)
    }
    return this.request('/api/users/stats')
  }

  async getKnowledgeComponents() {
    if (shouldUseMock('analytics')) {
      return Promise.resolve({ knowledgeComponents: mockKnowledgeComponents })
    }
    return this.request('/api/users/knowledge-components')
  }

  async getAchievements() {
    if (shouldUseMock('analytics')) {
      return Promise.resolve({ achievements: [] }) // Add mock achievements if needed
    }
    return this.request('/api/users/achievements')
  }

  async getRecommendations() {
    if (shouldUseMock('analytics')) {
      return Promise.resolve({ 
        recommendedProblems: mockProblems.slice(0, 3).map(p => ({
          problemId: p.id,
          title: p.title,
          difficulty: p.difficulty,
          reason: "Based on your current skill level",
          confidence: 0.8
        }))
      })
    }
    return this.request('/api/recommendations')
  }

  // Student dashboard endpoint
  async getStudentDashboard(studentId: string) {
    if (shouldUseMock('analytics')) {
      return Promise.resolve({
        student: {
          id: studentId,
          name: mockUser.name,
          email: mockUser.email,
          totalSubmissions: mockUserStats.totalSubmissions,
          accuracy: mockUserStats.successRate / 100
        },
        accuracyByLanguage: [
          { language: 'javascript', accuracy: 0.75 },
          { language: 'python', accuracy: 0.82 },
          { language: 'java', accuracy: 0.68 }
        ],
        accuracyByTopic: mockKnowledgeComponents.slice(0, 5).map(kc => ({
          topic: kc.name,
          accuracy: kc.mastery / 100
        })),
        errorDistribution: [
          { status: 'accepted', count: 45 },
          { status: 'wrong_answer', count: 12 },
          { status: 'time_limit_exceeded', count: 5 },
          { status: 'compile_error', count: 3 }
        ],
        kcMastery: mockKnowledgeComponents.map(kc => ({
          kc: kc.name,
          pKnown: kc.mastery / 100
        })),
        timeSpent: {
          totalSeconds: 7200,
          activeSeconds: 7200
        }
      })
    }
    return this.request(`/api/students/${studentId}/dashboard`)
  }

  // Instructor endpoints
  async getInstructorClasses() {
    return this.request('/api/instructor/classes')
  }

  async getClassDetails(classId: string) {
    return this.request(`/api/instructor/classes/${classId}`)
  }

  async getClassAnalytics(classId: string) {
    return this.request(`/api/instructor/classes/${classId}/analytics`)
  }

  async getStudents() {
    if (shouldUseMock('analytics')) {
      return Promise.resolve({ 
        students: [
          {
            id: '1',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            totalSubmissions: 45,
            acceptedSubmissions: 32,
            lastActive: new Date().toISOString()
          },
          {
            id: '2', 
            name: 'Bob Smith',
            email: 'bob@example.com',
            totalSubmissions: 38,
            acceptedSubmissions: 25,
            lastActive: new Date().toISOString()
          }
        ]
      })
    }
    return this.request('/api/instructor/students')
  }

  async createProblem(problemData: any) {
    return this.request('/api/problems', {
      method: 'POST',
      body: JSON.stringify(problemData),
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export default apiClient