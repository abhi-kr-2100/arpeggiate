import { describe, expect, test } from "bun:test";
import {
  formatComboFromKeys,
  normalizeEventKey,
  normalizeSequence,
  normalizeStroke,
  sortComboKeys,
} from "../src/normalizer.js";

describe("Canonical Normalizer (Seam 1)", () => {
  test("normalizes browser event key values to canonical tokens", () => {
    expect(normalizeEventKey(" ")).toBe("Space");
    expect(normalizeEventKey("Control")).toBe("Ctrl");
    expect(normalizeEventKey("Alt")).toBe("Alt");
    expect(normalizeEventKey("Shift")).toBe("Shift");
    expect(normalizeEventKey("Meta")).toBe("Meta");
    expect(normalizeEventKey("J")).toBe("j");
    expect(normalizeEventKey("k")).toBe("k");
    expect(normalizeEventKey("Enter")).toBe("Enter");
  });

  test("sorts and formats combo keys with symmetrical modifier ranking", () => {
    expect(sortComboKeys(["k", "j"])).toEqual(["j", "k"]);
    expect(formatComboFromKeys(["k", "j"])).toBe("j+k");
    expect(formatComboFromKeys(["a", "Ctrl"])).toBe("Ctrl+a");
    expect(formatComboFromKeys(["Shift", "j", "k"])).toBe("Shift+j+k");
    expect(formatComboFromKeys(["Alt", "Ctrl"])).toBe("Ctrl+Alt");
    expect(formatComboFromKeys(["Meta", "Shift", "Alt", "Ctrl", "Mod"])).toBe("Mod+Ctrl+Alt+Shift+Meta");
    expect(formatComboFromKeys([])).toBe("");
  });

  test("normalizes strokes and multi-stroke whitespace-padded sequences", () => {
    expect(normalizeStroke("k+j")).toBe("j+k");
    expect(normalizeStroke("a+Ctrl")).toBe("Ctrl+a");
    expect(normalizeStroke("Shift+J")).toBe("Shift+j");
    expect(normalizeSequence("  g   g  ")).toBe("g g");
    expect(normalizeSequence("  Ctrl+a   g  ")).toBe("Ctrl+a g");
    expect(normalizeSequence("")).toBe("");
  });
});
