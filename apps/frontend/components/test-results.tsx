"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import type { Submission } from "@/lib/types"

interface TestResultsProps {
  submission: Submission | null
}

export function TestResults({ submission }: TestResultsProps) {
  if (!submission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Run your code to see test results</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: Submission["status"]) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "wrong_answer":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "time_limit_exceeded":
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-orange-600" />
    }
  }

  const getStatusText = (status: Submission["status"]) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getStatusVariant = (status: Submission["status"]): "default" | "secondary" | "destructive" => {
    if (status === "accepted") return "default"
    if (status === "wrong_answer") return "destructive"
    return "secondary"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Test Results</CardTitle>
          <Badge variant={getStatusVariant(submission.status)}>{getStatusText(submission.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {getStatusIcon(submission.status)}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Test Cases</span>
              <span className="text-sm text-muted-foreground">
                {submission.testCasesPassed}/{submission.totalTestCases} passed
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  submission.status === "accepted" ? "bg-green-600" : "bg-red-600"
                }`}
                style={{ width: `${(submission.testCasesPassed / submission.totalTestCases) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {submission.runtime && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm font-medium">Runtime</span>
            <span className="text-sm">{submission.runtime.toFixed(3)}s</span>
          </div>
        )}

        {submission.memory && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm font-medium">Memory</span>
            <span className="text-sm">{(submission.memory / 1024).toFixed(2)} MB</span>
          </div>
        )}

        {submission.status === "accepted" && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              Congratulations! Your solution passed all test cases.
            </p>
          </div>
        )}

        {submission.status === "wrong_answer" && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Your solution failed some test cases. Review the problem requirements and try again.
            </p>
          </div>
        )}

        {submission.compileOutput && (
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
              Compilation Output:
            </p>
            <pre className="text-xs text-orange-600 dark:text-orange-300 whitespace-pre-wrap font-mono bg-orange-500/5 p-2 rounded">
              {submission.compileOutput}
            </pre>
          </div>
        )}

        {submission.stderr && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
              Runtime Error:
            </p>
            <pre className="text-xs text-red-600 dark:text-red-300 whitespace-pre-wrap font-mono bg-red-500/5 p-2 rounded">
              {submission.stderr}
            </pre>
          </div>
        )}

        {submission.error && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                AI Error Analysis
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-medium text-blue-700 dark:text-blue-300 min-w-[120px]">Error Type:</span>
                <span className="text-blue-600 dark:text-blue-400">{submission.error.surfaceError}</span>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="font-medium text-blue-700 dark:text-blue-300 min-w-[120px]">Likely Cause:</span>
                <span className="text-blue-600 dark:text-blue-400">{submission.error.cognitiveCause}</span>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="font-medium text-blue-700 dark:text-blue-300 min-w-[120px]">Skill Level:</span>
                <span className="text-blue-600 dark:text-blue-400">{submission.error.bloomLevel}</span>
              </div>
              
              {submission.error.suggestion && (
                <div className="mt-3 pt-3 border-t border-blue-500/20">
                  <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">💡 Suggestion:</p>
                  <p className="text-blue-600 dark:text-blue-400 leading-relaxed">
                    {submission.error.suggestion}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
