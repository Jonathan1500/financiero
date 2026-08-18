"use client"

import { useState } from "react"
import { X, Save, Globe, Clock, DollarSign, Sun, Moon, Monitor } from "lucide-react"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const themeOptions = [
  { value: "light" as const, label: "Claro", icon: Sun },
  { value: "dark" as const, label: "Oscuro", icon: Moon },
  { value: "system" as const, label: "Sistema", icon: Monitor },
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Configuración
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tema */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Tema
            </label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTema(value)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    tema === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${tema === value ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-sm font-medium text-center block ${tema === value ? "text-primary" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                  {tema === value && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Moneda */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Moneda
            </label>
            <select
              value={moneda}
              onChange={(e) => setMoneda(e.target.value as CurrencyCode)}
              className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background"
            >
              {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.name} ({code}) - {info.symbol}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-muted-foreground">
              Ejemplo: {formatCurrency(1234.56, moneda)}
            </p>
          </div>

          {/* Idioma */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Idioma
            </label>
            <select
              value={idioma}
              onChange={(e) => setIdioma(e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Zona horaria */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Zona horaria
            </label>
            <select
              value={zonaHoraria}
              onChange={(e) => setZonaHoraria(e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background"
            >
              <option value="America/Santo_Domingo">República Dominicana (AST)</option>
              <option value="America/Guatemala">Guatemala (CST)</option>
              <option value="America/Mexico_City">México (CST)</option>
              <option value="America/Bogota">Colombia (COT)</option>
              <option value="America/Lima">Perú (PET)</option>
              <option value="America/Argentina/Buenos_Aires">Argentina (ART)</option>
              <option value="America/Caracas">Venezuela (VET)</option>
              <option value="America/Santiago">Chile (CLT/CLST)</option>
              <option value="America/Montevideo">Uruguay (UYT)</option>
              <option value="Europe/Madrid">España (CET/CEST)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saving ? "Guardando..." : "Guardar"}
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}