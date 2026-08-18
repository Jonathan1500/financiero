"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-browser"
import type { CurrencyCode } from "@/lib/utils"

type Theme = "light" | "dark" | "system"

interface UserPreferences {
  moneda: CurrencyCode
  idioma: string
  zona_horaria: string
  tema: Theme
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    moneda: "DOP",
    idioma: "es",
    zona_horaria: "America/Santo_Domingo",
    tema: "system",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("user_preferences")
      .select("moneda, idioma, zona_horaria, tema")
      .eq("usuario_id", user.id)
      .single()

    if (data) {
      setPreferences(data as UserPreferences)
    }
    setLoading(false)
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from("user_preferences")
      .upsert({
        usuario_id: user.id,
        ...preferences,
        ...updates,
      })

    if (!error) {
      setPreferences(prev => ({ ...prev, ...updates }))
      return true
    }
    return false
  }

  return { preferences, loading, updatePreferences, refetch: fetchPreferences }
}