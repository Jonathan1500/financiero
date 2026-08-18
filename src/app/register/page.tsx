"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DollarSign, Eye, EyeOff, Lock, Mail, User, CheckCircle } from "lucide-react"
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
  const [success, setSuccess] = useState(false)

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
      { nombre: "Salario", tipo: "ingreso", color: "#0D6E5A", icono: "briefcase" },
      { nombre: "Freelance", tipo: "ingreso", color: "#0F9D7A", icono: "laptop" },
      { nombre: "Inversiones", tipo: "ingreso", color: "#148F74", icono: "trending-up" },
      { nombre: "Otros Ingresos", tipo: "ingreso", color: "#1AA389", icono: "plus-circle" },
      { nombre: "Alimentación", tipo: "gasto", color: "#B84030", icono: "utensils" },
      { nombre: "Transporte", tipo: "gasto", color: "#C45A3A", icono: "car" },
      { nombre: "Vivienda", tipo: "gasto", color: "#0D6E5A", icono: "home" },
      { nombre: "Entretenimiento", tipo: "gasto", color: "#D97355", icono: "film" },
      { nombre: "Salud", tipo: "gasto", color: "#0F9D7A", icono: "heart" },
      { nombre: "Educación", tipo: "gasto", color: "#148F74", icono: "book-open" },
      { nombre: "Servicios", tipo: "gasto", color: "#7A746B", icono: "wifi" },
      { nombre: "Otros Gastos", tipo: "gasto", color: "#8B7D6B", icono: "more-horizontal" },
    ]

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const categoriesToInsert = defaultCategories.map((cat) => ({
        ...cat,
        usuario_id: user.id,
      }))

      await supabase.from("categorias").insert(categoriesToInsert)
    }

    setSuccess(true)
    setLoading(false)
    
    setTimeout(() => {
      router.push("/login?message=Cuenta creada. Ahora inicia sesión.")
    }, 1500)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="card card--elevated p-8 text-center stagger animate-scale-in">
            <div className="w-16 h-16 bg-wealth/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-wealth" />
            </div>
            <h1 className="font-display text-2xl font-medium text-ink mb-2">¡Cuenta Creada!</h1>
            <p className="text-ink-muted">Redirigiendo al login…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="card card--elevated p-8 stagger animate-slide-up">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <Link href="/" className="flex items-center gap-2 mb-5" aria-label="Modern Ledger - Inicio">
              <span className="font-display text-2xl font-medium text-ink">Modern Ledger</span>
            </Link>
            <h1 className="font-display text-2xl font-medium text-ink text-center">Crear tu cuenta</h1>
            <p className="text-ink-muted mt-1 text-center">Empieza a organizar tus finanzas hoy</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/20 text-danger rounded-xl text-sm animate-slide-down" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="nombre" className="label">Nombre</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true">
                  <User className="w-5 h-5" />
                </span>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  autoComplete="name"
                  className="input pl-12"
                  placeholder="Tu nombre"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label">Email</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  spellCheck={false}
                  className="input pl-12"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">Contraseña</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="input pl-12 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirmar Contraseña</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="input pl-12"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-accent w-full py-3.5 mt-2"
            >
              {loading ? "Creando cuenta…" : "Crear Cuenta"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-wealth hover:text-wealth-light font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}