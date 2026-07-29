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

## 1. Separar auth a su propio proyecto  ⚠️ #1 — sesión fresca, presupuesto completo

Hoy `auth` (Supabase Auth) vive DENTRO del proyecto `condomanager`
(`twkuidnjwhopbjnrhnxp`). Si ese proyecto se borra o corrompe, **se cae el login
de TODO el ecosistema.** Pro resolvió el pausado, NO esto.

- Crear proyecto Supabase `sorsabsa-identity` (solo identidad).
- Apuntar auth-sorsabsa ahí.
- **Compartir el secreto del JWT con los TRES productos que usan el SSO:**
  `condomanager`, `domuscrm`, `agente24siete` (verificado: agente24siete delega
  en auth-sorsabsa, no firma JWT propios). Sin esto, su RLS `auth.uid()` deja de
  validar los tokens → login roto.
- Recrear los usuarios de prueba (hoy no hay usuarios reales → momento limpio).
- Verificar login end-to-end en cada producto ANTES de dar por hecho.

**Por qué en sesión aparte:** es cirugía del login de todo el ecosistema; parte
toca settings del dashboard; es lo que peor quedaría a medio camino si se acaban
los tokens. Se hace de principio a fin, no al final de una sesión larga.

## 2. JustiRed al SSO central

JustiRed (legaltech) tiene **login propio separado** en su propio proyecto
(`jywrjk`), NO pasa por auth-sorsabsa. Viola el principio de arriba. Migrarlo al
SSO para que sea single-sign-on de verdad.

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
