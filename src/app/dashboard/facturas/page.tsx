"use client"

export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase-browser"
import { formatCurrency, getCurrentMonth } from "@/lib/utils"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import {
  Plus, X, Camera, Upload, FileText, Trash2, Eye,
  Pencil, Calendar, Filter, Loader2, Image as ImageIcon
} from "lucide-react"

interface Factura {
  id: string
  empresa: string | null
  fecha_emision: string | null
  numero_factura: string | null
  concepto: string | null
  total: number | null
  imagen_url: string | null
  created_at: string
}

export default function FacturasPage() {
  const { preferences } = useUserPreferences()
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Factura | null>(null)
  const [filtroMes, setFiltroMes] = useState(getCurrentMonth().mes)
  const [filtroAnio, setFiltroAnio] = useState(getCurrentMonth().anio)

  const [empresa, setEmpresa] = useState("")
  const [fechaEmision, setFechaEmision] = useState("")
  const [numeroFactura, setNumeroFactura] = useState("")
  const [concepto, setConcepto] = useState("")
  const [total, setTotal] = useState("")
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [imagenExistente, setImagenExistente] = useState<string | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [verModal, setVerModal] = useState<Factura | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const fmt = (amount: number) => formatCurrency(amount, preferences.moneda)

  const fetchFacturas = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const startDate = `${filtroAnio}-${String(filtroMes).padStart(2, "0")}-01`
    const endDate = `${filtroAnio}-${String(filtroMes + 1 > 12 ? 1 : filtroMes + 1).padStart(2, "0")}-01`

    const { data } = await supabase
      .from("facturas")
      .select("*")
      .eq("usuario_id", user.id)
      .gte("fecha_emision", startDate)
      .lt("fecha_emision", endDate)
      .order("fecha_emision", { ascending: false })

    setFacturas((data as Factura[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchFacturas()
  }, [filtroMes, filtroAnio])

  const parseOCRText = (text: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean)
    let empresa = ""
    let fecha = ""
    let total = ""
    let numero = ""
    let concepto = ""

    for (const line of lines) {
      const lower = line.toLowerCase()

      if (!empresa && !/^\d/.test(line) && line.length > 2 && !lower.includes("total") && !lower.includes("fecha")) {
        empresa = line.substring(0, 80)
      }

      const fechaMatch = line.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/)
      if (fechaMatch && !fecha) {
        const [, d, m, y] = fechaMatch
        const year = y.length === 2 ? `20${y}` : y
        fecha = `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
      }

      const totalMatch = line.match(/(?:total|importe|monto|q|gtq)[:\s]*([0-9,.\s]+)/i)
      if (totalMatch && !total) {
        total = totalMatch[1].replace(/\s/g, "").replace(",", "")
      }

      const numMatch = line.match(/(?:factura|folio|no|número|fact\.?)[:\s]*([\w-]+)/i)
      if (numMatch && !numero) {
        numero = numMatch[1]
      }
    }

    if (!concepto && lines.length > 0) {
      concepto = lines.slice(0, 3).join(" | ").substring(0, 200)
    }

    return { empresa, fecha, total, numero, concepto }
  }

  const runOCR = useCallback(async (imageUrl: string) => {
    setOcrLoading(true)
    try {
      const Tesseract = await import("tesseract.js")
      const result = await Tesseract.recognize(imageUrl, "spa+eng", {
        logger: () => {},
      })
      const parsed = parseOCRText(result.data.text)
      if (parsed.empresa) setEmpresa(parsed.empresa)
      if (parsed.fecha) setFechaEmision(parsed.fecha)
      if (parsed.total) setTotal(parsed.total)
      if (parsed.numero) setNumeroFactura(parsed.numero)
      if (parsed.concepto) setConcepto(parsed.concepto)
    } catch (err) {
      console.error("OCR error:", err)
    } finally {
      setOcrLoading(false)
    }
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImagenFile(file)
    setImagenExistente(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImagenPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    const supabase = createClient()
    const ext = file.name.split(".").pop() || "jpg"
    const path = `${userId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from("facturas-imagenes")
      .upload(path, file, { contentType: file.type })

    if (error) {
      console.error("Upload error:", error)
      return null
    }

    const { data } = supabase.storage.from("facturas-imagenes").getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let imageUrl = imagenExistente
    if (imagenFile) {
      imageUrl = await uploadImage(imagenFile, user.id)
    }

    const data = {
      usuario_id: user.id,
      empresa: empresa || null,
      fecha_emision: fechaEmision || null,
      numero_factura: numeroFactura || null,
      concepto: concepto || null,
      total: total ? Number(total) : null,
      imagen_url: imageUrl,
    }

    if (editando) {
      await supabase.from("facturas").update(data).eq("id", editando.id)
    } else {
      await supabase.from("facturas").insert(data)
    }

    setShowModal(false)
    resetForm()
    fetchFacturas()
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta factura?")) return
    const supabase = createClient()
    await supabase.from("facturas").delete().eq("id", id)
    fetchFacturas()
  }

  const resetForm = () => {
    setEditando(null)
    setEmpresa("")
    setFechaEmision("")
    setNumeroFactura("")
    setConcepto("")
    setTotal("")
    setImagenFile(null)
    setImagenPreview(null)
    setImagenExistente(null)
  }

  const openModal = (factura?: Factura) => {
    if (factura) {
      setEditando(factura)
      setEmpresa(factura.empresa || "")
      setFechaEmision(factura.fecha_emision || "")
      setNumeroFactura(factura.numero_factura || "")
      setConcepto(factura.concepto || "")
      setTotal(factura.total ? String(factura.total) : "")
      setImagenExistente(factura.imagen_url)
      setImagenPreview(null)
      setImagenFile(null)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ]

  const totalFacturas = facturas.reduce((s, f) => s + (Number(f.total) || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-wealth/20 border-t-wealth rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="stagger">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Facturas</h1>
          <p className="text-ink-muted text-sm">Registra facturas escaneando fotos o subiendo imágenes</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-wealth text-primary-foreground rounded-lg hover:bg-wealth-light transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Factura
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-ink-muted mb-1">Total Facturas del Mes</p>
          <p className="text-lg font-bold text-wealth">{fmt(totalFacturas)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-ink-muted mb-1">Facturas Registradas</p>
          <p className="text-lg font-bold text-ink">{facturas.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-ink-muted" />
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(Number(e.target.value))}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-surface-elevated"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(Number(e.target.value))}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-surface-elevated"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de facturas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facturas.length === 0 ? (
          <div className="col-span-full bg-card rounded-xl border border-border py-16 text-center">
            <FileText className="w-12 h-12 text-ink-subtle mx-auto mb-3" />
            <p className="text-ink-muted">No hay facturas este mes</p>
            <p className="text-sm text-ink-subtle mt-1">Sube una foto o toma una foto de una factura</p>
            <button
              onClick={() => openModal()}
              className="mt-4 px-4 py-2 bg-wealth text-primary-foreground rounded-lg hover:bg-wealth-light transition-colors text-sm font-medium"
            >
              Agregar factura
            </button>
          </div>
        ) : (
          facturas.map((f) => (
            <div key={f.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
              {f.imagen_url ? (
                <div className="relative h-40 bg-muted overflow-hidden">
                  <img
                    src={f.imagen_url}
                    alt={`Factura ${f.empresa || ""}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setVerModal(f)}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="h-40 bg-muted flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-ink-subtle" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-ink truncate">{f.empresa || "Sin empresa"}</h3>
                  {f.numero_factura && (
                    <span className="text-xs bg-wealth/10 text-wealth px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      #{f.numero_factura}
                    </span>
                  )}
                </div>
                {f.concepto && (
                  <p className="text-xs text-ink-muted truncate mb-2">{f.concepto}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-ink-subtle">
                    <Calendar className="w-3 h-3" />
                    {f.fecha_emision
                      ? new Date(f.fecha_emision + "T12:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })
                      : "Sin fecha"}
                  </div>
                  <p className="font-semibold text-wealth">{f.total ? fmt(Number(f.total)) : "—"}</p>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => openModal(f)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-ink-muted hover:text-wealth bg-surface rounded-lg transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-ink-muted hover:text-danger bg-surface rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nueva/Editar Factura */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-lg font-semibold text-ink">
                {editando ? "Editar Factura" : "Nueva Factura"}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="text-ink-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Zona de imagen */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Foto de la Factura</label>
                {imagenPreview || imagenExistente ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img
                      src={imagenPreview || imagenExistente || ""}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => { setImagenPreview(null); setImagenExistente(null); setImagenFile(null) }}
                      className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {imagenPreview && !ocrLoading && (
                      <button
                        type="button"
                        onClick={() => runOCR(imagenPreview)}
                        className="absolute bottom-2 right-2 px-3 py-1.5 bg-wealth text-white rounded-lg text-xs font-medium hover:bg-wealth-light flex items-center gap-1"
                      >
                        <Loader2 className={`w-3 h-3 ${ocrLoading ? "animate-spin" : ""}`} />
                        Escanear OCR
                      </button>
                    )}
                    {ocrLoading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-white">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm font-medium">Escaneando factura...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-xl hover:border-wealth hover:bg-wealth/5 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-ink-subtle" />
                      <span className="text-sm text-ink-muted">Subir archivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-xl hover:border-wealth hover:bg-wealth/5 transition-colors"
                    >
                      <Camera className="w-8 h-8 text-ink-subtle" />
                      <span className="text-sm text-ink-muted">Tomar foto</span>
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Empresa / Negocio</label>
                <input
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border-strong rounded-lg focus:ring-2 focus:ring-wealth focus:border-transparent outline-none"
                  placeholder="Ej: Walmart, TNT, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Fecha de emisión</label>
                  <input
                    type="date"
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border-strong rounded-lg focus:ring-2 focus:ring-wealth focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">N° Factura</label>
                  <input
                    type="text"
                    value={numeroFactura}
                    onChange={(e) => setNumeroFactura(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border-strong rounded-lg focus:ring-2 focus:ring-wealth focus:border-transparent outline-none"
                    placeholder="Folio o número"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Concepto / Descripción</label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border-strong rounded-lg focus:ring-2 focus:ring-wealth focus:border-transparent outline-none"
                  placeholder="Servicio o producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Total (GTQ)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border-strong rounded-lg focus:ring-2 focus:ring-wealth focus:border-transparent outline-none"
                  placeholder="0.00"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-wealth hover:bg-wealth-light text-primary-foreground font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {editando ? "Guardar Cambios" : "Guardar Factura"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Imagen */}
      {verModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setVerModal(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setVerModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={verModal.imagen_url || ""}
              alt={`Factura ${verModal.empresa || ""}`}
              className="max-w-full max-h-[85vh] rounded-xl object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-xl">
              <p className="text-white font-medium">{verModal.empresa || "Sin empresa"}</p>
              <p className="text-white/70 text-sm">
                {verModal.fecha_emision ? new Date(verModal.fecha_emision + "T12:00:00").toLocaleDateString("es-GT") : ""} · {verModal.total ? fmt(Number(verModal.total)) : ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
