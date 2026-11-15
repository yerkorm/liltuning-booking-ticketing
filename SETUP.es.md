# LilTuning — sitio + reservas + ticketera de eventos

Sitio público de LilTuning (car audio) con sistema de reservas online, abono
vía Mercado Pago, venta de entradas para eventos con validación por QR en
la puerta, y panel de administración con dos roles (atención al público /
super administrador).

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4) — sitio, API y panel admin en un solo proyecto.
- **Supabase** — Postgres + Auth (login del panel) + Row Level Security.
- **Mercado Pago Checkout Pro** — cobro del abono de reserva y de las entradas de eventos.
- **qrcode / jsQR** — generación de códigos QR de las entradas y lectura por cámara para el check-in (sin dependencias nativas, corre bien en Cloudflare Workers).
- **Cloudflare Workers** (vía `@opennextjs/cloudflare`) — hosting, en una cuenta de Cloudflare **nueva y separada**, dedicada a este cliente (no la cuenta personal de LandApp/CARGOO).

## 1. Crear el proyecto de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y corre, en este orden:
   - [`supabase/schema.sql`](supabase/schema.sql) — tablas, índices, RLS de reservas.
   - [`supabase/seed.sql`](supabase/seed.sql) — servicios de ejemplo, horario base, configuración inicial (ya incluye el Instagram y WhatsApp reales de LilTuning).
   - [`supabase/tickets.sql`](supabase/tickets.sql) — tablas, RLS y funciones de la ticketera de eventos (usa funciones creadas en `schema.sql`, córrelo después).
   - [`supabase/seed_tickets.sql`](supabase/seed_tickets.sql) — opcional, un evento de ejemplo con 2 tipos de entrada para probar el flujo.
3. Ve a **Project Settings -> API** y copia:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (¡secreta!) -> `SUPABASE_SERVICE_ROLE_KEY`

### Crear el primer super administrador

El panel solo permite crear cuentas de staff **desde el panel mismo** (rol
super_admin), así que la primera cuenta hay que crearla a mano una sola vez:

1. En Supabase, ve a **Authentication -> Users -> Add user** y crea el
   usuario (correo + contraseña) con "Auto Confirm User" activado.
2. Copia el UUID del usuario recién creado.
3. En **SQL Editor**, corre:
   ```sql
   insert into staff_users (id, full_name, role)
   values ('PEGA-AQUI-EL-UUID', 'Nombre del dueño', 'super_admin');
   ```
4. Ya puedes entrar en `/admin/login` con ese correo/contraseña. Desde
   **Admin -> Equipo** puedes crear el resto de las cuentas de staff
   normalmente (esas sí se crean solas).

## 2. Variables de entorno

Copia `.env.local.example` a `.env.local` y completa:

```bash
cp .env.local.example .env.local
```

| Variable | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase -> Project Settings -> API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase -> Project Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase -> Project Settings -> API (secreta, solo servidor) |
| `MERCADOPAGO_ACCESS_TOKEN` | developers.mercadopago.com -> Tus integraciones -> Credenciales (usa las de **prueba** primero, `TEST-...`) |
| `MERCADOPAGO_WEBHOOK_SECRET` | developers.mercadopago.com -> Tu app -> Webhooks -> Configurar notificaciones (clave secreta que se genera ahí) |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (`http://localhost:3000` en local, tu dominio en producción) |

El monto del abono **no** es una variable de entorno: vive en la tabla
`site_settings` y se edita desde **Admin -> Configuración**.

## 3. Correr en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. El sitio funciona con `.env.local` vacío
(usa valores por defecto y listas vacías), pero para probar reservas,
pagos y el panel necesitas el proyecto de Supabase configurado (paso 1).

## 4. Probar el pago con Mercado Pago (sandbox)

Con `MERCADOPAGO_ACCESS_TOKEN` en modo `TEST-...`, el checkout se abre en
modo sandbox automáticamente. Para simular un pago:

1. Crea un comprador de prueba en developers.mercadopago.com -> Tus
   integraciones -> Cuentas de prueba (o usa uno ya creado).
2. En el checkout, inicia sesión con ese comprador de prueba y paga con
   una tarjeta de prueba (por ejemplo, la tarjeta de aprobación automática
   que entrega el panel de Mercado Pago para tu país).
