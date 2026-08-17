import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const SUPPORTED_CURRENCIES = {
  DOP: { locale: "es-DO", symbol: "RD$", name: "Peso Dominicano" },
  GTQ: { locale: "es-GT", symbol: "Q", name: "Quetzal Guatemalteco" },
  USD: { locale: "en-US", symbol: "$", name: "Dólar Estadounidense" },
  EUR: { locale: "de-DE", symbol: "€", name: "Euro" },
  MXN: { locale: "es-MX", symbol: "$", name: "Peso Mexicano" },
  COP: { locale: "es-CO", symbol: "$", name: "Peso Colombiano" },
  ARS: { locale: "es-AR", symbol: "$", name: "Peso Argentino" },
  PEN: { locale: "es-PE", symbol: "S/", name: "Sol Peruano" },
  CLP: { locale: "es-CL", symbol: "$", name: "Peso Chileno" },
  UYU: { locale: "es-UY", symbol: "$", name: "Peso Uruguayo" },
  VES: { locale: "es-VE", symbol: "Bs.", name: "Bolívar Venezolano" },
} as const

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES

export function getCurrencyInfo(currency: CurrencyCode) {
  return SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.DOP
}

export function formatCurrency(amount: number, currency: CurrencyCode = "DOP"): string {
  const info = getCurrencyInfo(currency)
  const zeroDecimals = ["CLP", "COP", "VES", "JPY", "KRW"].includes(currency)
  return new Intl.NumberFormat(info.locale, {
    style: "currency",
    currency,
    minimumFractionDigits: zeroDecimals ? 0 : 2,
    maximumFractionDigits: zeroDecimals ? 0 : 2,
  }).format(amount)
}

export function formatCurrencyShort(amount: number, currency: CurrencyCode = "DOP"): string {
  const info = getCurrencyInfo(currency)
  const formatted = new Intl.NumberFormat(info.locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  return formatted
}

export function formatDate(date: string | Date, locale = "es-DO"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function getCurrentMonth(): { mes: number; anio: number } {
  const now = new Date()
  return { mes: now.getMonth() + 1, anio: now.getFullYear() }
}

export function getMonthName(mes: number, locale = "es"): string {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]
  return months[mes - 1]
}