"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import {
  LayoutDashboard,
  CreditCard,
  Target,
  BarChart3,
  LogOut,
  DollarSign,
  Menu,
  X,
  Settings,
  CalendarDays,
  ChevronRight,
} from "lucide-react"
import SettingsModal from "@/components/settings-modal"

export const dynamic = 'force-dynamic'

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/transacciones", label: "Transacciones", icon: CreditCard },
  { href: "/dashboard/pagos-fijos", label: "Pagos Fijos", icon: CalendarDays },
  { href: "/dashboard/presupuestos", label: "Presupuestos", icon: Target },
  { href: "/dashboard/metas", label: "Metas", icon: Target },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-background">
      {/* Skip link */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/30 z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="Navegación principal"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-3" aria-label="Modern Ledger - Inicio">
              <div className="w-10 h-10 bg-wealth/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-wealth" />
              </div>
              <span className="font-display text-lg font-medium text-ink">Modern Ledger</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-ink-muted hover:text-ink p-2 rounded-lg"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Secciones">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-wealth/10 text-wealth border border-wealth/20"
                      : "text-ink-muted hover:bg-muted hover:text-ink"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-wealth" : "text-ink-muted"}`} aria-hidden="true" />
                  {item.label}
                  {isActive && (
                    <ChevronRight className="ml-auto w-4 h-4 text-wealth" aria-hidden="true" />
                  )}
                </Link>
              )
            })}
            {/* Settings in sidebar */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-muted hover:bg-muted hover:text-ink transition-all w-full"
            >
              <Settings className="w-5 h-5 text-ink-muted" aria-hidden="true" />
              Configuración
            </button>
          </nav>

          {/* User */}
          <div className="px-3 py-4 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 bg-wealth/10 rounded-full flex items-center justify-center text-wealth font-medium text-sm">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-ink-muted truncate">
                  {session?.user?.email}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-ink-muted hover:text-danger transition-colors p-1.5 rounded-lg"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-ink-muted hover:text-ink p-2 rounded-lg"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-wealth" />
            <span className="font-display font-medium text-ink">Modern Ledger</span>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-ink-muted hover:text-ink p-2 rounded-lg"
            title="Configuración"
            aria-label="Configuración"
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        <main id="main-content" className="flex-1 p-4 lg:p-6" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}