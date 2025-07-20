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
import { Plus, Calendar, MapPin, Users, Video } from "lucide-react"

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
    full_name: string
    jersey_number: number | null
  }
}

export default function MatchesPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [matches, setMatches] = useState<Match[]>([])
  const [participants, setParticipants] = useState<{ [key: string]: MatchParticipant[] }>({})
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
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

        // Fetch participants for each match
        const participantsData: { [key: string]: MatchParticipant[] } = {}
        for (const match of matchesData) {
          const { data } = await supabase
            .from("match_participants")
            .select(`
              *,
              profiles (
                full_name,
                jersey_number
              )
            `)
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

      // Add current user as participant
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
      const { error } = await supabase.from("match_participants").upsert({
        match_id: matchId,
        player_id: profile?.id,
        status,
      })

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
                  <Input
                    id="opponent"
                    value={newMatch.opponent_team}
                    onChange={(e) => setNewMatch({ ...newMatch, opponent_team: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">{t("matchDate")}</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={newMatch.match_date}
                    onChange={(e) => setNewMatch({ ...newMatch, match_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">{t("location")}</Label>
                  <Input
                    id="location"
                    value={newMatch.location}
                    onChange={(e) => setNewMatch({ ...newMatch, location: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="home-jersey">{t("homeJerseyColor")}</Label>
                  <Input
                    id="home-jersey"
                    value={newMatch.home_jersey_color}
                    onChange={(e) => setNewMatch({ ...newMatch, home_jersey_color: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="away-jersey">{t("awayJerseyColor")}</Label>
                  <Input
                    id="away-jersey"
                    value={newMatch.away_jersey_color}
                    onChange={(e) => setNewMatch({ ...newMatch, away_jersey_color: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="home-game"
                    checked={newMatch.is_home_game}
                    onCheckedChange={(checked) => setNewMatch({ ...newMatch, is_home_game: checked })}
                  />
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
                            {new Date(match.match_date).toLocaleDateString()} at{" "}
                            {new Date(match.match_date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
                              <Badge
                                variant={
                                  participant.status === "accepted"
                                    ? "default"
                                    : participant.status === "declined"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="text-xs"
                              >
                                {participant.status}
                              </Badge>
                            </div>
                          ))}
                          {participantList.length > 3 && (
                            <div className="text-gray-500">+{participantList.length - 3} more</div>
                          )}
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
                                {player.profiles.jersey_number && (
                                  <span className="text-gray-500"> #{player.profiles.jersey_number}</span>
                                )}
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
                        <a
                          href={match.video_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Watch Match Recording
                        </a>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Your status:</span>
                        <Badge
                          variant={
                            userStatus === "accepted"
                              ? "default"
                              : userStatus === "declined"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {t(userStatus as any)}
                        </Badge>
                      </div>

                      {userStatus === "pending" && (
                        <div className="space-x-2">
                          <Button size="sm" onClick={() => handleParticipationResponse(match.id, "accepted")}>
                            {t("accept")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleParticipationResponse(match.id, "declined")}
                          >
                            {t("decline")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
