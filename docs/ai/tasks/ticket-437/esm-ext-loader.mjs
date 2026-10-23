// Scratch-only ESM loader (J9): this repo's src files import local modules
// without extensions (Vite resolves this at build time); plain Node ESM
// requires an explicit extension. This loader only appends ".js" when the
// default resolver fails on an extensionless relative specifier, purely so
// the read-only reference-case script can import real, UNMODIFIED repo
// functions directly. Not part of the application; not referenced by it.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith(".") && !specifier.match(/\.[a-zA-Z0-9]+$/)) {
      return nextResolve(`${specifier}.js`, context);
    }
    throw err;
  }
}
