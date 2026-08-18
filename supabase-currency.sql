-- =============================================
-- AGREGAR CONFIGURACIÓN DE MONEDA + TEMA
-- Ejecuta esto en SQL Editor de Supabase
-- =============================================

-- Tabla de preferencias de usuario
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

CREATE POLICY "Usuarios ven sus preferencias" ON user_preferences
  FOR ALL USING (auth.uid() = usuario_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para obtener o crear preferencias por defecto
CREATE OR REPLACE FUNCTION get_or_create_user_preferences()
RETURNS TABLE (
  usuario_id UUID,
  moneda TEXT,
  idioma TEXT,
  zona_horaria TEXT,
  tema TEXT
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO user_preferences (usuario_id, moneda, idioma, zona_horaria, tema)
  VALUES (auth.uid(), 'DOP', 'es', 'America/Santo_Domingo', 'system')
  ON CONFLICT (usuario_id) DO NOTHING
  RETURNING usuario_id, moneda, idioma, zona_horaria, tema;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Si la tabla ya existe, agregar columna tema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' AND column_name = 'tema'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN tema TEXT NOT NULL DEFAULT 'system' CHECK (tema IN ('light', 'dark', 'system'));
  END IF;
END $$;

-- Monedas soportadas (para referencia)
/*
  Código | Nombre                    | Símbolo | Locale
  -------|---------------------------|---------|--------
  DOP    | Peso Dominicano           | RD$     | es-DO
  GTQ    | Quetzal Guatemalteco      | Q       | es-GT
  USD    | Dólar Estadounidense      | $       | en-US
  EUR    | Euro                      | €       | de-DE
  MXN    | Peso Mexicano             | $       | es-MX
  COP    | Peso Colombiano           | $       | es-CO
  ARS    | Peso Argentino            | $       | es-AR
  PEN    | Sol Peruano               | S/      | es-PE
  CLP    | Peso Chileno              | $       | es-CL
  UYU    | Peso Uruguayo             | $       | es-UY
  VES    | Bolívar Venezolano        | Bs.     | es-VE
*/