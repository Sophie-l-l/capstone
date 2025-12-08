"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, BookOpen, Calendar } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Class {
  id: string
  name: string
  description?: string
  enrollments?: Array<{ student: { name: string; email: string } }>
  problemSets?: Array<{ id: string; title: string; dueDate: string | null }>
}

interface ClassManagementProps {
  classes: Class[]
  onClassCreated: () => void
}

export function ClassManagement({ classes, onClassCreated }: ClassManagementProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [className, setClassName] = useState("")
  const [classDescription, setClassDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()

  const handleCreateClass = async () => {
    if (!className.trim()) {
      toast({
        title: "Error",
        description: "Class name is required",
        variant: "destructive"
      })
      return
    }

    setCreating(true)
    try {
      await apiClient.createClass({
        name: className,
        description: classDescription || undefined
      })
      
      toast({
        title: "Success",
        description: "Class created successfully"
      })
      
      setClassName("")
      setClassDescription("")
      setCreateDialogOpen(false)
      onClassCreated()
    } catch (error) {
      console.error("Error creating class:", error)
      toast({
        title: "Error",
        description: "Failed to create class",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Classes</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Create a new class to organize students and assignments
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="className">Class Name *</Label>
                <Input
                  id="className"
                  placeholder="e.g., CS 101 - Fall 2024"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classDescription">Description (Optional)</Label>
                <Textarea
                  id="classDescription"
                  placeholder="Brief description of the class"
                  value={classDescription}
                  onChange={(e) => setClassDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateClass} disabled={creating}>
                {creating ? "Creating..." : "Create Class"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-semibold">No classes yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first class to start assigning problems
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{cls.name}</CardTitle>
                {cls.description && (
                  <CardDescription className="line-clamp-2">{cls.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{cls.enrollments?.length || 0} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{cls.problemSets?.length || 0} assignments</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/dashboard/instructor/classes/${cls.id}`}>View Details</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
