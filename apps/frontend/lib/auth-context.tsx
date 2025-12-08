"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User } from "./types"
import { apiClient } from "./api"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, role: "student" | "instructor") => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for stored user on mount
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('educode_token')
      const storedUser = localStorage.getItem('educode_user')
      
      if (token && storedUser) {
        apiClient.setToken(token)
        // First restore from localStorage for immediate display
        setUser(JSON.parse(storedUser))
        
        // Then verify with backend
        try {
          const userData = await apiClient.getCurrentUser()
          setUser(userData.user)
          localStorage.setItem('educode_user', JSON.stringify(userData.user))
        } catch (verifyErr) {
          // If verification fails but we have stored user, keep it
          console.warn('Could not verify user with backend, using cached data')
        }
      }
    } catch (err) {
      // Token might be invalid, clear it
      localStorage.removeItem('educode_token')
      localStorage.removeItem('educode_user')
      apiClient.setToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setError(null)
    setIsLoading(true)
    
    try {
      const response = await apiClient.login(email, password)
      setUser(response.user)
      // Store user data in localStorage
      localStorage.setItem('educode_user', JSON.stringify(response.user))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string, role: "student" | "instructor") => {
    setError(null)
    setIsLoading(true)
    
    try {
      const response = await apiClient.register(email, password, name, role)
      setUser(response.user)
      // Store user data in localStorage
      localStorage.setItem('educode_user', JSON.stringify(response.user))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setError(null)
    
    try {
      await apiClient.logout()
    } catch (err) {
      // Even if logout fails on server, clear local state
      console.warn('Logout request failed:', err)
    } finally {
      setUser(null)
      localStorage.removeItem('educode_user')
      localStorage.removeItem('educode_token')
      apiClient.setToken(null)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        register, 
        logout, 
        isLoading, 
        error, 
        clearError 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
