"use client"

import { useEffect, useState } from "react"
import React from "react"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/config"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { MyAssignments } from "@/components/my-assignments"
import { apiClient } from "@/lib/api"

type StudentResponse = {
  student: { id: string; name: string; email: string; totalSubmissions: number; accuracy: number }
  accuracyByLanguage: { language: string; accuracy: number }[]
  accuracyByTopic: { topic: string; accuracy: number }[]
  errorDistribution: { status: string; count: number }[]
  kcMastery: { kc: string; pKnown: number }[]
}

type ErrorAnalytics = {
  topErrors: { label: string; count: number }[]  // label is constructed by backend API
  recentErrors: {
    id: string
    submissionId: string
    // Academic framework fields (from database)
    surface_error?: string          // Lexical, Syntax, Semantic/Type, etc.
    specific_error?: string         // Detailed error description
    compiler_excerpt?: string       // Specific code/error excerpt
    cognitive_cause?: string        // MENTAL_TYPO, KNOWLEDGE_GAP, MISCONCEPTION, etc.
    bloom_level?: string            // Below Remember, Remember, Understand, Apply, Analyse, Evaluate, Create
    reasoning?: string              // Full AI explanation
    source?: string                 // rule-based | llm | llm-logic-error
    confidence?: number             // 0.0-1.0
    // Embedding fields
    embedding?: number[] | null
    embeddingLength?: number
    embeddingPreview?: number[] | null
    // Metadata
    problemTitle: string
    problemId: string
    language: string
    createdAt: string
    compileOutput: string | null
    stderr: string | null
  }[]
}

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const STUDENT_ID = user?.id || ''

  // Debug: Log the user ID to see what we're actually sending to the API
  useEffect(() => {
    console.log('🔍 StudentDashboardPage - User from AuthProvider:', user)
    console.log('🔍 StudentDashboardPage - STUDENT_ID being used:', STUDENT_ID)
  }, [user, STUDENT_ID])

  const [data, setData] = useState<StudentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Error analytics state (for charts only, not listing)
  const [errorData, setErrorData] = useState<ErrorAnalytics | null>(null)
  const [errorLoading, setErrorLoading] = useState(true)

  // Submissions modal state
  const [submissionsOpen, setSubmissionsOpen] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [subLoading, setSubLoading] = useState(false)
  const [subError, setSubError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const limit = 10
  const [total, setTotal] = useState(0)
  const [showAllKCs, setShowAllKCs] = useState(false)

  // Assignments state
  const [assignments, setAssignments] = useState<any[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    if (!STUDENT_ID) return () => { mounted = false }
    setLoading(true)
    const token = typeof window !== 'undefined' ? localStorage.getItem('educode_token') : null
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (token) headers.Authorization = `Bearer ${token}`

    const url = `${apiUrl}/api/students/${STUDENT_ID}/dashboard`
    console.log('🌐 Fetching dashboard data from:', url)
    console.log('📦 STUDENT_ID:', STUDENT_ID)

    fetch(url, { headers })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!mounted) return
        console.log('✅ Dashboard data received:', json)
        setData(json)
        setError(null)
      })
      .catch((e) => {
        if (!mounted) return
        console.error('❌ Dashboard fetch error:', e)
        setError(String(e))
        setData(null)
      })
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [STUDENT_ID])

  // Fetch error analytics
  useEffect(() => {
    let mounted = true
    if (!STUDENT_ID) return () => { mounted = false }
    setErrorLoading(true)
    const token = typeof window !== 'undefined' ? localStorage.getItem('educode_token') : null
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (token) headers.Authorization = `Bearer ${token}`

    fetch(`${apiUrl}/api/students/${STUDENT_ID}/errors?limit=10`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!mounted) return
        setErrorData(json)
      })
      .catch((e) => {
        if (!mounted) return
        console.error('Error fetching error analytics:', e)
        setErrorData(null)
      })
      .finally(() => mounted && setErrorLoading(false))

    return () => {
      mounted = false
    }
  }, [STUDENT_ID])

  // Fetch assignments from enrolled classes
  useEffect(() => {
    if (!STUDENT_ID) return
    
    setAssignmentsLoading(true)
    apiClient.getClasses()
      .then(async (classesData) => {
        const classes = classesData.classes || []
        const allAssignments = []
        
        for (const cls of classes) {
          try {
            const assignmentsData = await apiClient.getClassAssignments(cls.id)
            const problemSets = assignmentsData.problemSets || []
            
            for (const ps of problemSets) {
              // Get user's submissions to calculate completion
              const submissions = await apiClient.getSubmissions({ problemId: undefined })
              const userSubmissions = submissions.submissions || []
              
              const completedProblemIds = new Set(
                userSubmissions
                  .filter((sub: any) => sub.status === 'accepted')
                  .map((sub: any) => sub.problemId)
              )
              
              const assignmentProblems = ps.problems || []
              const completedProblems = assignmentProblems.filter((p: any) => 
                completedProblemIds.has(p.id)
              ).length

              allAssignments.push({
                id: ps.id,
                title: ps.title,
                className: cls.name,
                dueDate: ps.dueDate,
                totalProblems: assignmentProblems.length,
                completedProblems,
                problems: assignmentProblems
              })
            }
          } catch (error) {
            console.error(`Error fetching assignments for class ${cls.id}:`, error)
          }
        }
        
        setAssignments(allAssignments)
        setAssignmentsLoading(false)
      })
      .catch(error => {
        console.error('Error fetching assignments:', error)
        setAssignmentsLoading(false)
      })
  }, [STUDENT_ID])

  async function fetchSubmissions(pageToFetch = 1) {
    setSubLoading(true)
    setSubError(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('educode_token') : null
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(
        `${apiUrl}/api/students/${STUDENT_ID}/submissions?page=${pageToFetch}&limit=${limit}`,
        { headers }
      )

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`${res.status} ${txt}`)
      }

      const json = await res.json()
      setSubmissions(json.submissions || [])
      setPage(json.page || pageToFetch)
      setTotal(json.total || 0)
    } catch (e: any) {
      setSubError(String(e.message || e))
      setSubmissions([])
    } finally {
      setSubLoading(false)
    }
  }

  if (!STUDENT_ID || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { student, accuracyByLanguage, accuracyByTopic, errorDistribution, kcMastery } = data

  const timeSpent = (data as any).timeSpent || null

  function formatSeconds(sec: number | undefined | null) {
    if (!sec || sec <= 0) return "0s"
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = Math.floor(sec % 60)
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  // Normalize and deduplicate KC mastery entries to the canonical KC list
  const CANONICAL_KCS = [
    'arrays',
    'hash_maps',
    'two_pointers',
    'strings',
    'stacks',
    'trees',
    'dfs',
    'recursion',
    'math',
    'tree_traversal'
  ]

  const SYNONYM_MAP: Record<string, string> = {
    // maps common topic labels to canonical KC names
    'array': 'arrays',
    'arrays': 'arrays',
    'hash_table': 'hash_maps',
    'hash_tables': 'hash_maps',
    'hash_map': 'hash_maps',
    'hash_maps': 'hash_maps',
    'string': 'strings',
    'strings': 'strings',
    'two_pointers': 'two_pointers',
    'two pointers': 'two_pointers',
    'two-pointers': 'two_pointers',
    'in_place_algorithms': 'in_place_algorithms',
    'inplacealgorithms': 'in_place_algorithms'
  }

  function normalizeKey(s: string) {
    return (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, '')
      .replace(/[\s-]+/g, '_')
      .trim()
  }

  const dedupedKCMap: Record<string, number> = {}

  for (const entry of kcMastery) {
    const raw = entry.kc || ''
    const norm = normalizeKey(raw)

    // Resolve synonym -> canonical if available
    let canonical = SYNONYM_MAP[norm]

    // If not in synonyms, check canonical list by normalized comparison
    if (!canonical) {
      for (const c of CANONICAL_KCS) {
        if (normalizeKey(c) === norm) {
          canonical = c
          break
        }
      }
    }

    // If still not resolved, try some heuristics: pluralize/singularize
    if (!canonical) {
      const plural = norm.endsWith('s') ? norm : `${norm}s`
      if (CANONICAL_KCS.includes(plural)) canonical = plural
    }

    // Only include if it maps to a canonical KC (do not introduce new KCs)
    if (!canonical) continue

    dedupedKCMap[canonical] = Math.max(dedupedKCMap[canonical] || 0, entry.pKnown)
  }

  const dedupedKCs = Object.entries(dedupedKCMap).map(([kc, pKnown]) => ({ kc, pKnown }))

  // By default hide KCs with pKnown === 0 to avoid showing many empty/unused concepts.
  // Users can toggle to see the full canonical list.
  const displayedKCs = showAllKCs ? dedupedKCs : dedupedKCs.filter((k) => k.pKnown > 0)

  const masteredCount = dedupedKCs.filter((k) => k.pKnown > 0.8).length

  const pieColors = ["#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6"]
  const MASTERED_THRESHOLD = 0.8

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Student Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">Performance summary for {student.name}</p>
            </div>

          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="text-sm">Test User Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{student.name}</div>
                  <div className="text-xs text-muted-foreground">{student.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">ID</div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm break-all">{student.id}</code>
                    <button
                      className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20"
                      onClick={() => {
                        navigator.clipboard?.writeText(student.id)
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transform transition hover:-translate-y-1 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-sm">Overall Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(student.accuracy * 100).toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">Based on all submissions</p>
              </CardContent>
            </Card>

            <Card
              className="transform transition hover:-translate-y-1 hover:shadow-md cursor-pointer"
              onClick={() => {
                setSubmissionsOpen(true)
                fetchSubmissions(1)
              }}
            >
              <CardHeader>
                <CardTitle className="text-sm">Total Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{student.totalSubmissions}</div>
                <p className="text-xs text-muted-foreground">Submissions across all problems</p>
              </CardContent>
            </Card>

            <Card className="transform transition hover:-translate-y-1 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-sm">Concepts Mastered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{masteredCount}</div>
                <p className="text-xs text-muted-foreground">pKnown &gt; 0.8</p>
              </CardContent>
            </Card>

            <Card className="transform transition hover:-translate-y-1 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-sm">Time Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timeSpent ? formatSeconds(timeSpent.activeSeconds) : "0s"}</div>
                <p className="text-xs text-muted-foreground">Active time based on recent submissions</p>
              </CardContent>
            </Card>
          </div>

          {/* My Assignments Widget */}
          <MyAssignments assignments={assignments} loading={assignmentsLoading} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Accuracy by Language</CardTitle>
              </CardHeader>
              <CardContent className="h-72 flex items-center justify-center">
                {accuracyByLanguage.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (() => {
                  // Calculate submission counts per language
                  const langCounts: Record<string, number> = {}
                  data?.errorDistribution.forEach(() => {
                    // This is a simplified version - ideally get from backend
                  })
                  
                  return (
                    <ResponsiveContainer width="95%" height="95%">
                      <BarChart data={accuracyByLanguage} margin={{ top: 25, right: 15, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorLanguage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                        <XAxis 
                          dataKey="language" 
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          tickLine={{ stroke: '#E5E7EB' }}
                        />
                        <YAxis 
                          domain={[0, 1]} 
                          tickFormatter={(v) => `${Math.round((v as number) * 100)}%`}
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          tickLine={{ stroke: '#E5E7EB' }}
                        />
                        <Tooltip 
                          formatter={(v: any) => [`${Math.round((v as number) * 100)}%`, 'Accuracy']}
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '6px' }}
                        />
                        <Bar 
                          dataKey="accuracy" 
                          fill="url(#colorLanguage)" 
                          radius={[6, 6, 0, 0]}
                          label={{
                            position: 'top',
                            fontSize: 10,
                            fill: '#3B82F6',
                            formatter: (value: number) => {
                              const pct = Math.round(value * 100)
                              return pct >= 10 ? `${pct}%` : `${pct}%`
                            }
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accuracy by Topic</CardTitle>
              </CardHeader>
              <CardContent className="h-72 flex items-center justify-center">
                {accuracyByTopic.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <ResponsiveContainer width="95%" height="95%">
                    <BarChart data={accuracyByTopic} margin={{ top: 25, right: 15, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorTopic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                      <XAxis 
                        dataKey="topic" 
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        tickLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis 
                        domain={[0, 1]} 
                        tickFormatter={(v) => `${Math.round((v as number) * 100)}%`}
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        tickLine={{ stroke: '#E5E7EB' }}
                      />
                      <Tooltip 
                        formatter={(v: any) => [`${Math.round((v as number) * 100)}%`, 'Accuracy']}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '6px' }}
                      />
                      <Bar 
                        dataKey="accuracy" 
                        fill="url(#colorTopic)" 
                        radius={[6, 6, 0, 0]}
                        label={{
                          position: 'top',
                          fontSize: 10,
                          fill: '#8B5CF6',
                          formatter: (value: number) => {
                            const pct = Math.round(value * 100)
                            return pct >= 10 ? `${pct}%` : `${pct}%`
                          }
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Submission Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                {errorDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (() => {
                  const totalSubmissions = errorDistribution.reduce((sum, entry) => sum + entry.count, 0)
                  const pieColors = ["#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#EC4899"]
                  
                  return (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie 
                          data={errorDistribution} 
                          dataKey="count" 
                          nameKey="status" 
                          outerRadius={80} 
                          label={(entry: any) => `${entry.count} (${((entry.count / totalSubmissions) * 100).toFixed(1)}%)`}
                          labelLine={true}
                        >
                          {errorDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [`${value} (${((value / totalSubmissions) * 100).toFixed(1)}%)`, 'Count']}
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '6px' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry: any) => `${value}: ${entry.payload.count}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )
                })()}
              </CardContent>
            </Card>

            <Card>
        <CardHeader>
          <CardTitle>Top Error Types</CardTitle>
        </CardHeader>
              <CardContent className="h-72 flex items-center justify-center">
                {errorLoading ? (
                  <p className="text-sm text-muted-foreground">Loading error analytics...</p>
                ) : !errorData || errorData.topErrors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No errors recorded yet</p>
                ) : (() => {
                  const totalErrors = errorData.topErrors.reduce((sum, item) => sum + item.count, 0)
                  
                  // Extract surface error type and assign colors
                  const surfaceErrorColors: Record<string, string> = {
                    'Lexical': '#3B82F6',
                    'Syntax': '#8B5CF6', 
                    'Semantic': '#10B981',
                    'Functional': '#F59E0B',
                    'Logic': '#EF4444',
                    'Runtime': '#EC4899'
                  }
                  
                  const dataWithColors = errorData.topErrors.map(item => {
                    const surfaceType = item.label.split(':')[0] || item.label.split(' ')[0]
                    const color = surfaceErrorColors[surfaceType] || '#6B7280'
                    return { ...item, fill: color, surfaceType }
                  })
                  
                  return (
                    <ResponsiveContainer width="95%" height="95%">
                      <BarChart data={dataWithColors} margin={{ top: 25, right: 15, left: 5, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                        <XAxis 
                          dataKey="label" 
                          tick={false}
                          tickLine={false}
                          height={10}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          tickLine={{ stroke: '#E5E7EB' }}
                          width={35}
                        />
                        <Tooltip 
                          position={{ y: 0 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                                  <p className="font-medium text-sm mb-1">{data.label}</p>
                                  <p className="text-xs text-gray-600">
                                    {data.count} errors ({((data.count / totalErrors) * 100).toFixed(1)}%)
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                          cursor={{ fill: '#F3F4F6', opacity: 0.3 }}
                        />
                        <Bar 
                          dataKey="count" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={45}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Academic Error Analysis */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Surface Error Categories</CardTitle>
              </CardHeader>
              <CardContent className="h-72 flex items-center justify-center">
                {errorLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : !errorData || errorData.recentErrors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No errors recorded yet</p>
                ) : (() => {
                  const surfaceErrorCounts: Record<string, number> = {}
                  errorData.recentErrors.forEach(err => {
                    const surface = err.surface_error || 'Unknown'
                    surfaceErrorCounts[surface] = (surfaceErrorCounts[surface] || 0) + 1
                  })
                  const surfaceData = Object.entries(surfaceErrorCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                  
                  const totalSurfaceErrors = surfaceData.reduce((sum, item) => sum + item.count, 0)
                  
                  return (
                    <ResponsiveContainer width="95%" height="95%">
                      <BarChart data={surfaceData} margin={{ top: 25, right: 15, left: 5, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorSurface" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                        <XAxis 
                          dataKey="name" 
                          tick={false}
                          tickLine={false}
                          height={10}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          tickLine={{ stroke: '#E5E7EB' }}
                          width={35}
                        />
                        <Tooltip 
                          position={{ y: 0 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                                  <p className="font-medium text-sm mb-1">{data.name}</p>
                                  <p className="text-xs text-gray-600">
                                    {data.count} errors ({((data.count / totalSurfaceErrors) * 100).toFixed(1)}%)
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                          cursor={{ fill: '#F3F4F6', opacity: 0.3 }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="url(#colorSurface)" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={45}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cognitive Causes</CardTitle>
              </CardHeader>
              <CardContent className="h-72 flex items-center justify-center">
                {errorLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : !errorData || errorData.recentErrors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No errors recorded yet</p>
                ) : (() => {
                  const cognitiveCounts: Record<string, number> = {}
                  errorData.recentErrors.forEach(err => {
                    const cause = err.cognitive_cause || 'Unknown'
                    cognitiveCounts[cause] = (cognitiveCounts[cause] || 0) + 1
                  })
                  const cognitiveData = Object.entries(cognitiveCounts)
                    .map(([name, count]) => ({ name, count }))
                  
                  const totalCognitive = cognitiveData.reduce((sum, item) => sum + item.count, 0)
                  
                  const cognitiveColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#10B981']
                  
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 50, left: 0 }}>
                        <Pie 
                          data={cognitiveData} 
                          dataKey="count" 
                          nameKey="name" 
                          cx="50%"
                          cy="45%"
                          outerRadius={70}
                          innerRadius={35}
                          paddingAngle={2}
                          label={(entry: any) => `${entry.count}`}
                          labelLine={false}
                        >
                          {cognitiveData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={cognitiveColors[index % cognitiveColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [`${value} (${((value / totalCognitive) * 100).toFixed(1)}%)`, 'Count']} 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '6px' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={50}
                          formatter={(value) => value.replace(/_/g, ' ')}
                          wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bloom Taxonomy Levels</CardTitle>
              </CardHeader>
              <CardContent className="h-72 flex items-center justify-center">
                {errorLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : !errorData || errorData.recentErrors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No errors recorded yet</p>
                ) : (() => {
                  const bloomCounts: Record<string, number> = {}
                  errorData.recentErrors.forEach(err => {
                    const level = err.bloom_level || 'Unknown'
                    bloomCounts[level] = (bloomCounts[level] || 0) + 1
                  })
                  
                  // Order Bloom levels hierarchically
                  const bloomOrder = ['Below Remember', 'Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']
                  const bloomData = bloomOrder
                    .filter(level => bloomCounts[level])
                    .map(level => ({ level, count: bloomCounts[level] }))
                  
                  const totalBloom = bloomData.reduce((sum, item) => sum + item.count, 0)
                  
                  return (
                    <ResponsiveContainer width="95%" height="95%">
                      <BarChart data={bloomData} margin={{ top: 25, right: 15, left: 5, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorBloom" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                        <XAxis 
                          dataKey="level" 
                          tick={false}
                          tickLine={false}
                          height={10}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          tickLine={{ stroke: '#E5E7EB' }}
                          width={35}
                        />
                        <Tooltip 
                          position={{ y: 0 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                                  <p className="font-medium text-sm mb-1">{data.level}</p>
                                  <p className="text-xs text-gray-600">
                                    {data.count} errors ({((data.count / totalBloom) * 100).toFixed(1)}%)
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                          cursor={{ fill: '#F3F4F6', opacity: 0.3 }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="url(#colorBloom)" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={45}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                })()}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Knowledge Mastery</CardTitle>
                <div>
                  <button
                    className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"
                    onClick={() => setShowAllKCs((v) => !v)}
                  >
                    {showAllKCs ? "Show only >0%" : "Show all"}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />
                    <span>Mastered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-sm bg-gray-300" />
                    <span>Remaining</span>
                  </div>
                </div>

                {displayedKCs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  displayedKCs.map((kc) => (
                    <div key={kc.kc}>
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{kc.kc}</div>
                        <div className="text-sm text-muted-foreground">{Math.round(kc.pKnown * 100)}%</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${kc.pKnown >= MASTERED_THRESHOLD ? "bg-emerald-500" : "bg-primary"}`}
                          style={{ width: `${kc.pKnown * 100}%` }}
                          role="progressbar"
                          aria-valuenow={Math.round(kc.pKnown * 100)}
                          aria-label={`${kc.kc} mastery: ${Math.round(kc.pKnown * 100)}%`}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Submissions dialog */}
        <Dialog open={submissionsOpen} onOpenChange={(v) => { if (!v) { setSubmissionsOpen(false) } }}>
          <DialogContent className="max-w-4xl max-h-[80vh] w-full flex flex-col">
            <DialogHeader>
              <DialogTitle>Submissions</DialogTitle>
              <DialogDescription>Recent submissions by {student.name}</DialogDescription>
            </DialogHeader>

              <div className="mt-4 flex-1 overflow-auto">
                {subLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : subError ? (
                  <div className="text-sm text-destructive">{subError}</div>
                ) : submissions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No submissions found.</div>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full text-sm table-auto border-collapse">
                    <thead>
                      <tr className="text-left">
                        <th className="px-2 py-2">Problem</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">Lang</th>
                        <th className="px-2 py-2">Passed</th>
                        <th className="px-2 py-2">Runtime(s)</th>
                        <th className="px-2 py-2">Memory(KB)</th>
                        <th className="px-2 py-2">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                        {submissions.map((s) => (
                          <tr key={s.id} className="border-t align-top">
                            <td className="px-2 py-3 max-w-[180px] align-top">
                              <div className="truncate max-w-[180px]">{s.problemTitle || "-"}</div>
                            </td>
                            <td className="px-2 py-3 align-top"><div className="truncate max-w-[120px]">{s.status}</div></td>
                            <td className="px-2 py-3 align-top"><div className="truncate max-w-[80px]">{s.language}</div></td>
                            <td className="px-2 py-3 align-top">{s.testCasesPassed}/{s.totalTestCases}</td>
                            <td className="px-2 py-3 align-top">{s.runtime ?? "-"}</td>
                            <td className="px-2 py-3 align-top">{s.memory ?? "-"}</td>
                            <td className="px-2 py-3 align-top">{new Date(s.submittedAt).toLocaleString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded border bg-muted hover:bg-muted/80"
                  onClick={() => {
                    if (page > 1) {
                      fetchSubmissions(page - 1)
                    }
                  }}
                  disabled={page <= 1 || subLoading}
                >
                  Prev
                </button>
                <div className="text-sm text-muted-foreground">Page {page} — {total} total</div>
                <button
                  className="px-3 py-1 rounded border bg-muted hover:bg-muted/80"
                  onClick={() => {
                    const maxPage = Math.ceil(total / limit) || 1
                    if (page < maxPage) fetchSubmissions(page + 1)
                  }}
                  disabled={subLoading || page >= Math.ceil(total / limit)}
                >
                  Next
                </button>
              </div>
              <div>
                <DialogClose className="px-3 py-1 rounded bg-primary text-white">Close</DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
    </ProtectedRoute>
  )
}
