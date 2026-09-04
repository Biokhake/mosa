// The engine's imports are extensionless; teach node to find the .ts files.
import { existsSync } from "node:fs";
export async function resolve(spec, ctx, next) {
  if (spec.startsWith(".") && !/\.(ts|mts|js|mjs|json)$/.test(spec)) {
    const base = new URL(spec, ctx.parentURL);
    for (const ext of [".ts", "/index.ts"]) if (existsSync(new URL(base.href + ext))) return next(base.href + ext, ctx);
  }
  return next(spec, ctx);
}
