"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Search, Phone, MapPin, Calendar as CalendarIcon, ArrowUpDown, List, LayoutGrid } from "lucide-react"
import { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { useIsMobile } from "@/hooks/use-mobile"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

interface Match {
  id: string
  match_date: string
}
interface MatchParticipant {
  player_id: string
  status: string
  match_id: string
}
interface MatchEvent {
  player_id: string
  event_type: string
  match_id: string
}
interface PlayerRating {
  rated_player_id: string
  rating: number
  match_id: string
}

type SortKey = keyof PlayerStats | 'full_name';

export default function PlayersPage() {
  const { profile, sessionKey } = useAuth()
  const { t } = useLanguage()
  const [players, setPlayers] = useState<Player[]>([])
  const [playerStats, setPlayerStats] = useState<{ [key: string]: PlayerStats }>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const isMobile = useIsMobile()
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  const [allMatches, setAllMatches] = useState<Match[]>([])
  const [allParticipants, setAllParticipants] = useState<MatchParticipant[]>([])
  const [allEvents, setAllEvents] = useState<MatchEvent[]>([])
  const [allRatings, setAllRatings] = useState<PlayerRating[]>([])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { data: playersData },
        { data: matchesData },
        { data: participantsData },
        { data: eventsData },
        { data: ratingsData },
      ] = await Promise.all([
        supabase.from("profiles").select("*").order("full_name", { ascending: true }),
        supabase.from("matches").select("id, match_date"),
        supabase.from("match_participants").select("player_id, status, match_id"),
        supabase.from("match_events").select("player_id, event_type, match_id"),
        supabase.from("player_ratings").select("rated_player_id, rating, match_id"),
      ])

      setPlayers(playersData || [])
      setAllMatches(matchesData || [])
      setAllParticipants(participantsData || [])
      setAllEvents(eventsData || [])
      setAllRatings(ratingsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (profile) {
      fetchAllData()
    }
  }, [profile, sessionKey, fetchAllData])

  useEffect(() => {
    if (loading) return

    const startDate = dateRange?.from
    const endDate = dateRange?.to

    const filteredMatchIds = allMatches
      .filter((match) => {
        const matchDate = new Date(match.match_date)
        if (startDate && matchDate < startDate) return false
        if (endDate) {
          const endOfDay = new Date(endDate)
          endOfDay.setHours(23, 59, 59, 999)
          if (matchDate > endOfDay) return false
        }
        return true
      })
      .map((match) => match.id)

    const stats: { [key: string]: PlayerStats } = {}
    for (const player of players) {
      const matches_played = allParticipants.filter(
        (p) => p.player_id === player.id && p.status === "accepted" && filteredMatchIds.includes(p.match_id)
      ).length

      const goals = allEvents.filter(
        (e) => e.player_id === player.id && e.event_type === "Goal" && filteredMatchIds.includes(e.match_id)
      ).length

      const assists = allEvents.filter(
        (e) => e.player_id === player.id && e.event_type === "Assist" && filteredMatchIds.includes(e.match_id)
      ).length

      const playerRatings = allRatings.filter(
        (r) => r.rated_player_id === player.id && filteredMatchIds.includes(r.match_id)
      )

      const average_rating =
        playerRatings.length > 0
          ? playerRatings.reduce((sum, r) => sum + r.rating, 0) / playerRatings.length
          : 0

      stats[player.id] = {
        matches_played,
        goals,
        assists,
        average_rating: Math.round(average_rating * 10) / 10,
      }
    }
    setPlayerStats(stats)
  }, [loading, players, allMatches, allParticipants, allEvents, allRatings, dateRange])

  const sortedAndFilteredPlayers = useMemo(() => {
    let sortableItems = players.filter(
      (player) =>
        player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.position && player.position.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = sortConfig.key === 'full_name' ? a.full_name : playerStats[a.id]?.[sortConfig.key] || 0;
        const bValue = sortConfig.key === 'full_name' ? b.full_name : playerStats[b.id]?.[sortConfig.key] || 0;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [players, searchTerm, sortConfig, playerStats]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (loading && players.length === 0) {
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
          <p className="text-gray-600 mt-1">{t("playerRosterStats")}</p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t("searchPlayers")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button id="date" variant={"outline"} className="w-full md:w-auto justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>{t("pickDateRange")}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={isMobile ? 1 : 2}
              />
            </PopoverContent>
          </Popover>
          <div className="flex items-center space-x-2">
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'table' ? 'default' : 'outline'} onClick={() => setViewMode('table')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedAndFilteredPlayers.map((player) => {
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
                              {t("you")}
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

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.matches_played}</div>
                        <div className="text-xs text-gray-500">{t("matches")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.goals}</div>
                        <div className="text-xs text-gray-500">{t("goals")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.assists}</div>
                        <div className="text-xs text-gray-500">{t("assists")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {stats.average_rating > 0 ? stats.average_rating.toFixed(1) : "-"}
                        </div>
                        <div className="text-xs text-gray-500">{t("rating")}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort('full_name')} className="cursor-pointer">
                    {t("player")} <ArrowUpDown className="h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => requestSort('matches_played')} className="cursor-pointer">
                    {t("matchesPlayed")} <ArrowUpDown className="h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => requestSort('goals')} className="cursor-pointer">
                    {t("goals")} <ArrowUpDown className="h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => requestSort('assists')} className="cursor-pointer">
                    {t("assists")} <ArrowUpDown className="h-4 w-4 inline" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredPlayers.map((player) => {
                  const stats = playerStats[player.id] || { matches_played: 0, goals: 0, assists: 0, average_rating: 0 };
                  return (
                    <TableRow key={player.id}>
                      <TableCell>{player.full_name}</TableCell>
                      <TableCell>{stats.matches_played}</TableCell>
                      <TableCell>{stats.goals}</TableCell>
                      <TableCell>{stats.assists}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        {sortedAndFilteredPlayers.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t("noPlayersFound")}</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm ? t("adjustSearch") : t("noPlayersAdded")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
