// API client for backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
    return this.request(`/api/problems/${id}`)
  }

  // Code execution endpoints
  async runCode(problemId: string, code: string, language: string) {
    return this.request(`/api/problems/${problemId}/run`, {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    })
  }

  async submitCode(problemId: string, code: string, language: string) {
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

  // Analytics endpoints
  async getUserStats() {
    return this.request('/api/users/stats')
  }

  async getKnowledgeComponents() {
    return this.request('/api/users/knowledge-components')
  }

  async getAchievements() {
    return this.request('/api/users/achievements')
  }

  async getRecommendations() {
    return this.request('/api/recommendations')
  }

  // Instructor endpoints
  async getClassAnalytics() {
    return this.request('/api/instructor/class-analytics')
  }

  async getStudents() {
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