3. El webhook (`/api/mercadopago/webhook`) confirma el pago automáticamente
   y la reserva pasa a `confirmed`. En local, para que Mercado Pago pueda
   llegar a tu webhook necesitas exponerlo con una herramienta como
   `cloudflared tunnel` o `ngrok` y usar esa URL pública como
   `NEXT_PUBLIC_SITE_URL` mientras pruebas.

## 5. Vender entradas para eventos (ticketera)

1. Crea el evento desde **Admin -> Eventos -> + Nuevo evento** (queda como
   borrador) y agrégale uno o más **tipos de entrada** (nombre, precio,
   cupo total, máximo por compra) desde el detalle del evento.
2. Publícalo desde la lista de eventos — recién ahí aparece en `/eventos`
   para el público.
3. El comprador elige cantidad por tipo de entrada, paga con Mercado Pago
   (mismo flujo sandbox/producción que el abono de reservas) y al aprobarse
   el pago se generan automáticamente sus entradas, cada una con un código
   único y un QR. Puede verlas/descargarlas (imprimir a PDF) desde la
   página de confirmación.
4. **Check-in en la puerta**: `Admin -> Check-in` (disponible para staff y
   super_admin) abre la cámara del celular/tablet y escanea el QR;
   confirma en pantalla si la entrada es válida, ya fue usada, o no existe,
   y la marca como usada al instante para que no se pueda reusar. Si la
   cámara falla o no hay buena luz, hay un campo para escribir el código a
   mano.
5. **Requisito de la cámara en producción**: los navegadores solo dan
   acceso a la cámara en HTTPS (o `localhost`). Un dominio real en
   Cloudflare ya sirve por HTTPS por defecto, así que esto funciona solo
   una vez desplegado — no hace falta configurar nada aparte.
6. El control de cupos es atómico a nivel de base de datos (no se puede
   sobrevender aunque compren varias personas al mismo tiempo), y las
   órdenes de pago abandonadas liberan el cupo automáticamente tras el
   mismo tiempo de espera que las reservas.

## 6. Desplegar a producción (Cloudflare Workers)

**Usa una cuenta de Cloudflare nueva, dedicada a este cliente** — no la
cuenta personal donde viven LandApp/CARGOO. Así la facturación, los
dominios y los permisos quedan separados por proyecto/cliente desde el
día uno.

El proyecto ya trae el adaptador [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)
configurado (`wrangler.jsonc`, `open-next.config.ts`, scripts `cf:*` en
`package.json`). Camino recomendado: **Git + Cloudflare Workers Builds**
(Cloudflare compila en Linux al hacer push, evita cualquier problema de
symlinks de Windows al compilar en tu PC):

1. Sube el repo a GitHub (bajo la organización/cuenta del cliente, si
   aplica).
2. En el dashboard de Cloudflare (cuenta nueva) -> **Workers & Pages ->
   Create -> Connect to Git**, elige el repo.
3. Build command: `npm run cf:build`. Cloudflare detecta `wrangler.jsonc`
   y despliega el worker automáticamente tras el build.
4. Configura las variables de entorno en **Settings -> Variables and
   Secrets**:
   - Como **Environment Variables** (necesarias en build time, porque
     `NEXT_PUBLIC_*` se incrusta en el bundle del cliente):
     `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `NEXT_PUBLIC_SITE_URL` (tu dominio real).
   - Como **Secrets** (solo runtime, nunca en el bundle):
     `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`,
     `MERCADOPAGO_WEBHOOK_SECRET`.
5. Antes de cobrar de verdad, cambia `MERCADOPAGO_ACCESS_TOKEN` a la
   credencial de **producción** (`APP_USR-...`) y configura la URL del
   webhook (`https://tudominio.cl/api/mercadopago/webhook`) en
   developers.mercadopago.com -> Tu app -> Webhooks.
6. (Opcional) Cache incremental de Next persistente entre despliegues:
   crea un bucket con `npx wrangler r2 bucket create liltuning-opennext-cache`
   y descomenta el bloque `r2_buckets` en `wrangler.jsonc`. No es
   obligatorio para que el sitio funcione.

### Nota: no hay Next.js Proxy/Middleware en este proyecto

