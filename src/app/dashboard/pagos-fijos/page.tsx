"use client"

export const dynamic = 'force-dynamic'
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { formatCurrency, getMonthName } from "@/lib/utils"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { Plus, Pencil, Trash2, X, Calendar, ToggleLeft, ToggleRight, Check, Clock } from "lucide-react"

interface Categoria {
  id: string
  nombre: string
  tipo: string
  color: string
}

interface PagoFijo {
  id: string
  nombre: string
  descripcion: string | null
  monto: number
  tipo: string
  dia_cobro: number
  activo: boolean
  categoria_id: string | null
  categorias: Categoria | null
}

export default function PagosFijosPage() {
  const { preferences } = useUserPreferences()
  const [pagos, setPagos] = useState<PagoFijo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<PagoFijo | null>(null)

  // Form state
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [monto, setMonto] = useState("")
  const [tipo, setTipo] = useState<"ingreso" | "gasto">("gasto")
  const [diaCobro, setDiaCobro] = useState(1)
  const [categoriaId, setCategoriaId] = useState("")
  const [activo, setActivo] = useState(true)

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
      .order("nombre")

    setCategorias(cats || [])

    const { data } = await supabase
      .from("pagos_fijos")
      .select("*, categorias(id, nombre, tipo, color)")
      .eq("usuario_id", user.id)
      .order("dia_cobro")

    setPagos((data as PagoFijo[]) || [])
    setLoading(false)
  }

  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const data = {
      usuario_id: user.id,
      nombre,
      descripcion,
      monto: Number(monto),
      tipo,
      dia_cobro: Number(diaCobro),
      categoria_id: categoriaId || null,
      activo,
    }

    if (editando) {
      await supabase.from("pagos_fijos").update(data).eq("id", editando.id)
    } else {
      await supabase.from("pagos_fijos").insert(data)
    }

    setShowModal(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este pago fijo?")) return
    const supabase = createClient()
    await supabase.from("pagos_fijos").delete().eq("id", id)
    fetchData()
  }

  const handleToggleActivo = async (pago: PagoFijo) => {
    const supabase = createClient()
    await supabase.from("pagos_fijos").update({ activo: !pago.activo }).eq("id", pago.id)
    fetchData()
  }

  const openModal = (pago?: PagoFijo) => {
    if (pago) {
      setEditando(pago)
      setNombre(pago.nombre)
      setDescripcion(pago.descripcion || "")
      setMonto(String(pago.monto))
      setTipo(pago.tipo as "ingreso" | "gasto")
      setDiaCobro(pago.dia_cobro)
      setCategoriaId(pago.categoria_id || "")
      setActivo(pago.activo)
    } else {
      setEditando(null)
      setNombre("")
      setDescripcion("")
      setMonto("")
      setTipo("gasto")
      setDiaCobro(1)
      setCategoriaId("")
      setActivo(true)
    }
    setShowModal(true)
  }

  const totalGastos = pagos.filter(p => p.tipo === "gasto" && p.activo).reduce((s, p) => s + Number(p.monto), 0)
  const totalIngresos = pagos.filter(p => p.tipo === "ingreso" && p.activo).reduce((s, p) => s + Number(p.monto), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wealth"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Pagos Fijos</h1>
          <p className="text-ink-muted text-sm">Gastos e ingresos recurrentes que se reflejan cada mes</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-wealth text-primary-foreground rounded-lg hover:bg-wealth-light transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Pago Fijo
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-ink-muted mb-1">Total Ingresos Fijos</p>
          <p className="text-lg font-bold text-wealth">{fmt(totalIngresos)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-ink-muted mb-1">Total Gastos Fijos</p>
          <p className="text-lg font-bold text-danger">{fmt(totalGastos)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-ink-muted mb-1">Balance Fijo</p>
          <p className={`text-lg font-bold ${totalIngresos - totalGastos >= 0 ? "text-wealth" : "text-danger"}`}>
            {fmt(totalIngresos - totalGastos)}
          </p>
        </div>
      </div>

      {/* Lista por día del mes */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {pagos.length === 0 ? (
          <div className="py-16 text-center text-ink-muted">
            <Calendar className="w-12 h-12 text-ink-subtle mx-auto mb-3" />
            <p>No hay pagos fijos configurados</p>
            <p className="text-sm mt-1">Agrega alquiler, suscripciones, salario, etc.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => {
              const pagosDia = pagos.filter(p => p.dia_cobro === dia)
              if (pagosDia.length === 0) return null

              return (
                <div key={dia} className="px-6 py-4 bg-surface border-b border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-wealth/10 rounded-full flex items-center justify-center text-wealth font-bold text-sm">
                      {dia}
                    </div>
                    <span className="text-sm font-medium text-ink">Día {dia} de cada mes</span>
                    <span className="text-xs text-ink-subtle">({pagosDia.length} pago{pagosDia.length > 1 ? 's' : ''})</span>
                  </div>
                  <div className="space-y-2 ml-11">
                    {pagosDia.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: p.categorias?.color || (p.tipo === "ingreso" ? "#10b981" : "#ef4444") }}
                          />
                          <div>
                            <p className="text-sm font-medium text-ink">{p.nombre}</p>
                            <p className="text-xs text-ink-subtle">{p.categorias?.nombre || "Sin categoría"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-semibold ${p.tipo === "ingreso" ? "text-wealth" : "text-danger"}`}>
                            {p.tipo === "ingreso" ? "+" : "-"}{fmt(Number(p.monto))}
                          </span>
                          <button
                            onClick={() => handleToggleActivo(p)}
                            className={`relative w-10 h-6 rounded-full transition-colors ${
                              p.activo ? "bg-wealth" : "bg-surface"
                            }`}
                          >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              p.activo ? "right-0.5" : "left-0.5"
                            }`} />
                          </button>
                          <button onClick={() => openModal(p)} className="text-ink-subtle hover:text-wealth p-1">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="text-ink-subtle hover:text-danger p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-lg font-semibold text-ink">
                {editando ? "Editar Pago Fijo" : "Nuevo Pago Fijo"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-ink-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-border-strong rounded-lg focus:ring-2 focus:ring-wealth focus:border-transparent outline-none"
                  placeholder="Ej: Alquiler, Netflix, Salario..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Descripción (opcional)</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border-strong rounded-lg focus:ring-2 focus:ring-wealth focus:border-transparent outline-none"
                  placeholder="Detalles adicionales"
                />
              </div>

              <div className="flex bg-surface rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => { setTipo("gasto"); setCategoriaId("") }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    tipo === "gasto" ? "bg-danger text-destructive-foreground" : "text-ink-muted"
                  }`}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => { setTipo("ingreso"); setCategoriaId("") }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    tipo === "ingreso" ? "bg-wealth text-primary-foreground" : "text-ink-muted"
                  }`}
                >
                  Ingreso
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-border-strong rounded-lg focus:ring-2 focus:ring-wealth focus:border-transparent outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Día de cobro (1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={diaCobro}
                  onChange={(e) => setDiaCobro(Math.min(31, Math.max(1, Number(e.target.value))))}
                  required
                  className="w-full px-4 py-2.5 border border-border-strong rounded-lg focus:ring-2 focus:ring-wealth focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Categoría</label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border-strong rounded-lg focus:ring-2 focus:ring-wealth focus:border-transparent outline-none bg-surface-elevated"
                >
                  <option value="">Sin categoría</option>
                  {categoriasFiltradas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ink">Activo</label>
                <button
                  type="button"
                  onClick={() => setActivo(!activo)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    activo ? "bg-wealth" : "bg-surface"
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    activo ? "right-1" : "left-1"
                  }`} />
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-wealth hover:bg-wealth-light text-primary-foreground font-medium rounded-lg transition-colors"
              >
                {editando ? "Guardar Cambios" : "Crear Pago Fijo"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}