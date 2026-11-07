import { describe, expect, test } from "bun:test";
import {
  Keyboard,
  createKeyboard,
  SequenceBuffer,
  StrokeTracker,
  PrefixTrie,
  TrieNode,
  KeyStroke,
  KeySequence,
  KeymapBuilder,
  defineKeymap,
  formatComboFromKeys,
  normalizeEventKey,
  normalizeSequence,
  normalizeStroke,
  buildTrie,
  findTrieNode,
  collectContinuations,
  ALL_KEYS,
  isKey,
  type Key,
  type ValidateKey,
  type ParseStroke,
  type ValidateKeySequence,
  type ValidatedKeySequence,
} from "../src/index.js";

describe("Barrel Exports (Index)", () => {
  test("exports all required functions and classes from @arpeggiate/core", () => {
    expect(typeof Keyboard).toBe("function");
    expect(typeof createKeyboard).toBe("function");
    expect(typeof SequenceBuffer).toBe("function");
    expect(typeof StrokeTracker).toBe("function");
    expect(typeof PrefixTrie).toBe("function");
    expect(typeof TrieNode).toBe("function");
    expect(typeof KeyStroke).toBe("function");
    expect(typeof KeySequence).toBe("function");
    expect(typeof KeymapBuilder).toBe("function");
    expect(typeof defineKeymap).toBe("function");
    expect(typeof formatComboFromKeys).toBe("function");
    expect(typeof normalizeEventKey).toBe("function");
    expect(typeof normalizeSequence).toBe("function");
    expect(typeof normalizeStroke).toBe("function");
    expect(typeof buildTrie).toBe("function");
    expect(typeof findTrieNode).toBe("function");
    expect(typeof collectContinuations).toBe("function");
    expect(typeof isKey).toBe("function");
    expect(Array.isArray(ALL_KEYS)).toBe(true);
    expect(ALL_KEYS.length).toBe(79);
  });

  test("defineKeymap identity helper returns the keymap intact", () => {
    const keymap = defineKeymap({
      "j+k": "mode.visual",
      "Ctrl+a": "select.all",
      "g g": "doc.top",
      "Ctrl++": "view.zoomIn",
      "+": "view.plus",
    });

    expect(keymap).toEqual({
      "j+k": "mode.visual",
      "Ctrl+a": "select.all",
      "g g": "doc.top",
      "Ctrl++": "view.zoomIn",
      "+": "view.plus",
    });
  });

  test("ParseStroke rejects combos with duplicate keys at the type level", () => {
    type AssertNever<T extends never> = T;
    type AssertType<T, Expected> = [T] extends [Expected]
      ? [Expected] extends [T]
        ? true
        : false
      : false;

    // Duplicate keys in combo must evaluate to never
    type DuplicateTwo = AssertNever<ParseStroke<"j+j">>;
    type DuplicateModifiers = AssertNever<ParseStroke<"Ctrl+Ctrl">>;
    type DuplicateThree = AssertNever<ParseStroke<"j+k+j">>;
    type DuplicateMiddle = AssertNever<ParseStroke<"Shift+Alt+Shift">>;
    const typeChecks: [DuplicateTwo, DuplicateModifiers, DuplicateThree, DuplicateMiddle] = [
      undefined as never,
      undefined as never,
      undefined as never,
      undefined as never,
    ];
    expect(typeChecks.length).toBe(4);

    // Valid combos must evaluate to themselves
    type ValidCombo = AssertType<ParseStroke<"j+k">, "j+k">;
    type ValidThree = AssertType<ParseStroke<"Ctrl+Shift+a">, "Ctrl+Shift+a">;
    const isValid: ValidCombo = true;
    const isThreeValid: ValidThree = true;
    expect(isValid).toBe(true);
    expect(isThreeValid).toBe(true);

    // defineKeymap rejects duplicate key combos with @ts-expect-error
    defineKeymap({
      // @ts-expect-error: combos with duplicate keys are rejected at compile time
      "j+j": "action.invalid",
      // @ts-expect-error: combos with duplicate modifier keys are rejected
      "Ctrl+Ctrl": "action.invalid",
      // @ts-expect-error: combos with non-adjacent duplicate keys are rejected
      "a+b+a": "action.invalid",
    });
  });

  test("ValidateKeySequence evaluates valid sequences and returns descriptive error types for invalid ones", () => {
    type AssertType<T, Expected> = [T] extends [Expected]
      ? [Expected] extends [T]
        ? true
        : false
      : false;

    type ValidSeq = AssertType<ValidateKeySequence<"g g">, "g g">;
    type ValidComboSeq = AssertType<ValidatedKeySequence<"Ctrl+s">, "Ctrl+s">;
    type InvalidSeq = AssertType<
      ValidateKeySequence<"Ctl+s">,
      "Error: Invalid key sequence 'Ctl+s'"
    >;
    type EmptySeq = AssertType<
      ValidateKeySequence<"">,
      "Error: Invalid key sequence ''"
    >;

    const isValid: ValidSeq = true;
    const isValidCombo: ValidComboSeq = true;
    const isInvalid: InvalidSeq = true;
    const isEmpty: EmptySeq = true;

    expect(isValid).toBe(true);
    expect(isValidCombo).toBe(true);
    expect(isInvalid).toBe(true);
    expect(isEmpty).toBe(true);
  });

  test("isKey and ValidateKey enforce key-level compile-time and runtime type safety", () => {
    type AssertType<T, Expected> = [T] extends [Expected]
      ? [Expected] extends [T]
        ? true
        : false
      : false;

    type ValidKeyCheck = AssertType<ValidateKey<"Ctrl">, "Ctrl">;
    type ValidPlusCheck = AssertType<ValidateKey<"+">, "+">;
    type InvalidKeyCheck = AssertType<ValidateKey<"foo">, "Error: Invalid key 'foo'">;

    const validKeyCheck: ValidKeyCheck = true;
    const validPlusCheck: ValidPlusCheck = true;
    const invalidKeyCheck: InvalidKeyCheck = true;
    const sampleKey: Key = "Ctrl";

    expect(validKeyCheck).toBe(true);
    expect(validPlusCheck).toBe(true);
    expect(invalidKeyCheck).toBe(true);
    expect(sampleKey).toBe("Ctrl");

    // Runtime type guard
    expect(isKey("Ctrl")).toBe(true);
    expect(isKey("+")).toBe(true);
    expect(isKey("k")).toBe(true);
    expect(isKey("F12")).toBe(true);
    expect(isKey("Escape")).toBe(true);
    expect(isKey("Space")).toBe(true);
    expect(isKey("invalid_key")).toBe(false);
    expect(isKey("Ctrl+k")).toBe(false);
    expect(isKey("")).toBe(false);
  });
});
