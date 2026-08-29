"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { createClient } from "@/lib/supabase-browser"
import { formatCurrency, getCurrentMonth, getMonthName } from "@/lib/utils"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import {
  TrendingUp, TrendingDown, Wallet, Target, ArrowRight, ChevronRight,
  CreditCard, CalendarDays, BarChart3, FileText, Calendar, Clock
} from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

interface Stats {
  totalIngresos: number
  totalGastos: number
  balance: number
  totalMetas: number
  metasCompletadas: number
}

interface RecentTransaction {
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

export default function DashboardPage() {
  const { data: session } = useSession()
  const { preferences } = useUserPreferences()
  const [stats, setStats] = useState<Stats>({ totalIngresos: 0, totalGastos: 0, balance: 0, totalMetas: 0, metasCompletadas: 0 })
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [pagosFijos, setPagosFijos] = useState<PagoFijo[]>([])
  const [loading, setLoading] = useState(true)
  const { mes, anio } = getCurrentMonth()

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const startDate = `${anio}-${String(mes).padStart(2, "0")}-01`
    const endDate = `${anio}-${String(mes + 1 > 12 ? 1 : mes + 1).padStart(2, "0")}-01`

    const { data: transacciones } = await supabase
      .from("transacciones")
      .select("*, categorias(nombre, color)")
      .eq("usuario_id", user.id)
      .gte("fecha", startDate)
      .lt("fecha", endDate)
      .order("fecha", { ascending: false })

    const ingresos = transacciones?.filter((t) => t.tipo === "ingreso").reduce((sum, t) => sum + Number(t.monto), 0) || 0
    const gastos = transacciones?.filter((t) => t.tipo === "gasto").reduce((sum, t) => sum + Number(t.monto), 0) || 0

    const { data: metas } = await supabase
      .from("metas_ahorro")
      .select("monto_objetivo, monto_actual")
      .eq("usuario_id", user.id)

    const totalMetas = metas?.length || 0
    const metasCompletadas = metas?.filter((m) => Number(m.monto_actual) >= Number(m.monto_objetivo)).length || 0

    const { data: fijos } = await supabase
      .from("pagos_fijos")
      .select("*, categorias(nombre, color)")
      .eq("usuario_id", user.id)
      .eq("activo", true)
      .order("dia_cobro")

    setPagosFijos((fijos as PagoFijo[]) || [])

    setStats({
      totalIngresos: ingresos,
      totalGastos: gastos,
      balance: ingresos - gastos,
      totalMetas,
      metasCompletadas,
    })

    setRecentTransactions((transacciones?.slice(0, 5) as RecentTransaction[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-wealth/20 border-t-wealth rounded-full animate-spin"></div>
      </div>
    )
  }

  const fmt = (amount: number) => formatCurrency(amount, preferences.moneda)
  const balance = stats.balance
  const balancePct = stats.totalIngresos > 0 ? Math.min(100, Math.max(0, (balance / stats.totalIngresos) * 100 + 50)) : 50
  const pulseState = balance > 0 ? "positive" : balance < 0 ? "negative" : "neutral"

  // Ciclos de pago
  const hoy = new Date()
  const esMesActual = mes === hoy.getMonth() + 1 && anio === hoy.getFullYear()
  const diaActual = hoy.getDate()

  const ciclo15Ingresos = pagosFijos.filter(p => p.tipo === "ingreso" && p.dia_cobro <= 15).reduce((s, p) => s + Number(p.monto), 0)
  const ciclo15Gastos = pagosFijos.filter(p => p.tipo === "gasto" && p.dia_cobro <= 15).reduce((s, p) => s + Number(p.monto), 0)
  const ciclo30Ingresos = pagosFijos.filter(p => p.tipo === "ingreso" && p.dia_cobro > 15).reduce((s, p) => s + Number(p.monto), 0)
  const ciclo30Gastos = pagosFijos.filter(p => p.tipo === "gasto" && p.dia_cobro > 15).reduce((s, p) => s + Number(p.monto), 0)

  const ciclo15Completado = esMesActual && diaActual >= 15
  const ciclo30Completado = esMesActual && diaActual >= 30

  const statCards = [
    { 
      label: "Ingresos", 
      value: stats.totalIngresos, 
      icon: TrendingUp, 
      color: "text-wealth", 
      bg: "bg-wealth/10",
      iconBg: "bg-wealth/20",
      href: "/dashboard/transacciones?tipo=ingreso",
    },
    { 
      label: "Gastos", 
      value: stats.totalGastos, 
      icon: TrendingDown, 
      color: "text-danger", 
      bg: "bg-danger/10",
      iconBg: "bg-danger/20",
      href: "/dashboard/transacciones?tipo=gasto",
    },
    { 
      label: "Balance", 
      value: balance, 
      icon: Wallet, 
      color: balance >= 0 ? "text-wealth" : "text-danger", 
      bg: balance >= 0 ? "bg-wealth/10" : "bg-danger/10",
      iconBg: balance >= 0 ? "bg-wealth/20" : "bg-danger/20",
      href: "/dashboard/transacciones",
    },
    { 
      label: "Metas", 
      value: stats.metasCompletadas, 
      icon: Target, 
      color: "text-amber", 
      bg: "bg-amber/10",
      iconBg: "bg-amber/20",
      extra: `${stats.totalMetas} total`,
      href: "/dashboard/metas",
    },
  ]

  return (
    <div className="stagger">
      {/* Page Header */}
      <div className="page-header animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="page-title">
              Hola, {session?.user?.name?.split(" ")[0]}
            </h1>
            <p className="text-ink-muted mt-1">
              Resumen de {getMonthName(mes)} {anio}
            </p>
          </div>
          <Link
            href="/dashboard/transacciones"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            Nueva transacción
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="ledger-rule ledger-rule--animated ledger-rule--short" />
      </div>

      {/* Wealth Pulse */}
      <section className="mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="card card--elevated p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className={`wealth-pulse wealth-pulse--${pulseState} wealth-pulse--alive`} role="img" aria-label={`Wealth Pulse: Balance neto ${balance >= 0 ? "positivo" : "negativo"} ${fmt(Math.abs(balance))}`}>
                <svg viewBox="0 0 160 160" className="w-full h-full">
                  <circle className="wealth-pulse__track" cx="80" cy="80" r="45" />
                  <circle 
                    className="wealth-pulse__progress" 
                    cx="80" 
                    cy="80" 
                    r="45" 
                    style={{ strokeDashoffset: 283 * (1 - balancePct / 100) }}
                  />
                </svg>
                <div className="wealth-pulse__label">
                  <span className="wealth-pulse__value font-mono-nums">{fmt(balance)}</span>
                  <span className="wealth-pulse__sub">Balance neto este mes</span>
                </div>
                <div className="wealth-pulse-tooltip">
                  Ingresos: {fmt(stats.totalIngresos)} · Gastos: {fmt(stats.totalGastos)}
                </div>
              </div>
              
              <div>
                <p className="font-display text-2xl font-medium text-ink">
                  {balance >= 0 ? "Vas por buen camino" : "Atención necesaria"}
                </p>
                <p className="text-ink-muted mt-1">
                  {balance >= 0 
                    ? `Tus ingresos superan tus gastos en ${fmt(Math.abs(balance))}.`
                    : `Gastas ${fmt(Math.abs(balance))} más de lo que ingresas.`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 lg:gap-8">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                <div className="w-10 h-10 bg-wealth/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-wealth" />
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Ingresos mes</p>
                  <p className="font-mono-nums font-semibold text-ink">{fmt(stats.totalIngresos)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                <div className="w-10 h-10 bg-danger/10 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Gastos mes</p>
                  <p className="font-mono-nums font-semibold text-ink">{fmt(stats.totalGastos)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                <div className="w-10 h-10 bg-amber/10 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber" />
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Metas activas</p>
                  <p className="font-mono-nums font-semibold text-ink">{stats.metasCompletadas}/{stats.totalMetas}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ciclos de Pago */}
      <section className="mb-8 animate-slide-up" style={{ animationDelay: '150ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-wealth" />
          <h2 className="font-display text-xl font-medium text-ink">Ciclos de Pago</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ciclo 15 */}
          <div className="card card--elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-wealth/10 rounded-xl flex items-center justify-center">
                  <span className="text-wealth font-bold text-lg">15</span>
                </div>
                <div>
                  <p className="font-medium text-ink">Día 15</p>
                  <p className="text-xs text-ink-muted">Primer ciclo de pago</p>
                </div>
              </div>
              {ciclo15Completado ? (
                <span className="px-3 py-1 bg-wealth/10 text-wealth text-xs font-semibold rounded-full">Completado</span>
              ) : (
                <span className="px-3 py-1 bg-amber/10 text-amber text-xs font-semibold rounded-full">Próximo</span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-wealth" /> Ingresos fijos
                </span>
                <span className="text-sm font-semibold text-wealth">{fmt(ciclo15Ingresos)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-danger" /> Gastos fijos
                </span>
                <span className="text-sm font-semibold text-danger">{fmt(ciclo15Gastos)}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">Te queda</span>
                  <span className={`text-lg font-bold ${ciclo15Ingresos - ciclo15Gastos >= 0 ? "text-wealth" : "text-danger"}`}>
                    {fmt(ciclo15Ingresos - ciclo15Gastos)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ciclo 30 */}
          <div className="card card--elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-terracotta/10 rounded-xl flex items-center justify-center">
                  <span className="text-terracotta font-bold text-lg">30</span>
                </div>
                <div>
                  <p className="font-medium text-ink">Día 30</p>
                  <p className="text-xs text-ink-muted">Segundo ciclo de pago</p>
                </div>
              </div>
              {ciclo30Completado ? (
                <span className="px-3 py-1 bg-wealth/10 text-wealth text-xs font-semibold rounded-full">Completado</span>
              ) : (
                <span className="px-3 py-1 bg-amber/10 text-amber text-xs font-semibold rounded-full">Próximo</span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-wealth" /> Ingresos fijos
                </span>
                <span className="text-sm font-semibold text-wealth">{fmt(ciclo30Ingresos)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-danger" /> Gastos fijos
                </span>
                <span className="text-sm font-semibold text-danger">{fmt(ciclo30Gastos)}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">Te queda</span>
                  <span className={`text-lg font-bold ${ciclo30Ingresos - ciclo30Gastos >= 0 ? "text-wealth" : "text-danger"}`}>
                    {fmt(ciclo30Ingresos - ciclo30Gastos)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
        {statCards.map((card, index) => (
          <Link
            key={card.label}
            href={card.href}
            className={`card card--interactive p-5 group ${card.bg} ${card.iconBg} animate-slide-up`}
            style={{ animationDelay: `${200 + index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconBg} group-hover:scale-105 transition-transform`}>
                <card.icon className={`w-5 h-5 ${card.color}`} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-ink-muted truncate">{card.label}</p>
                <p className={`text-xl font-mono-nums font-medium ${card.color} truncate`}>
                  {typeof card.value === "number" ? fmt(card.value) : card.value}
                </p>
              </div>
            </div>
            <ChevronRight className="ml-auto w-5 h-5 text-ink-muted group-hover:text-wealth transition-colors" aria-hidden="true" />
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <section className="animate-slide-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-medium text-ink">Últimas Transacciones</h2>
          <Link
            href="/dashboard/transacciones"
            className="text-sm text-wealth hover:text-wealth-light font-medium inline-flex items-center gap-1"
          >
            Ver todas
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="card overflow-hidden">
          {recentTransactions.length === 0 ? (
            <div className="empty-state py-12">
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 4v16m8-8H4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <p className="empty-state-title">No hay transacciones este mes</p>
              <p className="empty-state-text">Empieza registrando tu primer ingreso o gasto</p>
              <Link
                href="/dashboard/transacciones"
                className="btn btn-primary mt-4"
              >
                Agregar transacción
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: t.categorias?.color || "#8B7D6B" }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {t.descripcion || t.categorias?.nombre || "Sin descripción"}
                      </p>
                      <p className="text-xs text-ink-muted truncate">
                        {t.categorias?.nombre} · {new Date(t.fecha).toLocaleDateString("es-GT", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-mono-nums font-semibold ${t.tipo === "ingreso" ? "text-wealth" : "text-danger"}`}>
                    {t.tipo === "ingreso" ? "+" : "-"}{fmt(Number(t.monto))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mt-8 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <h2 className="font-display text-xl font-medium text-ink mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Link href="/dashboard/transacciones" className="card card--interactive p-5 text-center group">
            <div className="w-12 h-12 bg-wealth/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <CreditCard className="w-6 h-6 text-wealth" />
            </div>
            <p className="text-sm font-medium text-ink">Transacciones</p>
            <p className="text-xs text-ink-muted mt-1">Registrar y revisar</p>
          </Link>
          <Link href="/dashboard/pagos-fijos" className="card card--interactive p-5 text-center group">
            <div className="w-12 h-12 bg-terracotta/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <CalendarDays className="w-6 h-6 text-terracotta" />
            </div>
            <p className="text-sm font-medium text-ink">Pagos Fijos</p>
            <p className="text-xs text-ink-muted mt-1">Recurrentes automáticos</p>
          </Link>
          <Link href="/dashboard/calendario" className="card card--interactive p-5 text-center group">
            <div className="w-12 h-12 bg-amber/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6 text-amber" />
            </div>
            <p className="text-sm font-medium text-ink">Calendario</p>
            <p className="text-xs text-ink-muted mt-1">Vista visual de pagos</p>
          </Link>
          <Link href="/dashboard/facturas" className="card card--interactive p-5 text-center group">
            <div className="w-12 h-12 bg-wealth/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6 text-wealth" />
            </div>
            <p className="text-sm font-medium text-ink">Facturas</p>
            <p className="text-xs text-ink-muted mt-1">Escanear y guardar</p>
          </Link>
          <Link href="/dashboard/reportes" className="card card--interactive p-5 text-center group">
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-6 h-6 text-ink-muted" />
            </div>
            <p className="text-sm font-medium text-ink">Reportes</p>
            <p className="text-xs text-ink-muted mt-1">Análisis profundo</p>
          </Link>
        </div>
      </section>
    </div>
  )
}
