"use client"

import Link from "next/link"
import { ArrowRight, Shield, Target, BarChart3, CreditCard, Sparkles, ChevronRight } from "lucide-react"

const features = [
  {
    icon: CreditCard,
    title: "Transacciones Inteligentes",
    desc: "Registra ingresos y gastos con categorías, búsqueda instantánea y filtros avanzados",
  },
  {
    icon: Target,
    title: "Metas de Ahorro",
    desc: "Define objetivos visuales, progreso animado y hitos que motivan",
  },
  {
    icon: BarChart3,
    title: "Reportes con Significado",
    desc: "Gráficos que explican, no solo decoran: tendencias, composición, comparativas",
  },
  {
    icon: Shield,
    title: "Privacidad por Defecto",
    desc: "Tus datos encriptados, autenticación robusta, cero tracking publicitario",
  },
]

const stats = [
  { value: "12K+", label: "Usuarios activos" },
  { value: "2.4M", label: "Transacciones/mes" },
  { value: "98%", label: "Retención 30 días" },
  { value: "4.9★", label: "Valoración media" },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-wealth/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-terracotta/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber/3 rounded-full blur-[200px] opacity-30" />
      </div>

      {/* Navigation bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-16 lg:h-18">
          <Link href="/" className="flex items-center gap-2" aria-label="Modern Ledger - Inicio">
            <span className="font-display text-xl font-medium text-ink">Modern Ledger</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6" aria-label="Navegación principal">
            <Link href="#features" className="text-sm text-ink-muted hover:text-ink transition-colors">Características</Link>
            <Link href="#stats" className="text-sm text-ink-muted hover:text-ink transition-colors">Resultados</Link>
            <Link href="/login" className="btn btn-ghost text-sm">Iniciar sesión</Link>
            <Link href="/register" className="btn btn-primary text-sm">Empezar gratis</Link>
          </nav>
          <div className="lg:hidden flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost p-2" aria-label="Iniciar sesión">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </Link>
            <Link href="/register" className="btn btn-primary px-4 py-2 text-sm">Empezar</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main id="main-content">
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-28">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center relative stagger">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-wealth/10 border border-wealth/20 rounded-full text-wealth text-sm font-medium mb-8 animate-fade-in">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Nuevo: Wealth Pulse — Tu balance cobra vida</span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-5xl lg:text-7xl font-medium text-ink leading-[1.05] mb-6 animate-slide-up" style={{ animationDelay: '60ms' }}>
                Tus finanzas,<br />
                <span className="text-wealth">bien contadas</span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl lg:text-2xl text-ink-muted max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '120ms' }}>
                Una app que entiende cómo piensas. Registra, planifica y haz crecer 
                tu dinero con claridad editorial y control total.
              </p>

              {/* CTA Group */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '180ms' }}>
                <Link
                  href="/register"
                  className="btn btn-accent px-10 py-4 text-lg group"
                >
                  Crear mi cuenta gratis
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
                <Link
                  href="#features"
                  className="btn btn-secondary px-10 py-4 text-lg"
                >
                  Ver cómo funciona
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="mt-16 animate-fade-in" style={{ animationDelay: '240ms' }}>
                <div className="flex flex-wrap items-center justify-center gap-8 text-ink-subtle text-sm">
                  {stats.map((stat) => (
                    <div key={stat.label} className="flex items-center gap-2">
                      <span className="font-display text-2xl font-medium text-ink">{stat.value}</span>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wealth Pulse Signature Element */}
              <div className="mt-20 animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="wealth-pulse wealth-pulse--positive wealth-pulse--alive mx-auto" role="img" aria-label="Wealth Pulse: Balance neto positivo Q12,450">
                  <svg viewBox="0 0 160 160" className="w-full h-full">
                    <circle className="wealth-pulse__track" cx="80" cy="80" r="45" />
                    <circle 
                      className="wealth-pulse__progress" 
                      cx="80" 
                      cy="80" 
                      r="45" 
                      style={{ strokeDashoffset: "85" }}
                    />
                  </svg>
                  <div className="wealth-pulse__label">
                    <span className="wealth-pulse__value font-mono-nums">Q12,450</span>
                    <span className="wealth-pulse__sub">Balance neto este mes</span>
                  </div>
                  <div className="wealth-pulse-tooltip">
                    Ingresos: Q28,900 · Gastos: Q16,450
                  </div>
                </div>
                <p className="mt-4 text-sm text-ink-muted max-w-sm mx-auto">
                  Pasa el cursor para ver el desglose. El anillo pulsa cuando tu balance es positivo.
                </p>
              </div>
            </div>

            {/* Ledger Rule */}
            <div className="mt-16 max-w-xs mx-auto">
              <div className="ledger-rule ledger-rule--centered ledger-rule--animated ledger-rule--short" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 lg:py-28 bg-surface/50">
          <div className="container">
            <div className="text-center mb-16 stagger">
              <h2 className="font-display text-4xl lg:text-5xl font-medium text-ink mb-5 animate-slide-up">
                Diseñado para cómo piensas
              </h2>
              <p className="text-xl text-ink-muted max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '60ms' }}>
                Cada herramienta tiene un propósito. Nada de ruido, nada de relleno.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <article
                  key={feature.title}
                  className="card card--elevated p-7 stagger group"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="w-14 h-14 bg-wealth/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-wealth" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-xl font-medium text-ink mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-ink-muted leading-relaxed">
                    {feature.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-20 lg:py-28">
          <div className="container">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 stagger">
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center stagger" style={{ animationDelay: `${index * 60}ms` }}>
                  <div className="font-display text-4xl lg:text-5xl font-medium text-ink mb-2">
                    {stat.value}
                  </div>
                  <div className="text-ink-muted text-sm font-medium uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-16 max-w-lg mx-auto">
              <div className="ledger-rule ledger-rule--centered ledger-rule--animated ledger-rule--short" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28">
          <div className="container">
            <div className="card card--elevated p-8 lg:p-16 text-center stagger animate-slide-up">
              <div className="max-w-xl mx-auto">
                <h2 className="font-display text-4xl lg:text-5xl font-medium text-ink mb-5">
                  ¿Listo para tomar el control?
                </h2>
                <p className="text-xl text-ink-muted mb-10 leading-relaxed">
                  Únete a miles de personas que ya organizan sus finanzas con claridad.
                  Sin tarjeta de crédito, sin compromiso, cancelas cuando quieras.
                </p>
                <Link
                  href="/register"
                  className="btn btn-accent px-12 py-4 text-lg inline-flex items-center gap-2 group"
                >
                  Empezar gratis ahora
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-14 border-t border-border bg-surface/50">
          <div className="container">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <p className="font-display text-lg font-medium text-ink">Modern Ledger</p>
                <p className="text-ink-muted text-sm mt-1">Finanzas con elegancia editorial</p>
              </div>
              <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-ink-muted" aria-label="Footer">
                <Link href="#" className="hover:text-ink transition-colors">Privacidad</Link>
                <Link href="#" className="hover:text-ink transition-colors">Términos</Link>
                <Link href="#" className="hover:text-ink transition-colors">Contacto</Link>
              </nav>
              <div className="flex items-center justify-center lg:justify-end gap-4">
                <a href="#" className="text-ink-muted hover:text-ink transition-colors" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
                </a>
                <a href="#" className="text-ink-muted hover:text-ink transition-colors" aria-label="GitHub">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.579v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}