#!/usr/bin/env node
/**
 * Mejora/escala una imagen local con la API de Magnific (ex Magnific AI, hoy
 * parte de Freepik — docs.magnific.com).
 *
 * Uso:
 *   node scripts/magnific-upscale.mjs <imagen-entrada> [imagen-salida] [opciones]
 *
 * Opciones:
 *   --scale=2x|4x|8x|16x            (default: 2x)
 *   --optimized-for=standard|soft_portraits|hard_portraits|art_n_illustration|
 *                    videogame_assets|nature_n_landscapes|films_n_photography|
 *                    3d_renders|science_fiction_n_horror   (default: standard)
 *   --engine=automatic|magnific_illusio|magnific_sharpy|magnific_sparkle (default: automatic)
 *   --creativity=N     (-10 a 10, default: 0)
 *   --hdr=N            (-10 a 10, default: 0)
 *   --resemblance=N    (-10 a 10, default: 0)
 *   --fractality=N     (-10 a 10, default: 0)
 *   --prompt="texto"   (opcional, guía la mejora)
 *
 * Requiere la variable de entorno MAGNIFIC_API_KEY, ya sea exportada en la
 * shell o puesta en un archivo .env.local en la raíz del repo (no se
 * commitea — ver .gitignore). Conseguí la key en tu cuenta de Freepik/Magnific.
 *
 * NOTA: el endpoint de polling (GET .../{task_id}) sigue el patrón estándar
 * documentado para el resto de la API de IA de Freepik/Magnific. Si al
 * correrlo devuelve 404, revisar docs.magnific.com/api-reference/image-upscaler-creative
 * y ajustar POLL_URL más abajo.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const API_BASE = "https://api.magnific.com/v1/ai/image-upscaler";
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

function loadEnvLocal() {
  const envPath = resolve(REPO_ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const positional = [];
  const opts = {};
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const [key, ...rest] = arg.slice(2).split("=");
      opts[key] = rest.length ? rest.join("=") : true;
    } else {
      positional.push(arg);
    }
  }
  return { positional, opts };
}

function usageAndExit(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(
    "Uso: node scripts/magnific-upscale.mjs <imagen-entrada> [imagen-salida] [--scale=2x] [--optimized-for=standard] [--engine=automatic] [--creativity=0] [--hdr=0] [--resemblance=0] [--fractality=0] [--prompt=\"...\"]"
  );
  process.exit(1);
}

async function main() {
  loadEnvLocal();

  const apiKey = process.env.MAGNIFIC_API_KEY;
  if (!apiKey) {
    usageAndExit(
      "falta MAGNIFIC_API_KEY. Ponela en .env.local (raíz del repo) o expórtala en la shell."
    );
  }

  const { positional, opts } = parseArgs(process.argv.slice(2));
  const [inputPath, outputPathArg] = positional;
  if (!inputPath) usageAndExit("falta la ruta de la imagen de entrada.");

  const resolvedInput = resolve(process.cwd(), inputPath);
  if (!existsSync(resolvedInput)) {
    usageAndExit(`no existe el archivo: ${resolvedInput}`);
  }

  const ext = extname(resolvedInput) || ".png";
  const outputPath = resolve(
    process.cwd(),
    outputPathArg || inputPath.replace(extname(inputPath), `.upscaled${ext}`)
  );

  const imageBase64 = readFileSync(resolvedInput).toString("base64");

  const body = {
    image: imageBase64,
    scale_factor: opts.scale || "2x",
    optimized_for: opts["optimized-for"] || "standard",
    engine: opts.engine || "automatic",
    creativity: opts.creativity !== undefined ? Number(opts.creativity) : 0,
    hdr: opts.hdr !== undefined ? Number(opts.hdr) : 0,
    resemblance: opts.resemblance !== undefined ? Number(opts.resemblance) : 0,
    fractality: opts.fractality !== undefined ? Number(opts.fractality) : 0,
  };
  if (opts.prompt) body.prompt = String(opts.prompt);

  console.log(`Subiendo ${resolvedInput} (scale=${body.scale_factor}, engine=${body.engine})...`);

  const createRes = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-magnific-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const createJson = await safeJson(createRes);
  if (!createRes.ok) {
    console.error(`Error al crear la tarea (HTTP ${createRes.status}):`, createJson);
    process.exit(1);
  }

  const taskId = createJson?.data?.task_id;
  if (!taskId) {
    console.error("Respuesta inesperada, no vino task_id:", createJson);
    process.exit(1);
  }
  console.log(`Tarea creada: ${taskId}. Esperando resultado...`);

  const result = await pollTask(taskId, apiKey);
  const imageUrl = result?.generated?.[0];
  if (!imageUrl) {
    console.error("La tarea terminó pero no hay imagen generada:", result);
    process.exit(1);
  }

  console.log(`Listo. Descargando resultado desde ${imageUrl}...`);
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    console.error(`No se pudo descargar la imagen final (HTTP ${imgRes.status}).`);
    process.exit(1);
  }
  const buf = Buffer.from(await imgRes.arrayBuffer());
  writeFileSync(outputPath, buf);
  console.log(`Guardado en ${outputPath}`);
}

async function pollTask(taskId, apiKey) {
  const pollUrl = `${API_BASE}/${taskId}`;
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);
    const res = await fetch(pollUrl, {
      headers: { "x-magnific-api-key": apiKey },
    });
    const json = await safeJson(res);
    if (!res.ok) {
      throw new Error(
        `Error consultando la tarea (HTTP ${res.status}): ${JSON.stringify(json)}`
      );
    }
    const data = json?.data;
    const status = data?.status;
    console.log(`  estado: ${status || "desconocido"}`);
    if (status === "COMPLETED") return data;
    if (status === "FAILED") {
      throw new Error(`La tarea falló: ${JSON.stringify(data)}`);
    }
    // CREATED / IN_PROGRESS -> seguir esperando
  }
  throw new Error("Timeout esperando el resultado de la tarea.");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
