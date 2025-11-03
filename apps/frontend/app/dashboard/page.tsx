"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { useAuth } from "@/lib/auth-context"
import InstructorDashboardPage from "@/app/dashboard/instructor/page"
import StudentDashboardPage from "@/app/dashboard/student/page"

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-8">
          {user?.role === "instructor" ? (
            <InstructorDashboardPage />
          ) : (
            <StudentDashboardPage />
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
