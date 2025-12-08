"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, BookOpen, Calendar, ArrowLeft, Clock, User } from "lucide-react"
import { apiClient } from "@/lib/api"
import { AssignmentCreation } from "@/components/assignment-creation"
import Link from "next/link"

interface Student {
  id: string
  name: string
  email: string
}

interface Problem {
  id: string
  title: string
  difficulty: string
}

interface ProblemSet {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  createdAt: string
  problems: Array<{
    id: string
    problem: Problem
  }>
}

interface ClassDetail {
  id: string
  name: string
  description: string | null
  semester: string
  code: string
  createdAt: string
  enrollments: Array<{
    id: string
    enrolledAt: string
    student: Student
  }>
  problemSets: ProblemSet[]
}

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const classId = params.id as string
  
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClassDetail()
  }, [classId])

  const fetchClassDetail = async () => {
    setLoading(true)
    try {
      const data = await apiClient.getClassDetails(classId)
      setClassDetail(data)
    } catch (error) {
      console.error("Error fetching class detail:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      case "hard":
        return "bg-red-500/10 text-red-600 dark:text-red-400"
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400"
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

  if (!classDetail) {
    return (
      <ProtectedRoute allowedRoles={["instructor"]}>
        <div className="min-h-screen bg-background">
          <DashboardNav />
          <main className="container py-8">
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">Class not found</h3>
                  <Button onClick={() => router.push("/dashboard/instructor/classes")}>
                    Back to Classes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/instructor/classes">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {classDetail.name}
                </h1>
                {classDetail.description && (
                  <p className="text-muted-foreground mt-2">{classDetail.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {classDetail.semester}
                  </span>
                  <span>•</span>
                  <span>{classDetail.code}</span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classDetail.enrollments.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classDetail.problemSets.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Students and Assignments */}
            <Tabs defaultValue="assignments" className="space-y-6">
              <TabsList>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
              </TabsList>

              <TabsContent value="assignments" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Assignments</h2>
                  <AssignmentCreation classId={classId} onAssignmentCreated={fetchClassDetail} />
                </div>

                {classDetail.problemSets.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center space-y-4">
                        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
                        <div>
                          <h3 className="text-lg font-semibold">No assignments yet</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Create your first assignment to assign problems to students
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {classDetail.problemSets.map((assignment) => (
                      <Card key={assignment.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle>{assignment.title}</CardTitle>
                              {assignment.description && (
                                <CardDescription className="mt-1">
                                  {assignment.description}
                                </CardDescription>
                              )}
                            </div>
                            {assignment.dueDate && (
                              <Badge variant="outline" className="ml-4">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(assignment.dueDate)}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>{assignment.problems.length} problems</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Created {new Date(assignment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {assignment.problems.map((p) => (
                                <Badge
                                  key={p.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {p.problem.title}
                                  <span className={`ml-2 ${getDifficultyColor(p.problem.difficulty)}`}>
                                    {p.problem.difficulty}
                                  </span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="students" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Enrolled Students</h2>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Add Students
                  </Button>
                </div>

                {classDetail.enrollments.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center space-y-4">
                        <Users className="h-16 w-16 mx-auto text-muted-foreground/50" />
                        <div>
                          <h3 className="text-lg font-semibold">No students enrolled yet</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Add students to this class to track their progress
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {classDetail.enrollments.map((enrollment) => (
                      <Card key={enrollment.id}>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{enrollment.student.name}</CardTitle>
                              <CardDescription className="text-xs">
                                {enrollment.student.email}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xs text-muted-foreground">
                            Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
