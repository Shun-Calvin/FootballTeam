"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Globe } from "lucide-react"
import type { Language } from "@/types/language"

export default function LoginPage() {
  const [email, setEmail] = useState("") // Changed from username
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Create user form
  const [newUser, setNewUser] = useState({
    email: "", // Added email for new user
    username: "", // Kept username for profile
    password: "",
    full_name: "",
    jersey_number: "",
    position: "",
    phone: "",
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState("")
  const [createSuccess, setCreateSuccess] = useState(false)

  const { signIn, createUser } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await signIn(email, password) // Changed to email

    if (error) {
      setError(error.message)
    } else {
      router.push("/dashboard")
    }

    setLoading(false)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError("")

    const { error } = await createUser({
      email: newUser.email, // Pass email
      username: newUser.username, // Pass username
      password: newUser.password,
      full_name: newUser.full_name,
      jersey_number: newUser.jersey_number ? Number.parseInt(newUser.jersey_number) : undefined,
      position: newUser.position || undefined,
      phone: newUser.phone || undefined,
    })

    if (error) {
      setCreateError(error.message)
    } else {
      setCreateSuccess(true)
      setNewUser({
        email: "",
        username: "",
        password: "",
        full_name: "",
        jersey_number: "",
        position: "",
        phone: "",
      })
    }

    setCreateLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-center flex-1">Football Team Management</h1>
          <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
            <SelectTrigger className="w-20">
              <Globe className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="zh-TW">繁體中文</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t("login")}</TabsTrigger>
            <TabsTrigger value="create">{t("createUser")}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{t("login")}</CardTitle>
                <CardDescription>Enter your credentials to access the system</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label> {/* Changed label to Email */}
                    <Input
                      id="email"
                      type="email" // Changed type to email
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t("loading") : t("signIn")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>{t("createUser")}</CardTitle>
                <CardDescription>Create a new user account (Admin only)</CardDescription>
              </CardHeader>
              <CardContent>
                {createSuccess ? (
                  <Alert>
                    <AlertDescription>User created successfully! They can now log in.</AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-email">Email</Label> {/* Added email input for new user */}
                      <Input
                        id="new-email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-username">{t("username")}</Label>
                      <Input
                        id="new-username"
                        type="text"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">{t("password")}</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full-name">{t("fullName")}</Label>
                      <Input
                        id="full-name"
                        type="text"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jersey-number">{t("jerseyNumber")}</Label>
                      <Input
                        id="jersey-number"
                        type="number"
                        value={newUser.jersey_number}
                        onChange={(e) => setNewUser({ ...newUser, jersey_number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">{t("position")}</Label>
                      <Input
                        id="position"
                        type="text"
                        value={newUser.position}
                        onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("phone")}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      />
                    </div>
                    {createError && (
                      <Alert variant="destructive">
                        <AlertDescription>{createError}</AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" className="w-full" disabled={createLoading}>
                      {createLoading ? t("loading") : t("create")}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
