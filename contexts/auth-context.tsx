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
  sessionKey: number
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
  const [sessionKey, setSessionKey] = useState(0)

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
    if (error) {
      console.error("Error fetching profile:", error)
      setProfile(null)
    } else {
      setProfile(data)
    }
  }

  // Effect for initializing session and listening for auth changes
  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      setSessionKey(prev => prev + 1);
      setLoading(false)
    }

    initializeSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setSessionKey(prev => prev + 1);
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // This effect runs once on mount

  // Effect for handling tab visibility to refresh the session
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // This tells the Supabase client to check the session and refresh if needed.
        // If the session has changed, it will trigger the onAuthStateChange listener above.
        await supabase.auth.getSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, []) // This effect also runs once on mount

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (data.user) {
      await fetchProfile(data.user.id)
    }
    setLoading(false)
    return { error }
  }

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setLoading(false)
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
    sessionKey,
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
