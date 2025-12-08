"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, BookOpen, TrendingUp, AlertCircle, Award, Clock, Brain, Target, PieChart } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ClassData {
  id: string
  name: string
  code: string
  semester: string
  _count: {
    enrollments: number
    problemSets: number
  }
}

interface ClassAnalytics {
  studentStats: Array<{
    studentId: string
    name: string
    email: string
    totalSubmissions: number
    acceptedSubmissions: number
    acceptanceRate: number
    avgMastery: number
    isAtRisk: boolean
  }>
  kcStats: Array<{
    kc: string
    avgMastery: number
    studentCount: number
  }>
  summary: {
    totalStudents: number
    totalSubmissions: number
    atRiskStudents: number
  }
}

export default function InstructorDashboardPage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<ClassData[]>([])
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  useEffect(() => {
    fetchClasses()
  }, [user])

  useEffect(() => {
    if (selectedClass) {
      fetchAnalytics(selectedClass)
    }
  }, [selectedClass])

  const fetchClasses = async () => {
    try {
      const data = await apiClient.getInstructorClasses()
      setClasses(data || [])
      if (data && data.length > 0) {
        setSelectedClass(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async (classId: string) => {
    setAnalyticsLoading(true)
    try {
      const data = await apiClient.getClassAnalytics(classId)
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["instructor"]}>
        <div className="min-h-screen bg-background">
          <DashboardNav />
          <main className="container py-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  const selectedClassData = classes.find(c => c.id === selectedClass)
  const totalStudents = classes.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0)

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-8">
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Instructor Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Welcome back, {user?.name || 'Instructor'}
              </p>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classes.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Current semester
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all classes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics ? `${Math.round((analytics.summary.totalSubmissions / (analytics.summary.totalStudents || 1)))}` : '--'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Submissions per student
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {analytics?.summary.atRiskStudents || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Need attention
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Class Tabs and Analytics */}
            {classes.length > 0 && (
              <Tabs value={selectedClass || undefined} onValueChange={setSelectedClass}>
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(classes.length, 4)}, 1fr)` }}>
                  {classes.map((cls) => (
                    <TabsTrigger key={cls.id} value={cls.id}>
                      {cls.code}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {classes.map((cls) => (
                  <TabsContent key={cls.id} value={cls.id} className="space-y-6">
                    {analyticsLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      </div>
                    ) : analytics ? (
                      <>
                        {/* Class Summary */}
                        <div className="grid gap-4 md:grid-cols-3">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Class Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Students:</span>
                                <span className="font-semibold">{analytics.summary.totalStudents}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Submissions:</span>
                                <span className="font-semibold">{analytics.summary.totalSubmissions}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Avg per Student:</span>
                                <span className="font-semibold">
                                  {Math.round(analytics.summary.totalSubmissions / (analytics.summary.totalStudents || 1))}
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base flex items-center gap-2">
                                <Brain className="h-4 w-4" />
                                Knowledge Mastery
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {analytics.kcStats.length > 0
                                  ? `${Math.round((analytics.kcStats.reduce((sum, kc) => sum + kc.avgMastery, 0) / analytics.kcStats.length) * 100)}%`
                                  : 'N/A'}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Average across all KCs
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Success Rate
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {analytics.studentStats.length > 0
                                  ? `${Math.round((analytics.studentStats.reduce((sum, s) => sum + s.acceptanceRate, 0) / analytics.studentStats.length) * 100)}%`
                                  : 'N/A'}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Average acceptance rate
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Knowledge Component Mastery */}
                        {analytics.kcStats.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <PieChart className="h-5 w-5" />
                                Knowledge Component Mastery
                              </CardTitle>
                              <CardDescription>
                                Class-wide understanding of different programming concepts
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {analytics.kcStats
                                  .sort((a, b) => b.avgMastery - a.avgMastery)
                                  .slice(0, 8)
                                  .map((kc, index) => (
                                    <div key={index} className="space-y-2">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{kc.kc}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-muted-foreground text-xs">
                                            {kc.studentCount} students
                                          </span>
                                          <span className="font-semibold">
                                            {Math.round(kc.avgMastery * 100)}%
                                          </span>
                                        </div>
                                      </div>
                                      <Progress value={kc.avgMastery * 100} className="h-2" />
                                    </div>
                                  ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* At-Risk Students */}
                        {analytics.studentStats.filter(s => s.isAtRisk).length > 0 && (
                          <Card className="border-destructive/50">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="h-5 w-5" />
                                Students Needing Attention
                              </CardTitle>
                              <CardDescription>
                                Students with low mastery scores and significant activity
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {analytics.studentStats
                                  .filter(s => s.isAtRisk)
                                  .map((student, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5">
                                      <div>
                                        <p className="font-medium">{student.name}</p>
                                        <p className="text-sm text-muted-foreground">{student.email}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-semibold text-destructive">
                                          {Math.round(student.avgMastery * 100)}% mastery
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {student.totalSubmissions} submissions
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Top Performers */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Award className="h-5 w-5 text-yellow-500" />
                              Top Performers
                            </CardTitle>
                            <CardDescription>
                              Students demonstrating strong understanding
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {analytics.studentStats
                                .sort((a, b) => b.avgMastery - a.avgMastery)
                                .slice(0, 5)
                                .map((student, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center">
                                        {index + 1}
                                      </Badge>
                                      <div>
                                        <p className="font-medium">{student.name}</p>
                                        <p className="text-sm text-muted-foreground">{student.email}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-green-600">
                                        {Math.round(student.avgMastery * 100)}% mastery
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {student.acceptedSubmissions}/{student.totalSubmissions} accepted
                                      </p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* AI Insights */}
                        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Brain className="h-5 w-5" />
                              AI-Generated Insights
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {analytics.summary.atRiskStudents > 0 && (
                              <div className="text-sm">
                                <p className="font-semibold">⚠️ Attention Needed:</p>
                                <p className="text-muted-foreground">
                                  {analytics.summary.atRiskStudents} student(s) showing low mastery despite multiple attempts. 
                                  Consider scheduling office hours or providing additional resources.
                                </p>
                              </div>
                            )}
                            {analytics.kcStats.filter(kc => kc.avgMastery < 0.5).length > 0 && (
                              <div className="text-sm">
                                <p className="font-semibold">📚 Difficult Topics:</p>
                                <p className="text-muted-foreground">
                                  The following concepts show class-wide difficulty: {' '}
                                  {analytics.kcStats
                                    .filter(kc => kc.avgMastery < 0.5)
                                    .map(kc => kc.kc)
                                    .join(', ')}
                                  . Consider dedicating extra lecture time to these areas.
                                </p>
                              </div>
                            )}
                            {analytics.summary.totalSubmissions / (analytics.summary.totalStudents || 1) > 10 && (
                              <div className="text-sm">
                                <p className="font-semibold">✅ High Engagement:</p>
                                <p className="text-muted-foreground">
                                  Students are highly engaged with an average of{' '}
                                  {Math.round(analytics.summary.totalSubmissions / (analytics.summary.totalStudents || 1))}{' '}
                                  submissions per student. Keep up the momentum!
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <p className="text-muted-foreground">No analytics data available yet</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}

            {/* Classes List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Classes</h2>
                <Link 
                  href="/classes/create" 
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Create Class
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classes.map((classData) => (
                  <Card key={classData.id} className="hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg">{classData.name}</span>
                        <BookOpen className="h-5 w-5 text-primary" />
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {classData.code} • {classData.semester}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Students</span>
                          </div>
                          <span className="font-semibold">{classData._count?.enrollments || 0}</span>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href={`/classes/${classData.id}`}
                            className="flex-1 inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            View Class
                          </Link>
                          <Link
                            href={`/classes/${classData.id}/students`}
                            className="flex-1 inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                          >
                            Students
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {classes.length === 0 && (
                  <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No classes yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create your first class to get started
                      </p>
                      <Link
                        href="/classes/create"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Create Class
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Quick Actions</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/problems/create">
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Award className="h-5 w-5 text-primary" />
                        Create Problem
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Add new coding problems for your students
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/metrics/instructor">
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        View Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Analyze student performance and progress
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/problems">
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Clock className="h-5 w-5 text-primary" />
                        Browse Problems
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        View all available coding problems
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
