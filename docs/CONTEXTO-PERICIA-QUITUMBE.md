# Contexto — Pericia QUITUMBE: adquisición del indicio USB

**Abierto:** 26-ago-2026. **Para qué existe:** retomar este análisis en otra máquina
sin repetir la investigación. Si el repo está en el equipo nuevo, basta con decir:
*"Lee `docs/CONTEXTO-PERICIA-QUITUMBE.md` y retomamos desde ahí"*. Si no está, este
documento se puede pegar entero como prompt.

**Estado:** el indicio **no se ha tocado**. Nada de lo que sigue se ha ejecutado.

---

## 1. El caso

Instrucción Fiscal **170101822113452** (17297-2026-00909), Fiscalía de Soluciones
Rápidas 1 — Quitumbe, Quito. Presunto **abuso de confianza**. Gina Silvana Proaño
Espinosa (cc 1711274975) designada **perito informática** por memorando
FGE-CGI-DIC-2026-03935-M, cuenta registrada ante el Consejo de la Judicatura:
`sorsabsa@hotmail.com`.

**Encargo:** obtener una **copia forense** de una memoria USB **sin contaminarla**.

**Indicio:** USB **Kingston DTSE9G2**, 8 GB, aluminio, S/N **04715.31A00LF 6843078**,
**cadena de custodia N.º 7984-2025**.

**Expediente:** `c:\sorsabsa\expedientes_forenses\2026\caso-quitumbe`
**Disposición fiscal completa:** `05_varios/disposicion_fiscal_170101822113452.md`

### Estado verificado del expediente (26-ago-2026)

```
01_evidencias/    → VACÍA
02_procesamiento/ → VACÍA
04_imagenes/      → VACÍA
03_informes/datos_estructurados.json → preservacion.fotos: []
```

**El indicio nunca se ha conectado.** No hay imagen, no hay hash previo, no hay
contacto sin registrar. Página en blanco: no hay nada que reconstruir ni explicar.

La ficha del caso ya declara el medio de preservación (marca, capacidad, serie,
cadena de custodia) y ahí se detuvo.

---

## 2. Decidido y verificado — no volver a discutir

### 2.1 DESCARTADO: bloqueo de escritura por registro de Windows

`HKLM\SYSTEM\CurrentControlSet\Control\StorageDevicePolicies` → DWORD
`WriteProtect = 1`.

