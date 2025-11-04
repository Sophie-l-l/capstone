"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { StudentProgress } from "@/lib/types"
import { AlertTriangle, Mail } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface AtRiskStudentsProps {
  students: StudentProgress[]
}

export function AtRiskStudents({ students }: AtRiskStudentsProps) {
  const atRiskStudents = students.filter((s) => s.isAtRisk)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle>At-Risk Students</CardTitle>
        </div>
        <CardDescription>Students who may need additional support</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {atRiskStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No at-risk students identified</p>
          ) : (
            atRiskStudents.map((student) => (
              <div key={student.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                <Avatar>
                  <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                  <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{student.name}</h4>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{student.problemsSolved} problems solved</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-red-600 dark:text-red-400">{student.successRate}% success rate</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      Last active {formatDistanceToNow(new Date(student.lastActive), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground">Weak areas:</span>
                    {student.weakAreas.map((area: string) => (
                      <Badge key={area} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
