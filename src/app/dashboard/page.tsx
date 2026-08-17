"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { createClient } from "@/lib/supabase-browser"
import { formatCurrency, getCurrentMonth, getMonthName } from "@/lib/utils"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { TrendingUp, TrendingDown, Wallet, Target } from "lucide-react"

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const fmt = (amount: number) => formatCurrency(amount, preferences.moneda)

  const statCards = [
    { label: "Ingresos", value: stats.totalIngresos, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Gastos", value: stats.totalGastos, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
    { label: "Balance", value: stats.balance, icon: Wallet, color: stats.balance >= 0 ? "text-indigo-600" : "text-red-600", bg: stats.balance >= 0 ? "bg-indigo-50" : "bg-red-50" },
    { label: "Metas", value: stats.metasCompletadas, icon: Target, color: "text-amber-600", bg: "bg-amber-50", extra: `${stats.totalMetas} total` },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="text-gray-500">
          Resumen de {getMonthName(mes)} {anio}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className={`text-lg font-bold ${card.color}`}>
                  {typeof card.value === "number" ? fmt(card.value) : card.value}
                </p>
                {card.extra && (
                  <p className="text-xs text-gray-400">{card.extra}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Últimas Transacciones</h2>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <p>No hay transacciones este mes</p>
            <p className="text-sm mt-1">¡Empieza registrando tu primer ingreso o gasto!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.categorias?.color || "#94a3b8" }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t.descripcion || t.categorias?.nombre || "Sin descripción"}
                    </p>
                    <p className="text-xs text-gray-400">{t.categorias?.nombre}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${t.tipo === "ingreso" ? "text-emerald-600" : "text-red-600"}`}>
                  {t.tipo === "ingreso" ? "+" : "-"}{fmt(Number(t.monto))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}