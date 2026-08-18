"use client"

export const dynamic = 'force-dynamic'
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { formatCurrency, getCurrentMonth, getMonthName } from "@/lib/utils"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { Plus, Pencil, Trash2, X, AlertTriangle } from "lucide-react"

interface Categoria {
  id: string
  nombre: string
  tipo: string
  color: string
}

interface Presupuesto {
  id: string
  categoria_id: string
  monto_limite: number
  mes: number
  anio: number
  categorias: Categoria | null
}

interface GastoCategoria {
  categoria_id: string
  total: number
}

export default function PresupuestosPage() {
  const { preferences } = useUserPreferences()
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [gastos, setGastos] = useState<GastoCategoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Presupuesto | null>(null)
  const { mes, anio } = getCurrentMonth()

  const [categoriaId, setCategoriaId] = useState("")
  const [montoLimite, setMontoLimite] = useState("")

  const fmt = (amount: number) => formatCurrency(amount, preferences.moneda)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: cats } = await supabase
      .from("categorias")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("tipo", "gasto")
      .order("nombre")

    setCategorias(cats || [])

    const { data: pres } = await supabase
      .from("presupuestos")
      .select("*, categorias(id, nombre, tipo, color)")
      .eq("usuario_id", user.id)
      .eq("mes", mes)
      .eq("anio", anio)

    setPresupuestos((pres as Presupuesto[]) || [])

    const startDate = `${anio}-${String(mes).padStart(2, "0")}-01`
    const endDate = `${anio}-${String(mes + 1 > 12 ? 1 : mes + 1).padStart(2, "0")}-01`

    const { data: trans } = await supabase
      .from("transacciones")
      .select("categoria_id, monto")
      .eq("usuario_id", user.id)
      .eq("tipo", "gasto")
      .gte("fecha", startDate)
      .lt("fecha", endDate)

    const gastosPorCategoria: GastoCategoria[] = []
    trans?.forEach((t) => {
      const existing = gastosPorCategoria.find((g) => g.categoria_id === t.categoria_id)
      if (existing) {
        existing.total += Number(t.monto)
      } else {
        gastosPorCategoria.push({ categoria_id: t.categoria_id, total: Number(t.monto) })
      }
    })
    setGastos(gastosPorCategoria)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const data = {
      usuario_id: user.id,
      categoria_id: categoriaId,
      monto_limite: Number(montoLimite),
      mes,
      anio,
    }

    if (editando) {
      await supabase.from("presupuestos").update(data).eq("id", editando.id)
    } else {
      await supabase.from("presupuestos").insert(data)
    }

    setShowModal(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este presupuesto?")) return
    const supabase = createClient()
    await supabase.from("presupuestos").delete().eq("id", id)
    fetchData()
  }

  const openModal = (pres?: Presupuesto) => {
    if (pres) {
      setEditando(pres)
      setCategoriaId(pres.categoria_id)
      setMontoLimite(String(pres.monto_limite))
    } else {
      setEditando(null)
      setCategoriaId("")
      setMontoLimite("")
    }
    setShowModal(true)
  }

  const getGastoCategoria = (catId: string) => gastos.find((g) => g.categoria_id === catId)?.total || 0

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
          <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-gray-500 text-sm">{getMonthName(mes)} {anio} — Controla tus gastos por categoría</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Presupuesto
        </button>
      </div>

      {presupuestos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <p className="text-gray-400 mb-2">No hay presupuestos este mes</p>
          <p className="text-sm text-gray-400">Crea un presupuesto para controlar tus gastos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presupuestos.map((p) => {
            const gasto = getGastoCategoria(p.categoria_id)
            const limite = Number(p.monto_limite)
            const porcentaje = Math.min((gasto / limite) * 100, 100)
            const excedido = gasto > limite

            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: p.categorias?.color || "#94a3b8" }}
                    />
                    <span className="font-medium text-gray-900">{p.categorias?.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {excedido && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <button onClick={() => openModal(p)} className="text-gray-400 hover:text-indigo-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Gastado</span>
                  <span className={`font-semibold ${excedido ? "text-red-600" : "text-gray-900"}`}>
                    {fmt(gasto)} / {fmt(limite)}
                  </span>
                </div>

                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      excedido ? "bg-red-500" : porcentaje > 80 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  {porcentaje.toFixed(0)}% utilizado · {fmt(limite - gasto)} restante
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editando ? "Editar Presupuesto" : "Nuevo Presupuesto"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Límite mensual</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoLimite}
                  onChange={(e) => setMontoLimite(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                {editando ? "Guardar Cambios" : "Crear Presupuesto"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}