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
import { Switch } from "@/components/ui/switch"
import { Plus, Calendar, MapPin, Users, Video, Edit, Trash } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Match {
  id: string
  opponent_team: string
  match_date: string
  location: string
  home_jersey_color: string | null
  away_jersey_color: string | null
  is_home_game: boolean | null
  video_link: string | null
  status: string | null
  final_score_home: number | null
  final_score_away: number | null
  created_by: string | null
}

interface MatchParticipant {
  id: string
  match_id: string
  player_id: string
  status: string
  is_key_player: boolean
  profiles: {
    id: string
    full_name: string
    jersey_number: number | null
  }
}

interface MatchEvent {
  id: string
  match_id: string
  event_type: string
  player_id: string
  event_time: number
  description: string | null
}

export default function MatchesPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [matches, setMatches] = useState<Match[]>([])
  const [participants, setParticipants] = useState<{ [key: string]: MatchParticipant[] }>({})
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match & { video_links: string[] } | null>(null)
  const [matchEvents, setMatchEvents] = useState<Partial<MatchEvent>[]>([])
  const [editableParticipants, setEditableParticipants] = useState<MatchParticipant[]>([])
  const [newMatch, setNewMatch] = useState({
    opponent_team: "",
    match_date: "",
    location: "",
    home_jersey_color: "",
    away_jersey_color: "",
    is_home_game: true,
  })

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const { data: matchesData } = await supabase.from("matches").select("*").order("match_date", { ascending: false })

      if (matchesData) {
        setMatches(matchesData)

        const participantsData: { [key: string]: MatchParticipant[] } = {}
        for (const match of matchesData) {
          const { data } = await supabase
            .from("match_participants")
            .select(
              `
              *,
              profiles (
                id,
                full_name,
                jersey_number
              )
            `
            )
            .eq("match_id", match.id)

          participantsData[match.id] = data || []
        }
        setParticipants(participantsData)
      }
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data, error } = await supabase
        .from("matches")
        .insert({
          ...newMatch,
          created_by: profile?.id,
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from("match_participants").insert({
        match_id: data.id,
        player_id: profile?.id,
        status: "accepted",
      })

      setCreateDialogOpen(false)
      setNewMatch({
        opponent_team: "",
        match_date: "",
        location: "",
        home_jersey_color: "",
        away_jersey_color: "",
        is_home_game: true,
      })
      fetchMatches()
    } catch (error) {
      console.error("Error creating match:", error)
    }
  }

  const handleParticipationResponse = async (matchId: string, status: "accepted" | "declined") => {
    try {
      const { error } = await supabase
        .from("match_participants")
        .update({ status })
        .eq("match_id", matchId)
        .eq("player_id", profile?.id)

      if (error) throw error
      fetchMatches()
    } catch (error) {
      console.error("Error updating participation:", error)
    }
  }

  const getParticipationStatus = (matchId: string) => {
    const participant = participants[matchId]?.find((p) => p.player_id === profile?.id)
    return participant?.status || "pending"
  }

  const handleEditMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMatch) return

    try {
      const { error: matchError } = await supabase
        .from("matches")
        .update({
          opponent_team: selectedMatch.opponent_team,
          location: selectedMatch.location,
          final_score_home: selectedMatch.final_score_home,
          final_score_away: selectedMatch.final_score_away,
          video_link: selectedMatch.video_links.filter(Boolean).join(","),
        })
        .eq("id", selectedMatch.id)

      if (matchError) throw matchError

      for (const event of matchEvents) {
        const payload = { ...event, match_id: selectedMatch.id }
        if (!payload.id) {
          delete (payload as { id?: string }).id
        }
        const { error: eventError } = await supabase.from("match_events").upsert(payload)
        if (eventError) throw eventError
      }

      for (const participant of editableParticipants) {
        const { error: participantError } = await supabase
          .from("match_participants")
          .update({ status: participant.status })
          .eq("id", participant.id)
        if (participantError) throw participantError
      }

      setEditDialogOpen(false)
      fetchMatches()
    } catch (error) {
      console.error("Error updating match:", error)
    }
  }

  const handleDeleteEvent = async (eventId: string | undefined, index: number) => {
    if (eventId) {
      try {
        await supabase.from("match_events").delete().eq("id", eventId)
      } catch (error) {
        console.error("Error deleting event:", error)
        return
      }
    }
    setMatchEvents(matchEvents.filter((_, i) => i !== index))
  }

  const handleDeleteMatch = async (matchId: string) => {
    if (window.confirm("Are you sure you want to delete this match?")) {
      try {
        await supabase.from("matches").delete().eq("id", matchId)
        fetchMatches()
      } catch (error) {
        console.error("Error deleting match:", error)
      }
    }
  }

  const openEditDialog = async (match: Match) => {
    setSelectedMatch({ ...match, video_links: match.video_link?.split(",") || [""] })
    const { data: eventsData } = await supabase.from("match_events").select("*").eq("match_id", match.id)
    const { data: participantsData } = await supabase
      .from("match_participants")
      .select("*, profiles (id, full_name)")
      .eq("match_id", match.id)
    setMatchEvents(eventsData || [])
    setEditableParticipants(participantsData || [])
    setEditDialogOpen(true)
  }

  const handleVideoLinkChange = (index: number, value: string) => {
    if (!selectedMatch) return
    const newLinks = [...selectedMatch.video_links]
    newLinks[index] = value
    setSelectedMatch({ ...selectedMatch, video_links: newLinks })
  }
  const addVideoLink = () => {
    if (!selectedMatch) return
    setSelectedMatch({ ...selectedMatch, video_links: [...selectedMatch.video_links, ""] })
  }
  const removeVideoLink = (index: number) => {
    if (!selectedMatch) return
    const newLinks = selectedMatch.video_links.filter((_, i) => i !== index)
    setSelectedMatch({ ...selectedMatch, video_links: newLinks })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
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
            <h1 className="text-3xl font-bold text-gray-900">{t("matches")}</h1>
            <p className="text-gray-600 mt-1">Manage team matches and schedules</p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("createMatch")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("createMatch")}</DialogTitle>
                <DialogDescription>Create a new match for your team</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMatch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="opponent">{t("opponentTeam")}</Label>
                  <Input id="opponent" value={newMatch.opponent_team} onChange={(e) => setNewMatch({ ...newMatch, opponent_team: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">{t("matchDate")}</Label>
                  <Input id="date" type="datetime-local" value={newMatch.match_date} onChange={(e) => setNewMatch({ ...newMatch, match_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">{t("location")}</Label>
                  <Input id="location" value={newMatch.location} onChange={(e) => setNewMatch({ ...newMatch, location: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="home-jersey">{t("homeJerseyColor")}</Label>
                  <Input id="home-jersey" value={newMatch.home_jersey_color} onChange={(e) => setNewMatch({ ...newMatch, home_jersey_color: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="away-jersey">{t("awayJerseyColor")}</Label>
                  <Input id="away-jersey" value={newMatch.away_jersey_color} onChange={(e) => setNewMatch({ ...newMatch, away_jersey_color: e.target.value })} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="home-game" checked={newMatch.is_home_game} onCheckedChange={(checked) => setNewMatch({ ...newMatch, is_home_game: checked })} />
                  <Label htmlFor="home-game">{t("isHomeGame")}</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit">{t("create")}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {matches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No matches scheduled yet</p>
                <p className="text-sm text-gray-400 mt-1">Create your first match to get started</p>
              </CardContent>
            </Card>
          ) : (
            matches.map((match) => {
              const participantList = participants[match.id] || []
              const userStatus = getParticipationStatus(match.id)
              const acceptedCount = participantList.filter((p) => p.status === "accepted").length
              const keyPlayers = participantList.filter((p) => p.is_key_player)

              return (
                <Card key={match.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>vs {match.opponent_team}</span>
                          <Badge variant={match.status === "completed" ? "default" : "secondary"}>{match.status}</Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-2">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {match.match_date.replace("T", " ").substring(0, 16)}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {match.location}
                          </span>
                        </CardDescription>
                      </div>
                      {match.status === "completed" && (
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {match.final_score_home} - {match.final_score_away}
                          </div>
                          <div className="text-sm text-gray-500">Final Score</div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Jersey Colors</h4>
                        <div className="space-y-1 text-sm">
                          <div>Home: {match.home_jersey_color || "Not specified"}</div>
                          <div>Away: {match.away_jersey_color || "Not specified"}</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          Participants ({acceptedCount})
                        </h4>
                        <div className="space-y-1 text-sm">
                          {participantList.slice(0, 3).map((participant) => (
                            <div key={participant.id} className="flex items-center justify-between">
                              <span>{participant.profiles.full_name}</span>
                              <Badge variant={participant.status === "accepted" ? "default" : participant.status === "declined" ? "destructive" : "secondary"} className="text-xs">
                                {participant.status}
                              </Badge>
                            </div>
                          ))}
                          {participantList.length > 3 && <div className="text-gray-500">+{participantList.length - 3} more</div>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">{t("keyPlayers")}</h4>
                        <div className="space-y-1 text-sm">
                          {keyPlayers.length === 0 ? (
                            <span className="text-gray-500">None assigned</span>
                          ) : (
                            keyPlayers.map((player) => (
                              <div key={player.id}>
                                {player.profiles.full_name}
                                {player.profiles.jersey_number && <span className="text-gray-500"> #{player.profiles.jersey_number}</span>}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    {match.video_link && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center">
                          <Video className="h-4 w-4 mr-1" />
                          Match Video
                        </h4>
                        {match.video_link.split(',').map((link, index) => (
                          <a key={index} href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm block">
                            Watch Match Recording {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Your status:</span>
                        <Badge variant={userStatus === "accepted" ? "default" : userStatus === "declined" ? "destructive" : "secondary"}>
                          {t(userStatus as any)}
                        </Badge>
                      </div>
                      {userStatus === "pending" && (
                        <div className="space-x-2">
                          <Button size="sm" onClick={() => handleParticipationResponse(match.id, "accepted")}>
                            {t("accept")}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleParticipationResponse(match.id, "declined")}>
                            {t("decline")}
                          </Button>
                        </div>
                      )}
                      <div className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(match)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteMatch(match.id)}>
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
      {selectedMatch && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Match</DialogTitle>
              <DialogDescription>Edit details for the match against {selectedMatch.opponent_team}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opponent-team">Opponent Team</Label>
                  <Input id="opponent-team" value={selectedMatch.opponent_team} onChange={(e) => setSelectedMatch({ ...selectedMatch, opponent_team: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={selectedMatch.location} onChange={(e) => setSelectedMatch({ ...selectedMatch, location: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="score-home">Home Score</Label>
                  <Input id="score-home" type="number" value={selectedMatch.final_score_home || ""} onChange={(e) => setSelectedMatch({ ...selectedMatch, final_score_home: parseInt(e.target.value) || null })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="score-away">Away Score</Label>
                  <Input id="score-away" type="number" value={selectedMatch.final_score_away || ""} onChange={(e) => setSelectedMatch({ ...selectedMatch, final_score_away: parseInt(e.target.value) || null })} />
                </div>
              </div>
              <div>
                <Label>Match Videos</Label>
                {selectedMatch.video_links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <Input value={link} onChange={(e) => handleVideoLinkChange(index, e.target.value)} />
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeVideoLink(index)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addVideoLink}>
                  Add Video
                </Button>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Participants</h4>
                {editableParticipants.map((p, i) => (
                  <div key={p.id} className="grid grid-cols-2 gap-2 mb-2">
                    <p>{p.profiles.full_name}</p>
                    <Select value={p.status} onValueChange={(value) => {
                      const newParticipants = [...editableParticipants]
                      newParticipants[i].status = value
                      setEditableParticipants(newParticipants)
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-semibold mb-2">Match Events</h4>
                {matchEvents.map((event, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                    <Select value={event.event_type} onValueChange={(value) => {
                      const newEvents = [...matchEvents]
                      newEvents[index].event_type = value
                      setMatchEvents(newEvents)
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Event Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Goal">Goal</SelectItem>
                        <SelectItem value="Assist">Assist</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={event.player_id} onValueChange={(value) => {
                      const newEvents = [...matchEvents]
                      newEvents[index].player_id = value
                      setMatchEvents(newEvents)
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Player" />
                      </SelectTrigger>
                      <SelectContent>
                        {editableParticipants.map((p) => (
                          <SelectItem key={p.player_id} value={p.player_id}>
                            {p.profiles.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Time (mins)" type="number" value={event.event_time || ""} onChange={(e) => {
                      const newEvents = [...matchEvents]
                      newEvents[index].event_time = parseInt(e.target.value)
                      setMatchEvents(newEvents)
                    }} />
                    <Button type="button" variant="destructive" size="sm" onClick={() => handleDeleteEvent(event.id, index)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setMatchEvents([...matchEvents, { event_type: "Goal", player_id: "", event_time: 0, description: "" }])}>
                  Add Event
                </Button>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  )
