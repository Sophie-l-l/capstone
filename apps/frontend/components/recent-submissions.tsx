"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Submission, Problem } from "@/lib/types"
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface RecentSubmissionsProps {
  submissions: Submission[]
  problems: Problem[]
}

export function RecentSubmissions({ submissions, problems }: RecentSubmissionsProps) {
  const getStatusIcon = (status: Submission["status"]) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "wrong_answer":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "time_limit_exceeded":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-orange-600" />
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
        <CardTitle>Recent Submissions</CardTitle>
        <CardDescription>Your latest problem attempts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {submissions.map((submission) => {
            const problem = problems.find((p) => p.id === submission.problemId)
            return (
              <div
                key={submission.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="mt-1">{getStatusIcon(submission.status)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{problem?.title || "Unknown Problem"}</h4>
                    <Badge variant={getStatusVariant(submission.status)}>{getStatusText(submission.status)}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{submission.language}</span>
                    <span>
                      {submission.testCasesPassed}/{submission.totalTestCases} tests passed
                    </span>
                    {submission.runtime && <span>{submission.runtime}s</span>}
                    <span>{formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
