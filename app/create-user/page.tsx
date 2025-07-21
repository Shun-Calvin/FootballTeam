"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus } from "lucide-react"

export default function CreateUserPage() {
  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    password: "",
    full_name: "",
    jersey_number: "",
    position: "",
    phone: "",
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState("")
  const [createSuccess, setCreateSuccess] = useState(false)

  const { createUser } = useAuth()
  const { t } = useLanguage()

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError("")
    setCreateSuccess(false)

    const { error } = await createUser({
      email: newUser.email,
      username: newUser.username,
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
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <UserPlus className="h-8 w-8 mr-3" />
            {t("createUser")}
          </h1>
          <p className="text-gray-600 mt-1">{t("createUserDescription")}</p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>{t("createUser")}</CardTitle>
            </CardHeader>
            <CardContent>
              {createSuccess ? (
                <Alert>
                  <AlertDescription>{t("createUserSuccess")}</AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-email">{t("email")}</Label>
                      <Input id="new-email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-username">{t("username")}</Label>
                      <Input id="new-username" type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">{t("password")}</Label>
                      <Input id="new-password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full-name">{t("fullName")}</Label>
                      <Input id="full-name" type="text" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jersey-number">{t("jerseyNumber")}</Label>
                      <Input id="jersey-number" type="number" value={newUser.jersey_number} onChange={(e) => setNewUser({ ...newUser, jersey_number: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">{t("position")}</Label>
                      <Input id="position" type="text" value={newUser.position} onChange={(e) => setNewUser({ ...newUser, position: e.target.value })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="phone">{t("phone")}</Label>
                      <Input id="phone" type="tel" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
                    </div>
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
        </div>
      </div>
    </DashboardLayout>
  )
}
