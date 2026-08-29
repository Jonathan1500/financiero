-- =============================================
-- FACTURAS CON OCR
-- Ejecuta en SQL Editor de Supabase
-- =============================================

-- Tabla de facturas
CREATE TABLE facturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa TEXT,
  fecha_emision DATE,
  numero_factura TEXT,
  concepto TEXT,
  total DECIMAL(12,2),
  imagen_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus facturas" ON facturas
  FOR ALL USING (auth.uid() = usuario_id);

-- Índice para consultas por mes
CREATE INDEX idx_facturas_usuario_fecha ON facturas(usuario_id, fecha_emision);

-- Storage bucket (ejecutar después en Dashboard → Storage → New Bucket)
-- Nombre: facturas-imagenes
-- Pública: false
-- Tamaño máximo: 5MB

-- Políticas de Storage (ejecutar en SQL Editor):
-- INSERT
CREATE POLICY "Usuarios suben sus facturas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'facturas-imagenes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- SELECT
CREATE POLICY "Usuarios ven sus facturas en storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'facturas-imagenes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE
CREATE POLICY "Usuarios eliminan sus facturas en storage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'facturas-imagenes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
