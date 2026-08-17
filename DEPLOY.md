# =============================================
# DESPLIEGUE COMPLETO - FINANZAS PERSONALES
# Next.js + Supabase + Vercel
# =============================================

# ---------------------------------------------------------
# 1. CREAR PROYECTO EN SUPABASE (2 min)
# ---------------------------------------------------------
# - Ve a https://supabase.com/dashboard
# - "New Project" → Nombre: finanzas-personales
# - Password: genera uno fuerte (guárdalo)
# - Region: la más cercana
# - Espera a que termine

# ---------------------------------------------------------
# 2. EJECUTAR SQL EN SUPABASE
# ---------------------------------------------------------
# - SQL Editor → "New query"
# - Copia TODO el contenido de supabase-schema.sql
# - Click "Run"

# ---------------------------------------------------------
# 3. OBTENER CREDENCIALES SUPABASE
# ---------------------------------------------------------
# Settings → API → Copia:
#   Project URL        → NEXT_PUBLIC_SUPABASE_URL
#   anon public key    → NEXT_PUBLIC_SUPABASE_ANON_KEY

# ---------------------------------------------------------
# 4. VARIABLES DE ENTORNO (.env.local)
# ---------------------------------------------------------
# Copia esto a .env.local y reemplaza los valores de Supabase:

NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
NEXTAUTH_SECRET=5kiR2L35BB3W56caYl4jrlkJKDlTrUpBMM9gqhFgus0=
NEXTAUTH_URL=http://localhost:3000

# ---------------------------------------------------------
# 5. PROBAR EN LOCAL
# ---------------------------------------------------------
cd /opt/lampp/htdocs/financiero
npm run dev
# Abre http://localhost:3000

# ---------------------------------------------------------
# 6. SUBIR A GITHUB
# ---------------------------------------------------------
cd /opt/lampp/htdocs/financiero

# Inicializar git (si no está hecho)
git init

# Agregar archivos
git add .

# Commit inicial
git commit -m "Initial commit: Finanzas personales con Next.js + Supabase"

# Renombrar rama a main
git branch -M main

# Conectar con tu repositorio GitHub (REEMPLAZA TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/financiero.git

# Subir
git push -u origin main

# ---------------------------------------------------------
# 7. DEPLOY EN VERCEL
# ---------------------------------------------------------
# 1. Ve a https://vercel.com → "Add New Project"
# 2. Importa tu repositorio de GitHub
# 3. Framework: Next.js (se detecta solo)
# 4. Environment Variables (agrega las 4):
#      NEXT_PUBLIC_SUPABASE_URL = [tu URL de Supabase]
#      NEXT_PUBLIC_SUPABASE_ANON_KEY = [tu anon key de Supabase]
#      NEXTAUTH_SECRET = 5kiR2L35BB3W56caYl4jrlkJKDlTrUpBMM9gqhFgus0=
#      NEXTAUTH_URL = https://tu-proyecto.vercel.app  (o déjalo vacío por ahora)
# 5. "Deploy"

# ---------------------------------------------------------
# 8. ACTUALIZAR NEXTAUTH_URL TRAS PRIMER DEPLOY
# ---------------------------------------------------------
# 1. Copia la URL que te da Vercel (ej: https://financiero-abc123.vercel.app)
# 2. En Vercel → Settings → Environment Variables
# 3. Edita NEXTAUTH_URL = https://financiero-abc123.vercel.app
# 4. Save → "Redeploy" (último deployment → "..." → Redeploy)

# ---------------------------------------------------------
# 9. CONFIGURAR AUTH EN SUPABASE (opcional pero recomendado)
# ---------------------------------------------------------
# En Supabase → Authentication → Settings:
# - Site URL: https://tu-proyecto.vercel.app
# - Redirect URLs: https://tu-proyecto.vercel.app/api/auth/callback/credentials

# ---------------------------------------------------------
# COMANDOS ÚTILES
# ---------------------------------------------------------
# Desarrollo:
#   npm run dev

# Build producción:
#   npm run build

# Ver build local:
#   npm run start

# Actualizar dependencias:
#   npm update

# Ver logs en Vercel:
#   Vercel Dashboard → tu proyecto → Functions → View Logs

# ---------------------------------------------------------
# ESTRUCTURA DEL PROYECTO
# ---------------------------------------------------------
# financiero/
# ├── .env.local                    # Variables locales (no subir a git)
# ├── env-template.txt              # Este archivo
# ├── supabase-schema.sql           # SQL para Supabase
# ├── src/
# │   ├── app/
# │   │   ├── api/auth/[...nextauth]/route.ts
# │   │   ├── dashboard/            # Páginas protegidas
# │   │   ├── login/page.tsx
# │   │   ├── register/page.tsx
# │   │   ├── layout.tsx
# │   │   └── page.tsx
# │   ├── components/
# │   ├── lib/
# │   ├── middleware.ts
# │   └── types/next-auth.d.ts
# └── package.json

# ---------------------------------------------------------
# NOTAS IMPORTANTES
# ---------------------------------------------------------
# - .env.local está en .gitignore (no se sube a GitHub)
# - Las variables en Vercel son SECRETAS (no visibles en repo)
# - RLS en Supabase protege que usuarios vean solo sus datos
# - Si cambias NEXTAUTH_SECRET, todos los usuarios tendrán que loguearse de nuevo