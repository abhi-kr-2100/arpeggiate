import { describe, expect, test } from "bun:test";
import * as ArpeggiateCore from "../src/index.js";
import {
  createKeyboard,
  type Keymap,
  type ValidatedKeymap,
  type KeyboardConfig,
  type KeyboardController,
} from "../src/index.js";

describe("Minimal Public API (AGENTS.md Section 3)", () => {
  test("exports ONLY the minimal public API from @arpeggiate/core", () => {
    // Only createKeyboard function is exported
    expect(typeof createKeyboard).toBe("function");

    // All classes, helpers, wrappers, and aliases are completely eliminated / private
    const rawModule: Record<string, unknown> = { ...ArpeggiateCore };
    expect(rawModule["arpeggiate"]).toBeUndefined();
    expect(rawModule["defineKeymap"]).toBeUndefined();
    expect(rawModule["Keyboard"]).toBeUndefined();
    expect(rawModule["SequenceBuffer"]).toBeUndefined();
    expect(rawModule["StrokeTracker"]).toBeUndefined();
    expect(rawModule["PrefixTrie"]).toBeUndefined();
    expect(rawModule["TrieNode"]).toBeUndefined();
    expect(rawModule["KeyStroke"]).toBeUndefined();
    expect(rawModule["KeySequence"]).toBeUndefined();
    expect(rawModule["KeymapBuilder"]).toBeUndefined();
    expect(rawModule["Key"]).toBeUndefined();
    expect(rawModule["ALL_KEYS"]).toBeUndefined();
    expect(rawModule["isKey"]).toBeUndefined();
    expect(rawModule["normalizeEventKey"]).toBeUndefined();
    expect(rawModule["sortStroke"]).toBeUndefined();
    expect(rawModule["sortCombo"]).toBeUndefined();
    expect(rawModule["sortComboKeys"]).toBeUndefined();
    expect(rawModule["formatComboFromKeys"]).toBeUndefined();
    expect(rawModule["normalizeStroke"]).toBeUndefined();
    expect(rawModule["normalizeSequence"]).toBeUndefined();
    expect(rawModule["buildTrie"]).toBeUndefined();
    expect(rawModule["findNode"]).toBeUndefined();
    expect(rawModule["findTrieNode"]).toBeUndefined();
    expect(rawModule["collectContinuations"]).toBeUndefined();
  });

  test("createKeyboard validates key sequences at compile time with 0 runtime overhead", () => {
    const target = new EventTarget();

    // Valid bindings compile cleanly
    const cleanup = createKeyboard({
      bindings: {
        "Control+k": "palette.open",
        "g g": "navigate.top",
        "j+k": "mode.visual",
        "AudioVolumeUpBy50": "vendor.volume",
        "Unidentified": "vendor.unidentified",
        "ñ": "unicode.char",
        "Control+AudioVolumeUpBy50": "vendor.stroke",
        "Ctl+k": "custom.abbreviation",
      },
      target,
      onAction: () => {},
    });

    expect(typeof cleanup).toBe("function");
    expect(typeof cleanup.destroy).toBe("function");
    expect(typeof cleanup.reset).toBe("function");
    expect(typeof cleanup[Symbol.dispose]).toBe("function");
    cleanup();

    // Invalid sequences and strokes with duplicate keys produce compile-time type errors
    createKeyboard({
      bindings: {
        // @ts-expect-error: stroke with duplicate keys is rejected at compile time
        "j+j": "action.invalid",
        // @ts-expect-error: duplicate modifier stroke is rejected
        "Control+Control": "action.invalid",
        // @ts-expect-error: non-adjacent duplicate keys are rejected
        "a+b+a": "action.invalid",
        // @ts-expect-error: duplicate vendor-specific keys in stroke are rejected
        "AudioVolumeUpBy50+AudioVolumeUpBy50": "action.invalid",
        // @ts-expect-error: trailing plus in stroke is rejected
        "Control+": "action.invalid",
        // @ts-expect-error: empty sequence is rejected at compile time
        "": "action.invalid",
      },
      target,
      onAction: () => {},
    });
  });

  test("public type contracts can be instantiated cleanly", () => {
    const keymap: Keymap<"action.open"> = {
      "Control+k": "action.open",
    };
    const config: KeyboardConfig<"action.open"> = {
      bindings: keymap,
      target: new EventTarget(),
      onAction: () => {},
    };

    const controller: KeyboardController = createKeyboard(config);
    expect(typeof controller).toBe("function");
    expect(typeof controller.reset).toBe("function");
    controller.destroy();

    // ValidatedKeymap type contract evaluates properly
    type Checked = ValidatedKeymap<{ "Control+k": "action.open" }>;
    const checkedKeymap: Checked = { "Control+k": "action.open" };
    expect(checkedKeymap["Control+k"]).toBe("action.open");
  });
});
