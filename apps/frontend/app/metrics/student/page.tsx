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

// Simple client-side k-means for small demos: returns label per row
function euclideanSq(a: number[], b: number[]) {
  let s = 0
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] || 0) - (b[i] || 0)
    s += d * d
  }
  return s
}

function kmeans(X: number[][], k: number, maxIters = 10): number[] {
  if (X.length === 0) return []
  const dim = X[0].length
  // initialize centroids as first k distinct points (or random fallback)
  const centroids: number[][] = []
  const used = new Set<number>()
  for (let i = 0; i < k; i++) {
    let idx = i % X.length
    // try to find a distinct point
    let attempts = 0
    while (used.has(idx) && attempts < X.length) { idx = (idx + 1) % X.length; attempts++ }
    used.add(idx)
    centroids.push(X[idx].slice(0, dim))
  }

  let labels = new Array(X.length).fill(0)

  for (let iter = 0; iter < maxIters; iter++) {
    let changed = false
    // assign
    for (let i = 0; i < X.length; i++) {
      let best = 0
      let bestD = euclideanSq(X[i], centroids[0])
      for (let c = 1; c < centroids.length; c++) {
        const d = euclideanSq(X[i], centroids[c])
        if (d < bestD) { bestD = d; best = c }
      }
      if (labels[i] !== best) { labels[i] = best; changed = true }
    }

    // recompute centroids
    const sums = Array.from({ length: k }, () => new Array(dim).fill(0))
    const counts = new Array(k).fill(0)
    for (let i = 0; i < X.length; i++) {
      const l = labels[i]
      counts[l]++
      for (let d = 0; d < dim; d++) sums[l][d] += X[i][d] || 0
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue
      for (let d = 0; d < dim; d++) centroids[c][d] = sums[c][d] / counts[c]
    }

    if (!changed) break
  }

  return labels
}

type StudentResponse = {
  student: { id: string; name: string; email: string; totalSubmissions: number; accuracy: number }
  accuracyByLanguage: { language: string; accuracy: number }[]
  accuracyByTopic: { topic: string; accuracy: number }[]
  errorDistribution: { status: string; count: number }[]
  kcMastery: { kc: string; pKnown: number }[]
}

