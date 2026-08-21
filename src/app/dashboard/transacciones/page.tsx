"use client"

export const dynamic = 'force-dynamic'
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { formatCurrency, formatDate, getCurrentMonth, getDaysInMonth } from "@/lib/utils"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { Plus, Pencil, Trash2, X, Filter, Calendar, CheckCircle } from "lucide-react"

interface Categoria {
  id: string
  nombre: string
  tipo: string
  color: string
}

interface Transaccion {
  id: string
  monto: number
  descripcion: string
  fecha: string
  tipo: string
  categoria_id: string
  categorias: Categoria | null
  esFijo?: boolean
  pagoFijoId?: string
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

export default function TransaccionesPage() {
  const { preferences } = useUserPreferences()
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [pagosFijos, setPagosFijos] = useState<PagoFijo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Transaccion | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [filtroMes, setFiltroMes] = useState(getCurrentMonth().mes)
  const [filtroAnio, setFiltroAnio] = useState(getCurrentMonth().anio)
  const [mostrarFijos, setMostrarFijos] = useState(true)

  // Form state
  const [tipo, setTipo] = useState("gasto")
  const [monto, setMonto] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])

  const fmt = (amount: number) => formatCurrency(amount, preferences.moneda)

  useEffect(() => {
    fetchData()
  }, [filtroMes, filtroAnio])

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

    // Pagos fijos activos
    const { data: fijos } = await supabase
      .from("pagos_fijos")
      .select("*, categorias(id, nombre, tipo, color)")
      .eq("usuario_id", user.id)
      .eq("activo", true)
      .order("dia_cobro")

    setPagosFijos((fijos as PagoFijo[]) || [])

    const startDate = `${filtroAnio}-${String(filtroMes).padStart(2, "0")}-01`
    const endDate = `${filtroAnio}-${String(filtroMes + 1 > 12 ? 1 : filtroMes + 1).padStart(2, "0")}-01`

    const { data: trans } = await supabase
      .from("transacciones")
      .select("*, categorias(id, nombre, tipo, color)")
      .eq("usuario_id", user.id)
      .gte("fecha", startDate)
      .lt("fecha", endDate)
      .order("fecha", { ascending: false })

    setTransacciones((trans as Transaccion[]) || [])
    setLoading(false)
  }

  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo)

  // Combinar transacciones reales + pagos fijos del mes
  const getTransaccionesConFijos = () => {
    let resultado = [...transacciones]

    if (mostrarFijos) {
      const diasEnMes = getDaysInMonth(filtroMes, filtroAnio)
      const fijosDelMes = pagosFijos.filter(p => p.dia_cobro <= diasEnMes)

      const fijosComoTransacciones: Transaccion[] = fijosDelMes.map((p) => ({
        id: `fijo-${p.id}`,
        monto: Number(p.monto),
        descripcion: p.nombre + (p.descripcion ? ` - ${p.descripcion}` : ""),
        fecha: `${filtroAnio}-${String(filtroMes).padStart(2, "0")}-${String(p.dia_cobro).padStart(2, "0")}`,
        tipo: p.tipo,
        categoria_id: p.categoria_id || "",
        categorias: p.categorias,
        esFijo: true,
        pagoFijoId: p.id,
      }))

      resultado = [...resultado, ...fijosComoTransacciones].sort((a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )
    }

    return resultado
  }

  const todasTransacciones = getTransaccionesConFijos()

  const filteredTransacciones = filtroTipo === "todos"
    ? todasTransacciones
    : todasTransacciones.filter((t) => t.tipo === filtroTipo)

  const totalIngresos = filteredTransacciones.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + Number(t.monto), 0)
  const totalGastos = filteredTransacciones.filter((t) => t.tipo === "gasto").reduce((s, t) => s + Number(t.monto), 0)

  const openModal = (trans?: Transaccion) => {
    if (trans) {
      setEditando(trans)
      setTipo(trans.tipo)
      setMonto(String(trans.monto))
      setDescripcion(trans.descripcion || "")
      setCategoriaId(trans.categoria_id || "")
      setFecha(trans.fecha)
    } else {
      setEditando(null)
      setTipo("gasto")
      setMonto("")
      setDescripcion("")
      setCategoriaId("")
      setFecha(new Date().toISOString().split("T")[0])
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const data = {
      usuario_id: user.id,
      tipo,
      monto: Number(monto),
      descripcion,
      categoria_id: categoriaId || null,
      fecha,
    }

    if (editando) {
      if (editando.esFijo) {
        // Si es un pago fijo, crear transacción real y opcionalmente desactivar el fijo
        await supabase.from("transacciones").insert(data)
      } else {
        await supabase.from("transacciones").update(data).eq("id", editando.id)
      }
    } else {
      await supabase.from("transacciones").insert(data)
    }

    setShowModal(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta transacción?")) return
    const supabase = createClient()
    
    if (id.startsWith("fijo-")) {
      // No se puede eliminar un pago fijo desde aquí, solo desactivar
      alert("Los pagos fijos se gestionan en la sección 'Pagos Fijos'")
      return
    }
    
    await supabase.from("transacciones").delete().eq("id", id)
    fetchData()
  }

  const confirmarFijo = async (pagoFijoId: string, fecha: string) => {
    const pago = pagosFijos.find(p => p.id === pagoFijoId)
    if (!pago) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("transacciones").insert({
      usuario_id: user.id,
      tipo: pago.tipo,
      monto: Number(pago.monto),
      descripcion: pago.nombre + (pago.descripcion ? ` - ${pago.descripcion}` : ""),
      categoria_id: pago.categoria_id,
      fecha,
    })

    fetchData()
  }

  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ]

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
          <h1 className="text-2xl font-bold text-ink">Transacciones</h1>
          <p className="text-ink-muted text-sm">Gestiona tus ingresos y gastos</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-wealth text-primary-foreground rounded-lg hover:bg-wealth-light transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Transacción
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-ink-muted" />
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(Number(e.target.value))}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-surface-elevated"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(Number(e.target.value))}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-surface-elevated"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex bg-surface rounded-lg p-1">
          {["todos", "ingreso", "gasto"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltroTipo(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filtroTipo === f
                  ? "bg-card-elevated text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {f === "todos" ? "Todos" : f === "ingreso" ? "Ingresos" : "Gastos"}
            </button>
          ))}
        </div>
        {/* Toggle pagos fijos */}
        <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer">
          <input
            type="checkbox"
            checked={mostrarFijos}
            onChange={(e) => setMostrarFijos(e.target.checked)}
            className="w-4 h-4 text-wealth border-border-strong rounded focus:ring-wealth"
          />
          <Calendar className="w-4 h-4" />
          Mostrar pagos fijos
        </label>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-ink-muted mb-1">Ingresos</p>
          <p className="text-lg font-bold text-wealth">{fmt(totalIngresos)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-ink-muted mb-1">Gastos</p>
          <p className="text-lg font-bold text-danger">{fmt(totalGastos)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-ink-muted mb-1">Balance</p>
          <p className={`text-lg font-bold ${totalIngresos - totalGastos >= 0 ? "text-wealth" : "text-danger"}`}>
            {fmt(totalIngresos - totalGastos)}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {filteredTransacciones.length === 0 ? (
          <div className="py-12 text-center text-ink-muted">
            <p>No hay transacciones para este período</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTransacciones.map((t) => (
              <div
                key={t.id}
                className={`flex items-center justify-between px-6 py-3 hover:bg-muted ${t.esFijo ? "bg-wealth/5" : ""}`}
              >
                <div className="flex items-center gap-3">
                  {t.esFijo && (
                    <span className="px-2 py-0.5 text-xs bg-wealth/10 text-wealth rounded-full font-medium">
                      FIJO
                    </span>
                  )}
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: t.categorias?.color || (t.tipo === "ingreso" ? "#10b981" : "#ef4444") }}
                  />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {t.descripcion || t.categorias?.nombre || "Sin descripción"}
                    </p>
                    <p className="text-xs text-ink-subtle">
                       {t.categorias?.nombre} · {formatDate(t.fecha)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${t.tipo === "ingreso" ? "text-wealth" : "text-danger"}`}>
                    {t.tipo === "ingreso" ? "+" : "-"}{fmt(Number(t.monto))}
                  </p>
                  {t.esFijo ? (
                    <button
                      onClick={() => confirmarFijo(t.pagoFijoId!, t.fecha)}
                      className="px-3 py-1.5 text-xs bg-wealth text-primary-foreground rounded-lg hover:bg-wealth-light transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Confirmar
                    </button>
                  ) : (
                    <>
                      <button onClick={() => openModal(t)} className="text-ink-subtle hover:text-wealth">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="text-ink-subtle hover:text-danger">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-ink">
                {editando ? "Editar Transacción" : "Nueva Transacción"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-ink-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tipo */}
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

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Descripción</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border-strong rounded-lg focus:ring-2 focus:ring-wealth focus:border-transparent outline-none"
                  placeholder="Ej: Compra en supermercado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-border-strong rounded-lg focus:ring-2 focus:ring-wealth focus:border-transparent outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-wealth hover:bg-wealth-light text-primary-foreground font-medium rounded-lg transition-colors"
              >
                {editando ? "Guardar Cambios" : "Agregar Transacción"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}