"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { formatCurrency, getCurrentMonth } from "@/lib/utils"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent"

interface MonthlyData {
  mes: string
  ingresos: number
  gastos: number
}

interface CategoryData {
  nombre: string
  total: number
  color: string
}

interface TransaccionRaw {
  monto: number
  tipo: string
  fecha: string
  categorias: { nombre: string; color: string }[] | null
}

export default function ReportesPage() {
  const { preferences } = useUserPreferences()
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [ingresosMensuales, setIngresosMensuales] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [anioSeleccionado, setAnioSeleccionado] = useState(getCurrentMonth().anio)
  const [resumen, setResumen] = useState({ totalIngresos: 0, totalGastos: 0, promedioIngresos: 0, promedioGastos: 0 })

  useEffect(() => {
    fetchData()
  }, [anioSeleccionado])

  const fetchData = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const startDate = `${anioSeleccionado}-01-01`
    const endDate = `${anioSeleccionado + 1}-01-01`

    const { data: transacciones } = await supabase
      .from("transacciones")
      .select("monto, tipo, fecha, categorias(nombre, color)")
      .eq("usuario_id", user.id)
      .gte("fecha", startDate)
      .lt("fecha", endDate)
      .order("fecha")

    if (!transacciones) { setLoading(false); return }

    const raw = transacciones as unknown as TransaccionRaw[]

    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const monthlyMap: Record<string, MonthlyData> = {}
    months.forEach((m) => { monthlyMap[m] = { mes: m, ingresos: 0, gastos: 0 } })

    let totalIng = 0, totalGas = 0

    raw.forEach((t) => {
      const mesIdx = new Date(t.fecha).getMonth()
      const mesName = months[mesIdx]
      if (t.tipo === "ingreso") {
        monthlyMap[mesName].ingresos += Number(t.monto)
        totalIng += Number(t.monto)
      } else {
        monthlyMap[mesName].gastos += Number(t.monto)
        totalGas += Number(t.monto)
      }
    })

    setMonthlyData(Object.values(monthlyMap))

    const catMap: Record<string, { total: number; color: string }> = {}
    raw.filter((t) => t.tipo === "gasto").forEach((t) => {
      const cat = Array.isArray(t.categorias) ? t.categorias[0] : t.categorias
      const nombre = cat?.nombre || "Otros"
      const color = cat?.color || "#94a3b8"
      if (catMap[nombre]) {
        catMap[nombre].total += Number(t.monto)
      } else {
        catMap[nombre] = { total: Number(t.monto), color }
      }
    })
    setCategoryData(
      Object.entries(catMap)
        .map(([nombre, data]) => ({ nombre, ...data }))
        .sort((a, b) => b.total - a.total)
    )

    const ingMap: Record<string, { total: number; color: string }> = {}
    raw.filter((t) => t.tipo === "ingreso").forEach((t) => {
      const cat = Array.isArray(t.categorias) ? t.categorias[0] : t.categorias
      const nombre = cat?.nombre || "Otros"
      const color = cat?.color || "#10b981"
      if (ingMap[nombre]) {
        ingMap[nombre].total += Number(t.monto)
      } else {
        ingMap[nombre] = { total: Number(t.monto), color }
      }
    })
    setIngresosMensuales(
      Object.entries(ingMap)
        .map(([nombre, data]) => ({ nombre, ...data }))
        .sort((a, b) => b.total - a.total)
    )

    const mesesConDatos = Object.values(monthlyMap).filter((m) => m.ingresos > 0 || m.gastos > 0).length || 1

    setResumen({
      totalIngresos: totalIng,
      totalGastos: totalGas,
      promedioIngresos: totalIng / mesesConDatos,
      promedioGastos: totalGas / mesesConDatos,
    })

    setLoading(false)
  }

  const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"]
  const fmt = (amount: number) => formatCurrency(amount, preferences.moneda)

  const formatTooltip = (value: ValueType | undefined, name: NameType | undefined): React.ReactNode =>
    value !== undefined ? fmt(Number(value)) : ""

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
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500 text-sm">Análisis de tus finanzas en {anioSeleccionado}</p>
        </div>
        <select
          value={anioSeleccionado}
          onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Total Ingresos</p>
          <p className="text-lg font-bold text-emerald-600">{fmt(resumen.totalIngresos)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Total Gastos</p>
          <p className="text-lg font-bold text-red-600">{fmt(resumen.totalGastos)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Promedio Ingresos</p>
          <p className="text-lg font-bold text-emerald-600">{fmt(resumen.promedioIngresos)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Promedio Gastos</p>
          <p className="text-lg font-bold text-red-600">{fmt(resumen.promedioGastos)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfica de barras - Ingresos vs Gastos */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Ingresos vs Gastos Mensuales</h2>
          {monthlyData.some((m) => m.ingresos > 0 || m.gastos > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={formatTooltip} />
                <Legend />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Sin datos para este año
            </div>
          )}
        </div>

        {/* Gráfica de pastel - Gastos por categoría */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Gastos por Categoría</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="total"
                  nameKey="nombre"
                  paddingAngle={2}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={formatTooltip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Sin datos de gastos
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla de gastos por categoría */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Detalle Gastos por Categoría</h2>
          {categoryData.length > 0 ? (
            <div className="space-y-3">
              {categoryData.map((cat, i) => {
                const porcentaje = resumen.totalGastos > 0 ? (cat.total / resumen.totalGastos) * 100 : 0
                return (
                  <div key={cat.nombre}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }} />
                        <span className="text-gray-700">{cat.nombre}</span>
                      </div>
                      <span className="font-medium text-gray-900">{fmt(cat.total)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${porcentaje}%`, backgroundColor: cat.color || COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Sin datos</p>
          )}
        </div>

        {/* Detalle ingresos por categoría */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Detalle Ingresos por Categoría</h2>
          {ingresosMensuales.length > 0 ? (
            <div className="space-y-3">
              {ingresosMensuales.map((cat, i) => {
                const porcentaje = resumen.totalIngresos > 0 ? (cat.total / resumen.totalIngresos) * 100 : 0
                return (
                  <div key={cat.nombre}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }} />
                        <span className="text-gray-700">{cat.nombre}</span>
                      </div>
                      <span className="font-medium text-gray-900">{fmt(cat.total)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${porcentaje}%`, backgroundColor: cat.color || COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Sin datos</p>
          )}
        </div>
      </div>
    </div>
  )
}