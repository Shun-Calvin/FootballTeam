"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDays, Plus, Edit, Trash } from "lucide-react"

interface Availability {
  id: string
  player_id: string
  date: string
  is_available: boolean
  notes: string | null
  profiles: {
    full_name: string
  }
}

const toYYYYMMDD = (date: Date) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function AvailabilityPage() {
  const { profile, sessionKey } = useAuth()
  const { t } = useLanguage()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAvailability, setEditingAvailability] = useState<Availability | null>(null)
  const [newAvailability, setNewAvailability] = useState({
    date: "",
    notes: "",
  })

  const fetchAvailability = useCallback(async () => {
    if (!profile) return;
    setLoading(true)
    try {
      const { data } = await supabase
        .from("availability")
        .select(`*, profiles(full_name)`)
        .order("date", { ascending: true })

      setAvailability(data || [])
    } catch (error) {
      console.error("Error fetching availability:", error)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability, sessionKey])

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        player_id: profile?.id,
        date: editingAvailability ? editingAvailability.date : newAvailability.date,
        is_available: false, // Always set to unavailable
        notes: editingAvailability ? editingAvailability.notes || "" : newAvailability.notes || "",
      }

      const { error } = await supabase.from("availability").upsert(payload, { onConflict: 'player_id,date' })

      if (error) throw error

      setDialogOpen(false)
      setEditingAvailability(null)
      setNewAvailability({
        date: "",
        notes: "",
      })
      fetchAvailability()
    } catch (error) {
      console.error("Error creating/updating availability:", error)
    }
  }

  const handleDeleteAvailability = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this availability entry?")) {
      try {
        await supabase.from("availability").delete().eq("id", id)
        fetchAvailability()
      } catch (error) {
        console.error("Error deleting availability:", error)
      }
    }
  }

  const getAvailabilityForDate = (date: Date) => {
    const dateString = toYYYYMMDD(date)
    return availability.filter((a) => a.date === dateString)
  }

  const getTeamAvailabilityStatus = (date: Date) => {
    const todaysAvailability = getAvailabilityForDate(date);
    if (todaysAvailability.length === 0) {
      return { available: false, unavailable: false };
    }

    const hasUnavailable = todaysAvailability.some(a => !a.is_available);
    if (hasUnavailable) {
      return { available: false, unavailable: true };
    }

    return { available: false, unavailable: false };
  };
  
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(`${dateString}T00:00:00Z`)
    return date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("availability")}</h1>
            <p className="text-gray-600 mt-1">{t("manageAvailability")}</p>
          </div>

          <Dialog
            open={dialogOpen}
            onOpenChange={(isOpen) => {
              setDialogOpen(isOpen)
              if (!isOpen) {
                setEditingAvailability(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("addAvailability")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingAvailability ? t("editAvailability") : t("setAvailability")}</DialogTitle>
                <DialogDescription>{t("setAvailabilityDescription")}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveAvailability} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">{t("date")}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={editingAvailability ? editingAvailability.date : newAvailability.date}
                    onChange={(e) =>
                      editingAvailability
                        ? setEditingAvailability({ ...editingAvailability, date: e.target.value })
                        : setNewAvailability({ ...newAvailability, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t("notesOptional")}</Label>
                  <Textarea
                    id="notes"
                    value={editingAvailability ? editingAvailability.notes || "" : newAvailability.notes}
                    onChange={(e) =>
                      editingAvailability
                        ? setEditingAvailability({ ...editingAvailability, notes: e.target.value })
                        : setNewAvailability({ ...newAvailability, notes: e.target.value })
                    }
                    placeholder="..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit">{t("save")}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarDays className="h-5 w-5 mr-2" />
                {t("calendar")}
              </CardTitle>
              <CardDescription>{t("calendarDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  unavailable: (date) => getTeamAvailabilityStatus(date).unavailable,
                }}
                modifiersStyles={{
                  unavailable: { backgroundColor: "#fecaca", color: "#dc2626" },
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{selectedDate ? toYYYYMMDD(selectedDate) : t("selectDate")}</CardTitle>
              <CardDescription>{t("availabilityForDate")}</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-4">
                  {getAvailabilityForDate(selectedDate).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">{t("noAvailabilityForDate")}</p>
                  ) : (
                    <div className="space-y-3">
                      {getAvailabilityForDate(selectedDate).map((avail) => (
                        <div key={avail.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{avail.profiles.full_name}</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant={"destructive"}>{t("unavailable")}</Badge>
                              {avail.player_id === profile?.id && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingAvailability(avail)
                                      setDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => handleDeleteAvailability(avail.id)}>
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {avail.notes && <p className="text-sm text-gray-600">{avail.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">{t("selectDatePrompt")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("upcomingAvailability")}</CardTitle>
            <CardDescription>{t("upcomingAvailabilityDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() + i)
                const dateString = toYYYYMMDD(date)
                const userAvailability = availability.find((a) => a.date === dateString && a.player_id === profile?.id)

                return (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{dateString}</div>
                      <div className="text-sm text-gray-500">{getDayOfWeek(dateString)}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {userAvailability ? (
                        <Badge variant={"destructive"}>
                          {t("unavailable")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{t("available")}</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
