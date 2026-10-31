import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const coreDir = resolve(rootDir, "@arpeggiate/core");
const reactDir = resolve(rootDir, "@arpeggiate/react");

async function buildPackage(
  name: string,
  pkgDir: string,
  external: string[] = []
): Promise<void> {
  console.log(`Building ${name}...`);

  // 1. Emit TypeScript declaration files (.d.ts)
  const tscResult = spawnSync(
    "bun",
    ["x", "tsc", "-p", resolve(pkgDir, "tsconfig.build.json")],
    { stdio: "inherit" }
  );
  if (tscResult.status !== 0) {
    throw new Error(`TypeScript declaration build failed for ${name}`);
  }

  // 2. Build ESM bundle (for Node/Bun/bundlers/browsers)
  const esmResult = await Bun.build({
    entrypoints: [resolve(pkgDir, "src/index.ts")],
    outdir: resolve(pkgDir, "dist"),
    naming: "index.mjs",
    format: "esm",
    target: "browser",
    external,
    sourcemap: "linked",
  });
  if (!esmResult.success) {
    console.error(esmResult.logs);
    throw new Error(`ESM build failed for ${name}`);
  }

  // 3. Build CommonJS bundle (for Node.js require)
  const cjsResult = await Bun.build({
    entrypoints: [resolve(pkgDir, "src/index.ts")],
    outdir: resolve(pkgDir, "dist"),
    naming: "index.cjs",
    format: "cjs",
    target: "node",
    external,
    sourcemap: "linked",
  });
  if (!cjsResult.success) {
    console.error(cjsResult.logs);
    throw new Error(`CJS build failed for ${name}`);
  }

  // 4. Build Browser Global IIFE bundle (for <script> tags)
  const globalExternal = external.filter((dep) => dep !== "@arpeggiate/core" && dep !== "react");
  const plugins = name === "@arpeggiate/react"
    ? [
        {
          name: "react-shim",
          setup(build: { onResolve: (opts: { filter: RegExp }, cb: () => { path: string }) => void }) {
            build.onResolve({ filter: /^react$/ }, () => ({
              path: resolve(rootDir, "scripts/react-browser-shim.ts"),
            }));
          },
        },
      ]
    : [];

  const globalResult = await Bun.build({
    entrypoints: [resolve(pkgDir, "src/browser.ts")],
    outdir: resolve(pkgDir, "dist"),
    naming: "index.global.js",
    format: "iife",
    target: "browser",
    external: globalExternal,
    plugins,
    minify: true,
    sourcemap: "linked",
  });
  if (!globalResult.success) {
    console.error(globalResult.logs);
    throw new Error(`Global IIFE build failed for ${name}`);
  }

  console.log(`✓ Built ${name} (ESM, CJS, Global IIFE, Types)`);
}

async function main(): Promise<void> {
  await buildPackage("@arpeggiate/core", coreDir, []);
  await buildPackage("@arpeggiate/react", reactDir, ["react", "@arpeggiate/core"]);
  console.log("\nAll packages built successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
