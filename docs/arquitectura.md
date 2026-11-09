# Arquitectura

## Capas

```
src/app            Rutas (Server Components) y páginas públicas
  └─ usa ─▶ src/server/acciones      Server Actions: validan con Zod y llaman a…
               └─ src/server/servicios   Casos de uso (p. ej. «recibir equipo»)
                    ├─ src/domain        Reglas de negocio PURAS (sin I/O) + tests
                    └─ src/server/repositorios   Acceso a Supabase (una entidad por archivo)
src/components     UI reutilizable (ui/) y por funcionalidad (ordenes/, inventario/…)
supabase/          Migraciones SQL, RLS, funciones y pruebas con PGlite
```

Regla: las dependencias apuntan hacia dentro. `src/domain` no importa nada de
Next ni de Supabase, por eso se prueba con tests unitarios rápidos.

## Dónde vive cada regla crítica

| Regla                      | Dónde se hace cumplir                                            | Por qué ahí                                                                  |
| -------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Transiciones de estado     | `cambiar_estado()` en SQL + `domain/estados.ts` para la UI       | La BD no confía en el cliente; la UI solo ofrece opciones válidas            |
| Descuento de stock         | `usar_pieza()` con `SELECT … FOR UPDATE`                         | Dos técnicos no pueden usar la última pieza a la vez                         |
| Garantía y reapertura      | `reabrir_en_garantia()` + `domain/garantia.ts`                   | Igual que arriba                                                             |
| Quién ve qué               | RLS en todas las tablas                                          | Aunque alguien obtenga la anon key, no lee datos sin sesión                  |
| Datos del cliente en el QR | RPC `estado_publico()` (`security definer`)                      | Devuelve solo campos aptos: sin teléfono, IMEI, apellidos ni notas internas  |
| PIN / patrón               | AES-256-GCM en el servidor (`server/cripto.ts`)                  | Una filtración de la BD no expone las claves de los clientes                 |
| Conversión USD → CUP       | `domain/dinero.ts` (en centavos) + `tasa_aplicada` en cada orden | Sin errores de coma flotante; los reportes históricos no cambian con la tasa |

## Modelo de datos

```
perfiles ──────────────┐ (admin / técnicos)
                       │
clientes ──< equipos ──< ordenes_servicio >── perfiles (técnico)
                              │  │  │  └── orden_padre_id (reapertura en garantía)
                              │  │  └──< orden_fotos            (Storage privado)
                              │  └─────< orden_eventos          (estados + notas)
                              └────────< orden_piezas >── piezas ──< movimientos_stock

ajustes (1 fila)        tasas_cambio (historial con fecha y autor)
```

Vistas (`security_invoker`): `v_ordenes`, `v_ordenes_por_estado`,
`v_ingresos_mensuales`, `v_ganancia_piezas`, `v_rendimiento_tecnicos`.

## Rendimiento con conexiones lentas

- Casi todo se renderiza en el servidor; el JavaScript del cliente se limita a
  formularios, el selector de patrón y la subida de fotos.
- Sin fuentes web ni librería de gráficos (barras en CSS).
- Fotos comprimidas a WebP en el propio teléfono antes de subirlas.
- Buscadores y filtros por URL (funcionan sin JS y se pueden compartir).
- `loading.tsx` con esqueletos para responder al instante.
- Service worker: estáticos en caché y página `/offline`.

## Pruebas

| Tipo           | Qué cubre                                                                      | Dónde                      |
| -------------- | ------------------------------------------------------------------------------ | -------------------------- |
| Unitarias      | Estados, dinero, fechas, garantía, WhatsApp, inventario, esquemas Zod, cifrado | `src/**/__tests__`         |
| PDF            | Genera los tickets 80 mm y A4                                                  | `src/server/pdf/__tests__` |
| Generador demo | Invariantes del seed (transiciones, stock, IMEI, fechas)                       | `src/seed/__tests__`       |
| SQL (PGlite)   | Migraciones, RLS por rol, funciones, vistas y el seed contra el esquema real   | `supabase/tests`           |

CI (GitHub Actions) ejecuta lint, formato, tipos, tests y build en cada PR.

## Flujo de trabajo Git

- `main`: producción (cada release lleva un tag `vX.Y.Z`).
- `develop`: integración.
- Ramas cortas `feat/*`, `fix/*`, `chore/*`, `docs/*` desde `develop`, con PR y CI en verde.
- Commits con _Conventional Commits_ en español.
