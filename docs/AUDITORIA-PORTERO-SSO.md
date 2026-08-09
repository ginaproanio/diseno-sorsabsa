# Auditoría — portero SSO del ecosistema SORSABSA

**Abierta:** 09-ago-2026. **Regla que gobierna esta auditoría:**
[ESTANDAR-DESARROLLO.md](./ESTANDAR-DESARROLLO.md) — ningún hallazgo de
esta lista se corrige sin presentar antes el análisis de 9 puntos (síntoma,
causa inmediata, causa raíz, componente responsable, código afectado, fix
propuesto, código que se elimina, riesgo de regresión, validación).

**Estado de esta auditoría:** ABIERTA. Si esta sesión se corta, retomar
leyendo este archivo completo antes de tocar código — es la fuente de
verdad de qué está encontrado, qué está corregido, y qué falta.

**Alcance auditado hasta ahora:** `auth-sorsabsa` completo (login, consent,
complete, logout, reset, update-password, register, entity-resolver,
safe-redirect, redirect-allowed, entitlements, send-email hook, apps.ts,
invite-user.mjs) + `iot` (auth_sso.py, editor.py) + comparación contra
`condomanager` (SignOutButton, auth/callback) y `agente24siete/lib/adminAuth.js`
como referencia del patrón ya establecido. **No auditado todavía:**
domuscrm, justired, convertidor (código propio de cada uno, más allá de su
entrada en apps.ts), pagos-sorsabsa en sí.

Leyenda de estado: ⬜ pendiente · 🔧 en análisis (9 puntos presentados,
sin código tocado) · ✅ corregido y verificado · ❌ descartado (no era un
problema real, con motivo).

---

## La cadena que originó esta auditoría (no repetir)

```
IOT nace con Basic Auth propio
  → Fix 1 (08-ago): JWKS stateless + autorización por user_metadata.identidad_iot
    → cuentas de Susana/Patricio creadas EN EL PROYECTO EQUIVOCADO (producto, no identity)
      → Síntoma: bloqueada en /auth/complete ("no pudimos verificar tu cuenta")
        → Fix 2: bypass de entitlements hardcodeado por nombre de app
          → Síntoma: bucle (branding primero, luego el real: callbackUrl nunca se usaba)
            → Fix 3: excepción hardcodeada app==='iot' en /auth/complete
              → Síntoma: reset de contraseña no llegaba a cuentas fuera de identity
                → Fix 4: /auth/reset manda a los DOS proyectos (via=identity/via=producto)
                  → Síntoma: Susana resetea "bien" pero el login sigue fallando
                    → Fix 5: crear cuentas de nuevo en identity + BORRAR las de producto a mano
                      → Síntoma: la federación OIDC crea un usuario NUEVO sin identidad_iot
                        → Fix 6: mapear por email — hardcodeado, y solo en un archivo primero
                          → Síntoma: logout no cerraba nada (no usaba el logout universal)
                            → Fix 7: apuntar logout a /auth/logout
```

Siete parches sobre el mismo problema en menos de 24h. Ninguno era la causa.
La causa raíz es 🔴-1.

---

## 🔴 CRÍTICO

### 🔴-1 — ⬜ No existe un proceso gobernado para dar de alta usuarios con atributos de autorización, ni un mecanismo para propagarlos a los proyectos federados

- **Archivo:** `auth-sorsabsa/scripts/invite-user.mjs` (el proceso) + `iot/auth_sso.py` (la consecuencia)
- **Problema:** ningún componente decide "esta persona debe existir en identity, con estos atributos, con acceso a este producto" — lo decide quien corre el script a mano.
- **Impacto:** causa raíz de toda la cadena de arriba. Pasó dos veces (Susana y Patricio).
- **Solución arquitectónica:** endpoint gobernado en el portero que garantice alta SIEMPRE en identity, con el rol/producto en una tabla real (no en `user_metadata` de un JWT), y que cada producto consulte esa tabla o reciba el claim vía un Custom Access Token Hook configurado explícitamente — nunca inventando su propio criterio.
- **Código a eliminar:** `invite-user.mjs` como mecanismo de alta real (puede quedar como utilidad de emergencia).

### 🔴-2 / 🔴-3 — 🔧 Fallback que trata "no configurado" como estado válido, en el motor de cobros

- **Archivos:**
  `auth-sorsabsa/src/app/api/entitlements/route.ts:47-50` — `if (!pagosUrl) return { active: true, simulated: true }`
  `auth-sorsabsa/src/lib/entity-resolver.ts:27` — `if (!db) return { subject: userId }`
