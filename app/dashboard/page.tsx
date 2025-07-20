"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Trophy, Clock } from "lucide-react"

interface DashboardStats {
  upcomingMatches: number
  totalPlayers: number
  matchesPlayed: number
  pendingInvitations: number
}

interface UpcomingMatch {
  id: string
  opponent_team: string
  match_date: string
  location: string
  status: string
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState<DashboardStats>({
    upcomingMatches: 0,
    totalPlayers: 0,
    matchesPlayed: 0,
    pendingInvitations: 0,
  })
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return; // Don't fetch data if profile is not loaded yet

    const fetchDashboardData = async () => {
      try {
        // Fetch upcoming matches
        const { data: matches } = await supabase
          .from("matches")
          .select("*")
          .gte("match_date", new Date().toISOString())
          .order("match_date", { ascending: true })
          .limit(5)

        // Fetch total players
        const { count: playersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

        // Fetch matches played
        const { count: matchesPlayedCount } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed")

        // Fetch pending invitations for current user
        const { count: pendingCount } = await supabase
          .from("match_participants")
          .select("*", { count: "exact", head: true })
          .eq("player_id", profile.id)
          .eq("status", "pending")

        setStats({
          upcomingMatches: matches?.length || 0,
          totalPlayers: playersCount || 0,
          matchesPlayed: matchesPlayedCount || 0,
          pendingInvitations: pendingCount || 0,
        })

        setUpcomingMatches(matches || [])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [profile])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">{t("welcomeBack", { name: profile?.full_name || "" })}</h1>
          <p className="text-gray-600 mt-1">{t("teamStatus")}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("upcomingMatches")}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingMatches}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalPlayers")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlayers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("matchesPlayed")}</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.matchesPlayed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("pendingInvitations")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvitations}</div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Matches */}
        <Card>
          <CardHeader>
            <CardTitle>{t("upcomingMatches")}</CardTitle>
            <CardDescription>{t("nextMatches")}</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMatches.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t("noUpcomingMatches")}</p>
            ) : (
              <div className="space-y-4">
                {upcomingMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{t("vs", { opponent_team: match.opponent_team })}</h3>
                      <p className="text-sm text-gray-600">{match.location}</p>
                      <p className="text-sm text-gray-500">
                        {match.match_date.replace("T", " ").substring(0, 16)}
                      </p>
                    </div>
                    <Badge variant={match.status === "scheduled" ? "default" : "secondary"}>{match.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
