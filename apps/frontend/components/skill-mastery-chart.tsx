"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { KnowledgeComponent } from "@/lib/types"

interface SkillMasteryChartProps {
  skills: KnowledgeComponent[]
}

export function SkillMasteryChart({ skills }: SkillMasteryChartProps) {
  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return "text-green-600 dark:text-green-400"
    if (mastery >= 60) return "text-blue-600 dark:text-blue-400"
    if (mastery >= 40) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getMasteryLevel = (mastery: number) => {
    if (mastery >= 80) return "Mastered"
    if (mastery >= 60) return "Proficient"
    if (mastery >= 40) return "Learning"
    return "Beginner"
  }

  const sortedSkills = [...skills].sort((a, b) => b.mastery - a.mastery)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill Mastery (BKT)</CardTitle>
        <CardDescription>Your knowledge component mastery based on Bayesian Knowledge Tracing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedSkills.map((skill) => (
          <div key={skill.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{skill.name}</span>
                <span className={`text-xs font-semibold ${getMasteryColor(skill.mastery)}`}>
                  {getMasteryLevel(skill.mastery)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{skill.problemsSolved} problems</span>
                <span className={`text-sm font-bold ${getMasteryColor(skill.mastery)}`}>{skill.mastery}%</span>
              </div>
            </div>
            <Progress value={skill.mastery} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