- **Estado de la investigación (09-ago-2026):** `PAGOS_API_URL` y `PAGOS_API_KEY`
  **SÍ existen** en Vercel producción (confirmado vía `vercel env pull`, sin
  exponer valores — solo existencia/longitud). Pero `PAGOS_API_URL` (13
  caracteres) **no empieza con `http://` ni `https://`** — no es una URL
  real, probablemente un placeholder. Eso significa que el código NO cae en
  el fallback "simulated: true" que se temía (ese solo dispara si la
  variable está vacía) — cae en el otro lado: `fetch()` falla al construir
  la URL, se captura, devuelve `503 pagos_unreachable`.
- **Sin confirmar todavía:** si esto bloquea HOY a usuarios reales de
  condomanager/domuscrm/justired/agente24siete (los que no tienen el bypass
  de iot/convertidor). Los logs de Vercel de los últimos 7 días para
  `/api/entitlements` **no tienen tráfico real de otros productos** — todo
  lo que aparece es la prueba propia de hoy con IOT (que ni siquiera llega
  a esta rama, por el bypass). No hay evidencia para afirmar ni descartar
  que otros productos estén bloqueados ahora mismo.
- **Próximo paso antes de tocar código:** confirmar con Gina qué contiene
  realmente `PAGOS_API_URL` (¿placeholder a propósito porque pagos-sorsabsa
  no está en producción todavía? ¿URL vieja de un ambiente que ya no existe?)
  y si CondoManager/DomusCRM han tenido logins reales exitosos recientemente
  fuera de esta sesión.
- **Fix propuesto (una vez confirmado):** distinguir "no configurado en
  desarrollo" de "falló en producción" de forma explícita (por entorno, no
  por ausencia de variable) — en producción, sin motor de pagos conectado
  y verificable, bloquear con un motivo claro, no aprobar ni fallar en
  silencio con un mensaje genérico.
- **Riesgo de regresión:** si el motor de pagos realmente no está listo
  todavía, un fix de "falla-cerrado" mal aplicado podría bloquear acceso
  que hoy funciona por otra razón no identificada — de ahí la necesidad de
  confirmar antes de tocar código.

### 🔴-4 — ⬜ "Funciona por casualidad", admitido en el propio código

- **Archivo:** `auth-sorsabsa/src/app/auth/complete/page.tsx:106-110`
- **Cita textual del comentario:** *"Para las apps Next.js del ecosistema
  eso 'funcionaba' de pura casualidad: su propio cliente de Supabase
  detecta la sesión en CUALQUIER página."*
- **Impacto:** domuscrm, condomanager, justired, agente24siete y convertidor
  no funcionan porque el traspaso de sesión esté bien diseñado — funcionan
  porque `detectSessionInUrl: true` rescata cualquier fragmento por
  accidente. El día que eso cambie en cualquiera de esos clientes, reaparece
  el mismo bug que tuvo IOT, en un producto con clientes reales.
- **Solución arquitectónica:** usar `config.callbackUrl` de forma
  incondicional en `/auth/complete` para todos los productos — ver 🟠-1
  (mismo fix, mismo lugar).

---

## 🟠 ALTO

### 🟠-1 — ⬜ Excepción hardcodeada `app === 'iot'` en /auth/complete

- **Archivo:** `auth-sorsabsa/src/app/auth/complete/page.tsx:122`
- **Código:** `const destinoFinal = app === 'iot' && config.callbackUrl ? config.callbackUrl : destino;`
- **Causa raíz:** `callbackUrl` existe en `AppConfig` para los 6 productos,
  documentado como "el destino real tras el login", pero el código nunca lo
  consultaba para nadie. Se corrigió para uno solo en vez de arreglarlo
  para todos.
- **Componente responsable:** el portero (`/auth/complete`), no cada producto.
- **Fix:** usar `config.callbackUrl` siempre que exista, para cualquier app.
- **Código a eliminar:** `app === 'iot' &&`.

### 🟠-2 — ⬜ Bypass de entitlements hardcodeado por nombre de producto

- **Archivo:** `auth-sorsabsa/src/lib/entity-resolver.ts:51`
- **Código:** `if (app === 'iot' || app === 'convertidor') { return { subject: null, bypass: true }; }`
- **Problema:** decisión de negocio ("este producto no cobra") implementada
  como lista de nombres en una función técnica.
- **Fix:** campo declarativo en `AppConfig` (ej. `billable: boolean`,
  default `true`).
