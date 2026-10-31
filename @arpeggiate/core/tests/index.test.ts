import { describe, expect, test } from "bun:test";
import {
  createKeyboard,
  defineKeymap,
  detectConflicts,
  formatComboFromKeys,
  normalizeEventKey,
  normalizeSequence,
  normalizeStroke,
  buildTrie,
  findTrieNode,
  collectContinuations,
} from "../src/index.js";

describe("Barrel Exports (Index)", () => {
  test("exports all required functions from @arpeggiate/core", () => {
    expect(typeof createKeyboard).toBe("function");
    expect(typeof defineKeymap).toBe("function");
    expect(typeof detectConflicts).toBe("function");
    expect(typeof formatComboFromKeys).toBe("function");
    expect(typeof normalizeEventKey).toBe("function");
    expect(typeof normalizeSequence).toBe("function");
    expect(typeof normalizeStroke).toBe("function");
    expect(typeof buildTrie).toBe("function");
    expect(typeof findTrieNode).toBe("function");
    expect(typeof collectContinuations).toBe("function");
  });

  test("defineKeymap identity helper returns the keymap intact", () => {
    const keymap = defineKeymap({
      "j+k": "mode.visual",
      "Ctrl+a": "select.all",
      "g g": "doc.top",
    });

    expect(keymap).toEqual({
      "j+k": "mode.visual",
      "Ctrl+a": "select.all",
      "g g": "doc.top",
    });
  });
});
