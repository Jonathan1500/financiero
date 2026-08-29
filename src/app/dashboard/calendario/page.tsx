"use client"

export const dynamic = 'force-dynamic'
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { formatCurrency, getCurrentMonth, getMonthName, getDaysInMonth } from "@/lib/utils"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Calendar
} from "lucide-react"

interface Transaccion {
  id: string
  monto: number
  descripcion: string
  fecha: string
  tipo: string
  categorias: { nombre: string; color: string } | null
}

interface PagoFijo {
  id: string
  nombre: string
  monto: number
  tipo: string
  dia_cobro: number
  activo: boolean
  categorias: { nombre: string; color: string } | null
}

interface DiaCalendario {
  dia: number
  esHoy: boolean
  esPasado: boolean
  ingresos: number
  gastos: number
  transacciones: Transaccion[]
  pagosFijos: PagoFijo[]
}

export default function CalendarioPage() {
  const { preferences } = useUserPreferences()
  const [mesActual, setMesActual] = useState(getCurrentMonth().mes)
  const [anioActual, setAnioActual] = useState(getCurrentMonth().anio)
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [pagosFijos, setPagosFijos] = useState<PagoFijo[]>([])
  const [loading, setLoading] = useState(true)
  const [diaSeleccionado, setDiaSeleccionado] = useState<DiaCalendario | null>(null)

  const fmt = (amount: number) => formatCurrency(amount, preferences.moneda)
  const diasEnMes = getDaysInMonth(mesActual, anioActual)
  const hoy = new Date()
  const esMesActual = mesActual === hoy.getMonth() + 1 && anioActual === hoy.getFullYear()

  const fetchData = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const startDate = `${anioActual}-${String(mesActual).padStart(2, "0")}-01`
    const endDate = `${anioActual}-${String(mesActual + 1 > 12 ? 1 : mesActual + 1).padStart(2, "0")}-01`

    const { data: trans } = await supabase
      .from("transacciones")
      .select("*, categorias(nombre, color)")
      .eq("usuario_id", user.id)
      .gte("fecha", startDate)
      .lt("fecha", endDate)
      .order("fecha")

    setTransacciones((trans as Transaccion[]) || [])

    const { data: fijos } = await supabase
      .from("pagos_fijos")
      .select("*, categorias(nombre, color)")
      .eq("usuario_id", user.id)
      .eq("activo", true)

    setPagosFijos((fijos as PagoFijo[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [mesActual, anioActual])

  const getDiasCalendario = (): DiaCalendario[] => {
    const dias: DiaCalendario[] = []

    for (let d = 1; d <= diasEnMes; d++) {
      const fechaStr = `${anioActual}-${String(mesActual).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      const transDelDia = transacciones.filter(t => t.fecha === fechaStr)
      const fijosDelDia = pagosFijos.filter(p => p.dia_cobro === d)

      const ingresos = transDelDia
        .filter(t => t.tipo === "ingreso")
        .reduce((s, t) => s + Number(t.monto), 0) +
        fijosDelDia
          .filter(p => p.tipo === "ingreso")
          .reduce((s, p) => s + Number(p.monto), 0)

      const gastos = transDelDia
        .filter(t => t.tipo === "gasto")
        .reduce((s, t) => s + Number(t.monto), 0) +
        fijosDelDia
          .filter(p => p.tipo === "gasto")
          .reduce((s, p) => s + Number(p.monto), 0)

      dias.push({
        dia: d,
        esHoy: esMesActual && d === hoy.getDate(),
        esPasado: esMesActual && d < hoy.getDate(),
        ingresos,
        gastos,
        transacciones: transDelDia,
        pagosFijos: fijosDelDia,
      })
    }

    return dias
  }

  const dias = getDiasCalendario()
  const totalIngresosMes = dias.reduce((s, d) => s + d.ingresos, 0)
  const totalGastosMes = dias.reduce((s, d) => s + d.gastos, 0)

  const primerCicloIngresos = pagosFijos.filter(p => p.tipo === "ingreso" && p.dia_cobro <= 15).reduce((s, p) => s + Number(p.monto), 0)
  const primerCicloGastos = pagosFijos.filter(p => p.tipo === "gasto" && p.dia_cobro <= 15).reduce((s, p) => s + Number(p.monto), 0)
  const segundoCicloIngresos = pagosFijos.filter(p => p.tipo === "ingreso" && p.dia_cobro > 15).reduce((s, p) => s + Number(p.monto), 0)
  const segundoCicloGastos = pagosFijos.filter(p => p.tipo === "gasto" && p.dia_cobro > 15).reduce((s, p) => s + Number(p.monto), 0)

  const navegarMes = (dir: number) => {
    setDiaSeleccionado(null)
    let nuevoMes = mesActual + dir
    let nuevoAnio = anioActual
    if (nuevoMes < 1) { nuevoMes = 12; nuevoAnio-- }
    if (nuevoMes > 12) { nuevoMes = 1; nuevoAnio++ }
    setMesActual(nuevoMes)
    setAnioActual(nuevoAnio)
  }

  const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  const primerDiaMes = new Date(anioActual, mesActual - 1, 1).getDay()
  const offsetLunes = primerDiaMes === 0 ? 6 : primerDiaMes - 1

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-wealth/20 border-t-wealth rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="stagger">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Calendario de Pagos</h1>
          <p className="text-ink-muted text-sm">Vista visual de tus ingresos y gastos por día</p>
        </div>
      </div>

      {/* Navegación del mes */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navegarMes(-1)}
          className="p-2 rounded-lg hover:bg-surface transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-ink-muted" />
        </button>
        <h2 className="font-display text-2xl font-medium text-ink">
          {getMonthName(mesActual)} {anioActual}
        </h2>
        <button
          onClick={() => navegarMes(1)}
          className="p-2 rounded-lg hover:bg-surface transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-ink-muted" />
        </button>
      </div>

      {/* Resumen de ciclos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-wealth/10 rounded-full flex items-center justify-center">
              <span className="text-wealth font-bold text-sm">15</span>
            </div>
            <span className="text-sm font-medium text-ink">Ciclo Día 15</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-wealth" /> Ingresos
              </span>
              <span className="text-sm font-semibold text-wealth">{fmt(primerCicloIngresos)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-danger" /> Gastos
              </span>
              <span className="text-sm font-semibold text-danger">{fmt(primerCicloGastos)}</span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink">Te queda</span>
                <span className={`text-sm font-bold ${primerCicloIngresos - primerCicloGastos >= 0 ? "text-wealth" : "text-danger"}`}>
                  {fmt(primerCicloIngresos - primerCicloGastos)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-terracotta/10 rounded-full flex items-center justify-center">
              <span className="text-terracotta font-bold text-sm">30</span>
            </div>
            <span className="text-sm font-medium text-ink">Ciclo Día 30</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-wealth" /> Ingresos
              </span>
              <span className="text-sm font-semibold text-wealth">{fmt(segundoCicloIngresos)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-danger" /> Gastos
              </span>
              <span className="text-sm font-semibold text-danger">{fmt(segundoCicloGastos)}</span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink">Te queda</span>
                <span className={`text-sm font-bold ${segundoCicloIngresos - segundoCicloGastos >= 0 ? "text-wealth" : "text-danger"}`}>
                  {fmt(segundoCicloIngresos - segundoCicloGastos)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendario grid */}
        <div className="flex-1">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Header días de la semana */}
            <div className="grid grid-cols-7 bg-surface border-b border-border">
              {diasSemana.map((d) => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7">
              {Array.from({ length: offsetLunes }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 border-b border-r border-border/50 bg-muted/30" />
              ))}

              {dias.map((dia) => (
                <button
                  key={dia.dia}
                  onClick={() => setDiaSeleccionado(diaSeleccionado?.dia === dia.dia ? null : dia)}
                  className={`h-24 border-b border-r border-border/50 p-1.5 text-left hover:bg-muted/50 transition-colors relative ${
                    dia.esHoy ? "bg-wealth/5" : ""
                  } ${diaSeleccionado?.dia === dia.dia ? "ring-2 ring-wealth ring-inset" : ""} ${
                    dia.esPasado ? "opacity-60" : ""
                  }`}
                >
                  <span className={`text-xs font-medium ${
                    dia.esHoy ? "bg-wealth text-white w-6 h-6 rounded-full flex items-center justify-center" : "text-ink"
                  }`}>
                    {dia.dia}
                  </span>

                  {/* Dots de actividad */}
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {dia.ingresos > 0 && (
                      <div className="w-2 h-2 rounded-full bg-wealth" title={`Ingresos: ${fmt(dia.ingresos)}`} />
                    )}
                    {dia.gastos > 0 && (
                      <div className="w-2 h-2 rounded-full bg-danger" title={`Gastos: ${fmt(dia.gastos)}`} />
                    )}
                    {dia.pagosFijos.length > 0 && (
                      <div className="w-2 h-2 rounded-full bg-amber" title={`${dia.pagosFijos.length} pago(s) fijo(s)`} />
                    )}
                  </div>

                  {/* Montos */}
                  {(dia.ingresos > 0 || dia.gastos > 0) && (
                    <div className="mt-auto">
                      {dia.ingresos > 0 && (
                        <p className="text-[9px] text-wealth font-mono leading-tight">+{fmt(dia.ingresos)}</p>
                      )}
                      {dia.gastos > 0 && (
                        <p className="text-[9px] text-danger font-mono leading-tight">-{fmt(dia.gastos)}</p>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="lg:w-80">
          {diaSeleccionado ? (
            <div className="bg-card rounded-xl border border-border p-4 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  diaSeleccionado.esHoy ? "bg-wealth text-white" : "bg-surface text-ink"
                }`}>
                  <span className="font-bold">{diaSeleccionado.dia}</span>
                </div>
                <div>
                  <p className="font-medium text-ink">Día {diaSeleccionado.dia}</p>
                  <p className="text-xs text-ink-subtle">{getMonthName(mesActual)} {anioActual}</p>
                </div>
              </div>

              {diaSeleccionado.ingresos > 0 && (
                <div className="mb-3 p-3 bg-wealth/5 rounded-lg">
                  <p className="text-xs font-medium text-wealth mb-1">Ingresos</p>
                  <p className="text-lg font-bold text-wealth">{fmt(diaSeleccionado.ingresos)}</p>
                </div>
              )}

              {diaSeleccionado.gastos > 0 && (
                <div className="mb-3 p-3 bg-danger/5 rounded-lg">
                  <p className="text-xs font-medium text-danger mb-1">Gastos</p>
                  <p className="text-lg font-bold text-danger">{fmt(diaSeleccionado.gastos)}</p>
                </div>
              )}

              {diaSeleccionado.pagosFijos.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-ink-muted mb-2">Pagos Fijos</p>
                  <div className="space-y-1">
                    {diaSeleccionado.pagosFijos.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-surface rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.categorias?.color || (p.tipo === "ingreso" ? "#10b981" : "#ef4444") }} />
                          <span className="text-xs text-ink">{p.nombre}</span>
                        </div>
                        <span className={`text-xs font-semibold ${p.tipo === "ingreso" ? "text-wealth" : "text-danger"}`}>
                          {p.tipo === "ingreso" ? "+" : "-"}{fmt(Number(p.monto))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diaSeleccionado.transacciones.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-ink-muted mb-2">Transacciones</p>
                  <div className="space-y-1">
                    {diaSeleccionado.transacciones.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2 bg-surface rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.categorias?.color || (t.tipo === "ingreso" ? "#10b981" : "#ef4444") }} />
                          <span className="text-xs text-ink truncate max-w-[120px]">{t.descripcion || t.categorias?.nombre || "—"}</span>
                        </div>
                        <span className={`text-xs font-semibold ${t.tipo === "ingreso" ? "text-wealth" : "text-danger"}`}>
                          {t.tipo === "ingreso" ? "+" : "-"}{fmt(Number(t.monto))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diaSeleccionado.ingresos === 0 && diaSeleccionado.gastos === 0 && diaSeleccionado.pagosFijos.length === 0 && diaSeleccionado.transacciones.length === 0 && (
                <p className="text-sm text-ink-subtle text-center py-4">Sin actividad este día</p>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-wealth" />
                <p className="font-medium text-ink">Resumen del Mes</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-wealth/5 rounded-lg">
                  <span className="text-xs text-ink-muted">Total Ingresos</span>
                  <span className="text-sm font-bold text-wealth">{fmt(totalIngresosMes)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-danger/5 rounded-lg">
                  <span className="text-xs text-ink-muted">Total Gastos</span>
                  <span className="text-sm font-bold text-danger">{fmt(totalGastosMes)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                  <span className="text-xs font-medium text-ink">Balance</span>
                  <span className={`text-sm font-bold ${totalIngresosMes - totalGastosMes >= 0 ? "text-wealth" : "text-danger"}`}>
                    {fmt(totalIngresosMes - totalGastosMes)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-ink-subtle text-center mt-4">Selecciona un día para ver detalle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