Next.js 16 renombró `middleware.ts` a `proxy.ts` y lo dejó corriendo
**siempre en runtime Node.js** (sin opción de volver a Edge). El adaptador
`@opennextjs/cloudflare` (a la fecha de este proyecto) **todavía no soporta
Node.js middleware** en Cloudflare Workers — el build falla con `Node.js
middleware is not currently supported` ([issue abierto en
cloudflare/workers-sdk](https://github.com/cloudflare/workers-sdk/issues/13755)).

Por eso este proyecto no usa `src/proxy.ts`. En su lugar:

- La protección de `/admin/*` la hace directamente
  `src/app/admin/(dashboard)/layout.tsx` (redirige a `/admin/login` si no
  hay sesión válida).
- `/admin/login` redirige a `/admin` si ya hay sesión (server-side, en la
  propia página).
- El refresco de sesión de Supabase ocurre cuando corre un Server Action o
  Route Handler (pueden escribir cookies); una página que solo lee datos
  no puede persistir un refresh de token. En la práctica el staff dispara
  suficientes acciones (marcar reservas, hacer check-in, etc.) como para
  que esto no sea un problema real, pero si algún día alguien queda
  "deslogueado" sin razón aparente, es la primera pista a revisar.

Cuando OpenNext agregue soporte para Node.js middleware, se puede volver a
crear `src/proxy.ts` (ver el histórico de este archivo/README) y centralizar
esa lógica ahí de nuevo.

### Probar el build de Cloudflare en local (opcional)

```bash
npm run cf:build      # compila con next build + empaqueta para Workers
npm run cf:preview    # sirve ese build localmente con workerd (no next dev)
```

Si `cf:build` falla en Windows con un error de symlinks (`EPERM: symlink`),
activa el **Modo Desarrollador de Windows** (Configuración -> Privacidad y
seguridad -> Para desarrolladores) y vuelve a intentar — no bloquea el
camino de Git+Cloudflare Builds, que compila en Linux y no tiene ese
problema.

## Estructura

```
src/app/(public)/       Sitio público: inicio, nosotros, servicios, contacto, reservar
src/app/admin/          Panel de administración (login + dashboard con sidebar por rol)
src/app/api/            Endpoints: disponibilidad, crear reserva, estado de reserva, webhook MP, gestión de staff
src/lib/                Clientes de Supabase, lógica de disponibilidad/horarios, Mercado Pago, auth
supabase/schema.sql       Esquema de reservas + RLS
supabase/seed.sql         Datos iniciales de reservas (servicios, horario, configuración)
supabase/tickets.sql      Esquema de la ticketera (eventos, tipos de entrada, órdenes, entradas) + RLS
supabase/seed_tickets.sql Evento de ejemplo opcional
wrangler.jsonc            Config del Worker de Cloudflare (deploy)
open-next.config.ts       Config del adaptador @opennextjs/cloudflare
```

## Roles del panel

- **Atención a público (`staff`)**: ve y gestiona reservas (marcar
  completada/no-show/cancelada, asignar quién atiende), gestiona la
  disponibilidad de horarios, y hace el **check-in de entradas** (escáner QR)
  en la puerta de los eventos.
- **Super administrador (`super_admin`)**: todo lo anterior, más dashboard
  de métricas, gestión de servicios, gestión de **eventos y tipos de
  entrada** (con ventas/ingresos por evento), gestión de cuentas de staff,
  y configuración general del sitio (abono, contacto, redes sociales).

## Pendiente / a definir por el cliente

- Contenido definitivo de "Nosotros" y catálogo real de servicios (hay
  contenido de ejemplo, editable desde Admin -> Servicios / Configuración).
- Correo y dirección de contacto (el teléfono/WhatsApp e Instagram reales
  ya están cargados en `supabase/seed.sql`).
- Credenciales de **producción** de Mercado Pago.
- Envío de correo de confirmación al cliente, tanto de reservas como de
  entradas (hoy la confirmación es solo en pantalla/descarga — se puede
  sumar con un proveedor tipo Resend más adelante).
- Eventos/tipos de entrada reales (hoy solo existe el de ejemplo de
  `seed_tickets.sql`, si se corrió).
- Logo en fondo oscuro para tema oscuro (ya se usa `public/logo-white.png`
  en el footer y el panel; si más adelante hay una versión distinta,
  reemplazar ese archivo).
