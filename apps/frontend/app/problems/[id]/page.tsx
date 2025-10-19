"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { ProblemDescription } from "@/components/problem-description"
import { CodeEditor } from "@/components/code-editor"
import { TestResults } from "@/components/test-results"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import type { Submission } from "@/lib/types"
import { Play, Send, ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const languageTemplates = {
  python: `class Solution:
    def solve(self, nums):
        """
        Write your solution here.
        Args:
            nums: Input parameter (adjust based on problem)
        Returns:
            The result according to problem requirements
        """
        # Write your code here
        pass

# The system will call Solution().solve(test_input) for each test case`,

  javascript: `class Solution {
    solve(nums) {
        /*
         * Write your solution here.
         * @param {any} nums - Input parameter (adjust based on problem)
         * @return {any} The result according to problem requirements
         */
        // Write your code here
    }
}

// The system will call new Solution().solve(test_input) for each test case`,

  java: `class Solution {
    /**
     * Write your solution here.
     * @param nums Input parameter (adjust based on problem)
     * @return The result according to problem requirements
     */
    public Object solve(Object nums) {
        // Write your code here
        return null;
    }
}

// The system will call new Solution().solve(test_input) for each test case`,

  cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

class Solution {
public:
    /**
     * Write your solution here.
     * @param nums Input parameter (adjust based on problem)
     * @return The result according to problem requirements
     */
    auto solve(auto nums) {
        // Write your code here
        return nums;
    }
};

// The system will call Solution().solve(test_input) for each test case`
}

export default function ProblemPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const problemId = params.id as string
  
  const [problem, setProblem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState(languageTemplates.python)
  const [language, setLanguage] = useState<"python" | "javascript" | "java" | "cpp">("python")
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const problemData = await apiClient.getProblem(problemId)
        setProblem(problemData)
      } catch (error) {
        console.error('Failed to fetch problem:', error)
        toast({
          title: "Error",
          description: "Failed to load problem. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProblem()
  }, [problemId, toast])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <DashboardNav />
          <main className="container py-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading problem...</span>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (!problem) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <DashboardNav />
          <main className="container py-8">
            <p>Problem not found</p>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  const handleLanguageChange = (newLanguage: "python" | "javascript" | "java" | "cpp") => {
    setLanguage(newLanguage)
    setCode(languageTemplates[newLanguage])
  }

  const handleRun = async () => {
    setIsRunning(true)
    try {
      const result = await apiClient.runCode(problemId, code, language)
      
      const runSubmission: Submission = {
        id: Math.random().toString(),
        userId: "current",
        problemId: problem.id,
        code,
        language,
        status: result.status || "accepted",
        testCasesPassed: result.passedTestCases || 0,
        totalTestCases: result.totalTestCases || 0,
        runtime: result.averageRuntime || 0,
        memory: result.maxMemory || 0,
        submittedAt: new Date().toISOString(),
      }

      setSubmission(runSubmission)

      toast({
        title: result.status === "accepted" ? "Tests Passed!" : "Tests Failed",
        description: result.message || (result.status === "accepted"
          ? "Your code passed all public test cases."
          : "Some test cases failed. Check the results below."),
        variant: result.status === "accepted" ? "default" : "destructive",
      })
    } catch (error) {
      console.error('Failed to run code:', error)
      toast({
        title: "Run Failed",
        description: error instanceof Error ? error.message : "Failed to execute code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const result = await apiClient.submitCode(problemId, code, language)
      
      const submitSubmission: Submission = {
        id: result.submissionId || Math.random().toString(),
        userId: "current",
        problemId: problem.id,
        code,
        language,
        status: result.status || "accepted",
        testCasesPassed: result.passedTestCases || 0,
        totalTestCases: result.totalTestCases || 0,
        runtime: result.averageRuntime || 0,
        memory: result.maxMemory || 0,
        submittedAt: new Date().toISOString(),
      }

      setSubmission(submitSubmission)

      toast({
        title: result.status === "accepted" ? "Submission Successful!" : "Submission Failed",
        description: result.message || (result.status === "accepted"
          ? "Your solution passed all test cases and has been recorded."
          : "Your submission failed some test cases."),
        variant: result.status === "accepted" ? "default" : "destructive",
      })
    } catch (error) {
      console.error('Failed to submit code:', error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-4">
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/problems")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Problems
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
            <div className="overflow-auto">
              <ProblemDescription problem={problem} />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleRun} disabled={isRunning || isSubmitting}>
                    {isRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run
                      </>
                    )}
                  </Button>
                  <Button onClick={handleSubmit} disabled={isRunning || isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex-1 border rounded-lg overflow-hidden">
                <CodeEditor value={code} onChange={setCode} language={language} />
              </div>

              <TestResults submission={submission} />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
