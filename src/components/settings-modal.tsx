"use client"

import { useState } from "react"
import { X, Save, Globe, Clock, DollarSign, Monitor, Sun, Moon, Check } from "lucide-react"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const themeOptions = [
  { value: "light" as const, label: "Claro", icon: Sun, desc: "Siempre claro" },
  { value: "dark" as const, label: "Oscuro", icon: Moon, desc: "Siempre oscuro" },
  { value: "system" as const, label: "Sistema", icon: Monitor, desc: "Según tu SO" },
]

const timezones = [
  { value: "America/Guatemala", label: "Guatemala (CST)" },
  { value: "America/Santo_Domingo", label: "República Dominicana (AST)" },
  { value: "America/Mexico_City", label: "México (CST)" },
  { value: "America/Bogota", label: "Colombia (COT)" },
  { value: "America/Lima", label: "Perú (PET)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (ART)" },
  { value: "America/Caracas", label: "Venezuela (VET)" },
  { value: "America/Santiago", label: "Chile (CLT/CLST)" },
  { value: "America/Montevideo", label: "Uruguay (UYT)" },
  { value: "Europe/Madrid", label: "España (CET/CEST)" },
  { value: "UTC", label: "UTC" },
]

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { preferences, loading, updatePreferences } = useUserPreferences()
  const { setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [moneda, setMoneda] = useState(preferences.moneda)
  const [idioma, setIdioma] = useState(preferences.idioma)
  const [zonaHoraria, setZonaHoraria] = useState(preferences.zona_horaria)
  const [tema, setTema] = useState(preferences.tema)

  const handleSave = async () => {
    setSaving(true)
    const success = await updatePreferences({ 
      moneda, 
      idioma, 
      zona_horaria: zonaHoraria,
      tema 
    })
    if (success) {
      await setTheme(tema)
      onClose()
    }
    setSaving(false)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose} aria-hidden="true">
      <div 
        className="modal-content animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="settings-title" className="font-display text-xl font-medium text-ink">
            Configuración
          </h2>
          <button 
            onClick={onClose} 
            className="btn btn-ghost p-2 rounded-xl"
            aria-label="Cerrar configuración"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Tema */}
          <fieldset>
            <legend className="label flex items-center gap-2 mb-4">
              <Monitor className="w-4 h-4" aria-hidden="true" />
              Tema
            </legend>
            <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Seleccionar tema">
              {themeOptions.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTema(value)}
                  role="radio"
                  aria-checked={tema === value}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    tema === value
                      ? "border-wealth bg-wealth/5"
                      : "border-border hover:border-wealth/30"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${tema === value ? "text-wealth" : "text-ink-muted"}`} aria-hidden="true" />
                  </div>
                  <span className={`text-sm font-medium text-center block ${tema === value ? "text-wealth" : "text-ink-muted"}`}>
                    {label}
                  </span>
                  <p className="text-xs text-ink-muted text-center mt-1">{desc}</p>
                  {tema === value && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-wealth rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Moneda */}
          <div>
            <label className="label flex items-center gap-2">
              <DollarSign className="w-4 h-4" aria-hidden="true" />
              Moneda
            </label>
            <select
              value={moneda}
              onChange={(e) => setMoneda(e.target.value as CurrencyCode)}
              className="input select"
              aria-label="Seleccionar moneda"
            >
              {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.name} ({code}) — {info.symbol}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-ink-muted">
              Ejemplo: <span className="font-mono-nums text-ink">{formatCurrency(1234.56, moneda)}</span>
            </p>
          </div>

          {/* Idioma */}
          <div>
            <label className="label flex items-center gap-2">
              <Globe className="w-4 h-4" aria-hidden="true" />
              Idioma
            </label>
            <select
              value={idioma}
              onChange={(e) => setIdioma(e.target.value)}
              className="input select"
              aria-label="Seleccionar idioma"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Zona horaria */}
          <div>
            <label className="label flex items-center gap-2">
              <Clock className="w-4 h-4" aria-hidden="true" />
              Zona horaria
            </label>
            <select
              value={zonaHoraria}
              onChange={(e) => setZonaHoraria(e.target.value)}
              className="input select"
              aria-label="Seleccionar zona horaria"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            className="btn btn-accent w-full py-3 mt-2"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
            <Save className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}