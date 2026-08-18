"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { createClient } from "@/lib/supabase-browser"
import { formatCurrency, getCurrentMonth, getMonthName } from "@/lib/utils"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { TrendingUp, TrendingDown, Wallet, Target, ArrowRight } from "lucide-react"
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

export default function DashboardPage() {
  const { data: session } = useSession()
  const { preferences } = useUserPreferences()
  const [stats, setStats] = useState<Stats>({ totalIngresos: 0, totalGastos: 0, balance: 0, totalMetas: 0, metasCompletadas: 0 })
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const { mes, anio } = getCurrentMonth()

  useEffect(() => {
    fetchData()
  }, [])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-wealth/20 border-t-wealth rounded-full animate-spin"></div>
      </div>
    )
  }

  const fmt = (amount: number) => formatCurrency(amount, preferences.moneda)

  const statCards = [
    { 
      label: "Ingresos", 
      value: stats.totalIngresos, 
      icon: TrendingUp, 
      color: "text-success", 
      bg: "bg-success/10",
      iconBg: "bg-success/20",
      href: "/dashboard/transacciones?tipo=ingreso"
    },
    { 
      label: "Gastos", 
      value: stats.totalGastos, 
      icon: TrendingDown, 
      color: "text-danger", 
      bg: "bg-danger/10",
      iconBg: "bg-danger/20",
      href: "/dashboard/transacciones?tipo=gasto"
    },
    { 
      label: "Balance", 
      value: stats.balance, 
      icon: Wallet, 
      color: stats.balance >= 0 ? "text-wealth" : "text-danger", 
      bg: stats.balance >= 0 ? "bg-wealth/10" : "bg-danger/10",
      iconBg: stats.balance >= 0 ? "bg-wealth/20" : "bg-danger/20",
      href: "/dashboard/transacciones"
    },
    { 
      label: "Metas", 
      value: stats.metasCompletadas, 
      icon: Target, 
      color: "text-warning", 
      bg: "bg-warning/10",
      iconBg: "bg-warning/20",
      extra: `${stats.totalMetas} total`,
      href: "/dashboard/metas"
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        {statCards.map((card, index) => (
          <Link
            key={card.label}
            href={card.href}
            className={`card card--interactive p-5 group ${card.bg} ${card.iconBg} animate-slide-up`}
            style={{ animationDelay: `${100 + index * 50}ms` }}
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
                {card.extra && (
                  <p className="text-xs text-ink-muted">{card.extra}</p>
                )}
              </div>
            </div>
            <ArrowRight className="ml-auto w-5 h-5 text-ink-muted group-hover:text-wealth transition-colors" aria-hidden="true" />
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-medium text-ink">Últimas Transacciones</h2>
          <Link
            href="/dashboard/transacciones"
            className="text-sm text-wealth hover:text-wealth-light font-medium inline-flex items-center gap-1"
          >
            Ver todas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="card overflow-hidden">
          {recentTransactions.length === 0 ? (
            <div className="empty-state py-12">
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
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
                        {t.categorias?.nombre} · {new Date(t.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-mono-nums font-semibold ${t.tipo === "ingreso" ? "text-success" : "text-danger"}`}>
                    {t.tipo === "ingreso" ? "+" : "-"}{fmt(Number(t.monto))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mt-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <h2 className="font-display text-xl font-medium text-ink mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/dashboard/transacciones" className="card card--interactive p-4 text-center">
            <CreditCard className="w-6 h-6 text-wealth mx-auto mb-2" />
            <p className="text-sm font-medium text-ink">Transacciones</p>
          </Link>
          <Link href="/dashboard/pagos-fijos" className="card card--interactive p-4 text-center">
            <CalendarDays className="w-6 h-6 text-terracotta mx-auto mb-2" />
            <p className="text-sm font-medium text-ink">Pagos Fijos</p>
          </Link>
          <Link href="/dashboard/metas" className="card card--interactive p-4 text-center">
            <Target className="w-6 h-6 text-warning mx-auto mb-2" />
            <p className="text-sm font-medium text-ink">Metas</p>
          </Link>
          <Link href="/dashboard/reportes" className="card card--interactive p-4 text-center">
            <BarChart3 className="w-6 h-6 text-ink-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-ink">Reportes</p>
          </Link>
        </div>
      </section>
    </div>
  )
}

// Icons needed
import { CreditCard, CalendarDays, BarChart3 } from "lucide-react"