import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatCurrency, getMonthName } from "./utils"
import type { CurrencyCode } from "./utils"

interface TransaccionPDF {
  fecha: string
  descripcion: string
  categoria: string
  tipo: string
  monto: number
  esFijo?: boolean
}

interface GeneratePDFParams {
  transacciones: TransaccionPDF[]
  mes: number
  anio: number
  moneda: CurrencyCode
  totalIngresos: number
  totalGastos: number
  balance: number
}

type RGB = [number, number, number]

const COLORS = {
  wealth: [13, 110, 90] as RGB,
  danger: [184, 64, 48] as RGB,
  ink: [28, 27, 26] as RGB,
  inkMuted: [122, 116, 107] as RGB,
  surface: [245, 243, 239] as RGB,
  rule: [232, 223, 208] as RGB,
  white: [255, 255, 255] as RGB,
}

export function generateTransactionsPDF({
  transacciones,
  mes,
  anio,
  moneda,
  totalIngresos,
  totalGastos,
  balance,
}: GeneratePDFParams) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2

  // Header
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(COLORS.ink[0], COLORS.ink[1], COLORS.ink[2])
  doc.text("Transacciones", margin, 28)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.inkMuted)
  const monthName = getMonthName(mes)
  doc.text(`${monthName} ${anio}`, margin, 36)

  // Ledger rule (decorative double line)
  const ruleY = 40
  doc.setDrawColor(COLORS.rule[0], COLORS.rule[1], COLORS.rule[2])
  doc.setLineWidth(0.3)
  doc.line(margin, ruleY, pageWidth - margin, ruleY)
  doc.setDrawColor(COLORS.rule[0], COLORS.rule[1], COLORS.rule[2])
  doc.setLineWidth(0.6)
  doc.line(margin, ruleY + 1.5, pageWidth - margin, ruleY + 1.5)

  // Summary cards
  const summaryY = 50
  const cardWidth = (contentWidth - 8) / 3

  const drawSummaryCard = (
    x: number,
    label: string,
    value: string,
    valueColor: [number, number, number]
  ) => {
    // Card background
    doc.setFillColor(COLORS.surface[0], COLORS.surface[1], COLORS.surface[2])
    doc.roundedRect(x, summaryY, cardWidth, 22, 3, 3, "F")

    // Label
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
  doc.setTextColor(COLORS.inkMuted[0], COLORS.inkMuted[1], COLORS.inkMuted[2])
    doc.text(label, x + 6, summaryY + 8)

    // Value
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(valueColor[0], valueColor[1], valueColor[2])
    doc.text(value, x + 6, summaryY + 16)
  }

  drawSummaryCard(margin, "Ingresos", formatCurrency(totalIngresos, moneda), COLORS.wealth)
  drawSummaryCard(margin + cardWidth + 4, "Gastos", formatCurrency(totalGastos, moneda), COLORS.danger)
  drawSummaryCard(margin + (cardWidth + 4) * 2, "Balance", formatCurrency(balance, moneda), balance >= 0 ? COLORS.wealth : COLORS.danger)

  // Transaction table
  const tableStartY = summaryY + 30

  const rows = transacciones.map((t) => [
    formatDateShort(t.fecha),
    t.descripcion || "Sin descripción",
    t.categoria || "—",
    t.esFijo ? "FIJO" : "",
    t.tipo === "ingreso" ? `+${formatCurrency(t.monto, moneda)}` : `-${formatCurrency(t.monto, moneda)}`,
  ])

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    head: [["Fecha", "Descripción", "Categoría", "Tipo", "Monto"]],
    body: rows,
    theme: "plain",
    styles: {
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
      textColor: COLORS.ink,
      lineColor: COLORS.rule,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: COLORS.surface,
      textColor: COLORS.inkMuted,
      fontStyle: "bold",
      fontSize: 8,
      lineColor: COLORS.rule,
      lineWidth: 0.3,
    },
    alternateRowStyles: {
      fillColor: [250, 249, 246],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 30 },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 34, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      // Color the amount column based on type
      if (data.column.index === 4 && data.section === "body") {
        const row = transacciones[data.row.index]
        if (row) {
          const color = row.tipo === "ingreso" ? COLORS.wealth : COLORS.danger
          data.cell.styles.textColor = color
        }
      }
      // Style the FIJO badge
      if (data.column.index === 3 && data.section === "body" && data.cell.raw === "FIJO") {
        data.cell.styles.textColor = COLORS.wealth
        data.cell.styles.fontStyle = "bold"
        data.cell.styles.fontSize = 7
      }
    },
    didDrawPage: (data) => {
      // Footer on each page
      const pageHeight = doc.internal.pageSize.getHeight()
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(COLORS.inkMuted[0], COLORS.inkMuted[1], COLORS.inkMuted[2])
      doc.text(
        `Generado el ${new Date().toLocaleDateString("es-DO")} · Finanzas Personales`,
        margin,
        pageHeight - 10
      )
      doc.text(
        `Página ${doc.getCurrentPageInfo().pageNumber}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" }
      )
    },
  })

  // Final footer line
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  doc.setDrawColor(COLORS.rule[0], COLORS.rule[1], COLORS.rule[2])
  doc.setLineWidth(0.3)
  doc.line(margin, finalY, pageWidth - margin, finalY)
  doc.setLineWidth(0.6)
  doc.line(margin, finalY + 1.5, pageWidth - margin, finalY + 1.5)

  // Download
  const fileName = `transacciones-${monthName.toLowerCase()}-${anio}.pdf`
  doc.save(fileName)
}

function formatDateShort(date: string): string {
  const d = new Date(date + "T00:00:00")
  return d.toLocaleDateString("es-DO", { day: "2-digit", month: "short" })
}
