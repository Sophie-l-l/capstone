"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { SkillMasteryChart } from "@/components/skill-mastery-chart"
import { RecentSubmissions } from "@/components/recent-submissions"
import { RecommendedProblems } from "@/components/recommended-problems"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockKnowledgeComponents, mockSubmissions, mockProblems, mockUserStats } from "@/lib/mock-data"
import { Trophy, Target, Flame, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const stats = mockUserStats

  useEffect(() => {
    if (user?.role === "instructor") {
      router.push("/dashboard/instructor")
    }
  }, [user, router])

  if (user?.role === "instructor") {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <DashboardNav />
          <main className="container py-8">
            <p>Redirecting...</p>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome Back!
              </h1>
              <p className="text-muted-foreground mt-2">Track your progress and continue learning</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Problems Solved</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.problemsSolved}</div>
                  <p className="text-xs text-muted-foreground">{stats.totalProblems} total problems</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.successRate}%</div>
                  <p className="text-xs text-muted-foreground">Across all submissions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.currentStreak} days</div>
                  <p className="text-xs text-muted-foreground">Longest: {stats.longestStreak} days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Class Rank</CardTitle>
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">#{stats.rank}</div>
                  <p className="text-xs text-muted-foreground">Out of {stats.totalStudents} students</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <SkillMasteryChart skills={mockKnowledgeComponents} />
              <RecommendedProblems problems={mockProblems} />
            </div>

            <RecentSubmissions submissions={mockSubmissions} problems={mockProblems} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
