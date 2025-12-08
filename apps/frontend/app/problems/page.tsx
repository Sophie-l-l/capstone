"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { ProblemsTable } from "@/components/problems-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Target, TrendingUp } from "lucide-react"
import { apiClient } from "@/lib/api"

export default function ProblemsPage() {
  const searchParams = useSearchParams()
  const assignmentParam = searchParams.get('assignment')
  
  const [problems, setProblems] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [assignmentsList, setAssignmentsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredProblems, setFilteredProblems] = useState<any[]>([])

  useEffect(() => {
    // Fetch problems
    apiClient.getProblems({ limit: 100 })
      .then(data => {
        setProblems(data.problems || [])
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching problems:', error)
        setLoading(false)
      })

    // Fetch assignments to show badges
    apiClient.getClasses()
      .then(async (classesData) => {
        const classes = classesData.classes || []
        const assignmentInfos: any[] = []
        const assignmentList: any[] = []
        
        for (const cls of classes) {
          try {
            const assignmentsData = await apiClient.getClassAssignments(cls.id)
            const problemSets = assignmentsData.problemSets || []
            
            for (const ps of problemSets) {
              const assignmentProblems = ps.problems || []
              
              // Add to assignments list for dropdown
              assignmentList.push({
                id: ps.id,
                title: ps.title,
                className: cls.name,
                problemIds: assignmentProblems.map((p: any) => p.id)
              })
              
              assignmentProblems.forEach((problem: any) => {
                assignmentInfos.push({
                  problemId: problem.id,
                  assignmentId: ps.id,
                  assignmentTitle: ps.title,
                  dueDate: ps.dueDate,
                  className: cls.name
                })
              })
            }
          } catch (error) {
            console.error(`Error fetching assignments for class ${cls.id}:`, error)
          }
        }
        
        setAssignments(assignmentInfos)
        setAssignmentsList(assignmentList)
      })
      .catch(error => {
        console.error('Error fetching assignments:', error)
      })
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
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

  const easyCount = filteredProblems.filter((p) => p.difficulty === "easy").length
  const mediumCount = filteredProblems.filter((p) => p.difficulty === "medium").length
  const hardCount = filteredProblems.filter((p) => p.difficulty === "hard").length
  
  const avgAcceptance = filteredProblems.length > 0 
    ? (filteredProblems.reduce((acc, p) => acc + (p.acceptanceRate || 0), 0) / filteredProblems.length).toFixed(1)
    : "0"

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
                  <div className="text-2xl font-bold">{filteredProblems.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {filteredProblems.length !== problems.length 
                      ? `Filtered from ${problems.length} total` 
                      : 'Available to solve'}
                  </p>
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
                    {avgAcceptance}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredProblems.length !== problems.length 
                      ? 'For filtered problems' 
                      : 'Across all problems'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <ProblemsTable 
              problems={problems} 
              assignments={assignments}
              assignmentsList={assignmentsList}
              initialAssignmentFilter={assignmentParam || undefined}
              onFilterChange={setFilteredProblems}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
