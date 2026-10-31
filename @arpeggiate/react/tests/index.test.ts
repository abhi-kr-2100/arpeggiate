import { describe, expect, test } from "bun:test";
import {
  ShortcutsProvider,
  KeyboardContext,
  useKeyboard,
  useWhichKey,
} from "../src/index.js";

describe("React Barrel Exports (Index)", () => {
  test("exports all React integration components, contexts, and hooks", () => {
    expect(typeof ShortcutsProvider).toBe("function");
    expect(typeof KeyboardContext).toBe("object");
    expect(typeof useKeyboard).toBe("function");
    expect(typeof useWhichKey).toBe("function");
  });
});
