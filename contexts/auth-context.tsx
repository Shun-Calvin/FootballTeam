"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
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

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
    if (error) {
      console.error("Error fetching profile:", error)
      setProfile(null)
    } else {
      setProfile(data)
    }
  }, [])

  const refreshSessionAndProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
    if (session?.user) {
      await fetchProfile(session.user.id)
    } else {
      setProfile(null)
    }
    setSessionKey(prev => prev + 1)
    setLoading(false)
  }, [fetchProfile])

  useEffect(() => {
    // Initial check
    refreshSessionAndProfile()

    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Use setTimeout to avoid deadlocks
      setTimeout(() => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setSessionKey(prev => prev + 1)
      }, 0)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile, refreshSessionAndProfile])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Use setTimeout to avoid deadlocks
        setTimeout(() => {
          refreshSessionAndProfile()
        }, 0)
      }
    }
    
    // Add event listeners for both focus and visibility change
    window.addEventListener('focus', refreshSessionAndProfile)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Clean up listeners on component unmount
    return () => {
      window.removeEventListener('focus', refreshSessionAndProfile)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshSessionAndProfile])

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
