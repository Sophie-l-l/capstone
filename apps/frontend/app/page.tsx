"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Code2, ArrowRight, BookOpen, TrendingUp, Users } from "lucide-react"

export default function HomePage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
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

  const dashboardLink = user 
    ? (user.role === "instructor" 
        ? `/dashboard/instructor/${user.id}` 
        : `/dashboard/student/${user.id}`)
    : "/login"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Code2 className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            EduCode
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl">
            An adaptive learning platform that personalizes your coding journey with AI-powered error analysis and Bayesian Knowledge Tracing
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 mt-8">
            {user ? (
              <Link href={dashboardLink}>
                <Button size="lg" className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button size="lg" className="gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 w-full">
            <div className="p-6 rounded-lg border bg-card">
              <BookOpen className="h-10 w-10 mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Adaptive Problems</h3>
              <p className="text-sm text-muted-foreground">
                Get personalized problem recommendations based on your current skill level and learning progress
              </p>
            </div>
            
            <div className="p-6 rounded-lg border bg-card">
              <TrendingUp className="h-10 w-10 mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">AI Error Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Intelligent error classification helps you understand and learn from your mistakes
              </p>
            </div>
            
            <div className="p-6 rounded-lg border bg-card">
              <Users className="h-10 w-10 mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your knowledge mastery with Bayesian Knowledge Tracing across multiple concepts
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
