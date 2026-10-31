import { describe, expect, test } from "bun:test";
import {
  normalizeKey,
  normalizeTokens,
  normalizeSequence,
  sortStroke,
  tokenizeSequence,
  tokenizeStroke,
} from "../src/normalize.js";

describe("normalizeKey", () => {
  test("normalizes Space key to canonical Space", () => {
    expect(normalizeKey(" ")).toBe("Space");
  });

  test("preserves Control key as Control (browser-native)", () => {
    expect(normalizeKey("Control")).toBe("Control");
  });

  test("preserves uppercase ASCII letters", () => {
    expect(normalizeKey("A")).toBe("A");
    expect(normalizeKey("Z")).toBe("Z");
    expect(normalizeKey("K")).toBe("K");
  });

  test("preserves lowercase ASCII letters", () => {
    expect(normalizeKey("a")).toBe("a");
    expect(normalizeKey("k")).toBe("k");
    expect(normalizeKey("z")).toBe("z");
  });

  test("preserves digit keys", () => {
    expect(normalizeKey("0")).toBe("0");
    expect(normalizeKey("9")).toBe("9");
  });

  test("preserves canonical modifier keys", () => {
    expect(normalizeKey("Control")).toBe("Control");
    expect(normalizeKey("Shift")).toBe("Shift");
    expect(normalizeKey("Alt")).toBe("Alt");
    expect(normalizeKey("Meta")).toBe("Meta");
    expect(normalizeKey("Mod")).toBe("Mod");
  });

  test("preserves special named keys", () => {
    expect(normalizeKey("Escape")).toBe("Escape");
    expect(normalizeKey("Enter")).toBe("Enter");
    expect(normalizeKey("Tab")).toBe("Tab");
    expect(normalizeKey("Backspace")).toBe("Backspace");
    expect(normalizeKey("Delete")).toBe("Delete");
    expect(normalizeKey("ArrowUp")).toBe("ArrowUp");
    expect(normalizeKey("ArrowDown")).toBe("ArrowDown");
    expect(normalizeKey("ArrowLeft")).toBe("ArrowLeft");
    expect(normalizeKey("ArrowRight")).toBe("ArrowRight");
    expect(normalizeKey("Home")).toBe("Home");
    expect(normalizeKey("End")).toBe("End");
    expect(normalizeKey("PageUp")).toBe("PageUp");
    expect(normalizeKey("PageDown")).toBe("PageDown");
    expect(normalizeKey("F1")).toBe("F1");
    expect(normalizeKey("F12")).toBe("F12");
  });

  test("preserves symbol and punctuation keys", () => {
    expect(normalizeKey("+")).toBe("+");
    expect(normalizeKey(",")).toBe(",");
    expect(normalizeKey(".")).toBe(".");
    expect(normalizeKey("/")).toBe("/");
    expect(normalizeKey(";")).toBe(";");
    expect(normalizeKey("'")).toBe("'");
    expect(normalizeKey("[")).toBe("[");
    expect(normalizeKey("]")).toBe("]");
    expect(normalizeKey("\\")).toBe("\\");
    expect(normalizeKey("-")).toBe("-");
    expect(normalizeKey("=")).toBe("=");
    expect(normalizeKey("`")).toBe("`");
  });

  test("preserves vendor-specific keys, Unidentified, and unicode keys", () => {
    expect(normalizeKey("AudioVolumeUpBy50")).toBe("AudioVolumeUpBy50");
    expect(normalizeKey("Unidentified")).toBe("Unidentified");
    expect(normalizeKey("ñ")).toBe("ñ");
    expect(normalizeKey("é")).toBe("é");
    expect(normalizeKey("€")).toBe("€");
  });
});

