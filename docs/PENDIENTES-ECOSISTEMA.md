# Pendientes del ecosistema SORSABSA

Lista viva de lo que falta, en orden de prioridad. Se va anotando a medida que
aparece. Fuente de arquitectura: `ARQUITECTURA-ECOSISTEMA.md`.

Última actualización: 2026-07-29.

## Principio que gobierna (regla dura)

**Todo producto DEBE usar los sistemas compartidos del ecosistema** (SSO
auth-sorsabsa, pagos-sorsabsa, notificaciones-sorsabsa, design system). Reinventar
cualquiera de ellos = octuplicar código y mantenimiento. Antes de construir
"login propio", "cobro propio" o "notificaciones propias" en un producto, se
usa el compartido.

---

## 1. Separar auth a su propio proyecto  🟠 #1 — INTENTADO 29-jul, chocó un muro real

Hoy `auth` (Supabase Auth) vive DENTRO del proyecto `condomanager`
(`twkuidnjwhopbjnrhnxp`). Si ese proyecto se borra, **se cae el login de TODO el
ecosistema.** (El riesgo de PÉRDIDA está cubierto por backups Pro + solo 4
usuarios basura: gina, puntablanca, eco.ec, andres-pa — NO migrarlos, los reales
se registran frescos.)

### Lo hecho el 29-jul
- ✅ Creado proyecto **`sorsabsa-identity`** = `gyqgorgfstffbgazhbnb` (+$10/mes,
  ACTIVE). **Aún NO está conectado a nada** — decidir si se usa o se borra.

### 🧱 EL MURO (verificado empíricamente — no volver a intentarlo a ciegas)
La idea era: identity firma los tokens, y condomanager confía en ellos SIN
refactor (browser-RLS sigue igual). **No se puede por llave asimétrica compartida:**
- Supabase **asigna el `kid` él mismo al importar una llave** y NO acepta un `kid`
  propio (import falla). Dos proyectos que importan la MISMA llave reciben **kids
  distintos**.
- La validación de Supabase es **estricta por kid**: token firmado con el kid de
  identity → condomanager responde **401 "No suitable key"** (probado minteando el
  token y golpeando `/rest/v1`). Sin kid coincidente, no valida.
- **Third-Party Auth NO sirve**: solo Firebase/Clerk/WorkOS/Auth0/Cognito, sin
  opción "Custom"/OIDC genérico para un Supabase→Supabase.

### Los dos caminos REALES (elegir con la usuaria)
- **A) Secreto HS256 compartido** entre los dos proyectos: esquiva el kid (HS256
  no usa kid), CondoManager NO se refactoriza, desuelda ya. **Pero** es el camino
  **deprecado** por Supabase → puente temporal, no "de raíz".
- **B) Verificación server-side** (patrón agente24siete: cada producto valida el
  token contra el JWKS de identity en su backend). **Correcto, escalable, sin
  deuda.** **Pero** exige refactorizar la capa de datos de CondoManager/DomusCRM
  (hoy browser-RLS) → trabajo real, sesión aparte.

### Estado y método
- **NADA roto:** auth-sorsabsa sigue apuntando a condomanager; solo se
  experimentó con llaves "standby" que se revirtieron. Login en vivo intacto.
- **Regla dura:** el próximo intento se **verifica en aislado** (mintear tokens de
  prueba + golpear las APIs) ANTES de tocar el dashboard en vivo. No más descubrir
  la mecánica sobre la marcha en producción.

## 2. JustiRed al SSO central  🟡 casi hecho — faltan 3 pasos manuales

**Hecho (29-jul-2026):** JustiRed se unificó al proyecto central
`twkuidnjwhopbjnrhnxp` como schema `justired` (mismo patrón que domus). El
frontend ya redirige al SSO (login propio eliminado) y apunta al central con
`db.schema='justired'`. Se descubrió que jywrjk estaba **vacío** (0 filas, 0
usuarios) y que las edge functions de notif/pago **ya eran proxies correctos** a
los compartidos — no reimplementaban nada. Se recrearon en el central: schema +
bucket `justired-legal-documents` (con RLS, el origen la tenía apagada), 4 edge
functions proxy (3 notif → notificaciones-sorsabsa, 1 pago → pagos-sorsabsa) +
`ingesta-legal`. pagos-sorsabsa acepta `PAGOS_API_KEY_JUSTIRED` (ya seteada en
Railway). Frontend redesplegado en Vercel apuntando al central → **el login SSO
ya funciona.**

**Falta (manual — no se puede por MCP; JustiRed no está lanzado, sin urgencia):**

1. **Exponer el schema `justired`** en la API del central: Supabase → central →
   Settings → API → *Exposed schemas* → agregar `justired`. Sin esto, la
   biblioteca legal y los planes no cargan (PostgREST no sirve el schema).