**Motivo:** falla documentada. En el foro oficial de Microsoft Learn
([Q&A 3905757](https://learn.microsoft.com/en-us/answers/questions/3905757/writeprotect-policy-is-not-working-as-expected-on),
ticket **cerrado sin solución**):

| Dispositivo | Win11 Enterprise 26100 | Win11 Home **22631** | Win10 Home |
|---|---|---|---|
| USB 2.0 4 GB | ✅ | ❌ | ❌ |
| SSD externo 500 GB | ❌ | ❌ | ❌ |
| MicroSD 32 GB | ❌ (solo con switch físico) | ❌ | ❌ |
| CompactFlash | ❌ | ❌ | ❌ |

La máquina donde se hizo este análisis era **Windows 11 Pro build 22631** — la misma
build donde falló. La clave **no existía** en esa máquina y **no se creó**.

La guía de estaciones forenses de
[SANS](https://www.sans.org/blog/digital-forensics-how-to-configure-windows-investigative-workstations)
lo dice textual: *"I am not advocating that this should replace a physical write
blocker — in fact, there are several reports of Windows not respecting this setting
and allowing writes to some USB devices."*

**Las otras claves que esa guía recomienda** (por si alguna vez se arma una estación
Windows, no para esta pericia): `MountMgr\NoAutoMount = 1` (o `diskpart` →
`automount disable`), `Policies\Explorer\NoDriveTypeAutoRun = 0xFF`, y deshabilitar
el servicio `WSearch`.

### 2.2 NO hace falta comprar hardware

- **ISO/IEC 27037** exige bloqueo de escritura, **no exige que sea hardware**. El
  requisito es funcional: que la adquisición no altere el original y que se pueda
  demostrar.
- **NIST/CFTT** tiene una categoría propia y validada de **Software Write Block
  (SWB)** — NISTIR 7207-A y 7207-B — separada de *Hardware Write Block*. El bloqueo
  por software es una categoría reconocida por el estándar.
- **Ecuador:** el **COIP art. 456** regula cadena de custodia sin distinguir
  evidencia física de digital; no manda bloqueador, ni copia bit a bit, ni hash. La
  literatura académica ecuatoriana señala eso como vacío normativo. Lo que sí se
  exige en audiencia es **demostrar que la copia es idéntica al original**.

> **Distinción que hay que sostener:** un bloqueador por software **validado**
> (categoría SWB de NIST) no es lo mismo que **una clave de registro**. La clave no
> es una herramienta forense: es una política de Windows que Microsoft dejó de
> honrar y no documentó.

**Nota sobre hardware, por si igual se cotiza:** los bloqueadores baratos (~$50) son
**SATA** y no sirven para un pendrive. Un bloqueador **USB-a-USB** real (tipo CRU
WiebeTech) está en la categoría cara — **cotizar, no asumir precio**.

El [artículo de Magnet Forensics](https://www.magnetforensics.com/blog/write-blocker-vs-imaging-device/)
que originó la consulta **no menciona bloqueo por software ni cita ninguna norma**.
Compara dos productos de hardware. No es fuente normativa.

### 2.3 CAMINO ELEGIDO: live USB forense

Arrancar desde **CAINE** (≥ 9.0 pone **todos los block devices en solo lectura por
defecto** y bloquea el automontaje) y adquirir a **`.E01`** con `ewfacquire` o
Guymager.

Por qué éste y no otro:

1. **No depende de la política rota de Windows.** El bloqueo está en el kernel de
   Linux y se puede **verificar**: `blockdev --getro /dev/sdX` → `1`.
2. **No modifica nada** — ni el registro, ni la máquina. Windows no corre.
3. **Es práctica aceptada**: CAINE y Paladin son las distros de referencia del rubro.
4. **Produce el `.E01` que el procesador propio ya espera** —
   `c:\sorsabsa\TODO_procesador_imagen.md` §7, Camino A: `pyewf` + `pytsk3` leen E01
   directo, *"sin montaje, sin riesgo de escritura"*.
5. **Es portátil.** La máquina donde se hizo este análisis se entrega alrededor del
   **15-sep-2026**; un live USB sobrevive a eso.
6. Cuesta $0.

### 2.4 Lo que sostiene la pericia es la cadena de hashes

El bloqueador es el **medio**. La **prueba** es esto, y va al acta:

1. Hash del dispositivo **al adquirir** (con el bloqueo ya verificado)
2. Hash de la imagen `.E01`
3. Hash del dispositivo **al terminar**, antes de devolverlo → idéntico al (1)
4. Hash recalculado tras el procesamiento → la imagen no cambió

Los cuatro coincidiendo es lo que no se puede impugnar. Concuerda con la regla dura
ya escrita en `TODO_procesador_imagen.md`: *"el hash se calcula una vez, en la
adquisición, y se persiste"*, y el procesador acepta `hash_esperado` = *"el que
consta en el acta/cadena de custodia"*.

### 2.5 Reglas de orden — no son opcionales

- **Verificar el bloqueo ANTES de leer un solo byte**, no después. Si se verifica
  después, no se puede demostrar que la lectura previa estaba bloqueada.
- **Arrancar CAINE con el indicio desconectado**, y conectarlo recién con el sistema
  ya arriba y comprobado.
- **Fotografiar el indicio sellado antes de abrir nada.** `preservacion.fotos` está
  en `[]` y `04_imagenes/` vacía. El propio `TODO_procesador_imagen.md` §11.2
  advierte que en un caso real *"se perdió una fotografía de preservación"*.
- **El destino de la imagen nunca puede ser el mismo dispositivo que el origen**, ni
  el `C:` de una máquina que se va a entregar.

---

## 3. Los tres momentos — qué es manipulación y qué no

Manipulación son dos cosas concretas: **escribir en el indicio**, o **tener contacto
con el indicio que no consta en el acta**. Nada más.

Ensayar sobre un pendrive propio no cae en ninguna de las dos: es otro objeto, que no
es evidencia de nada.

> **La contaminación no la produce preparar. La produce improvisar.**

| Momento | Sobre qué | ¿Toca el indicio? | ¿Va al expediente? |
|---|---|---|---|
| **Ensayo** (cuando se quiera) | Un USB propio | **No** | Sí — como **validación del método**, es anexo |
| **Adquisición** (con acta) | El Kingston, **una vez, leyendo** | Sí | Sí, cada paso |
| **Análisis** (después) | El `.E01`, nunca el original | **No** | Sí |

### 3.1 El ensayo — se puede hacer hoy, sobre un USB propio

1. Armar el live USB de CAINE y comprobar que **arranca** en la máquina elegida.
2. Con un pendrive propio cargado de archivos de prueba:
   - `lsblk` → identificar el dispositivo
   - `blockdev --getro /dev/sdX` → debe devolver **`1`**
   - **intentar escribir a propósito** → debe fallar. *Ésta es la prueba*
   - `sha256sum /dev/sdX` → hash del dispositivo
   - `ewfacquire /dev/sdX` → generar el `.E01`
   - `sha256sum /dev/sdX` de nuevo → **idéntico**
   - hash de la imagen
3. Meter ese `.E01` de prueba en el procesador (ver §5, pendiente técnico).

**Este ensayo va al informe**, no se esconde: es el anexo que responde *"¿cómo sabe
usted que su bloqueo funcionaba?"*. Es el enfoque de CFTT — validar el propio
bloqueador.

### 3.2 La adquisición — solo ese día, en este orden

1. Fotografiar el indicio **sellado**, antes de abrir
2. Arrancar CAINE **sin el indicio conectado**
3. Comprobar el estado del sistema en limpio
4. Recién ahí, conectar el Kingston
5. `blockdev --getro` → `1`, **antes de leer nada**
6. Hash del dispositivo
7. Adquirir a `.E01`
8. Hash del dispositivo de nuevo → idéntico
9. Desconectar, resellar, firmar acta

---

## 4. El riesgo abierto: Secure Boot + BitLocker

**CAINE 13 no tiene soporte confiable de Secure Boot.** Su propia documentación dice:
*"if secureboot failed, try to disable it from UEFI"*.

**Y ahí está el peligro:** desactivar Secure Boot en una máquina con **BitLocker**
dispara la pantalla de **clave de recuperación de 48 dígitos**. Sin esa clave, no se
vuelve a entrar a ese Windows. La doc de CAINE lo advierte explícitamente.

El escenario malo no es contaminar el indicio: es **quedarse fuera de la propia
computadora el día de la pericia**.

### Estado de la máquina del análisis original (26-ago-2026)

| Qué | Estado | Nota |
|---|---|---|
| SO | Windows 11 **Pro**, build **22631**, 64 bits | Misma build donde falla `WriteProtect` |
| Firmware | **UEFI** | CAINE 13 arranca en UEFI |
| Secure Boot | ⚠️ **no verificable** | `Confirm-SecureBootUEFI` → acceso denegado (requiere admin) |
| BitLocker | ⚠️ **no verificable** | `Get-BitLockerVolume` → acceso denegado (requiere admin) |
| Inicio rápido | **ACTIVO** (`HiberbootEnabled = 1`) | Windows hiberna en vez de apagar. Para forense: `Mayús`+Apagar o `shutdown /s /t 0` |
| Disco | 37,1 GB libres de 166,7 GB | Alcanza para 8 GB, pero **la imagen no va acá** |
| Entrega del equipo | ~**15-sep-2026** | No montar el procedimiento sobre esta máquina |

### Conclusión: no tiene que ser esa máquina

La adquisición forense **no necesita una computadora en particular**. Necesita:

- una máquina cualquiera que arranque desde USB,
- un disco destino para la imagen,
- y que la máquina quede **identificada en el acta** (marca, modelo, serie).

Conviene que **no** sea el equipo de trabajo diario: no se arriesga BitLocker, no
depende de una máquina que se entrega en septiembre, y hay menos superficie que
explicar en audiencia.

CAINE arranca con la opción **`toram`** (se carga entero a memoria, no toca el disco
interno), pero eso **no resuelve** Secure Boot/BitLocker — ese problema es previo, en
la UEFI.

---

## 5. Pendientes

### 5.1 Verificar la máquina de adquisición ⬜ — **lo primero**

En el equipo que se vaya a usar, **como administrador**, solo lectura:

```powershell
Confirm-SecureBootUEFI
manage-bde -status C:
```

- `Protection Off` → vía libre.
- `Protection On` → **guardar la clave de recuperación antes de tocar la UEFI**
  (`account.microsoft.com/devices/recoverykey`, o
  `manage-bde -protectors -get C:`).

### 5.1.a Verificación registrada — equipo "Lenovo azul" (26-ago-2026)

Chequeo corrido **sin privilegios de administrador** (limitación real, no se simuló
nada). Resultado parcial:

| Qué | Estado | Nota |
|---|---|---|
| SO | Windows 10 **Home**, build 19045 | Distinto de la máquina del análisis original (Win11 Pro 22631) |
| Firmware | **UEFI** | ✅ compatible con boot de CAINE |
| Secure Boot | ⚠️ **no verificable** | `Confirm-SecureBootUEFI` → "Acceso denegado" (requiere admin) |
| BitLocker | ⚠️ **no verificable** | `manage-bde -status` y `Get-BitLockerVolume` → "Acceso denegado" (requiere admin) |
| Python | ✅ 3.12.8 instalado | — |
| `pytsk3` | ❌ no instalado | No descarta la máquina, se instala aparte (ver §5.2) |
| `libewf-python` | ❌ no instalado | No descarta la máquina, se instala aparte (ver §5.2) |

**Veredicto: PENDIENTE, no "sirve" ni "no sirve" todavía.** Falta exactamente lo que
pide este §5.1: correr `Confirm-SecureBootUEFI` y `manage-bde -status C:` **como
administrador** en este equipo. Windows 10 Home además tiene BitLocker más limitado
que Pro (normalmente "Device Encryption" en vez de BitLocker completo) — otro motivo
para no asumir el resultado sin correrlo elevado.

Siguiente paso: repetir §5.1 en este equipo desde una terminal con "Ejecutar como
administrador" y registrar aquí `Protection Off` / `Protection On`.

### 5.2 Decidir Camino A vs Camino B del procesador de imagen ⬜

Probar si **`pytsk3`** y **`libewf-python`** instalan en el entorno real.
`c:\sorsabsa\TODO_procesador_imagen.md` §7 lo llama *"el único riesgo técnico serio
del proyecto"* y manda decidirlo **en el paso 1 de la implementación**.

- **Camino A (preferido):** `pyewf` + `pytsk3` leen el `.E01` directo, sin montaje.
- **Camino B (respaldo):** volumen montado en solo lectura con Arsenal Image Mounter
  u OSFMount → se pierden archivos eliminados, slack y espacio no asignado, y **el
  procesador debe declararlo automáticamente** en `limitaciones.json`.

Se puede resolver **hoy, con una imagen de juguete**, sin tocar el indicio. Es lo que
más conviene despachar: si `pytsk3` no instala, mejor enterarse ahora que el día de
la pericia.

### 5.3 Escribir `docs/PROTOCOLO-ADQUISICION-INDICIOS.md` ⬜

El procedimiento reusable: los tres momentos, el orden exacto, la justificación
normativa, la sección de **requisitos de la estación de adquisición**, y la redacción
que va en la sección *10. Medio de preservación* del informe.

---

## 6. Hueco de diseño detectado (26-ago-2026)

**La adquisición no está cubierta en ninguna parte del diseño de SorsabsaForensic.**

`c:\sorsabsa\TODO_procesador_imagen.md` arranca desde *"ya existe una imagen"*:
define todo lo posterior (fases F1–F18, hashes, limitaciones, anexos) pero **nada
dice cómo se obtiene esa imagen**. El paso más impugnable del peritaje es el único
sin procedimiento escrito.

QUITUMBE es el primer caso que lo necesita de verdad. Lo resuelve §5.3.

Relacionado: `PLAN-SORSABSAFORENSIC-WEB.md` §4 lista «Imagen forense» entre los
procesadores del grupo B ya portados, pero solo la **lectura** de la imagen — no su
adquisición.

---

## 7. Cómo trabajar sobre esto

- **No afirmar nada de infraestructura, arquitectura o estado sin abrir el archivo.**
  Marcar el origen de cada afirmación y decir explícitamente qué no se pudo verificar.
- **No parches**: nada de hardcodes, bypass, ni fallback que convierta "no
  configurado" en "válido". Ver `ESTANDAR-DESARROLLO.md`.
- Fuentes autoritativas del ecosistema: `docs/ARQUITECTURA-ECOSISTEMA.md`,
  `docs/ESTANDAR-DESARROLLO.md`.

## 8. Fuentes consultadas (26-ago-2026)

- [Microsoft Learn Q&A 3905757 — WriteProtect policy is not working as expected](https://learn.microsoft.com/en-us/answers/questions/3905757/writeprotect-policy-is-not-working-as-expected-on)
- [SANS — How to configure Windows Investigative Workstations](https://www.sans.org/blog/digital-forensics-how-to-configure-windows-investigative-workstations)
- [NIST CFTT — Software Write Block](https://www.nist.gov/itl/ssd/software-quality-group/computer-forensics-tool-testing-program-cftt/cftt-technical/software) · [Hardware Write Block](https://www.nist.gov/itl/ssd/software-quality-group/computer-forensics-tool-testing-program-cftt/cftt-technical/hardware) · [NISTIR 7207-B](https://www.govinfo.gov/content/pkg/GOVPUB-C13-5b8b6734330d77734b701e5c23f6bcf8/pdf/GOVPUB-C13-5b8b6734330d77734b701e5c23f6bcf8.pdf)
- [CAINE Live — News](https://www.caine-live.net/page6/page6.html) · [Manual and policies](https://www.caine-live.net/page8/page8.html)
- [Magnet Forensics — Write Blocker vs. Imaging Device](https://www.magnetforensics.com/blog/write-blocker-vs-imaging-device/) (no normativo)
- [Delitos informáticos y prueba digital en el COIP — validez, cadena de custodia y pericia forense en el Ecuador](https://tesla.puertomaderoeditorial.com.ar/index.php/tesla/en/article/download/542/527/1268)
- [ISO/IEC 27037 — Directrices para el manejo forense de evidencia digital](https://m10.com.mx/iso-iec-27037-directrices-para-el-manejo-forense-de-evidencia-digital/)
