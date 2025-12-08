"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Problem } from "@/lib/types"
import { Search, ArrowUpDown } from "lucide-react"

interface ProblemsTableProps {
  problems: Problem[]
}

export function ProblemsTable({ problems }: ProblemsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [topicFilter, setTopicFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"title" | "difficulty" | "acceptance">("title")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const allTopics = Array.from(new Set(problems.flatMap((p) => p.topics)))

  const filteredProblems = problems
    .filter((problem) => {
      const matchesSearch =
        problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.topics.some((topic) => topic.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesDifficulty = difficultyFilter === "all" || problem.difficulty === difficultyFilter
      const matchesTopic = topicFilter === "all" || problem.topics.includes(topicFilter)
      return matchesSearch && matchesDifficulty && matchesTopic
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title)
      } else if (sortBy === "difficulty") {
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 }
        comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
      } else if (sortBy === "acceptance") {
        comparison = a.acceptanceRate - b.acceptanceRate
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

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

  const toggleSort = (column: "title" | "difficulty" | "acceptance") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {allTopics.map((topic) => (
              <SelectItem key={topic} value={topic}>
                {topic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">
                <Button variant="ghost" size="sm" onClick={() => toggleSort("title")} className="gap-2">
                  Title
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("difficulty")} className="gap-2">
                  Difficulty
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Topics</TableHead>
              <TableHead>Knowledge Components</TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" onClick={() => toggleSort("acceptance")} className="gap-2">
                  Acceptance
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProblems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No problems found
                </TableCell>
              </TableRow>
            ) : (
              filteredProblems.map((problem) => (
                <TableRow key={problem.id} className="cursor-pointer hover:bg-accent/50">
                  <TableCell>
                    <Link href={`/problems/${problem.id}`} className="font-medium hover:text-primary">
                      {problem.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(problem.difficulty)}>{problem.difficulty}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {problem.topics.slice(0, 2).map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {problem.topics.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{problem.topics.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {problem.knowledgeComponents?.slice(0, 2).map((kc: string) => (
                        <Badge key={kc} variant="secondary" className="text-xs">
                          {kc.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {problem.knowledgeComponents?.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{problem.knowledgeComponents.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{problem.acceptanceRate}%</TableCell>
                    <div className="flex flex-wrap gap-1">
                      {problem.knowledgeComponents?.slice(0, 2).map((kc: string) => (
                        <Badge key={kc} variant="secondary" className="text-xs">
                          {kc.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {problem.knowledgeComponents?.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{problem.knowledgeComponents.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{problem.acceptanceRate}%</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredProblems.length} of {problems.length} problems
      </div>
    </div>
  )
}
