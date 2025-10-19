"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Problem } from "@/lib/types"
import { ArrowRight, Target } from "lucide-react"
import Link from "next/link"

interface RecommendedProblemsProps {
  problems: Problem[]
}

export function RecommendedProblems({ problems }: RecommendedProblemsProps) {
  const getDifficultyColor = (difficulty: Problem["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      case "hard":
        return "bg-red-500/10 text-red-600 dark:text-red-400"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle>Recommended for You</CardTitle>
        </div>
        <CardDescription>Problems tailored to improve your weak areas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {problems.slice(0, 5).map((problem) => (
            <Link key={problem.id} href={`/problems/${problem.id}`}>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{problem.title}</h4>
                    <Badge className={getDifficultyColor(problem.difficulty)}>{problem.difficulty}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {problem.topics.slice(0, 3).map((topic) => (
                      <span key={topic} className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
