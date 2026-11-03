import { describe, expect, test } from "bun:test";
import { detectConflicts } from "../src/conflicts.js";

describe("Conflict Detector (Seam 3)", () => {
  test("returns empty array for clean, non-conflicting keymap", () => {
    const cleanKeymap = {
      "g g": "doc.top",
      "g b": "doc.bottom",
      "Ctrl+k": "palette.open",
    };
    const conflicts = detectConflicts(cleanKeymap);
    expect(conflicts).toEqual([]);
  });

  test("detects direct_collision when equivalent sequences map to multiple actions", () => {
    const keymap = {
      "j+k": "mode.visual",
      "k+j": "mode.escape",
    };
    const conflicts = detectConflicts(keymap);
    expect(conflicts.length).toBe(1);
    const first = conflicts[0];
    expect(first).toBeDefined();
    if (typeof first !== "undefined") {
      expect(first.type).toBe("direct_collision");
      if (first.type === "direct_collision") {
        expect(first.sequence).toBe("j+k");
        expect(first.actionIds).toEqual(["mode.visual", "mode.escape"]);
      }
    }
  });

  test("does not report direct_collision when identical action IDs share equivalent sequences", () => {
    const keymap = {
      "j+k": "mode.visual",
      "k+j": "mode.visual",
    };
    const conflicts = detectConflicts(keymap);
    expect(conflicts).toEqual([]);
  });

  test("detects prefix_shadowing when a sequence is a strict prefix of another", () => {
    const keymap = {
      g: "doc.jump",
      "g g": "doc.top",
    };
    const conflicts = detectConflicts(keymap);
    expect(conflicts.length).toBe(1);
    const first = conflicts[0];
    expect(first).toBeDefined();
    if (typeof first !== "undefined") {
      expect(first.type).toBe("prefix_shadowing");
      if (first.type === "prefix_shadowing") {
        expect(first.prefixSequence).toBe("g");
        expect(first.prefixActionId).toBe("doc.jump");
        expect(first.longerSequence).toBe("g g");
        expect(first.longerActionId).toBe("doc.top");
      }
    }
  });

  test("detects combo_shadowing when a single key is also part of a combo", () => {
    const keymap = {
      k: "doc.up",
      "j+k": "mode.visual",
    };
    const conflicts = detectConflicts(keymap);
    expect(conflicts.length).toBe(1);
    const first = conflicts[0];
    expect(first).toBeDefined();
    if (typeof first !== "undefined") {
      expect(first.type).toBe("combo_shadowing");
      if (first.type === "combo_shadowing") {
        expect(first.singleKeySequence).toBe("k");
        expect(first.singleActionId).toBe("doc.up");
        expect(first.comboSequence).toBe("j+k");
        expect(first.comboActionId).toBe("mode.visual");
      }
    }
  });

  test("detects combo_shadowing when combo is followed by another chord", () => {
    const keymap = {
      j: "doc.down",
      "j+k g": "mode.visual",
    };
    const conflicts = detectConflicts(keymap);
    expect(conflicts.length).toBe(1);
    const first = conflicts[0];
    expect(first).toBeDefined();
    if (typeof first !== "undefined") {
      expect(first.type).toBe("combo_shadowing");
      if (first.type === "combo_shadowing") {
        expect(first.singleKeySequence).toBe("j");
        expect(first.singleActionId).toBe("doc.down");
        expect(first.comboSequence).toBe("j+k g");
        expect(first.comboActionId).toBe("mode.visual");
      }
    }
  });

  test("detects reserved_browser keys", () => {
    const keymap = {
      "Ctrl+w": "tab.close",
      "Alt+F4": "window.close",
    };
    const conflicts = detectConflicts(keymap);
    expect(conflicts.length).toBe(2);
    expect(conflicts[0]?.type).toBe("reserved_browser");
    expect(conflicts[1]?.type).toBe("reserved_browser");
  });

  test("detects reserved_browser conflict when chord begins with reserved sequence", () => {
    const keymap = {
      "Ctrl+w k": "pane.close",
    };
    const conflicts = detectConflicts(keymap);
    expect(conflicts.length).toBe(1);
    const first = conflicts[0];
    expect(first).toBeDefined();
    if (typeof first !== "undefined") {
      expect(first.type).toBe("reserved_browser");
      if (first.type === "reserved_browser") {
        expect(first.sequence).toBe("Ctrl+w k");
        expect(first.actionId).toBe("pane.close");
      }
    }
  });
});
