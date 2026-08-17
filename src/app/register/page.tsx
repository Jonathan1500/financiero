"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DollarSign, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase-browser"

export default function RegisterPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Crear categorías por defecto
    const defaultCategories = [
      { nombre: "Salario", tipo: "ingreso", color: "#10b981", icono: "briefcase" },
      { nombre: "Freelance", tipo: "ingreso", color: "#06b6d4", icono: "laptop" },
      { nombre: "Inversiones", tipo: "ingreso", color: "#8b5cf6", icono: "trending-up" },
      { nombre: "Otros Ingresos", tipo: "ingreso", color: "#f59e0b", icono: "plus-circle" },
      { nombre: "Alimentación", tipo: "gasto", color: "#ef4444", icono: "utensils" },
      { nombre: "Transporte", tipo: "gasto", color: "#f97316", icono: "car" },
      { nombre: "Vivienda", tipo: "gasto", color: "#6366f1", icono: "home" },
      { nombre: "Entretenimiento", tipo: "gasto", color: "#ec4899", icono: "film" },
      { nombre: "Salud", tipo: "gasto", color: "#14b8a6", icono: "heart" },
      { nombre: "Educación", tipo: "gasto", color: "#3b82f6", icono: "book-open" },
      { nombre: "Servicios", tipo: "gasto", color: "#64748b", icono: "wifi" },
      { nombre: "Otros Gastos", tipo: "gasto", color: "#78716c", icono: "more-horizontal" },
    ]

    // Obtener el usuario recién creado
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const categoriesToInsert = defaultCategories.map((cat) => ({
        ...cat,
        usuario_id: user.id,
      }))

      await supabase.from("categorias").insert(categoriesToInsert)
    }

    router.push("/login?message=Cuenta creada. Ahora inicia sesión.")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-700 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta</h1>
            <p className="text-gray-500 mt-1">Regístrate para empezar</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors mt-2"
            >
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
