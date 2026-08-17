"use client"

import Link from "next/link"
import { DollarSign } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-700">
      <div className="text-center px-6">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <DollarSign className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">
          Finanzas Personales
        </h1>
        <p className="text-xl text-white/80 mb-10 max-w-lg mx-auto">
          Administra tus ingresos, gastos, presupuestos y metas de ahorro de forma sencilla y segura.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/30"
          >
            Crear Cuenta
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-white font-semibold mb-2">Ingresos y Gastos</h3>
            <p className="text-white/70 text-sm">Registra y categoriza todas tus transacciones</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-white font-semibold mb-2">Presupuestos</h3>
            <p className="text-white/70 text-sm">Establece límites y controla tu gasto</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-white font-semibold mb-2">Metas de Ahorro</h3>
            <p className="text-white/70 text-sm">Define objetivos y alcanza tus metas</p>
          </div>
        </div>
      </div>
    </div>
  )
}
