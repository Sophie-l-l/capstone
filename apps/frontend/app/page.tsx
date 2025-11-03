"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect directly to role-specific dashboard
        if (user.role === "instructor") {
          router.push(`/dashboard/instructor/${user.id}`)
        } else {
          router.push(`/dashboard/student/${user.id}`)
        }
      } else {
        router.push("/login")
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          EduCode
        </h1>
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
