import { beforeAll, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { Window } from "happy-dom";

describe("Browser <script> Tag Execution Seam", () => {
  const rootDir = resolve(import.meta.dir, "../../..");
  const bundlePath = resolve(import.meta.dir, "../dist/arpeggiate.min.js");

  beforeAll(() => {
    execSync("bun run build", { cwd: rootDir });
  });

  it("loads via a <script> tag and exposes arpeggiate in window global scope", () => {
    const bundleCode = readFileSync(bundlePath, "utf-8");
    const window = new Window({
      settings: {
        enableJavaScriptEvaluation: true,
        suppressInsecureJavaScriptEnvironmentWarning: true,
      },
    });
    const document = window.document;

    const script = document.createElement("script");
    script.textContent = bundleCode;
    document.head.appendChild(script);

    const win = window as unknown as {
      arpeggiate?: { parse: (sequenceString: string) => readonly (ReadonlySet<string>)[] };
    };

    expect(win.arpeggiate).toBeDefined();
    expect(typeof win.arpeggiate?.parse).toBe("function");

    const result = win.arpeggiate!.parse("Control+s");
    expect(result).toEqual([new Set(["Control", "s"])]);

    const resultSequence = win.arpeggiate!.parse("g g");
    expect(resultSequence).toEqual([new Set(["g"]), new Set(["g"])]);
  });

  it("handles delimiter collisions and errors inside browser environment", () => {
    const bundleCode = readFileSync(bundlePath, "utf-8");
    const window = new Window({
      settings: {
        enableJavaScriptEvaluation: true,
        suppressInsecureJavaScriptEnvironmentWarning: true,
      },
    });
    const document = window.document;

    const script = document.createElement("script");
    script.textContent = bundleCode;
    document.head.appendChild(script);

    const win = window as unknown as {
      arpeggiate: { parse: (sequenceString: string) => readonly (ReadonlySet<string>)[] };
    };

    expect(win.arpeggiate.parse("Control++")).toEqual([new Set(["Control", "+"])]);
    expect(win.arpeggiate.parse("+")).toEqual([new Set(["+"])]);
    expect(win.arpeggiate.parse("Space")).toEqual([new Set(["Space"])]);
    expect(() => win.arpeggiate.parse("Control+")).toThrow();
  });

  it("supports ES module import for React-like projects", async () => {
    const esmModule = await import("../dist/index.js");
    expect(typeof esmModule.parse).toBe("function");
    const result = esmModule.parse("Control+s");
    expect(result).toEqual([new Set(["Control", "s"])]);
  });

  it("binds arpeggiate to globalThis and re-exports public API from browser source", async () => {
    delete (globalThis as { arpeggiate?: unknown }).arpeggiate;
    const browserModule = await import("../src/browser");

    expect(globalThis.arpeggiate).toBeDefined();
    expect(globalThis.arpeggiate?.parse).toBe(browserModule.parse);

    const result = globalThis.arpeggiate!.parse("Control+s");
    expect(result).toEqual([new Set(["Control", "s"])]);
  });

  it("falls back to window when globalThis is undefined", () => {
    const bundleCode = readFileSync(bundlePath, "utf-8");
    const fakeWindow = {} as {
      arpeggiate?: { parse: (sequenceString: string) => readonly (ReadonlySet<string>)[] };
    };
    const execute = new Function("globalThis", "window", bundleCode);
    execute(undefined, fakeWindow);

    expect(fakeWindow.arpeggiate).toBeDefined();
    expect(typeof fakeWindow.arpeggiate?.parse).toBe("function");

    const result = fakeWindow.arpeggiate!.parse("Control+s");
    expect(result).toEqual([new Set(["Control", "s"])]);
  });
});
