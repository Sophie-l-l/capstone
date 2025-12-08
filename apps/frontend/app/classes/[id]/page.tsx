"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, TrendingUp, UserPlus, AlertTriangle } from "lucide-react";
import { DashboardNav } from "@/components/dashboard-nav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ClassDetails {
  id: string;
  name: string;
  code: string;
  semester: string;
  createdAt: string;
  enrollments: {
    id: string;
    enrolledAt: string;
    student: {
      id: string;
      email: string;
      name: string | null;
    };
  }[];
  problemSets: {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    createdAt: string;
  }[];
}

interface Analytics {
  totalStudents: number;
  totalSubmissions: number;
  averageAccuracy: number;
  atRiskStudents: {
    studentId: string;
    email: string;
    name: string | null;
    submissionCount: number;
    accuracyRate: number;
  }[];
  knowledgeComponentMastery: {
    kc: string;
    averageMastery: number;
    studentCount: number;
  }[];
}

export default function ClassDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;

  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    if (classId) {
      fetchClassDetails();
      fetchAnalytics();
    }
  }, [classId]);

  const fetchClassDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/instructor/classes/${classId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch class details");
      }

      const data = await response.json();
      setClassDetails(data);
    } catch (err: any) {
      setError(err.message || "Failed to load class details");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `http://localhost:8000/api/instructor/classes/${classId}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      console.error("Analytics error:", err);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError("");
    setIsEnrolling(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/instructor/classes/${classId}/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ studentEmail }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to enroll student");
      }

      setStudentEmail("");
      setIsEnrollDialogOpen(false);
      fetchClassDetails();
      fetchAnalytics();
    } catch (err: any) {
      setEnrollError(err.message || "Failed to enroll student");
    } finally {
      setIsEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading class details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !classDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error || "Class not found"}</p>
              <Button onClick={() => router.push("/classes")} className="mt-4">
                Back to Classes
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {classDetails.name}
              </h1>
              <p className="text-muted-foreground">
                {classDetails.code} • {classDetails.semester}
              </p>
            </div>
            <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Enroll Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleEnrollStudent}>
                  <DialogHeader>
                    <DialogTitle>Enroll Student</DialogTitle>
                    <DialogDescription>
                      Add a student to this class by their email address.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Student Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="student@example.com"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        required
                      />
                    </div>
                    {enrollError && (
                      <p className="text-sm text-destructive">{enrollError}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEnrollDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isEnrolling}>
                      {isEnrolling ? "Enrolling..." : "Enroll"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalStudents || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalSubmissions || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Average Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.averageAccuracy.toFixed(1) || 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" className="space-y-4">
          <TabsList>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>
                  {classDetails.enrollments.length} students enrolled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classDetails.enrollments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No students enrolled yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      classDetails.enrollments.map((enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell>
                            {enrollment.student.name || "N/A"}
                          </TableCell>
                          <TableCell>{enrollment.student.email}</TableCell>
                          <TableCell>
                            {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {analytics?.atRiskStudents && analytics.atRiskStudents.length > 0 && (
              <Card className="border-orange-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    At-Risk Students
                  </CardTitle>
                  <CardDescription>
                    Students who may need additional support
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead>Accuracy</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.atRiskStudents.map((student) => (
                        <TableRow key={student.studentId}>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.submissionCount}</TableCell>
                          <TableCell>{student.accuracyRate.toFixed(1)}%</TableCell>
                          <TableCell>
                            <Badge variant="destructive">At Risk</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {analytics?.knowledgeComponentMastery && (
              <Card>
                <CardHeader>
                  <CardTitle>Knowledge Component Mastery</CardTitle>
                  <CardDescription>
                    Average mastery levels across knowledge components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Knowledge Component</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Average Mastery</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.knowledgeComponentMastery.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No mastery data available yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        analytics.knowledgeComponentMastery.map((kc) => (
                          <TableRow key={kc.kc}>
                            <TableCell className="font-medium">{kc.kc}</TableCell>
                            <TableCell>{kc.studentCount}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-secondary rounded-full h-2">
                                  <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{
                                      width: `${kc.averageMastery * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {(kc.averageMastery * 100).toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Problem Sets</CardTitle>
                <CardDescription>
                  {classDetails.problemSets.length} problem sets assigned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {classDetails.problemSets.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No problem sets created yet
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classDetails.problemSets.map((ps) => (
                        <TableRow key={ps.id}>
                          <TableCell className="font-medium">{ps.title}</TableCell>
                          <TableCell>
                            {ps.dueDate
                              ? new Date(ps.dueDate).toLocaleDateString()
                              : "No due date"}
                          </TableCell>
                          <TableCell>
                            {new Date(ps.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
