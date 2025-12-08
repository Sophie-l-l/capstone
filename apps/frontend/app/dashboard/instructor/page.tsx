"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, BookOpen, TrendingUp, AlertCircle, Brain, Target, BarChart3 } from "lucide-react"
import { apiClient } from "@/lib/api"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts"

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

interface StudentStats {
  studentId: string
  name: string
  email: string
  totalSubmissions: number
  acceptedSubmissions: number
  acceptanceRate: number
  avgMastery: number
  isAtRisk: boolean
}

interface KCStats {
  kc: string
  avgMastery: number
  studentCount: number
}

interface ClassAnalytics {
  studentStats: StudentStats[]
  kcStats: KCStats[]
  summary: {
    totalStudents: number
    totalSubmissions: number
    atRiskStudents: number
  }
}

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6366F1']

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
      console.log('[Instructor Dashboard] Fetching classes...')
      const data = await apiClient.getInstructorClasses()
      console.log('[Instructor Dashboard] Classes received:', data)
      setClasses(data || [])
      if (data && data.length > 0) {
        setSelectedClass(data[0].id)
      }
    } catch (error) {
      console.error('[Instructor Dashboard] Error fetching classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async (classId: string) => {
    setAnalyticsLoading(true)
    try {
      console.log('[Instructor Dashboard] Fetching analytics for class:', classId)
      const data = await apiClient.getClassAnalytics(classId)
      console.log('[Instructor Dashboard] Analytics received:', data)
      setAnalytics(data)
    } catch (error) {
      console.error('[Instructor Dashboard] Error fetching analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Performance clustering
  const performanceClusters = analytics ? [
    {
      name: 'High Performers',
      count: analytics.studentStats.filter(s => s.acceptanceRate >= 0.7 && s.avgMastery >= 0.6).length,
      color: '#10B981',
      criteria: '≥70% acceptance, ≥60% mastery'
    },
    {
      name: 'Average Performers',
      count: analytics.studentStats.filter(s => s.acceptanceRate >= 0.4 && s.acceptanceRate < 0.7).length,
      color: '#F59E0B',
      criteria: '40-70% acceptance'
    },
    {
      name: 'Struggling Students',
      count: analytics.studentStats.filter(s => s.acceptanceRate < 0.4 || s.avgMastery < 0.4).length,
      color: '#EF4444',
      criteria: '<40% acceptance or mastery'
    }
  ] : []

  // Submission distribution
  const submissionDistribution = analytics ? analytics.studentStats.map(s => ({
    name: s.name.split(' ')[0],
    submissions: s.totalSubmissions,
    accepted: s.acceptedSubmissions,
    rate: Math.round(s.acceptanceRate * 100)
  })).sort((a, b) => b.submissions - a.submissions) : []

  // KC mastery distribution
  const kcMasteryData = analytics ? analytics.kcStats
    .map(kc => ({
      kc: kc.kc,
      mastery: Math.round(kc.avgMastery * 100),
      students: kc.studentCount
    }))
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 10) : []

  // Performance scatter (submissions vs acceptance rate)
  const performanceScatter = analytics ? analytics.studentStats.map(s => ({
    name: s.name,
    submissions: s.totalSubmissions,
    acceptance: Math.round(s.acceptanceRate * 100),
    mastery: Math.round(s.avgMastery * 100)
  })) : []

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
  const classAvgAcceptance = analytics?.studentStats.length
    ? Math.round((analytics.studentStats.reduce((sum, s) => sum + s.acceptanceRate, 0) / analytics.studentStats.length) * 100)
    : 0

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Class Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive insights and performance clustering
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
                <p className="text-xs text-muted-foreground">Current semester</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.summary.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">In selected class</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.summary.totalSubmissions || 0}</div>
                <p className="text-xs text-muted-foreground">Class average: {classAvgAcceptance}%</p>
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
                <p className="text-xs text-muted-foreground">Need intervention</p>
              </CardContent>
            </Card>
          </div>

          {/* Class Selection */}
          {classes.length > 0 && (
            <Tabs value={selectedClass || undefined} onValueChange={setSelectedClass}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(classes.length, 4)}, 1fr)` }}>
                {classes.map((cls) => (
                  <TabsTrigger key={cls.id} value={cls.id}>
                    {cls.code} ({cls._count.enrollments})
                  </TabsTrigger>
                ))}
              </TabsList>

              {classes.map((cls) => (
                <TabsContent key={cls.id} value={cls.id} className="space-y-6 mt-6">
                  {analyticsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    </div>
                  ) : !analytics ? (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">No analytics data available</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Performance Clustering */}
                      <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Target className="h-5 w-5" />
                              Performance Clusters
                            </CardTitle>
                            <CardDescription>Student distribution by performance level</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {performanceClusters.map((cluster, idx) => (
                                <div key={idx} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cluster.color }} />
                                      <span className="font-medium">{cluster.name}</span>
                                    </div>
                                    <Badge variant="outline">{cluster.count} students</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground ml-5">{cluster.criteria}</p>
                                  <Progress 
                                    value={(cluster.count / (analytics.summary.totalStudents || 1)) * 100} 
                                    className="h-2"
                                  />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BarChart3 className="h-5 w-5" />
                              Cluster Distribution
                            </CardTitle>
                            <CardDescription>Visual breakdown of performance tiers</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                              <PieChart>
                                <Pie
                                  data={performanceClusters}
                                  cx="50%"
                                  cy="45%"
                                  labelLine={{ 
                                    stroke: '#888', 
                                    strokeWidth: 1,
                                    length: 20,
                                    type: 'polyline'
                                  }}
                                  label={(entry) => {
                                    const total = performanceClusters.reduce((sum, item) => sum + item.count, 0)
                                    const percent = ((entry.count / total) * 100).toFixed(0)
                                    return `${percent}%`
                                  }}
                                  outerRadius={70}
                                  fill="#8884d8"
                                  dataKey="count"
                                  minAngle={20}
                                >
                                  {performanceClusters.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value, name, props) => [`${value} students`, props.payload.name]}
                                />
                                <Legend 
                                  verticalAlign="bottom" 
                                  height={45}
                                  wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
                                  formatter={(value, entry: any) => `${value}: ${entry.payload.count}`}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Student Submissions Analysis */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Student Activity & Success Rate</CardTitle>
                          <CardDescription>Submission volume and acceptance rates per student</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={submissionDistribution}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis yAxisId="left" />
                              <YAxis yAxisId="right" orientation="right" />
                              <Tooltip />
                              <Legend />
                              <Bar yAxisId="left" dataKey="submissions" fill="#8B5CF6" name="Total Submissions" />
                              <Bar yAxisId="left" dataKey="accepted" fill="#10B981" name="Accepted" />
                              <Bar yAxisId="right" dataKey="rate" fill="#F59E0B" name="Acceptance %" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Performance Scatter Plot */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Performance Correlation</CardTitle>
                          <CardDescription>Submissions vs Acceptance Rate (bubble size = mastery)</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" dataKey="submissions" name="Submissions" />
                              <YAxis type="number" dataKey="acceptance" name="Acceptance %" />
                              <ZAxis type="number" dataKey="mastery" range={[100, 1000]} />
                              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                              <Scatter name="Students" data={performanceScatter} fill="#8B5CF6" />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Knowledge Component Mastery */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            Knowledge Component Mastery
                          </CardTitle>
                          <CardDescription>Average class mastery across topics (weakest first)</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={kcMasteryData} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" domain={[0, 100]} />
                              <YAxis dataKey="kc" type="category" width={120} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="mastery" fill="#8B5CF6" name="Avg Mastery %" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Student Details Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Detailed Student Performance</CardTitle>
                          <CardDescription>Individual metrics and status</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2">Student</th>
                                  <th className="text-right p-2">Submissions</th>
                                  <th className="text-right p-2">Accepted</th>
                                  <th className="text-right p-2">Rate</th>
                                  <th className="text-right p-2">Avg Mastery</th>
                                  <th className="text-center p-2">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {analytics.studentStats
                                  .sort((a, b) => b.totalSubmissions - a.totalSubmissions)
                                  .map((student) => (
                                    <tr key={student.studentId} className="border-b hover:bg-muted/50">
                                      <td className="p-2">
                                        <div>
                                          <div className="font-medium">{student.name}</div>
                                          <div className="text-xs text-muted-foreground">{student.email}</div>
                                        </div>
                                      </td>
                                      <td className="text-right p-2">{student.totalSubmissions}</td>
                                      <td className="text-right p-2">{student.acceptedSubmissions}</td>
                                      <td className="text-right p-2">{Math.round(student.acceptanceRate * 100)}%</td>
                                      <td className="text-right p-2">{Math.round(student.avgMastery * 100)}%</td>
                                      <td className="text-center p-2">
                                        {student.isAtRisk ? (
                                          <Badge variant="destructive">At Risk</Badge>
                                        ) : student.acceptanceRate >= 0.7 ? (
                                          <Badge variant="default">Excelling</Badge>
                                        ) : (
                                          <Badge variant="secondary">On Track</Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>

                      {/* AI Insights */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            AI-Generated Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {analytics.summary.atRiskStudents > 0 && (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                              <p className="text-sm">
                                <strong>⚠️ Attention Needed:</strong> {analytics.summary.atRiskStudents} student(s) showing signs of struggle 
                                (low acceptance rate or mastery). Consider scheduling one-on-one sessions.
                              </p>
                            </div>
                          )}
                          
                          {kcMasteryData.length > 0 && kcMasteryData[0].mastery < 30 && (
                            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                              <p className="text-sm">
                                <strong>📚 Topic Focus:</strong> The class is struggling with "{kcMasteryData[0].kc}" 
                                (avg {kcMasteryData[0].mastery}% mastery). Consider dedicating more time to this topic.
                              </p>
                            </div>
                          )}

                          {classAvgAcceptance >= 70 && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                              <p className="text-sm">
                                <strong>🎉 Great Work:</strong> Class average acceptance rate is {classAvgAcceptance}%! 
                                Students are performing well overall.
                              </p>
                            </div>
                          )}

                          {analytics.summary.totalSubmissions / (analytics.summary.totalStudents || 1) > 50 && (
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <p className="text-sm">
                                <strong>💪 High Engagement:</strong> Students are very active with an average of{' '}
                                {Math.round(analytics.summary.totalSubmissions / (analytics.summary.totalStudents || 1))} submissions per student!
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}

          {classes.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No classes found. Create a class to get started.</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
