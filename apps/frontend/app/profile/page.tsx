"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Edit, 
  Save, 
  X, 
  Trophy, 
  Code2, 
  Target,
  Clock,
  TrendingUp,
  Award
} from "lucide-react"
import { mockUserStats } from "@/lib/mock-data"

export default function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: "Passionate about coding and problem solving. Currently learning algorithms and data structures.",
    location: "San Francisco, CA",
    university: "Stanford University",
    graduationYear: "2025",
  })

  const stats = mockUserStats
  const achievements = [
    { name: "First Solution", description: "Solved your first problem", icon: Trophy, color: "text-yellow-500" },
    { name: "Speed Demon", description: "Solved 10 problems in one day", icon: Clock, color: "text-blue-500" },
    { name: "Problem Solver", description: "Solved 50 problems", icon: Target, color: "text-green-500" },
    { name: "Code Master", description: "Achieved 90% success rate", icon: Award, color: "text-purple-500" },
  ]

  const handleSave = () => {
    // Here you would typically call an API to update the profile
    console.log("Saving profile data:", profileData)
    setIsEditing(false)
    // You can add toast notification here
  }

  const handleCancel = () => {
    setProfileData({
      name: user?.name || "",
      email: user?.email || "",
      bio: "Passionate about coding and problem solving. Currently learning algorithms and data structures.",
      location: "San Francisco, CA",
      university: "Stanford University",
      graduationYear: "2025",
    })
    setIsEditing(false)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Profile
              </h1>
              <p className="text-muted-foreground mt-2">Manage your profile and view your achievements</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Profile Info Card */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Profile Information</CardTitle>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={handleSave}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={profileData.name} />
                        <AvatarFallback className="text-lg">
                          {profileData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Badge variant="secondary" className="capitalize">
                          {user?.role || 'student'}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Member since {new Date().getFullYear()}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{profileData.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        {isEditing ? (
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{profileData.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        {isEditing ? (
                          <Input
                            id="location"
                            value={profileData.location}
                            onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{profileData.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="university">University</Label>
                        {isEditing ? (
                          <Input
                            id="university"
                            value={profileData.university}
                            onChange={(e) => setProfileData(prev => ({ ...prev, university: e.target.value }))}
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{profileData.university}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm">{profileData.bio}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle>Achievements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {achievements.map((achievement, index) => {
                        const Icon = achievement.icon
                        return (
                          <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/50">
                            <Icon className={`h-8 w-8 ${achievement.color}`} />
                            <div>
                              <h4 className="font-medium">{achievement.name}</h4>
                              <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Problems Solved</span>
                      </div>
                      <span className="font-bold">{stats.problemsSolved}/{stats.totalProblems}</span>
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Success Rate</span>
                      </div>
                      <span className="font-bold">{stats.successRate}%</span>
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Class Rank</span>
                      </div>
                      <span className="font-bold">#{stats.rank}</span>
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Code2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Current Streak</span>
                      </div>
                      <span className="font-bold">{stats.currentStreak} days</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Last active</p>
                        <p className="font-medium">Today at 2:30 PM</p>
                      </div>
                      <Separator />
                      <div className="text-sm">
                        <p className="text-muted-foreground">Joined</p>
                        <p className="font-medium">September 2024</p>
                      </div>
                      <Separator />
                      <div className="text-sm">
                        <p className="text-muted-foreground">Total submissions</p>
                        <p className="font-medium">156</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}