2. **Secretos de las edge functions** (Supabase → central → Edge Functions →
   *Manage secrets*):
   - `NOTIFICACIONES_API_URL` = `https://notificaciones-sorsabsa-production.up.railway.app`
   - `NOTIFICACIONES_API_KEY` = (copiar del servicio notificaciones-sorsabsa en Railway)
   - `PAGOS_API_URL` = `https://pagos-sorsabsa-production.up.railway.app`
   - `PAGOS_API_KEY_JUSTIRED` = `justired_ea7252e2404150600aaf89ac19b6b1d77ab7b416c77b01c5`
     (debe COINCIDIR con la de Railway, ya seteada)
   - `INGESTA_LEGAL_TOKEN` = (cualquiera; también en el scraper — solo para poblar biblioteca)
3. ✅ **Proyecto `jywrjk` dado de baja** (29-jul-2026) — estaba vacío, borrado
   del dashboard. Quedan solo los pasos 1 y 2.

**Después (biblioteca legal, cuando se retome):** repuntar el scraper de JustiRed
(Railway) a la URL de `ingesta-legal` del central + su `INGESTA_LEGAL_TOKEN`.

## 3. ✅ HECHO — cutover de pagos (fuera de Vercel)

pagos-sorsabsa corre en Railway (SORSABSA-DATA), verificado. Los 3 llamadores
(agente24siete, condomanager, domuscrm) repuntados a
`https://pagos-sorsabsa-production.up.railway.app`. Variable estandarizada a
**`PAGOS_API_URL`** en todos (antes agente24siete usaba `PAGOS_SERVICE_URL`;
condo/domus ya usaban `PAGOS_API_URL`). Proyecto pagos-sorsabsa borrado de Vercel.

## 4. ✅ HECHO — notificaciones-sorsabsa → Railway

Mismo patrón que pagos. Corre en Railway, verificado (POST /api/listar → 200).
Llamadores (condomanager, domuscrm) repuntados a
`https://notificaciones-sorsabsa-production.up.railway.app` con `NOTIFICACIONES_API_URL`.
Proyecto borrado de Vercel. (agente24siete todavía no llama a notificaciones —
está en su TODO `alertarAdmin()`.)

## 4-bis. Limpieza menor en agente24siete

Al estandarizar, el fix quedó también en la rama `auditoria/ciclo-operativo`
(commit duplicado 4bc591b) y hay un `git stash` sin aplicar en esa rama. main
quedó correcto y desplegado. Revisar/limpiar la rama y el stash cuando se retome
ese repo. El repo quedó con `main` checked out.

## 5. RLS en 2 tablas expuestas (seguridad)

`public.unidad_fotos` y `domus.invitations` tienen RLS DESACTIVADO — cualquiera
con la anon key lee/escribe todo. Activar RLS + agregar políticas (activar sin
políticas bloquea la tabla, así que van juntas).

## 6. Borrar proyecto Supabase huérfano

`sorsabsa_ecosystem` (`tkkpqbelzwoenmeynjvw`, mayo 2026) — nada del código lo
referencia; intento temprano del proyecto consolidado, anterior al núcleo real.
Borrar desde el dashboard (Supabase → proyecto → Settings → General → Delete
project). MCP no permite borrar proyectos.

## 7. SorsabsaForensic → Fase 0 antes de Railway

Es PyQt5 (app de escritorio), no un servicio. Antes de Railway: poblar
`core/orchestrator.py` (vacío), sacar el renderizador de informe fuera de Qt,
quitar rutas absolutas, Dockerfile. Ver `PLAN_MATERIALIZACION.md` §2.

## 8. Probar CondoManager end-to-end (Punta Blanca)

Nunca se verificó el flujo real: admin entra, crea condominio, carga residentes,
emite alícuota, residente paga. El doc de arquitectura §6 lo marca sin probar.
Esto es lo que convierte "plomería lista" en "producto que funciona para un
cliente".

## 9. Auditar reuso de sistemas compartidos (graphify)

Correr graphify sobre el ecosistema (merge de repos) para ver quién reusa
auth/pagos/notificaciones/design-system y quién reinventó. Sostiene el principio
de arriba con datos.

---

## Hecho (para no re-hacer)

- ✅ pagos + notificaciones: **datos** migrados a Railway (SORSABSA-DATA).
- ✅ pagos-sorsabsa: **código** corriendo en Railway, verificado end-to-end.
- ✅ Convertidor backend, IoT: en Railway.
- ✅ Expedientes forenses (1.5 GB, 2296 archivos) respaldados en R2 privado, íntegros.
- ✅ Supabase Pro activado → núcleo `condomanager` encendido y sin pausarse.
