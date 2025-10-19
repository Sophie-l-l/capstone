"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { Problem, TestCase } from "@/lib/types"
import { Plus, Trash2, ArrowLeft, ArrowRight, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const availableTopics = [
  "Array",
  "String",
  "Hash Table",
  "Dynamic Programming",
  "Math",
  "Sorting",
  "Greedy",
  "Depth-First Search",
  "Binary Search",
  "Tree",
  "Breadth-First Search",
  "Two Pointers",
  "Stack",
  "Recursion",
]

const availableKCs = [
  "For Loops",
  "Arrays",
  "Recursion",
  "Functions",
  "Conditionals",
  "Strings",
  "Sorting",
  "OOP Basics",
  "Hash Tables",
  "Trees",
]

export default function CreateProblemPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)

  const [title, setTitle] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy")
  const [description, setDescription] = useState("")
  const [inputFormat, setInputFormat] = useState("")
  const [outputFormat, setOutputFormat] = useState("")
  const [timeLimit, setTimeLimit] = useState("5")
  const [memoryLimit, setMemoryLimit] = useState("256")
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [selectedKCs, setSelectedKCs] = useState<string[]>([])
  const [constraints, setConstraints] = useState<string[]>([""])
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "", output: "", explanation: "", isHidden: false, points: 10 },
  ])

  const addConstraint = () => {
    setConstraints([...constraints, ""])
  }

  const updateConstraint = (index: number, value: string) => {
    const newConstraints = [...constraints]
    newConstraints[index] = value
    setConstraints(newConstraints)
  }

  const removeConstraint = (index: number) => {
    setConstraints(constraints.filter((_, i) => i !== index))
  }

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", output: "", explanation: "", isHidden: false, points: 10 }])
  }

  const updateTestCase = (index: number, field: keyof TestCase, value: string | boolean | number) => {
    const newTestCases = [...testCases]
    newTestCases[index] = { ...newTestCases[index], [field]: value }
    setTestCases(newTestCases)
  }

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index))
    }
  }

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]))
  }

  const toggleKC = (kc: string) => {
    setSelectedKCs((prev) => (prev.includes(kc) ? prev.filter((k) => k !== kc) : [...prev, kc]))
  }

  const handleSubmit = () => {
    const newProblem: Partial<Problem> = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      difficulty,
      topics: selectedTopics,
      knowledgeComponents: selectedKCs,
      description,
      inputFormat,
      outputFormat,
      constraints: constraints.filter((c) => c.trim() !== ""),
      examples: testCases,
      timeLimit: Number.parseInt(timeLimit),
      memoryLimit: Number.parseInt(memoryLimit),
      acceptanceRate: 0,
      totalSubmissions: 0,
    }

    toast({
      title: "Problem Created!",
      description: `${title} has been successfully created.`,
    })

    router.push("/problems")
  }

  const canProceed = () => {
    if (step === 1) {
      return title.trim() !== "" && description.trim() !== ""
    }
    if (step === 2) {
      return inputFormat.trim() !== "" && outputFormat.trim() !== ""
    }
    if (step === 3) {
      return testCases.every((tc) => tc.input.trim() !== "" && tc.output.trim() !== "")
    }
    if (step === 4) {
      return selectedTopics.length > 0 && selectedKCs.length > 0
    }
    return true
  }

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-8 max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push("/problems")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Problems
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Create New Problem
              </h1>
              <p className="text-muted-foreground mt-2">Design a coding problem for your students</p>
            </div>

            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      s === step
                        ? "bg-primary text-primary-foreground"
                        : s < step
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 5 && <div className={`w-16 h-1 ${s < step ? "bg-primary" : "bg-muted"}`} />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Enter the problem title, difficulty, and description</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Problem Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Two Sum"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Problem Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the problem in detail..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Input/Output Format</CardTitle>
                  <CardDescription>Define how input and output should be formatted</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inputFormat">Input Format</Label>
                    <Textarea
                      id="inputFormat"
                      placeholder="Describe the input format..."
                      value={inputFormat}
                      onChange={(e) => setInputFormat(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="outputFormat">Output Format</Label>
                    <Textarea
                      id="outputFormat"
                      placeholder="Describe the output format..."
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="memoryLimit">Memory Limit (MB)</Label>
                      <Input
                        id="memoryLimit"
                        type="number"
                        value={memoryLimit}
                        onChange={(e) => setMemoryLimit(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Test Cases</CardTitle>
                  <CardDescription>Add test cases to validate student solutions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {testCases.map((testCase, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Test Case {index + 1}</h4>
                        {testCases.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeTestCase(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Input</Label>
                        <Textarea
                          placeholder="Enter input..."
                          value={testCase.input}
                          onChange={(e) => updateTestCase(index, "input", e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Expected Output</Label>
                        <Textarea
                          placeholder="Enter expected output..."
                          value={testCase.output}
                          onChange={(e) => updateTestCase(index, "output", e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Explanation (Optional)</Label>
                        <Input
                          placeholder="Explain the test case..."
                          value={testCase.explanation}
                          onChange={(e) => updateTestCase(index, "explanation", e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`hidden-${index}`}
                            checked={testCase.isHidden}
                            onCheckedChange={(checked) => updateTestCase(index, "isHidden", checked as boolean)}
                          />
                          <Label htmlFor={`hidden-${index}`} className="font-normal cursor-pointer">
                            Hidden test case
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`points-${index}`}>Points:</Label>
                          <Input
                            id={`points-${index}`}
                            type="number"
                            className="w-20"
                            value={testCase.points}
                            onChange={(e) => updateTestCase(index, "points", Number.parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" onClick={addTestCase} className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Test Case
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Topics & Knowledge Components</CardTitle>
                  <CardDescription>Tag the problem with relevant topics and knowledge components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Topics</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableTopics.map((topic) => (
                        <Badge
                          key={topic}
                          variant={selectedTopics.includes(topic) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTopic(topic)}
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Knowledge Components</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableKCs.map((kc) => (
                        <Badge
                          key={kc}
                          variant={selectedKCs.includes(kc) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleKC(kc)}
                        >
                          {kc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle>Constraints</CardTitle>
                  <CardDescription>Define constraints for the problem</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {constraints.map((constraint, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="e.g., 1 ≤ n ≤ 10^5"
                        value={constraint}
                        onChange={(e) => updateConstraint(index, e.target.value)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeConstraint(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button variant="outline" onClick={addConstraint} className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Constraint
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {step < 5 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canProceed()}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Problem
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
