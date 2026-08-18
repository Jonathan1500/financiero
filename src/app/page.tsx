"use client"

import Link from "next/link"
import { DollarSign, Target, BarChart3, CreditCard, Shield, Sparkles } from "lucide-react"

const features = [
  {
    icon: CreditCard,
    title: "Transacciones Inteligentes",
    desc: "Registra ingresos y gastos con categorías, búsqueda y filtros avanzados",
  },
  {
    icon: Target,
    title: "Metas de Ahorro",
    desc: "Define objetivos, visualiza progreso y alcanza tus metas financieras",
  },
  {
    icon: BarChart3,
    title: "Reportes Visuales",
    desc: "Gráficos de barras, pastel y tendencias para entender tus finanzas",
  },
  {
    icon: Shield,
    title: "Seguridad Total",
    desc: "Autenticación segura, datos encriptados y privacidad garantizada",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-wealth/10 border border-wealth/20 rounded-full text-wealth text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Nueva versión 2.0 — Diseño Ledger
            </div>
            <h1 className="font-display text-5xl lg:text-6xl font-medium text-ink mb-6 leading-tight">
              Tus finanzas,<br />
              <span className="text-wealth">bien ordenadas</span>
            </h1>
            <p className="text-xl text-ink-muted max-w-2xl mx-auto mb-10 leading-relaxed">
              Registra, planifica y haz crecer tu dinero con una app que entiende 
              cómo piensas. Sin complejidad innecesaria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="btn btn-accent px-8 py-4 text-lg"
              >
                Empezar gratis
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="btn btn-secondary px-8 py-4 text-lg"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>

          {/* Ledger rule under hero */}
          <div className="mt-16 max-w-xl mx-auto">
            <div className="ledger-rule ledger-rule--centered ledger-rule--animated ledger-rule--short" />
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-20 left-10 w-72 h-72 bg-wealth/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28 bg-parchment/50">
        <div className="container">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="font-display text-3xl lg:text-4xl font-medium text-ink mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-ink-muted max-w-2xl mx-auto">
              Herramientas diseñadas para darte control total sin abrumarte
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="card p-6 animate-slide-up stagger"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-wealth/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-wealth" />
                </div>
                <h3 className="font-display text-lg font-medium text-ink mb-2">
                  {feature.title}
                </h3>
                <p className="text-ink-muted text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="card card--elevated p-8 lg:p-16 text-center animate-slide-up">
            <div className="max-w-xl mx-auto">
              <h2 className="font-display text-3xl lg:text-4xl font-medium text-ink mb-4">
                ¿Listo para tomar el control?
              </h2>
              <p className="text-ink-muted mb-8 text-lg">
                Únete a miles de personas que ya organizan sus finanzas con claridad.
                Sin tarjeta de crédito, sin compromiso.
              </p>
              <Link
                href="/register"
                className="btn btn-accent px-10 py-4 text-lg inline-flex items-center gap-2"
              >
                Crear mi cuenta gratis
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-parchment/50">
        <div className="container text-center">
          <p className="text-ink-muted text-sm">
            Finanzas Personales — Hecho con cuidado para ti
          </p>
        </div>
      </footer>
    </div>
  )
}