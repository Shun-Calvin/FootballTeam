"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Edit, Save, X, KeyRound } from "lucide-react"

export default function ProfilePage() {
  const { profile, user } = useAuth()
  const { t } = useLanguage()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    jersey_number: profile?.jersey_number?.toString() || "",
    position: profile?.position || "",
    phone: profile?.phone || "",
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  const handleSave = async () => {
    setLoading(true)
    setMessage("")

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          jersey_number: formData.jersey_number ? Number.parseInt(formData.jersey_number) : null,
          position: formData.position || null,
          phone: formData.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile?.id)

      if (error) throw error

      setMessage(t("profileUpdateSuccess"))
      setEditing(false)

      // Refresh the page to get updated profile
      window.location.reload()
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage(t("profileUpdateError"))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || "",
      jersey_number: profile?.jersey_number?.toString() || "",
      position: profile?.position || "",
      phone: profile?.phone || "",
    })
    setEditing(false)
    setMessage("")
  }

  const handleChangePassword = async () => {
    setPasswordMessage("")
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage(t("passwordsNoMatch"))
      return
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage(t("passwordTooShort"))
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword })
    if (error) {
      setPasswordMessage(t("passwordChangeError", { message: error.message }))
    } else {
      setPasswordMessage(t("passwordChangeSuccess"))
      setPasswordData({ newPassword: "", confirmPassword: "" })
    }
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <User className="h-8 w-8 mr-3" />
            {t("profile")}
          </h1>
          <p className="text-gray-600 mt-1">{t("manageProfile")}</p>
        </div>

        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-xl">
                      {profile?.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{profile?.full_name}</CardTitle>
                    <CardDescription>@{profile?.username}</CardDescription>
                  </div>
                </div>

                {!editing ? (
                  <Button onClick={() => setEditing(true)} variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    {t("edit")}
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button onClick={handleSave} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? t("loading") : t("save")}
                    </Button>
                    <Button onClick={handleCancel} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      {t("cancel")}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input id="email" value={profile?.email || ""} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">{t("emailCannotChange")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">{t("username")}</Label>
                  <Input id="username" value={profile?.username || ""} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">{t("usernameCannotChange")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">{t("fullName")}</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!editing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jersey_number">{t("jerseyNumber")}</Label>
                  <Input
                    id="jersey_number"
                    type="number"
                    value={formData.jersey_number}
                    onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                    disabled={!editing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">{t("position")}</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    disabled={!editing}
                    placeholder="e.g., Forward, Midfielder, Defender"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editing}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">{t("accountInfo")}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{t("accountCreated")} {new Date(profile?.created_at || "").toLocaleDateString()}</p>
                  <p>{t("lastUpdated")} {new Date(profile?.updated_at || "").toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <KeyRound className="h-6 w-6 mr-3" />
                {t("changePassword")}
              </CardTitle>
              <CardDescription>{t("changePasswordDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordMessage && (
                <Alert variant={passwordMessage.startsWith("Error") || passwordMessage.startsWith("錯誤") ? "destructive" : "default"}>
                  <AlertDescription>{passwordMessage}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="new-password">{t("newPassword")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t("confirmNewPassword")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={loading}>
                {loading ? t("loading") : t("updatePassword")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
