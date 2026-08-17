"use client"

import { useState } from "react"
import { X, Save, Globe, Clock, DollarSign } from "lucide-react"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { preferences, loading, updatePreferences } = useUserPreferences()
  const [saving, setSaving] = useState(false)
  const [moneda, setMoneda] = useState(preferences.moneda)
  const [idioma, setIdioma] = useState(preferences.idioma)
  const [zonaHoraria, setZonaHoraria] = useState(preferences.zona_horaria)

  const handleSave = async () => {
    setSaving(true)
    const success = await updatePreferences({ moneda, idioma, zona_horaria: zonaHoraria })
    if (success) {
      onClose()
    }
    setSaving(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            Configuración
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Moneda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              Moneda
            </label>
            <select
              value={moneda}
              onChange={(e) => setMoneda(e.target.value as CurrencyCode)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
            >
              {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.name} ({code}) - {info.symbol}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Ejemplo: {formatCurrency(1234.56, moneda)}
            </p>
          </div>

          {/* Idioma */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" />
              Idioma
            </label>
            <select
              value={idioma}
              onChange={(e) => setIdioma(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Zona horaria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Zona horaria
            </label>
            <select
              value={zonaHoraria}
              onChange={(e) => setZonaHoraria(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
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
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saving ? "Guardando..." : "Guardar"}
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}