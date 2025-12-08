"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, BookOpen, Search } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Problem {
  id: string
  title: string
  difficulty: string
}

interface AssignmentCreationProps {
  classId?: string
  onAssignmentCreated?: () => void
}

export function AssignmentCreation({ classId, onAssignmentCreated }: AssignmentCreationProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [assignmentTitle, setAssignmentTitle] = useState("")
  const [selectedClass, setSelectedClass] = useState(classId || "")
  const [dueDate, setDueDate] = useState("")
  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set())
  const [problems, setProblems] = useState<Problem[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (createDialogOpen) {
      fetchProblems()
      if (!classId) {
        fetchClasses()
      }
    }
  }, [createDialogOpen, classId])

  const fetchProblems = async () => {
    try {
      const data = await apiClient.getProblems({ limit: 200 })
      setProblems(data.problems || [])
    } catch (error) {
      console.error("Error fetching problems:", error)
    }
  }

  const fetchClasses = async () => {
    try {
      const data = await apiClient.getClasses()
      setClasses(data.classes || [])
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const toggleProblem = (problemId: string) => {
    const newSelected = new Set(selectedProblems)
    if (newSelected.has(problemId)) {
      newSelected.delete(problemId)
    } else {
      newSelected.add(problemId)
    }
    setSelectedProblems(newSelected)
  }

  const handleCreateAssignment = async () => {
    if (!assignmentTitle.trim()) {
      toast({
        title: "Error",
        description: "Assignment title is required",
        variant: "destructive"
      })
      return
    }

    if (!selectedClass) {
      toast({
        title: "Error",
        description: "Please select a class",
        variant: "destructive"
      })
      return
    }

    if (selectedProblems.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one problem",
        variant: "destructive"
      })
      return
    }

    setCreating(true)
    try {
      await apiClient.createAssignment({
        title: assignmentTitle,
        classId: selectedClass,
        problemIds: Array.from(selectedProblems),
        dueDate: dueDate || undefined
      })
      
      toast({
        title: "Success",
        description: "Assignment created successfully"
      })
      
      setAssignmentTitle("")
      setDueDate("")
      setSelectedProblems(new Set())
      setCreateDialogOpen(false)
      onAssignmentCreated?.()
    } catch (error) {
      console.error("Error creating assignment:", error)
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
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

  const filteredProblems = problems.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
          <DialogDescription>
            Assign problems to your students with an optional due date
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="assignmentTitle">Assignment Title *</Label>
            <Input
              id="assignmentTitle"
              placeholder="e.g., Week 1 Practice"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
            />
          </div>

          {!classId && (
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Problems *</Label>
              <Badge variant="secondary">
                {selectedProblems.size} selected
              </Badge>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <div className="divide-y">
                {filteredProblems.map((problem) => (
                  <div
                    key={problem.id}
                    className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer"
                    onClick={() => toggleProblem(problem.id)}
                  >
                    <Checkbox
                      checked={selectedProblems.has(problem.id)}
                      onCheckedChange={() => toggleProblem(problem.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{problem.title}</p>
                    </div>
                    <Badge className={getDifficultyColor(problem.difficulty)}>
                      {problem.difficulty}
                    </Badge>
                  </div>
                ))}
              </div>
              {filteredProblems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No problems found
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateAssignment} disabled={creating}>
            {creating ? "Creating..." : "Create Assignment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
