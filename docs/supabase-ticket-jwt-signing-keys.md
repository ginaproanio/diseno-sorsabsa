# Ticket con Supabase — JWT Signing Keys congeladas en `twkuidnjwhopbjnrhnxp`

**Abierto:** 30-jul-2026 · **Atiende:** Gabriel (Supabase Support) ·
**Estado:** ⏳ esperando respuesta.

Contexto completo del intento y la evidencia:
[`PENDIENTES-ECOSISTEMA.md`](PENDIENTES-ECOSISTEMA.md) § 1.

## Qué se pidió (3 cosas)

1. **Borrar/desbloquear la llave revocada `b156c393-…`** antes del
   2026-08-28. Hoy `DELETE` → 422 y `POST` de una standby nueva → 409: las
   llaves de firma de ese proyecto están **congeladas**.
2. **Respuesta definitiva:** ¿puede un proyecto Supabase validar JWTs emitidos
   por otro proyecto Supabase? (Third-Party Auth solo lista Clerk, Firebase,
   Auth0, Cognito y WorkOS — sin OIDC genérico.)
3. **Si es que no:** ¿el secreto legacy HS256 todavía se puede *fijar* a un
   valor elegido en dos proyectos, y hasta cuándo vive?

Más: si el `kid` del JWK enviado siempre se ignora/rechaza, y permiso para
correr el test que pidió contra el proyecto **vacío** `gyqgorgfstffbgazhbnb` en
vez del que sirve el login (cada intento deja residuo 30 días).

## Qué hacer con cada respuesta — árbol de decisión

| Respuesta a la pregunta 2 | Qué significa | Siguiente paso |
|---|---|---|
| **Sí, se puede** (y explican cómo) | El plan original vive | Probar el método **en aislado** (mintear token + golpear `/rest/v1`) ANTES de tocar el dashboard |
| **No, no se soporta** | El plan de la llave compartida muere | Decidir entre las 3 salidas de abajo. No reintentar llaves |
| Responden la 3 con **"sí, se puede fijar el secreto HS256"** | Hay puente temporal | Sirve para desoldar YA, sabiendo que es deprecado |
| Responden la 3 con **"no / se retira pronto"** | No hay puente | Quedan solo las salidas B y C |

**Las tres salidas** (ninguna decidida al 30-jul-2026):

- **A) HS256 compartido** — desuelda ya, sin refactor. Deprecado por Supabase:
  puente temporal. Depende de la respuesta 3.
- **B) Verificación server-side** por producto (patrón agente24siete). Correcto
  y sin deuda, pero **refactor de la capa de datos** de CondoManager y DomusCRM
  (hoy browser-RLS). Semanas.
- **C) Identidad fuera de Supabase** — Clerk / WorkOS / Auth0, que Supabase SÍ
  soporta nativamente como emisor externo. **El RLS de los tres productos no se
  toca**; lo que se rehace es `auth-sorsabsa` (las pantallas de login). Los 4
  usuarios actuales son de prueba y se recrean. `sorsabsa-identity` sobraría y
  se borra ($10/mes). Surgió el 30-jul y **no se le ha presentado a Gina para
  decidir todavía**.

## La carta enviada, íntegra

