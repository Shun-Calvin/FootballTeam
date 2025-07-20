"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, Calendar, Users, ClipboardList, User, LogOut, Menu, Globe } from "lucide-react"
import type { Language } from "@/lib/i18n"

const navigation = [
  { name: "dashboard", href: "/dashboard", icon: Home },
  { name: "matches", href: "/matches", icon: Calendar },
  { name: "players", href: "/players", icon: Users },
  { name: "availability", href: "/availability", icon: ClipboardList },
  { name: "profile", href: "/profile", icon: User },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { signOut, profile, loading } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !profile) {
      router.push("/login")
    }
  }, [profile, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? "p-4" : "p-6"}`}>
      <div className="flex items-center space-x-2 mb-8">
        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">FC</span>
        </div>
        <span className="font-bold text-lg">Football Team</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <Icon className="h-5 w-5" />
              <span>{t(item.name as any)}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4" />
          <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-medium text-sm">{profile?.full_name?.charAt(0) || "U"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">#{profile?.jersey_number || "N/A"}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          {t("logout")}
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:bg-white lg:border-r">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <span className="font-semibold">Football Team</span>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
