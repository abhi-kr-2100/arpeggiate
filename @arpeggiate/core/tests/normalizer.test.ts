import { describe, expect, test } from "bun:test";
import {
  KeySequence,
  KeyStroke,
  formatComboFromKeys,
  normalizeEventKey,
  normalizeSequence,
  normalizeStroke,
  sortComboKeys,
} from "../src/normalizer.js";

describe("Canonical Normalizer (Seam 1)", () => {
  test("creates KeyStroke value object with canonical tokens and formatting", () => {
    const stroke = KeyStroke.parse("k + Ctrl + Shift");
    expect(stroke).toBeInstanceOf(KeyStroke);
    expect(stroke.tokens).toEqual(["Ctrl", "Shift", "k"]);
    expect(stroke.toString()).toBe("Ctrl+Shift+k");
    expect(stroke.equals("Ctrl+Shift+k")).toBe(true);
    expect(stroke.equals(new KeyStroke(["k", "Shift", "Ctrl"]))).toBe(true);
  });

  test("creates KeySequence value object representing sequential strokes", () => {
    const sequence = KeySequence.parse("  Ctrl+a    g   g  ");
    expect(sequence).toBeInstanceOf(KeySequence);
    expect(sequence.length).toBe(3);
    expect(sequence.toString()).toBe("Ctrl+a g g");
    expect(sequence.equals("Ctrl+a g g")).toBe(true);
    expect(sequence.strokes[0]?.toString()).toBe("Ctrl+a");
    expect(sequence.strokes[1]?.toString()).toBe("g");
  });

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

  test("parses and formats plus key '+' and 'Ctrl++' zoom in shortcut", () => {
    // Single plus key
    const singlePlus = KeyStroke.parse("+");
    expect(singlePlus.tokens).toEqual(["+"]);
    expect(singlePlus.toString()).toBe("+");

    // Universal zoom-in shortcut Ctrl++
    const zoomIn = KeyStroke.parse("Ctrl++");
    expect(zoomIn.tokens).toEqual(["Ctrl", "+"]);
    expect(zoomIn.toString()).toBe("Ctrl++");

    // Complex plus combo
    const shiftZoom = KeyStroke.parse("Ctrl+Shift++");
    expect(shiftZoom.tokens).toEqual(["Ctrl", "Shift", "+"]);
    expect(shiftZoom.toString()).toBe("Ctrl+Shift++");

    // Multi-stroke sequence with plus
    const seq = KeySequence.parse("Ctrl++ Ctrl++");
    expect(seq.length).toBe(2);
    expect(seq.toString()).toBe("Ctrl++ Ctrl++");

    expect(normalizeSequence("Ctrl++")).toBe("Ctrl++");
    expect(normalizeSequence("+")).toBe("+");
  });
});
