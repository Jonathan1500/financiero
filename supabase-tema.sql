-- =============================================
-- AGREGAR COLUMNA 'tema' A user_preferences
-- Ejecuta esto en SQL Editor de Supabase
-- =============================================

-- Opción 1: Agregar columna si no existe
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS tema TEXT NOT NULL DEFAULT 'system' 
CHECK (tema IN ('light', 'dark', 'system'));

-- Opción 2: Si la tabla no existe, créala completa
CREATE TABLE IF NOT EXISTS user_preferences (
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  moneda TEXT NOT NULL DEFAULT 'DOP',
  idioma TEXT NOT NULL DEFAULT 'es',
  zona_horaria TEXT NOT NULL DEFAULT 'America/Santo_Domingo',
  tema TEXT NOT NULL DEFAULT 'system' CHECK (tema IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven sus preferencias" ON user_preferences;
CREATE POLICY "Usuarios ven sus preferencias" ON user_preferences
  FOR ALL USING (auth.uid() = usuario_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

-- Refrescar schema cache (PostgREST)
NOTIFY pgrst, 'reload schema';