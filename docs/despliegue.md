# Despliegue gratuito: Supabase + Vercel

Guía paso a paso para poner TallerTrack en línea **sin coste** (planes gratuitos de
Supabase y Vercel). Tiempo estimado: 20–30 minutos.

> **Nota sobre Cuba.** Algunos servicios estadounidenses limitan el acceso desde
> Cuba. Los paneles de Supabase y Vercel puede que necesiten una VPN para
> configurarlos; la app publicada en `*.vercel.app` la usan después el taller y
> sus clientes. Compruebe que la URL final abre bien desde una conexión cubana
> (datos móviles y wifi) **antes** de enseñársela a un cliente.

---

## 1. Crear el proyecto en Supabase

1. Entre en <https://supabase.com> → **New project**.
2. Nombre: `tallertrack`. Región: **East US (North Virginia)** (la más cercana a Cuba).
3. Guarde la contraseña de la base de datos (no se usa en la app, pero se pide para la CLI).
4. Cuando termine de crearse, vaya a **Project Settings → API** y copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / publishable key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY` (¡secreta!)
   - El **Reference ID** del proyecto (en _General_), para el paso 2.

## 2. Crear las tablas (migraciones)

**Opción A — con la CLI (recomendada):**

```bash
npx supabase login
npx supabase link --project-ref <REFERENCE_ID>
npx supabase db push        # aplica supabase/migrations/* en orden
```

**Opción B — sin instalar nada:** en el panel, **SQL Editor → New query**, pegue y
ejecute **uno por uno y en orden** los archivos de `supabase/migrations/`
(el nombre empieza por la fecha, así que el orden alfabético es el correcto).

Compruebe en **Table Editor** que aparecen `ordenes_servicio`, `piezas`, etc., y en
**Storage** el bucket privado `fotos-ordenes`.

## 3. Configurar la autenticación

En **Authentication**:

- **Sign In / Providers → Email**: deje _Email_ activado y **desactive «Allow new
  users to sign up»** (los usuarios los crea el admin; nadie puede registrarse solo).
- **URL Configuration → Site URL**: la URL de Vercel del paso 5
  (p. ej. `https://tallertrack.vercel.app`). Vuelva aquí cuando la tenga.

## 4. Variables de entorno y datos demo (en su PC)

```bash
cp .env.example .env.local
# Genere la clave de cifrado de PIN/patrones:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Rellene `.env.local` con los valores del paso 1 y esa clave, y siembre la demo:

```bash
npm ci
npm run seed     # crea admin@demo.cu / demo1234, 4 técnicos, 50 órdenes y 30 piezas
npm run dev      # http://localhost:3000
```

> ⚠️ Guarde `DEVICE_SECRET_KEY` en un lugar seguro: si la cambia, los PIN y
> patrones ya guardados no se podrán descifrar.

## 5. Publicar en Vercel

1. Entre en <https://vercel.com> con su cuenta de GitHub → **Add New → Project** →
   importe `tallertrack`. Vercel detecta Next.js solo.
2. En **Environment Variables** añada **las mismas** del `.env.local`:

   | Variable                        | Valor                                             |
   | ------------------------------- | ------------------------------------------------- |
   | `NEXT_PUBLIC_SITE_URL`          | `https://<su-proyecto>.vercel.app`                |
   | `NEXT_PUBLIC_SUPABASE_URL`      | del paso 1                                        |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | del paso 1                                        |
   | `SUPABASE_SERVICE_ROLE_KEY`     | del paso 1 (secreta)                              |
   | `DEVICE_SECRET_KEY`             | la del paso 4 (la misma que usó en el seed)       |
   | `NEXT_PUBLIC_DEMO_MODE`         | `true` para la demo, `false` para un cliente real |

3. **Deploy**. Al terminar, copie la URL, actualice `NEXT_PUBLIC_SITE_URL` si
   cambió y vuelva a desplegar (el QR del ticket usa esa URL).
4. Vuelva a Supabase → **Authentication → URL Configuration** y ponga esa URL
   como _Site URL_.

Cada `push` a `main` despliega producción; cada PR genera una vista previa.

## 6. Comprobaciones finales

- [ ] `/login` muestra las credenciales demo y entra con `admin@demo.cu / demo1234`.
- [ ] Recibir un equipo → imprimir **ticket 80 mm** → escanear el QR con el móvil.
- [ ] La página `/estado/…` abre **sin sesión** y no muestra teléfono ni IMEI.
- [ ] «Avisar al cliente» abre WhatsApp con el mensaje pre-llenado.
- [ ] Subir una foto desde el móvil (se comprime a WebP).
- [ ] Chrome móvil ofrece **«Instalar aplicación»**.
- [ ] `/ajustes` → «Restablecer demo» deja de nuevo 50 órdenes.

## Mantenimiento en el plan gratuito

- Supabase **pausa** los proyectos gratuitos tras ~7 días sin actividad. Para una
  demo de portafolio, ábrala antes de enseñarla (o reactívela en el panel).
- Límites gratis aproximados: 500 MB de base de datos y 1 GB de Storage
  (sobra para miles de órdenes con fotos WebP de ~150 KB).
- Copias de seguridad: el plan gratis no incluye backups automáticos con
  restauración a un punto; para un cliente real, exporte con
  `npx supabase db dump` periódicamente o pase al plan Pro.
