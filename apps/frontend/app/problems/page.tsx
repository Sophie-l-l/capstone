"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { ProblemsTable } from "@/components/problems-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockProblems } from "@/lib/mock-data"
import { BookOpen, Target, TrendingUp } from "lucide-react"

export default function ProblemsPage() {
  const easyCount = mockProblems.filter((p) => p.difficulty === "easy").length
  const mediumCount = mockProblems.filter((p) => p.difficulty === "medium").length
  const hardCount = mockProblems.filter((p) => p.difficulty === "hard").length

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Problem Set
              </h1>
              <p className="text-muted-foreground mt-2">Practice and improve your coding skills</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockProblems.length}</div>
                  <p className="text-xs text-muted-foreground">Available to solve</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">By Difficulty</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600 dark:text-green-400 font-medium">{easyCount} Easy</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">{mediumCount} Medium</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">{hardCount} Hard</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Acceptance</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(mockProblems.reduce((acc, p) => acc + p.acceptanceRate, 0) / mockProblems.length).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Across all problems</p>
                </CardContent>
              </Card>
            </div>

            <ProblemsTable problems={mockProblems} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
