"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { ClassPerformanceChart } from "@/components/class-performance-chart"
import { AtRiskStudents } from "@/components/at-risk-students"
import { StudentProgressTable } from "@/components/student-progress-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockClassAnalytics, mockStudentProgress } from "@/lib/mock-data"
import { Users, TrendingUp, AlertTriangle, Activity, Target } from "lucide-react"

export default function InstructorDashboardPage() {
  const analytics = mockClassAnalytics

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Instructor Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">Monitor class performance and student progress</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">{analytics.activeStudents} active this week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.averageSuccessRate}%</div>
                  <p className="text-xs text-muted-foreground">Across all students</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.atRiskStudents}</div>
                  <p className="text-xs text-muted-foreground">Need additional support</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalSubmissions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">This semester</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ClassPerformanceChart data={analytics.weeklyActivity} />

              <Card>
                <CardHeader>
                  <CardTitle>Problem Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Easy Problems</span>
                      </div>
                      <span className="text-sm font-bold">{analytics.problemDistribution.easy}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-green-600"
                        style={{ width: `${analytics.problemDistribution.easy}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">Medium Problems</span>
                      </div>
                      <span className="text-sm font-bold">{analytics.problemDistribution.medium}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-yellow-600"
                        style={{ width: `${analytics.problemDistribution.medium}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">Hard Problems</span>
                      </div>
                      <span className="text-sm font-bold">{analytics.problemDistribution.hard}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-red-600"
                        style={{ width: `${analytics.problemDistribution.hard}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Avg problems per student</span>
                      <span className="font-bold">{analytics.averageProblemsPerStudent}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <AtRiskStudents students={mockStudentProgress} />

            <Card>
              <CardHeader>
                <CardTitle>Student Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <StudentProgressTable students={mockStudentProgress} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
