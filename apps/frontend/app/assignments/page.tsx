"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Calendar, CheckCircle2, Circle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api"

interface Assignment {
  id: string
  title: string
  className: string
  classId: string
  dueDate: string | null
  totalProblems: number
  completedProblems: number
  problems: Array<{
    id: string
    title: string
    difficulty: string
  }>
}

export default function AssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch all assignments from enrolled classes
    apiClient.getClasses()
      .then(async (classesData) => {
        const classes = classesData.classes || []
        const allAssignments: Assignment[] = []
        
        for (const cls of classes) {
          try {
            const assignmentsData = await apiClient.getClassAssignments(cls.id)
            const problemSets = assignmentsData.problemSets || []
            
            for (const ps of problemSets) {
              // Get user's submissions to calculate completion
              const submissions = await apiClient.getSubmissions({ problemId: undefined })
              const userSubmissions = submissions.submissions || []
              
              const completedProblemIds = new Set(
                userSubmissions
                  .filter((sub: any) => sub.status === 'accepted')
                  .map((sub: any) => sub.problemId)
              )
              
              const assignmentProblems = ps.problems || []
              const completedProblems = assignmentProblems.filter((p: any) => 
                completedProblemIds.has(p.id)
              ).length

              allAssignments.push({
                id: ps.id,
                title: ps.title,
                className: cls.name,
                classId: cls.id,
                dueDate: ps.dueDate,
                totalProblems: assignmentProblems.length,
                completedProblems,
                problems: assignmentProblems
              })
            }
          } catch (error) {
            console.error(`Error fetching assignments for class ${cls.id}:`, error)
          }
        }
        
        // Sort by due date (upcoming first, then no due date)
        allAssignments.sort((a, b) => {
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        })
        
        setAssignments(allAssignments)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching assignments:', error)
        setLoading(false)
      })
  }, [])

  const formatDueDate = (dueDate: string | null): { text: string; color: string } => {
    if (!dueDate) return { text: "No due date", color: "text-muted-foreground" }
    const date = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { text: "Past due", color: "text-red-500" }
    if (diffDays === 0) return { text: "Due today", color: "text-orange-500" }
    if (diffDays === 1) return { text: "Due tomorrow", color: "text-orange-500" }
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, color: "text-yellow-500" }
    
    return { text: `Due ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, color: "text-muted-foreground" }
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

  // Group assignments by class
  const assignmentsByClass = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.className]) {
      acc[assignment.className] = []
    }
    acc[assignment.className].push(assignment)
    return acc
  }, {} as Record<string, Assignment[]>)

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
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

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Assignments
              </h1>
              <p className="text-muted-foreground mt-2">Track your class assignments and progress</p>
            </div>

            {assignments.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
                    <div>
                      <h3 className="text-lg font-semibold">No assignments yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your instructor will assign problems for you to practice
                      </p>
                    </div>
                    <Link href="/problems">
                      <Button>Browse All Problems</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{assignments.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Across {Object.keys(assignmentsByClass).length} class{Object.keys(assignmentsByClass).length !== 1 ? 'es' : ''}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed</CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {assignments.filter(a => a.completedProblems === a.totalProblems && a.totalProblems > 0).length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((assignments.filter(a => a.completedProblems === a.totalProblems && a.totalProblems > 0).length / Math.max(assignments.length, 1)) * 100)}% completion rate
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {assignments.reduce((sum, a) => sum + a.completedProblems, 0)} / {assignments.reduce((sum, a) => sum + a.totalProblems, 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Problems solved</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Assignments grouped by class */}
                {Object.entries(assignmentsByClass).map(([className, classAssignments]) => (
                  <div key={className} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <h2 className="text-xl font-semibold">{className}</h2>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {classAssignments.map((assignment) => {
                        const progress = assignment.totalProblems > 0 
                          ? Math.round((assignment.completedProblems / assignment.totalProblems) * 100)
                          : 0
                        const isComplete = assignment.completedProblems === assignment.totalProblems && assignment.totalProblems > 0
                        const dueDateInfo = formatDueDate(assignment.dueDate)

                        return (
                          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1">
                                  {isComplete ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <CardTitle className="text-base">{assignment.title}</CardTitle>
                                    {assignment.dueDate && (
                                      <div className={`flex items-center gap-1 text-xs mt-1 ${dueDateInfo.color}`}>
                                        <Calendar className="h-3 w-3" />
                                        {dueDateInfo.text}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {isComplete && (
                                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100">
                                    Complete
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {assignment.completedProblems} / {assignment.totalProblems} problems
                                  </span>
                                  <span className="font-medium">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>

                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Problems:</p>
                                <div className="space-y-1.5">
                                  {assignment.problems.slice(0, 3).map((problem) => (
                                    <Link key={problem.id} href={`/problems/${problem.id}`}>
                                      <div className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors text-sm">
                                        <span className="truncate">{problem.title}</span>
                                        <Badge className={getDifficultyColor(problem.difficulty)} variant="secondary">
                                          {problem.difficulty}
                                        </Badge>
                                      </div>
                                    </Link>
                                  ))}
                                  {assignment.problems.length > 3 && (
                                    <p className="text-xs text-muted-foreground text-center py-1">
                                      +{assignment.problems.length - 3} more
                                    </p>
                                  )}
                                </div>
                              </div>

                              <Link href={`/problems?assignment=${assignment.id}`}>
                                <Button variant="outline" className="w-full" size="sm">
                                  View All Problems
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                              </Link>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
