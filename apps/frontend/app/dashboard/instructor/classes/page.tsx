"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { ClassManagement } from "@/components/class-management"
import { AssignmentCreation } from "@/components/assignment-creation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { apiClient } from "@/lib/api"

export default function InstructorClassesPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<any[]>([])
  const [classesWithDetails, setClassesWithDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const data = await apiClient.getClasses()
      const classList = data.classes || []
      setClasses(classList)
      
      // Fetch details for each class
      const detailedClasses = await Promise.all(
        classList.map(async (cls: any) => {
          try {
            const details = await apiClient.getClassDetails(cls.id)
            return details
          } catch (error) {
            console.error(`Error fetching details for class ${cls.id}:`, error)
            return cls
          }
        })
      )
      
      setClassesWithDetails(detailedClasses)
    } catch (error) {
      console.error("Error fetching classes:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["instructor"]}>
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
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Class Management
              </h1>
              <p className="text-muted-foreground mt-2">Manage your classes and assignments</p>
            </div>

            <Tabs defaultValue="classes">
              <TabsList>
                <TabsTrigger value="classes">My Classes</TabsTrigger>
                <TabsTrigger value="assignments">Create Assignment</TabsTrigger>
              </TabsList>

              <TabsContent value="classes" className="space-y-6 mt-6">
                <ClassManagement classes={classesWithDetails} onClassCreated={fetchClasses} />
              </TabsContent>

              <TabsContent value="assignments" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Assignment</CardTitle>
                    <CardDescription>Assign problems to your students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AssignmentCreation onAssignmentCreated={fetchClasses} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
