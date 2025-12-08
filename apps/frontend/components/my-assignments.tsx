"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, CheckCircle2, Circle } from "lucide-react"
import Link from "next/link"

interface Assignment {
  id: string
  title: string
  className: string
  dueDate: string | null
  totalProblems: number
  completedProblems: number
  problems: Array<{
    id: string
    title: string
    difficulty: string
  }>
}

interface MyAssignmentsProps {
  assignments: Assignment[]
  loading?: boolean
}

export function MyAssignments({ assignments, loading }: MyAssignmentsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No assignments yet. Check back later!
          </p>
        </CardContent>
      </Card>
    )
  }

  const sortedAssignments = [...assignments].sort((a, b) => {
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return "No due date"
    const date = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return <span className="text-red-500">Past due</span>
    if (diffDays === 0) return <span className="text-orange-500">Due today</span>
    if (diffDays === 1) return <span className="text-orange-500">Due tomorrow</span>
    if (diffDays <= 7) return <span className="text-yellow-500">Due in {diffDays} days</span>
    
    return `Due ${date.toLocaleDateString()}`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          My Assignments
        </CardTitle>
        <Link href="/assignments">
          <Button variant="ghost" size="sm">View All</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedAssignments.slice(0, 3).map((assignment) => {
            const progress = assignment.totalProblems > 0 
              ? Math.round((assignment.completedProblems / assignment.totalProblems) * 100)
              : 0
            const isComplete = assignment.completedProblems === assignment.totalProblems

            return (
              <div key={assignment.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h4 className="font-semibold">{assignment.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {assignment.className}
                    </p>
                  </div>
                  {isComplete && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100">
                      Complete
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{formatDueDate(assignment.dueDate)}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {assignment.completedProblems} of {assignment.totalProblems} problems completed
                    </span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        isComplete 
                          ? 'bg-green-500' 
                          : progress > 50 
                          ? 'bg-blue-500' 
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <Link href={`/assignments/${assignment.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Assignment
                  </Button>
                </Link>
              </div>
            )
          })}

          {assignments.length > 3 && (
            <Link href="/assignments">
              <Button variant="ghost" className="w-full">
                View {assignments.length - 3} more assignment{assignments.length - 3 !== 1 ? 's' : ''}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
