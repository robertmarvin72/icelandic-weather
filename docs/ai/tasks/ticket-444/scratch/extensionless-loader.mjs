// Ticket #444 — tiny resolve-hook shim (J7: no new dependencies). This
// repo's src/ files use Vite's bundler-style extensionless relative
// imports (e.g. `import { haversine } from "./geo"`), which plain Node ESM
// cannot resolve on its own. Rather than add a bundler/dependency to run a
// read-only reference script, this registers Node's own built-in loader
// hook (module.register, stable since Node 20.6) to retry a failed
// relative-import resolution with a ".js" suffix. It does not read/write
// any file itself — it only participates in resolving import specifiers
// that Node's default resolver already attempted and failed on.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(specifier, context, nextResolve) {
        try {
          return await nextResolve(specifier, context);
        } catch (err) {
          if (
            (specifier.startsWith("./") || specifier.startsWith("../")) &&
            !specifier.endsWith(".js") &&
            !specifier.endsWith(".mjs")
          ) {
            return nextResolve(specifier + ".js", context);
          }
          throw err;
        }
      }
    `),
  pathToFileURL(import.meta.url)
);