- **Código a eliminar:** el `if` con nombres de producto en
  `entity-resolver.ts` y el gemelo en `api/entitlements/route.ts:42`.

### 🟠-3 — ✅ Autorización duplicada en dos archivos de IOT — CORREGIDO 09-ago-2026

- **Archivos:** `iot/auth_sso.py` (`identidad_actual`) y `iot/editor.py` (`auth_callback_verify`)
- **Qué pasó:** dos copias independientes de la misma regla. Al arreglar la
  primera esta sesión, la segunda quedó rota un rato — confirmó el patrón
  en vivo.
- **Corregido:** ambas usan ahora `identidad_por_email()` en `auth_sso.py`
  como única fuente. Commits `8e7eef6`/`e75ef1f` en el repo `iot`.
- **Pendiente de este hallazgo:** ver 🟠-4 — la función única sigue
  hardcodeada, no es la solución final.

### 🟠-4 — ⬜ `IDENTIDADES_POR_EMAIL` hardcodea dos emails en código fuente

- **Archivo:** `iot/auth_sso.py`
- **Problema:** exactamente lo que la auditoría prohíbe — dos emails
  literales en una constante Python. Mejor que depender de un campo que no
  viaja (🟠-3), pero no es la solución arquitectónica.
- **Comparación con el estándar real:** `agente24siete/lib/adminAuth.js`
  resuelve la misma pregunta contra una **tabla real**
  (`SELECT id, email, nombre FROM usuarios WHERE email = $1`), no una
  constante en código.
- **Fix:** IOT necesita una tabla propia (o consultar una tabla central de
  autorizaciones en identity), no una constante — para que la 3ª persona
  con acceso no requiera un deploy de código.

### 🟠-5 — ⬜ CondoManager nunca usa el logout universal — mismo bug que tuvo IOT, sin corregir

- **Archivo:** `condomanager/app/components/SignOutButton.tsx:34`
- **Código:** `await supabase.auth.signOut();` — solo el cliente de producto, nunca `identityClient`.
- **Impacto:** cualquier residente/administrador de CondoManager que haga
  clic en "Salir del sistema" **no cierra sesión de verdad** — la sesión de
  identity queda viva, el próximo login se auto-aprueba solo. Mismo bucle
  que vivió Gina con IOT, pendiente de explotar en el producto con clientes
  reales (Punta Blanca).
- **Fix:** redirigir a `https://auth.sorsabsa.com/auth/logout?app=condomanager&next=<destino de negocio>`
  en vez de llamar `signOut()` localmente.
- **Código a eliminar:** la llamada directa a `supabase.auth.signOut()` en este archivo.

---

## 🟡 MEDIO

### 🟡-1 — ✅ Eliminación manual de cuentas reales vía SQL directo — reconocido, no repetir

Until 09-ago-2026 para "resolver" las cuentas de Susana/Patricio en el
proyecto equivocado. Funcionó porque se verificó antes que no había foreign
keys de iot hacia esos UUIDs, pero es exactamente lo que la regla de
desarrollo prohíbe. Se resuelve de raíz cuando 🔴-1 esté cerrado — no debería
volver a ser necesario.

### 🟡-2 — ⬜ `PROFILE_CHOICES` con nombres reales hardcodeados en editor.py
`iot/editor.py:63-66`. Mismo síntoma que 🟠-4, para datos de negocio (PDF)
en vez de autenticación. Se resuelve junto con 🟠-4 si se migra a tabla.

### 🟡-3 — ⬜ Reset dual (via=identity/via=producto) normaliza el problema en vez de resolverlo
`auth-sorsabsa/src/app/auth/reset/page.tsx`. Honesto y no filtra
información, pero parte de aceptar como normal que una cuenta real exista
en cualquiera de los dos proyectos. Debería poder eliminarse cuando 🔴-1
esté resuelto y no existan más cuentas nuevas fuera de identity.

---

## 🔵 BAJO

### 🔵-1 — ⬜ `iot.redirectUrl` es una URL cruda de Railway, no dominio propio
No es auth, es infraestructura. Ya documentado, no urgente.

### 🔵-2 — ⬜ Fallback basado en el texto de un error de un proveedor externo
`invite-user.mjs`: `if (error?.message?.includes('already been registered'))`.
Frágil por diseño, bajo impacto mientras el script sea manual.

---

## Próximo paso

Confirmar con Gina el contenido real de `PAGOS_API_URL` (🔴-2/3) antes de
tocar ese código — es el hallazgo en curso. El resto queda ⬜ en el orden
de esta lista salvo que se indique otra prioridad.
