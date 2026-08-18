-- =============================================
-- PAGOS FIJOS / RECURRENTES
-- Ejecuta en SQL Editor de Supabase
-- =============================================

CREATE TABLE pagos_fijos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  monto DECIMAL(12,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  dia_cobro INTEGER NOT NULL CHECK (dia_cobro BETWEEN 1 AND 31),
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE pagos_fijos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus pagos fijos" ON pagos_fijos
  FOR ALL USING (auth.uid() = usuario_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_pagos_fijos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pagos_fijos_updated_at ON pagos_fijos;
CREATE TRIGGER update_pagos_fijos_updated_at
  BEFORE UPDATE ON pagos_fijos
  FOR EACH ROW EXECUTE FUNCTION update_pagos_fijos_updated_at();

-- Índice para consultas por mes/día
CREATE INDEX idx_pagos_fijos_usuario_dia ON pagos_fijos(usuario_id, dia_cobro) WHERE activo = true;

-- Ejemplo de datos (se crean al registrar usuario vía trigger si quieres)
/*
INSERT INTO pagos_fijos (usuario_id, categoria_id, nombre, descripcion, monto, tipo, dia_cobro) VALUES
  (auth.uid(), (SELECT id FROM categorias WHERE nombre = 'Vivienda' AND usuario_id = auth.uid() LIMIT 1), 'Alquiler', 'Pago mensual de alquiler', 8000, 'gasto', 1),
  (auth.uid(), (SELECT id FROM categorias WHERE nombre = 'Servicios' AND usuario_id = auth.uid() LIMIT 1), 'Internet', 'Plan fibra óptica', 1200, 'gasto', 5),
  (auth.uid(), (SELECT id FROM categorias WHERE nombre = 'Suscripciones' AND usuario_id = auth.uid() LIMIT 1), 'Netflix', 'Suscripción mensual', 450, 'gasto', 10);
*/