type ErrorAnalytics = {
  topErrors: { label: string; count: number }[]
  recentErrors: {
    id: string
    label: string
    confidence: number
    embedding?: number[] | null
    embeddingLength?: number
    embeddingPreview?: number[] | null
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
  
  // Error analytics state
  const [errorData, setErrorData] = useState<ErrorAnalytics | null>(null)
  const [errorLoading, setErrorLoading] = useState(true)
  const [showEmbeddingPreview, setShowEmbeddingPreview] = useState(false)
  const [clusterCount, setClusterCount] = useState(2)
  const [clusters, setClusters] = useState<Record<string, number>>({})

  // Submissions modal state
  const [submissionsOpen, setSubmissionsOpen] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [subLoading, setSubLoading] = useState(false)
  const [subError, setSubError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const limit = 10
  const [total, setTotal] = useState(0)
  const [showAllKCs, setShowAllKCs] = useState(false)

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

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Accuracy by Language</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {accuracyByLanguage.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accuracyByLanguage} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="language" />
                      <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round((v as number) * 100)}%`} />
                      <Tooltip formatter={(v: any) => `${Math.round((v as number) * 100)}%`} />
                      <Bar dataKey="accuracy" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accuracy by Topic</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {accuracyByTopic.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accuracyByTopic} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="topic" />
                      <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round((v as number) * 100)}%`} />
                      <Tooltip formatter={(v: any) => `${Math.round((v as number) * 100)}%`} />
                      <Bar dataKey="accuracy" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Error Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                {errorDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={errorDistribution} dataKey="count" nameKey="status" outerRadius={80} fill="#8884d8">
                        {errorDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
        <CardHeader>
          <CardTitle>Top Error Types</CardTitle>
        </CardHeader>
              <CardContent className="h-64">
                {errorLoading ? (
                  <p className="text-sm text-muted-foreground">Loading error analytics...</p>
                ) : !errorData || errorData.topErrors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No errors recorded yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={errorData.topErrors} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="label" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
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

          <Card>
            <CardHeader>
              <CardTitle>Strengths & Weaknesses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium">Strengths</h3>
                  <ul className="mt-2 space-y-1">
                    {dedupedKCs.filter((k) => k.pKnown >= 0.7).length === 0 && (
                      <li className="text-sm text-muted-foreground">No strong concepts yet</li>
                    )}
                    {dedupedKCs
                      .filter((k) => k.pKnown >= 0.7)
                      .map((k) => (
                        <li key={k.kc} className="text-sm">
                          {k.kc} — {Math.round(k.pKnown * 100)}%
                        </li>
                      ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Weaknesses</h3>
                  <ul className="mt-2 space-y-1">
                    {dedupedKCs.filter((k) => k.pKnown < 0.4).length === 0 && (
                      <li className="text-sm text-muted-foreground">No major weaknesses</li>
                    )}
                    {dedupedKCs
                      .filter((k) => k.pKnown < 0.4)
                      .map((k) => (
                        <li key={k.kc} className="text-sm">
                          {k.kc} — {Math.round(k.pKnown * 100)}%
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Errors Section */}
          {!errorLoading && errorData && errorData.recentErrors.length > 0 && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Recent Errors</CardTitle>
                <div className="flex items-center gap-3">
                  <label className="text-xs flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showEmbeddingPreview}
                      onChange={(e) => setShowEmbeddingPreview(e.target.checked)}
                    />
                    <span>Show embeddings</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={clusterCount}
                      onChange={(e) => setClusterCount(Math.max(1, Math.min(10, Number(e.target.value || 2))))}
                      className="w-16 text-sm px-2 py-1 rounded border"
                      aria-label="cluster-count"
                    />
                    <button
                      className="px-2 py-1 text-xs rounded bg-primary text-white"
                      onClick={() => {
                        const items = (errorData.recentErrors || []).filter((r) => Array.isArray(r.embedding) && (r.embedding as number[]).length > 0)
                        if (items.length === 0) return
                        const X = items.map((r) => (r.embedding as number[]))
                        const labels = kmeans(X, clusterCount, 10)
                        const map: Record<string, number> = {}
                        items.forEach((it, idx) => { map[it.id] = labels[idx] })
                        setClusters(map)
                      }}
                    >
                      Cluster
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {errorData.recentErrors.map((error: ErrorAnalytics['recentErrors'][number]) => {
                    const preview = error.embeddingPreview ?? (Array.isArray(error.embedding) ? (error.embedding as number[]).slice(0, 8) : null)
                    return (
                      <div key={error.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-destructive">{error.label}</span>
                              <span className="text-xs px-2 py-1 bg-muted rounded">{Math.round(error.confidence * 100)}% confidence</span>
                              {clusters[error.id] !== undefined && (
                                <span className="text-xs px-2 py-1 rounded bg-amber-200 text-amber-800">Cluster {clusters[error.id]}</span>
                              )}
                              {showEmbeddingPreview && error.embeddingLength ? (
                                <span className="text-xs px-2 py-1 rounded bg-muted/80">emb {error.embeddingLength}</span>
                              ) : null}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Problem: <span className="font-medium">{error.problemTitle}</span> ({error.language})
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(error.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {(error.compileOutput || error.stderr) && (
                          <div className="mt-2 p-3 bg-muted/50 rounded text-xs font-mono overflow-x-auto">
                            <pre className="whitespace-pre-wrap">{error.compileOutput || error.stderr}</pre>
                          </div>
                        )}

                        {showEmbeddingPreview && preview && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <div className="font-medium">Embedding preview (first {preview.length} dims)</div>
                            <div className="mt-1 font-mono text-[11px] bg-slate-50 p-2 rounded overflow-x-auto">[{preview.map((v) => (v as number).toFixed(4)).join(', ')}{error.embeddingLength && error.embeddingLength > preview.length ? ', ...' : ''}]</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
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
