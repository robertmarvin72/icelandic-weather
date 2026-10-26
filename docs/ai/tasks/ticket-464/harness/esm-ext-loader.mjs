// Ticket #464 — task-local Node ESM loader shim (read-only research harness).
// This repo's src/ uses extensionless, Vite-style imports (e.g. "./scoring"),
// which plain Node ESM cannot resolve on its own. This hook resolves a bare
// specifier ending without an extension, relative to its importer, to the
// matching .js/.jsx file on disk. No repo file is modified; this only
// affects module resolution inside this standalone script's own process.
// Same pattern used in ticket #444's reference-cases-script.mjs.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const EXTS = [".mjs", ".js", ".jsx"];

export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !EXTS.some((ext) => specifier.endsWith(ext)) &&
    context.parentURL
  ) {
    const parentPath = fileURLToPath(context.parentURL);
    const base = path.resolve(path.dirname(parentPath), specifier);

    for (const ext of EXTS) {
      if (existsSync(base + ext)) {
        return nextResolve(pathToFileURL(base + ext).href, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
