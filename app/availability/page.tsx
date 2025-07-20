"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
import { Switch } from "@/components/ui/switch"
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

export default function AvailabilityPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAvailability, setEditingAvailability] = useState<Availability | null>(null)
  const [newAvailability, setNewAvailability] = useState({
    date: "",
    is_available: true,
    notes: "",
  })

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    try {
      const { data } = await supabase
        .from("availability")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .order("date", { ascending: true })

      setAvailability(data || [])
    } catch (error) {
      console.error("Error fetching availability:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        player_id: profile?.id,
        date: editingAvailability ? editingAvailability.date : newAvailability.date,
        is_available: editingAvailability ? editingAvailability.is_available : newAvailability.is_available,
        notes: editingAvailability ? editingAvailability.notes : newAvailability.notes,
      }

      const { error } = await supabase.from("availability").upsert(payload)

      if (error) throw error

      setDialogOpen(false)
      setEditingAvailability(null)
      setNewAvailability({
        date: "",
        is_available: true,
        notes: "",
      })
      fetchAvailability()
    } catch (error) {
      console.error("Error creating/updating availability:", error)
    }
  }

  const handleDeleteAvailability = async (id: string) => {
    try {
      await supabase.from("availability").delete().eq("id", id)
      fetchAvailability()
    } catch (error) {
      console.error("Error deleting availability:", error)
    }
  }

  const getAvailabilityForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return availability.filter((a) => a.date === dateString)
  }

  const getAvailabilityStatus = (date: Date) => {
    const dateAvailability = getAvailabilityForDate(date)
    const userAvailability = dateAvailability.find((a) => a.player_id === profile?.id)
    return userAvailability?.is_available
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
            <p className="text-gray-600 mt-1">Manage your training and match availability</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Availability
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingAvailability ? "Edit" : "Set"} Availability</DialogTitle>
                <DialogDescription>
                  {editingAvailability ? "Update" : "Set"} your availability for a specific date.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveAvailability} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
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
                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={editingAvailability ? editingAvailability.is_available : newAvailability.is_available}
                    onCheckedChange={(checked) =>
                      editingAvailability
                        ? setEditingAvailability({ ...editingAvailability, is_available: checked })
                        : setNewAvailability({ ...newAvailability, is_available: checked })
                    }
                  />
                  <Label htmlFor="available">Available</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={editingAvailability ? editingAvailability.notes || "" : newAvailability.notes}
                    onChange={(e) =>
                      editingAvailability
                        ? setEditingAvailability({ ...editingAvailability, notes: e.target.value })
                        : setNewAvailability({ ...newAvailability, notes: e.target.value })
                    }
                    placeholder="Any additional notes..."
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
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarDays className="h-5 w-5 mr-2" />
                Calendar
              </CardTitle>
              <CardDescription>Click on a date to see availability details</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  available: (date) => getAvailabilityStatus(date) === true,
                  unavailable: (date) => getAvailabilityStatus(date) === false,
                }}
                modifiersStyles={{
                  available: { backgroundColor: "#dcfce7", color: "#166534" },
                  unavailable: { backgroundColor: "#fecaca", color: "#dc2626" },
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Date Details */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedDate ? new Date(selectedDate).toLocaleDateString() : "Select a Date"}</CardTitle>
              <CardDescription>Availability details for the selected date</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-4">
                  {getAvailabilityForDate(selectedDate).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No availability set for this date</p>
                  ) : (
                    <div className="space-y-3">
                      {getAvailabilityForDate(selectedDate).map((avail) => (
                        <div key={avail.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{avail.profiles.full_name}</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant={avail.is_available ? "default" : "destructive"}>
                                {avail.is_available ? "Available" : "Unavailable"}
                              </Badge>
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
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteAvailability(avail.id)}
                                  >
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
                <p className="text-gray-500 text-center py-4">Select a date to view availability details</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Availability</CardTitle>
            <CardDescription>Your availability for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() + i)
                const dateString = date.toISOString().split("T")[0]
                const userAvailability = availability.find((a) => a.date === dateString && a.player_id === profile?.id)

                return (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{new Date(date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(date).toLocaleDateString("en-US", { weekday: "long" })}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {userAvailability ? (
                        <>
                          <Badge variant={userAvailability.is_available ? "default" : "destructive"}>
                            {userAvailability.is_available ? "Available" : "Unavailable"}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="outline">Not Set</Badge>
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