> Hi Gabriel,
>
> Thank you for the detailed log review — your timeline is accurate and it
> matches exactly what we did. Let me explain **why** we did it, because I don't
> think we are reporting a bug: we hit a design limit, and now we are stuck in a
> state we cannot clean up ourselves.
>
> **1. What we are trying to solve**
>
> Our `auth` schema — the login for our **entire** ecosystem — currently lives
> **inside** the Supabase project of one of our products,
> `twkuidnjwhopbjnrhnxp`. That same project also holds the databases of two
> other products (schemas `domus` and `justired`).
>
> This means that if that single project is paused, broken or deleted, **the
> login of all four of our products dies at once**. This already bit us: on
> 2026-07-26 that coupling took down payments and notifications across four
> products simultaneously. We are about to onboard a real client (~600 units)
> and are planning for ~3000 users on another product, so we cannot keep
> identity held hostage inside a product.
>
> **Our goal:** move `auth` out to its own dedicated project,
> `gyqgorgfstffbgazhbnb` (`sorsabsa-identity`), created 2026-07-29 for exactly
> this purpose, so that identity depends on no product and every product depends
> on identity.
>
> **2. Why that led us to the signing keys screen**
>
> Our products authorize **from the browser** using RLS policies based on
> `auth.uid()`, which reads the `sub` claim from the JWT. The component that
> validates that JWT is the PostgREST of the project that owns the database, and
> it matches on the **`kid`** header.
>
> We verified this ourselves: we minted a token signed with the identity
> project's key and called the product project's REST API. It returned:
>
> ```
> 401 — "No suitable key"
> ```
>
> So our plan was: **import the same signing key into both projects**, so both
> would present the same `kid`, and the product project would keep validating
> tokens issued by identity **without any refactor** — configuration, not a
> rewrite. That is the only reason we touched signing keys at all.
>
> **3. What we did (this is the timeline in your logs)**
>
> - **23:37:16Z — POST → 201.** Imported an existing EC P-256 private key (JWK,
>   `ES256`) as a **standby** key. The JWK had **no `kid` field**. Supabase
>   assigned it `b156c393-…`.
> - **23:54:30Z — PATCH → 200.** "Move to previously used" (trying to free the
>   standby slot).
> - **23:57:05Z — PATCH → 200.** "Revoke" (same purpose).
> - **23:55:13Z → 00:09:03Z — POST → 409.** Re-imports of **the same key
>   material**, this time with an explicit `"kid"` in the JWK (the identity
>   project's kid), so the two projects would match. All rejected with
>   `Failed to create new signing key in standby status for project` —
>   including the attempts made *after* the move and *after* the revoke.
> - **23:59:06Z → 00:55:40Z — DELETE → 422.** Attempts to remove the revoked
>   key, blocked until `2026-08-28T23:57:02.736Z`.
>
> **Nothing in production was affected.** Every key involved was *standby* and
> was never rotated into use; the project kept signing with its original key
> throughout, and we have confirmed its JWKS still publishes exactly that one
> original key.
>
> **4. Where we are stuck right now**
>
> Two symptoms, and they feed each other:
>
> 1. **We cannot delete the revoked key `b156c393-…`** — 422, locked for 30
>    days.
> 2. **We cannot create a new standby key** — 409. Our reading is that the
>    revoked key is still occupying the standby slot, or that the project still
>    recognizes its key material and refuses a duplicate. We cannot tell which,
>    because the error message is identical in every case.
>
> The net effect is that **the JWT signing keys of this project are frozen**: we
> can neither remove what we created nor create anything new, and we have to
> wait until 2026-08-28 unless you can release it.
>
> **5. What we need from you**
>
> 1. **Please remove or unlock the revoked key `b156c393-…` now**, ahead of the
>    30-day window, so the standby slot is usable again. That key never signed a
>    single token — it was created as standby and never rotated — so removing it
>    invalidates nothing.
>
> 2. **Please confirm, definitively: can one Supabase project validate JWTs
>    issued by another Supabase project?** We have already checked Third-Party
>    Auth; the docs list Clerk, Firebase Auth, Auth0, AWS Cognito and WorkOS,
>    with no generic OIDC option, so it does not appear to cover
>    Supabase → Supabase. If the answer is "no, this is not supported", please
>    say so plainly — a clear "no" is genuinely more useful to us than a
>    workaround, and we will change our architecture accordingly instead of
>    trying again.
>
> 3. **If the answer is no:** can the legacy HS256 JWT secret still be *set* to
>    a chosen value on two projects (the mechanism the deprecated Clerk
>    integration used), and what is its remaining lifetime? We would rather not
>    build on something about to be removed, but we need to know whether it is
>    an option at all.
>
> Two smaller points, in case they help you reproduce:
>
> - Is the `kid` always assigned by Supabase on
>   `POST /config/auth/signing-keys`, with any `kid` in the submitted JWK
>   ignored or rejected?
> - You asked us to retry standby key creation from both the Dashboard and the
>   Management API. We are willing, and will report exact UTC timestamps — but
>   as your own logs show, each attempt leaves a key we cannot remove for 30
>   days. So we would like to run that test against our **empty** project
>   `gyqgorgfstffbgazhbnb` rather than against the project that serves our
>   users' login. Please confirm that works for your investigation, or tell us
>   what you need instead.
>
> The screenshot of the JWT settings page is attached, with the key IDs hidden.
>
> Thank you,
> Gina

## Cuando llegue la respuesta

Pegar aquí abajo lo que respondan, con fecha, **antes de tocar nada**. Y
recordar la regla dura de § 1: el próximo intento se verifica en aislado
(mintear token + golpear la API) ANTES de pedir un clic en el dashboard en vivo.

### Respuesta de Supabase

_(pendiente al 30-jul-2026)_
