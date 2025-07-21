"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface Profile {
  id: string
  username: string
  email: string
  full_name: string
  jersey_number: number | null
  position: string | null
  phone: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  createUser: (userData: {
    email: string
    username: string
    password: string
    full_name: string
    jersey_number?: number
    position?: string
    phone?: string
  }) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
      setProfile(null)
    }
  }

  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }
    useEffect(() => {
      // 定義一個處理函式，當分頁變返可見時會被呼叫
      const handleVisibilityChange = async () => {
        // document.hidden 會話俾我哋知個分頁係咪喺背景
        if (!document.hidden) {
          // 當分頁由背景切換返嚟時，主動同 Supabase 講：
          // 「喂，我返嚟喇，唔該幫我重新整理一下 session 狀態。」
          // Supabase client 會喺底層檢查 token 有冇過期，有需要嘅話會自動刷新。
          // 呢個操作會確保我哋嘅 auth 狀態係最新嘅。
          await supabase.auth.getSession()
        }
      }

      // 喺 document 上面加一個事件監聽器，監聽 'visibilitychange' 事件
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // 當組件被 unmount (例如用戶離開網站) 時，
      // 清理返個監聽器，避免 memory leak
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }, []) // 空依賴陣列，確保呢個 effect 只會喺組件 mount 時執行一次

    initializeSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (data.user) {
      await fetchProfile(data.user.id)
    }
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setUser(null)
  }

  const createUser = async (userData: {
    email: string
    username: string
    password: string
    full_name: string
    jersey_number?: number
    position?: string
    phone?: string
  }) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      })

      if (authError) return { error: authError }

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
          jersey_number: userData.jersey_number || null,
          position: userData.position || null,
          phone: userData.phone || null,
        })

        if (profileError) return { error: profileError }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    createUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
