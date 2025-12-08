"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import apiClient from "@/lib/api"
import { CodeEditor } from "@/components/code-editor"
import { ProtectedRoute } from "@/components/protected-route"

type SubmissionDetail = {
  id: string
  code: string
  language: string
  status: string
  testCasesPassed: number
  totalTestCases: number
  runtime: number | null
  memory: number | null
  submittedAt: string
  problem: {
    id: string
    title: string
    difficulty: string
    description: string
    inputFormat: string
    outputFormat: string
    constraints: string[]
    topics: string[]
    knowledgeComponents: string[]
    timeLimit: number
    memoryLimit: number
  } | null
  error: {
    compileOutput: string | null
    stderr: string | null
    createdAt: string
    language: string
    classification: {
      surface_error?: string | null
      specific_error?: string | null
      compiler_excerpt?: string | null
      cognitive_cause?: string | null
      bloom_level?: string | null
      reasoning?: string | null
      source?: string | null
      confidence?: number | null
    } | null
  } | null
}

export default function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const [id, setId] = useState<string | null>(null)
  const [data, setData] = useState<SubmissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState("")

  useEffect(() => {
    let mounted = true
    async function resolveParams() {
      const resolvedParams = await params
      if (mounted) {
        setId(resolvedParams.id)
      }
    }
    resolveParams()
    return () => {
      mounted = false
    }
  }, [params])

  useEffect(() => {
    if (!id) return
    
    let mounted = true
    async function load() {
      try {
        const res = await apiClient["request"](`/api/students/submissions/${id}/detail`)
        if (!mounted) return
        setData(res)
        setCode(res.code || "")
      } catch (e) {
        console.error("Failed to load submission:", e)
        if (mounted) {
          setError(e instanceof Error ? e.message : "Failed to load submission")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  if (loading) {
    return <div className="p-6">Loading…</div>
  }
  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 font-semibold mb-2">Error loading submission</div>
        <div className="text-sm text-gray-600">{error}</div>
        <Link href="/metrics/student" className="text-primary hover:underline mt-4 inline-block">
          ← Back to Metrics
        </Link>
      </div>
    )
  }
  if (!data) {
    return <div className="p-6">Not found</div>
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Submission Detail</h1>
          <Link href="/metrics/student" className="text-primary hover:underline">← Back to Metrics</Link>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Problem</h2>
              {data.problem && (
                <span className="text-xs px-2 py-1 rounded bg-muted">{data.problem.difficulty}</span>
              )}
            </div>
            {data.problem ? (
              <div className="space-y-3">
                <div className="text-xl font-medium">{data.problem.title}</div>
                <div>
                  <div className="font-semibold mb-1">Description</div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.problem.description}</p>
                </div>
                <div>
                  <div className="font-semibold mb-1">Input</div>
                  <pre className="p-3 rounded bg-muted text-sm whitespace-pre-wrap">{data.problem.inputFormat}</pre>
                </div>
                <div>
                  <div className="font-semibold mb-1">Output</div>
                  <pre className="p-3 rounded bg-muted text-sm whitespace-pre-wrap">{data.problem.outputFormat}</pre>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-muted/70">Time {data.problem.timeLimit}s</span>
                  <span className="px-2 py-1 rounded bg-muted/70">Memory {data.problem.memoryLimit}MB</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Problem metadata unavailable.</div>
            )}
          </div>

          <div className="border rounded-lg p-4 space-y-2">
            <h2 className="text-lg font-semibold">Error</h2>
            {data.error?.classification && (
              <div className="flex flex-wrap gap-2 text-xs">
                {data.error.classification.surface_error && (
                  <span className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                    {data.error.classification.surface_error}
                  </span>
                )}
                {data.error.classification.specific_error && (
                  <span className="px-2 py-1 rounded bg-muted">{data.error.classification.specific_error}</span>
                )}
                {data.error.classification.cognitive_cause && (
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                    {data.error.classification.cognitive_cause?.replace(/_/g, " ")}
                  </span>
                )}
                {data.error.classification.bloom_level && (
                  <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                    {data.error.classification.bloom_level}
                  </span>
                )}
                {data.error.classification.source && (
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300">
                    {data.error.classification.source}
                  </span>
                )}
              </div>
            )}

            {data.error?.classification?.compiler_excerpt && (
              <div>
                <div className="text-xs font-semibold mb-1">Compiler Excerpt</div>
                <pre className="p-3 rounded bg-muted text-xs whitespace-pre-wrap">{data.error.classification.compiler_excerpt}</pre>
              </div>
            )}
            {data.error?.stderr && (
              <div>
                <div className="text-xs font-semibold mb-1">stderr</div>
                <pre className="p-3 rounded bg-muted text-xs whitespace-pre-wrap">{data.error.stderr}</pre>
              </div>
            )}
            {data.error?.compileOutput && (
              <div>
                <div className="text-xs font-semibold mb-1">compileOutput</div>
                <pre className="p-3 rounded bg-muted text-xs whitespace-pre-wrap">{data.error.compileOutput}</pre>
              </div>
            )}
            {data.error?.classification?.reasoning && (
              <div>
                <div className="text-xs font-semibold mb-1">Reasoning</div>
                <p className="text-sm text-muted-foreground italic border-l-2 pl-3">{data.error.classification.reasoning}</p>
              </div>
            )}
          </div>
        </div>

        <div className="h-[70vh] border rounded-lg overflow-hidden">
          <CodeEditor value={code} onChange={setCode} language={data.language || "plaintext"} readOnly />
        </div>
      </div>
    </ProtectedRoute>
  )
}
