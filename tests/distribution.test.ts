import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Distribution Artifacts (Target Environments)", () => {
  const rootDir = resolve(import.meta.dirname, "..");
  const coreDist = resolve(rootDir, "@arpeggiate/core/dist");
  const reactDist = resolve(rootDir, "@arpeggiate/react/dist");

  test("1. JavaScript on web (<script> tag): index.global.js attaches to window", () => {
    const coreScript = readFileSync(resolve(coreDist, "index.global.js"), "utf8");
    const reactScript = readFileSync(resolve(reactDist, "index.global.js"), "utf8");

    // Ensure window.React exists in browser environment
    (window as unknown as { React: unknown }).React = {
      createContext: () => ({ Provider: () => null }),
      useState: (fn: () => unknown) => [fn(), () => {}],
      useEffect: () => {},
      useRef: (val: unknown) => ({ current: val }),
      useContext: () => null,
    };

    // Simulate <script src="@arpeggiate/core/dist/index.global.js">
    const runCore = new Function("window", "globalThis", coreScript);
    runCore(window, globalThis);

    const arpeggiateCore = (window as unknown as { ArpeggiateCore?: Record<string, unknown> }).ArpeggiateCore;
    expect(arpeggiateCore).toBeDefined();
    if (typeof arpeggiateCore !== "undefined") {
      expect(typeof arpeggiateCore.createKeyboard).toBe("function");
      expect(typeof arpeggiateCore.detectConflicts).toBe("function");
    }

    // Simulate <script src="@arpeggiate/react/dist/index.global.js">
    const runReact = new Function("window", "globalThis", reactScript);
    runReact(window, globalThis);

    const arpeggiateReact = (window as unknown as { ArpeggiateReact?: Record<string, unknown> }).ArpeggiateReact;
    expect(arpeggiateReact).toBeDefined();
    if (typeof arpeggiateReact !== "undefined") {
      expect(typeof arpeggiateReact.ShortcutsProvider).toBe("function");
      expect(typeof arpeggiateReact.useKeyboard).toBe("function");
      expect(typeof arpeggiateReact.useWhichKey).toBe("function");
    }
  });

  test("2. JavaScript on backend (Node.js CommonJS): require() loads compiled CJS bundles", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const core = require(resolve(coreDist, "index.cjs"));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const reactPkg = require(resolve(reactDist, "index.cjs"));

    expect(typeof core.createKeyboard).toBe("function");
    expect(typeof core.detectConflicts).toBe("function");
    expect(typeof core.buildTrie).toBe("function");

    expect(typeof reactPkg.ShortcutsProvider).toBe("function");
    expect(typeof reactPkg.useKeyboard).toBe("function");
    expect(typeof reactPkg.useWhichKey).toBe("function");
  });

  test("3. JavaScript on backend (Node.js/Bun ESM): dynamic import() loads compiled ESM bundles", async () => {
    const core = await import(resolve(coreDist, "index.mjs"));
    const reactPkg = await import(resolve(reactDist, "index.mjs"));

    expect(typeof core.createKeyboard).toBe("function");
    expect(typeof core.detectConflicts).toBe("function");

    expect(typeof reactPkg.ShortcutsProvider).toBe("function");
    expect(typeof reactPkg.useKeyboard).toBe("function");
  });

  test("4. TypeScript on backend (Node.js/Bun): declaration files exist", () => {
    const coreDts = readFileSync(resolve(coreDist, "index.d.ts"), "utf8");
    const reactDts = readFileSync(resolve(reactDist, "index.d.ts"), "utf8");

    expect(coreDts).toContain("createKeyboard");
    expect(coreDts).toContain("defineKeymap");
    expect(coreDts).toContain("detectConflicts");

    expect(reactDts).toContain("ShortcutsProvider");
    expect(reactDts).toContain("useKeyboard");
    expect(reactDts).toContain("useWhichKey");
  });
});
