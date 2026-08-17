-- =============================================
-- SISTEMA DE FINANZAS PERSONALES
-- Ejecuta este SQL en el SQL Editor de Supabase
-- =============================================

-- Tabla de categorías
CREATE TABLE categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  color TEXT DEFAULT '#6366f1',
  icono TEXT DEFAULT 'tag',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de transacciones
CREATE TABLE transacciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  monto DECIMAL(12,2) NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de presupuestos
CREATE TABLE presupuestos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE NOT NULL,
  monto_limite DECIMAL(12,2) NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, categoria_id, mes, anio)
);

-- Tabla de metas de ahorro
CREATE TABLE metas_ahorro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  monto_objetivo DECIMAL(12,2) NOT NULL,
  monto_actual DECIMAL(12,2) DEFAULT 0,
  fecha_limite DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_ahorro ENABLE ROW LEVEL SECURITY;

-- Políticas para categorías
CREATE POLICY "Usuarios ven sus propias categorías" ON categorias
  FOR ALL USING (auth.uid() = usuario_id);

-- Políticas para transacciones
CREATE POLICY "Usuarios ven sus propias transacciones" ON transacciones
  FOR ALL USING (auth.uid() = usuario_id);

-- Políticas para presupuestos
CREATE POLICY "Usuarios ven sus propios presupuestos" ON presupuestos
  FOR ALL USING (auth.uid() = usuario_id);

-- Políticas para metas de ahorro
CREATE POLICY "Usuarios ven sus propias metas" ON metas_ahorro
  FOR ALL USING (auth.uid() = usuario_id);

-- =============================================
-- CATEGORÍAS POR DEFECTO
-- =============================================

-- Estas categorías se crearán para cada usuario nuevo usando un trigger
-- O puedes insertarlas manualmente después del registro
