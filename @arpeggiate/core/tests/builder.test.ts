import { describe, expect, test } from "bun:test";
import { KeymapBuilder } from "../src/builder.js";

describe("KeymapBuilder OOP", () => {
  test("fluently constructs and builds keymaps", () => {
    const builder = new KeymapBuilder()
      .bind("g g", "doc.top")
      .bind("g b", "doc.bottom")
      .bind("j+k", "mode.visual");

    expect(builder.build()).toEqual({
      "g g": "doc.top",
      "g b": "doc.bottom",
      "j+k": "mode.visual",
    });
  });

  test("unbinds keys and clears keymap", () => {
    const builder = new KeymapBuilder()
      .bind("g", "doc.jump")
      .bind("g g", "doc.top");

    builder.unbind("g");
    expect(builder.build()).toEqual({
      "g g": "doc.top",
    });

    builder.clear();
    expect(builder.build()).toEqual({});
  });

  test("rejects invalid key sequences and typos at compile time with strong types", () => {
    const builder = new KeymapBuilder()
      .bind("Ctrl+s", "doc.save")
      .bind("Ctrl+Shift+a", "action.all")
      .bind("Ctrl+x Ctrl+s", "doc.saveAll");

    expect(builder.build()).toEqual({
      "Ctrl+s": "doc.save",
      "Ctrl+Shift+a": "action.all",
      "Ctrl+x Ctrl+s": "doc.saveAll",
    });

    // @ts-expect-error: typo "Ctl+s" instead of "Ctrl+s" must be rejected at compile time
    builder.bind("Ctl+s", "doc.typo");

    // @ts-expect-error: empty sequence must be rejected at compile time
    builder.bind("", "doc.empty");

    // @ts-expect-error: combo with duplicate keys must be rejected at compile time
    builder.bind("j+j", "action.duplicate");

    // @ts-expect-error: combo with duplicate modifier keys must be rejected at compile time
    builder.bind("Ctrl+Ctrl", "action.duplicateMod");

    // @ts-expect-error: unbind with typo "Ctl+s" must be rejected at compile time
    builder.unbind("Ctl+s");

    // @ts-expect-error: unbind with empty sequence must be rejected at compile time
    builder.unbind("");
  });

  test("binds and unbinds plus key '+' and 'Ctrl++' zoom in shortcut via compile-time validated strings", () => {
    const builder = new KeymapBuilder()
      .bind("Ctrl++", "view.zoomIn")
      .bind("Ctrl+-", "view.zoomOut")
      .bind("+", "view.plus")
      .bind("Alt++", "view.altPlus");

    expect(builder.build()).toEqual({
      "Ctrl++": "view.zoomIn",
      "Ctrl+-": "view.zoomOut",
      "+": "view.plus",
      "Alt++": "view.altPlus",
    });

    // Unbind using strings
    builder.unbind("Ctrl++");
    builder.unbind("+");

    expect(builder.build()).toEqual({
      "Ctrl+-": "view.zoomOut",
      "Alt++": "view.altPlus",
    });

    // Type checking assertions:
    // @ts-expect-error: typo Ctl++ instead of Ctrl++
    builder.bind("Ctl++", "invalid.typo");

    // @ts-expect-error: duplicate plus in string sequence
    builder.bind("++", "invalid.duplicatePlus");
  });
});
