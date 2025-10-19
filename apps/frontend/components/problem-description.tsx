"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Problem } from "@/lib/types"
import { Clock, Database, CheckCircle2 } from "lucide-react"

interface ProblemDescriptionProps {
  problem: Problem
}

export function ProblemDescription({ problem }: ProblemDescriptionProps) {
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
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl">{problem.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(problem.difficulty)}>{problem.difficulty}</Badge>
              {problem.topics.map((topic) => (
                <Badge key={topic} variant="outline">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>{problem.acceptanceRate}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
            <TabsTrigger value="hints">Hints</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">Problem Statement</h3>
              <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Input Format</h3>
              <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap">{problem.inputFormat}</pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Output Format</h3>
              <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap">{problem.outputFormat}</pre>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Time Limit: {problem.timeLimit}s</span>
              </div>
              <div className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                <span>Memory Limit: {problem.memoryLimit}MB</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4 mt-4">
            {problem.examples
              .filter((ex) => !ex.isHidden)
              .map((example, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-semibold">Example {index + 1}</h3>
                  <div>
                    <p className="text-sm font-medium mb-1">Input:</p>
                    <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap">{example.input}</pre>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Output:</p>
                    <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap">{example.output}</pre>
                  </div>
                  {example.explanation && (
                    <div>
                      <p className="text-sm font-medium mb-1">Explanation:</p>
                      <p className="text-sm text-muted-foreground">{example.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
          </TabsContent>

          <TabsContent value="constraints" className="space-y-2 mt-4">
            <h3 className="font-semibold mb-2">Constraints</h3>
            <ul className="space-y-2">
              {problem.constraints.map((constraint, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{constraint}</code>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="hints" className="space-y-2 mt-4">
            <h3 className="font-semibold mb-2">Knowledge Components</h3>
            <div className="flex flex-wrap gap-2">
              {problem.knowledgeComponents.map((kc) => (
                <Badge key={kc} variant="secondary">
                  {kc}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              This problem tests your understanding of the above concepts. Try to identify which knowledge components
              apply to each part of the solution.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