describe("sortStroke", () => {
  test("sorts tokens lexicographically and joins with +", () => {
    expect(sortStroke(["k", "j"])).toBe("j+k");
    expect(sortStroke(["b", "c", "a"])).toBe("a+b+c");
  });

  test("accepts any Iterable including Set", () => {
    expect(sortStroke(new Set(["k", "j"]))).toBe("j+k");
  });

  test("handles single key token", () => {
    expect(sortStroke(["k"])).toBe("k");
    expect(sortStroke(new Set(["Control"]))).toBe("Control");
  });

  test("handles empty collection", () => {
    expect(sortStroke([])).toBe("");
  });

  test("treats modifiers with zero modifier priority (pure lexicographical sort)", () => {
    expect(sortStroke(["k", "Control"])).toBe("Control+k");
    expect(sortStroke(["Control", "k"])).toBe("Control+k");
    expect(sortStroke(["k", "Alt", "Control"])).toBe("Alt+Control+k");
    expect(sortStroke(["Alt", "k", "Control"])).toBe("Alt+Control+k");
    expect(sortStroke(["Shift", "p"])).toBe("Shift+p");
    expect(sortStroke(["p", "Shift"])).toBe("Shift+p");
  });

  test("handles + token in stroke", () => {
    expect(sortStroke(["Control", "+"])).toBe("++Control");
    expect(sortStroke(["+", "Control"])).toBe("++Control");
  });
});

describe("normalizeSequence", () => {
  test("normalizes single key sequence", () => {
    expect(normalizeSequence("k")).toBe("k");
    expect(normalizeSequence("K")).toBe("K");
  });

  test("normalizes single multi-key stroke with canonical key sorting", () => {
    expect(normalizeSequence("k+Control")).toBe("Control+k");
    expect(normalizeSequence("Control+k")).toBe("Control+k");
    expect(normalizeSequence("k+Alt+Control")).toBe("Alt+Control+k");
  });

  test("normalizes raw key names within strokes", () => {
    expect(normalizeSequence("Control+k")).toBe("Control+k");
    expect(normalizeSequence("Control+K")).toBe("Control+K");
    expect(normalizeSequence("Control+Space")).toBe("Control+Space");
  });

  test("normalizes whitespace-separated multi-stroke sequences", () => {
    expect(normalizeSequence("g g")).toBe("g g");
    expect(normalizeSequence("Control Control")).toBe("Control Control");
    expect(normalizeSequence("k+Control g g")).toBe("Control+k g g");
  });

  test("trims and collapses excessive whitespace", () => {
    expect(normalizeSequence("  Control+k   g   g  ")).toBe("Control+k g g");
  });

  test("normalizes literal + key stroke", () => {
    expect(normalizeSequence("+")).toBe("+");
  });

  test("normalizes strokes ending in ++", () => {
    expect(normalizeSequence("Control++")).toBe("++Control");
    expect(normalizeSequence("Alt+Control++")).toBe("++Alt+Control");
  });

  test("normalizes sequences and multi-key strokes with vendor-specific and unicode keys", () => {
    expect(normalizeSequence("AudioVolumeUpBy50")).toBe("AudioVolumeUpBy50");
    expect(normalizeSequence("Unidentified")).toBe("Unidentified");
    expect(normalizeSequence("Control+AudioVolumeUpBy50")).toBe("AudioVolumeUpBy50+Control");
    expect(normalizeSequence("ñ")).toBe("ñ");
    expect(normalizeSequence("Control+ñ")).toBe("Control+ñ");
    expect(normalizeSequence("AudioVolumeUpBy50 AudioVolumeUpBy50")).toBe(
      "AudioVolumeUpBy50 AudioVolumeUpBy50"
    );
  });
});

describe("normalizeTokens", () => {
  test("normalizes and deduplicates tokens", () => {
    expect(normalizeTokens(["k", "k"])).toEqual(["k"]);
    expect(normalizeTokens(["Control", " "])).toEqual(["Control", "Space"]);
    expect(normalizeTokens(["+", "Control"])).toEqual(["+", "Control"]);
  });
});

