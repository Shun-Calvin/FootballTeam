"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Search, Phone, MapPin } from "lucide-react"

interface Player {
  id: string
  username: string
  full_name: string
  jersey_number: number | null
  position: string | null
  phone: string | null
  created_at: string
}

interface PlayerStats {
  matches_played: number
  goals: number
  assists: number
  average_rating: number
}

export default function PlayersPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [players, setPlayers] = useState<Player[]>([])
  const [playerStats, setPlayerStats] = useState<{ [key: string]: PlayerStats }>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const { data: playersData } = await supabase.from("profiles").select("*").order("full_name", { ascending: true })

      if (playersData) {
        setPlayers(playersData)

        // Fetch stats for each player
        const stats: { [key: string]: PlayerStats } = {}
        for (const player of playersData) {
          // Get matches played
          const { count: matchesCount } = await supabase
            .from("match_participants")
            .select("*", { count: "exact", head: true })
            .eq("player_id", player.id)
            .eq("status", "accepted")

          // Get goals
          const { count: goalsCount } = await supabase
            .from("match_events")
            .select("*", { count: "exact", head: true })
            .eq("player_id", player.id)
            .eq("event_type", "goal")

          // Get assists
          const { count: assistsCount } = await supabase
            .from("match_events")
            .select("*", { count: "exact", head: true })
            .eq("player_id", player.id)
            .eq("event_type", "assist")

          // Get average rating
          const { data: ratingsData } = await supabase
            .from("player_ratings")
            .select("rating")
            .eq("rated_player_id", player.id)

          const averageRating =
            ratingsData && ratingsData.length > 0
              ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
              : 0

          stats[player.id] = {
            matches_played: matchesCount || 0,
            goals: goalsCount || 0,
            assists: assistsCount || 0,
            average_rating: Math.round(averageRating * 10) / 10,
          }
        }
        setPlayerStats(stats)
      }
    } catch (error) {
      console.error("Error fetching players:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPlayers = players.filter(
    (player) =>
      player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.position && player.position.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-3" />
            {t("players")}
          </h1>
          <p className="text-gray-600 mt-1">Team roster and player statistics</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => {
            const stats = playerStats[player.id] || {
              matches_played: 0,
              goals: 0,
              assists: 0,
              average_rating: 0,
            }

            return (
              <Card key={player.id} className={player.id === profile?.id ? "ring-2 ring-green-500" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                        {player.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg truncate">{player.full_name}</CardTitle>
                        {player.id === profile?.id && (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center space-x-2">
                        <span>@{player.username}</span>
                        {player.jersey_number && (
                          <>
                            <span>•</span>
                            <span>#{player.jersey_number}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Position and Contact */}
                  <div className="space-y-2">
                    {player.position && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{player.position}</span>
                      </div>
                    )}
                    {player.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{player.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.matches_played}</div>
                      <div className="text-xs text-gray-500">Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.goals}</div>
                      <div className="text-xs text-gray-500">Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.assists}</div>
                      <div className="text-xs text-gray-500">Assists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.average_rating > 0 ? stats.average_rating : "-"}
                      </div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredPlayers.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No players found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm ? "Try adjusting your search terms" : "No players have been added yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
