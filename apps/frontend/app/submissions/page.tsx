"use client"

import { useEffect, useState } from "react"
import React from "react"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/config"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Simple client-side k-means for clustering
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
  const centroids: number[][] = []
  const used = new Set<number>()
  for (let i = 0; i < k; i++) {
    let idx = i % X.length
    let attempts = 0
    while (used.has(idx) && attempts < X.length) { idx = (idx + 1) % X.length; attempts++ }
    used.add(idx)
    centroids.push(X[idx].slice(0, dim))
  }

  let labels = new Array(X.length).fill(0)

  for (let iter = 0; iter < maxIters; iter++) {
    let changed = false
    for (let i = 0; i < X.length; i++) {
      let best = 0
      let bestD = euclideanSq(X[i], centroids[0])
      for (let c = 1; c < centroids.length; c++) {
        const d = euclideanSq(X[i], centroids[c])
        if (d < bestD) { bestD = d; best = c }
      }
      if (labels[i] !== best) { labels[i] = best; changed = true }
    }

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

type ErrorAnalytics = {
  topErrors: { label: string; count: number }[]
  recentErrors: {
    id: string
    surface_error: string | null
    specific_error: string | null
    compiler_excerpt: string | null
    cognitive_cause: string | null
    bloom_level: string | null
    reasoning: string | null
    source: string | null
    confidence: number | null
    embedding: number[] | null
    embeddingLength: number
    embeddingPreview: number[] | null
    problemTitle: string
    problemId: string
    submissionId: string
    language: string
    createdAt: string
    compileOutput: string | null
    stderr: string | null
  }[]
}

function SubmissionsPageContent() {
  const { user } = useAuth()
  const STUDENT_ID = user?.id || 'b14da653-74ea-40bd-a00e-6020ebe36b76'

  const [errorData, setErrorData] = useState<ErrorAnalytics | null>(null)
  const [errorLoading, setErrorLoading] = useState(true)
  const [showEmbeddingPreview, setShowEmbeddingPreview] = useState(false)
  const [clusterCount, setClusterCount] = useState(2)
  const [clusters, setClusters] = useState<Record<string, number>>({})
  
  // Pagination state for Recent Errors
  const [errorPage, setErrorPage] = useState(1)
  const errorsPerPage = 20

  useEffect(() => {
    const fetchErrorData = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/students/${STUDENT_ID}/errors?recentLimit=200`)
        if (!response.ok) {
          throw new Error('Failed to fetch error data')
        }
        const data = await response.json()
        setErrorData(data)
      } catch (err) {
        console.error('Error fetching error data:', err)
      } finally {
        setErrorLoading(false)
      }
    }

    fetchErrorData()
  }, [STUDENT_ID])

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Submission Errors</h1>
          <p className="text-muted-foreground mt-2">
            View and analyze all error submissions with academic error classification framework
          </p>
        </div>

        <div className="space-y-6">
          {/* Recent Errors Section */}
          {errorLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              </CardContent>
            </Card>
          ) : !errorData || errorData.recentErrors.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No error submissions found</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center justify-between w-full">
                  <CardTitle>Recent Errors ({errorData.recentErrors.length} total)</CardTitle>
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
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {errorData.recentErrors.slice((errorPage - 1) * errorsPerPage, errorPage * errorsPerPage).map((error: ErrorAnalytics['recentErrors'][number]) => {
                    const preview = error.embeddingPreview ?? (Array.isArray(error.embedding) ? (error.embedding as number[]).slice(0, 8) : null)
                    return (
                      <a href={`/metrics/submission/${error.submissionId}`} key={error.id} className="block border rounded-lg p-4 space-y-2 hover:bg-muted/40 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-destructive">{error.surface_error || "Unknown"}</span>
                              {error.specific_error && (
                                <span className="text-sm text-muted-foreground">→ {error.specific_error}</span>
                              )}
                              {error.cognitive_cause && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  {error.cognitive_cause.replace(/_/g, ' ')}
                                </span>
                              )}
                              {error.bloom_level && (
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                  {error.bloom_level}
                                </span>
                              )}
                              {error.source && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                  {error.source}
                                </span>
                              )}
                              {clusters[error.id] !== undefined && (
                                <span className="text-xs px-2 py-1 rounded bg-amber-200 text-amber-800">Cluster {clusters[error.id]}</span>
                              )}
                              {showEmbeddingPreview && error.embeddingLength ? (
                                <span className="text-xs px-2 py-1 rounded bg-muted/80">emb {error.embeddingLength}</span>
                              ) : null}
                            </div>
                            {error.compiler_excerpt && (
                              <div className="text-sm font-mono bg-muted/50 p-2 rounded mt-2">
                                {error.compiler_excerpt}
                              </div>
                            )}
                            {error.reasoning && (
                              <div className="text-sm text-muted-foreground italic mt-2 pl-2 border-l-2 border-muted">
                                {error.reasoning}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground mt-2">
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
                      </a>
                    )
                  })}
                </div>
                
                {/* Pagination Controls */}
                {errorData.recentErrors.length > errorsPerPage && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {((errorPage - 1) * errorsPerPage) + 1} to {Math.min(errorPage * errorsPerPage, errorData.recentErrors.length)} of {errorData.recentErrors.length} errors
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setErrorPage(p => Math.max(1, p - 1))}
                        disabled={errorPage === 1}
                        className="px-3 py-1 text-sm rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.ceil(errorData.recentErrors.length / errorsPerPage) }, (_, i) => i + 1)
                          .filter(page => {
                            const totalPages = Math.ceil(errorData.recentErrors.length / errorsPerPage)
                            return page === 1 || page === totalPages || Math.abs(page - errorPage) <= 1
                          })
                          .map((page, idx, arr) => (
                            <React.Fragment key={page}>
                              {idx > 0 && arr[idx - 1] !== page - 1 && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <button
                                onClick={() => setErrorPage(page)}
                                className={`px-3 py-1 text-sm rounded border ${
                                  errorPage === page ? 'bg-primary text-white' : 'hover:bg-muted'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          ))}
                      </div>
                      <button
                        onClick={() => setErrorPage(p => Math.min(Math.ceil(errorData.recentErrors.length / errorsPerPage), p + 1))}
                        disabled={errorPage === Math.ceil(errorData.recentErrors.length / errorsPerPage)}
                        className="px-3 py-1 text-sm rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SubmissionsPage() {
  return (
    <ProtectedRoute>
      <SubmissionsPageContent />
    </ProtectedRoute>
  )
}