describe("tokenizeStroke", () => {
  test("tokenizes standard multi-key strokes", () => {
    expect(tokenizeStroke("Control+k")).toEqual(["Control", "k"]);
    expect(tokenizeStroke("Alt+Control+k")).toEqual(["Alt", "Control", "k"]);
  });

  test("tokenizes literal + key in all positions without special cases", () => {
    expect(tokenizeStroke("+")).toEqual(["+"]);
    expect(tokenizeStroke("Control++")).toEqual(["Control", "+"]);
    expect(tokenizeStroke("++Control")).toEqual(["+", "Control"]);
    expect(tokenizeStroke("Control+++Shift")).toEqual(["Control", "+", "Shift"]);
    expect(tokenizeStroke("++k")).toEqual(["+", "k"]);
    expect(tokenizeStroke("Alt+Control++")).toEqual(["Alt", "Control", "+"]);
    expect(tokenizeStroke("++Alt+Control")).toEqual(["+", "Alt", "Control"]);
  });

  test("tokenizes Space key token within a stroke", () => {
    expect(tokenizeStroke("Control+Space")).toEqual(["Control", "Space"]);
    expect(tokenizeStroke("Space+Control")).toEqual(["Space", "Control"]);
  });
});

describe("tokenizeSequence", () => {
  test("tokenizes single stroke sequences", () => {
    expect(tokenizeSequence("k")).toEqual([["k"]]);
    expect(tokenizeSequence("+")).toEqual([["+"]]);
    expect(tokenizeSequence("Space")).toEqual([["Space"]]);
  });

  test("handles empty and whitespace sequences", () => {
    expect(tokenizeSequence("")).toEqual([]);
    expect(tokenizeSequence(" ")).toEqual([]);
    expect(tokenizeSequence("   ")).toEqual([]);
  });

  test("tokenizes multi-stroke sequences", () => {
    expect(tokenizeSequence("g g")).toEqual([["g"], ["g"]]);
    expect(tokenizeSequence("Control+k g g")).toEqual([["Control", "k"], ["g"], ["g"]]);
    expect(tokenizeSequence("Space Space")).toEqual([["Space"], ["Space"]]);
    expect(tokenizeSequence("Control++ Control++")).toEqual([
      ["Control", "+"],
      ["Control", "+"],
    ]);
  });
});

describe("normalizeSequence - robust edge cases and idempotency", () => {
  test("maintains idempotency on canonical stroke containing + key", () => {
    const firstPass = normalizeSequence("Control++");
    expect(firstPass).toBe("++Control");
    expect(normalizeSequence(firstPass)).toBe("++Control");
  });

  test("normalizes when + key is at the beginning of a stroke", () => {
    expect(normalizeSequence("++k")).toBe("++k");
  });

  test("normalizes when + key is in the middle of a 3-key stroke", () => {
    expect(normalizeSequence("Control+++Shift")).toBe("++Control+Shift");
  });

  test("normalizes a Space key stroke to Space", () => {
    expect(normalizeSequence("Space")).toBe("Space");
  });

  test("normalizes stroke containing Space key", () => {
    expect(normalizeSequence("Control+Space")).toBe("Control+Space");
    expect(normalizeSequence("Space+Control")).toBe("Control+Space");
  });

  test("normalizes whitespace-only sequence to empty string", () => {
    expect(normalizeSequence(" ")).toBe("");
    expect(normalizeSequence("   ")).toBe("");
  });

  test("maintains idempotency on multi-stroke sequences containing + strokes", () => {
    const seq = "Control++ Control++";
    const canonical = normalizeSequence(seq);
    expect(canonical).toBe("++Control ++Control");
    expect(normalizeSequence(canonical)).toBe("++Control ++Control");
  });

  test("deduplicates identical keys within a stroke", () => {
    expect(normalizeSequence("k+k")).toBe("k");
  });
});

