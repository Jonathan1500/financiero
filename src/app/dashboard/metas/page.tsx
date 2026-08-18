"use client"

export const dynamic = 'force-dynamic'
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { Plus, Pencil, Trash2, X, Target, ArrowUp, ArrowDown } from "lucide-react"

interface Meta {
  id: string
  nombre: string
  monto_objetivo: number
  monto_actual: number
  fecha_limite: string | null
  created_at: string
}

export default function MetasPage() {
  const { preferences } = useUserPreferences()
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDepositarModal, setShowDepositarModal] = useState(false)
  const [editando, setEditando] = useState<Meta | null>(null)
  const [metaSeleccionada, setMetaSeleccionada] = useState<Meta | null>(null)
  const [montoDeposito, setMontoDeposito] = useState("")
  const [tipoDeposito, setTipoDeposito] = useState<"deposito" | "retiro">("deposito")

  const [nombre, setNombre] = useState("")
  const [montoObjetivo, setMontoObjetivo] = useState("")
  const [montoActual, setMontoActual] = useState("")
  const [fechaLimite, setFechaLimite] = useState("")

  const fmt = (amount: number) => formatCurrency(amount, preferences.moneda)

  useEffect(() => {
    fetchMetas()
  }, [])

  const fetchMetas = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("metas_ahorro")
      .select("*")
      .eq("usuario_id", user.id)
      .order("created_at", { ascending: false })

    setMetas((data as Meta[]) || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const data = {
      usuario_id: user.id,
      nombre,
      monto_objetivo: Number(montoObjetivo),
      monto_actual: Number(montoActual || 0),
      fecha_limite: fechaLimite || null,
    }

    if (editando) {
      await supabase.from("metas_ahorro").update(data).eq("id", editando.id)
    } else {
      await supabase.from("metas_ahorro").insert(data)
    }

    setShowModal(false)
    fetchMetas()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta meta?")) return
    const supabase = createClient()
    await supabase.from("metas_ahorro").delete().eq("id", id)
    fetchMetas()
  }

  const handleDeposito = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!metaSeleccionada) return

    const supabase = createClient()
    const nuevoMonto = tipoDeposito === "deposito"
      ? Number(metaSeleccionada.monto_actual) + Number(montoDeposito)
      : Number(metaSeleccionada.monto_actual) - Number(montoDeposito)

    await supabase
      .from("metas_ahorro")
      .update({ monto_actual: Math.max(0, nuevoMonto) })
      .eq("id", metaSeleccionada.id)

    setShowDepositarModal(false)
    setMontoDeposito("")
    fetchMetas()
  }

  const openModal = (meta?: Meta) => {
    if (meta) {
      setEditando(meta)
      setNombre(meta.nombre)
      setMontoObjetivo(String(meta.monto_objetivo))
      setMontoActual(String(meta.monto_actual))
      setFechaLimite(meta.fecha_limite || "")
    } else {
      setEditando(null)
      setNombre("")
      setMontoObjetivo("")
      setMontoActual("")
      setFechaLimite("")
    }
    setShowModal(true)
  }

  const openDepositarModal = (meta: Meta, tipo: "deposito" | "retiro") => {
    setMetaSeleccionada(meta)
    setTipoDeposito(tipo)
    setMontoDeposito("")
    setShowDepositarModal(true)
  }

  const totalAhorrado = metas.reduce((sum, m) => sum + Number(m.monto_actual), 0)
  const totalObjetivo = metas.reduce((sum, m) => sum + Number(m.monto_objetivo), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas de Ahorro</h1>
          <p className="text-gray-500 text-sm">Define objetivos y alcanza tus metas financieras</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Meta
        </button>
      </div>

      {/* Summary */}
      {metas.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6" />
            <span className="font-semibold">Progreso Total</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-white/80">Ahorrado</p>
              <p className="text-2xl font-bold">{fmt(totalAhorrado)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80">Objetivo</p>
              <p className="text-lg font-semibold">{fmt(totalObjetivo)}</p>
            </div>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${Math.min((totalAhorrado / totalObjetivo) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Metas */}
      {metas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No tienes metas de ahorro</p>
          <p className="text-sm text-gray-400">Crea una meta para empezar a ahorrar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metas.map((meta) => {
            const progreso = Math.min((Number(meta.monto_actual) / Number(meta.monto_objetivo)) * 100, 100)
            const completada = Number(meta.monto_actual) >= Number(meta.monto_objetivo)
            const diasRestantes = meta.fecha_limite
              ? Math.ceil((new Date(meta.fecha_limite).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null

            return (
              <div key={meta.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${completada ? "bg-emerald-100" : "bg-indigo-100"}`}>
                      <Target className={`w-4 h-4 ${completada ? "text-emerald-600" : "text-indigo-600"}`} />
                    </div>
                    <span className="font-medium text-gray-900">{meta.nombre}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openDepositarModal(meta, "deposito")} className="text-gray-400 hover:text-emerald-600 p-1" title="Depositar">
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => openDepositarModal(meta, "retiro")} className="text-gray-400 hover:text-amber-600 p-1" title="Retirar">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => openModal(meta)} className="text-gray-400 hover:text-indigo-600 p-1">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(meta.id)} className="text-gray-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Ahorrado</span>
                  <span className="font-semibold text-gray-900">
                    {fmt(Number(meta.monto_actual))} / {fmt(Number(meta.monto_objetivo))}
                  </span>
                </div>

                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${completada ? "bg-emerald-500" : "bg-indigo-500"}`}
                    style={{ width: `${progreso}%` }}
                  />
                </div>

                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-400">{progreso.toFixed(0)}% completado</p>
                  {diasRestantes !== null && (
                    <p className={`text-xs ${diasRestantes < 0 ? "text-red-500" : "text-gray-400"}`}>
                      {diasRestantes < 0 ? `${Math.abs(diasRestantes)} días vencida` : `${diasRestantes} días restantes`}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Nueva Meta */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editando ? "Editar Meta" : "Nueva Meta de Ahorro"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Ej: Viaje, Carro, Casa..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Objetivo</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoObjetivo}
                  onChange={(e) => setMontoObjetivo(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
              </div>

              {!editando && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto Inicial (opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoActual}
                    onChange={(e) => setMontoActual(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite (opcional)</label>
                <input
                  type="date"
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                {editando ? "Guardar Cambios" : "Crear Meta"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Depositar/Retirar */}
      {showDepositarModal && metaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {tipoDeposito === "deposito" ? "Depositar" : "Retirar"} — {metaSeleccionada.nombre}
              </h2>
              <button onClick={() => setShowDepositarModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDeposito} className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Actual: {fmt(Number(metaSeleccionada.monto_actual))}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={tipoDeposito === "retiro" ? metaSeleccionada.monto_actual : undefined}
                  value={montoDeposito}
                  onChange={(e) => setMontoDeposito(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
              </div>
              <button
                type="submit"
                className={`w-full py-3 text-white font-medium rounded-lg transition-colors ${
                  tipoDeposito === "deposito"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {tipoDeposito === "deposito" ? "Depositar" : "Retirar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}