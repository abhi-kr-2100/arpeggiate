import { describe, expect, test } from "bun:test";
import { createKeyboard } from "../src/engine.js";
import { defineKeymap } from "../src/types.js";

describe("Keyboard Engine (Seam 4 - Zero Mocks)", () => {
  test("executes continuous repeat on single navigation key without buffering", () => {
    const target = new EventTarget();
    let actionCount = 0;

    const bindings = defineKeymap({
      j: "doc.scrollDown",
      "g g": "doc.top",
    });

    const keyboard = createKeyboard({
      bindings,
      target,
      onAction: (id) => {
        if (id === "doc.scrollDown") {
          actionCount += 1;
        }
      },
    });

    // 1. Initial keydown
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j", repeat: false }));
    expect(actionCount).toBe(1);
    expect(keyboard.getState().isBuffering).toBe(false);

    // 2. Continuous repeat keydown events
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j", repeat: true }));
    expect(actionCount).toBe(2);
    expect(keyboard.getState().isBuffering).toBe(false);

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j", repeat: true }));
    expect(actionCount).toBe(3);
    expect(keyboard.getState().isBuffering).toBe(false);

    // 3. Release
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "j" }));
    expect(keyboard.getState().isBuffering).toBe(false);

    keyboard.destroy();
  });

  test("executes simultaneous symmetrical combo 'j+k'", () => {
    const target = new EventTarget();
    let executedAction = "";

    const bindings = defineKeymap({
      "j+k": "mode.visual",
    });

    const keyboard = createKeyboard({
      bindings,
      target,
      onAction: (id) => {
        executedAction = id;
      },
    });

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(executedAction).toBe("mode.visual");

    target.dispatchEvent(new KeyboardEvent("keyup", { key: "j" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "k" }));
    expect(keyboard.getState().isBuffering).toBe(false);

    keyboard.destroy();
  });

  test("executes sequential chord 'g g' and manages WhichKey continuations", () => {
    const target = new EventTarget();
    let executedAction = "";

    const bindings = defineKeymap({
      "g g": "doc.top",
      "g b": "doc.bottom",
    });

    const keyboard = createKeyboard({
      bindings,
      target,
      onAction: (id) => {
        executedAction = id;
      },
    });

    // Press and release first 'g'
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));

    const state1 = keyboard.getState();
    expect(state1.isBuffering).toBe(true);
    if (state1.isBuffering) {
      expect(state1.buffer).toEqual(["g"]);
      expect(state1.continuations.length).toBe(2);
    }

    // Press second 'g'
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    expect(executedAction).toBe("doc.top");
    expect(keyboard.getState().isBuffering).toBe(false);

    keyboard.destroy();
  });

  test("executes double modifier chords 'Ctrl Ctrl'", () => {
    const target = new EventTarget();
    let searchOpened = false;

    const bindings = defineKeymap({
      "Ctrl Ctrl": "search.open",
    });

    const keyboard = createKeyboard({
      bindings,
      target,
      onAction: (id) => {
        if (id === "search.open") {
          searchOpened = true;
        }
      },
    });

    // Press and release first Control
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Control" }));

    expect(keyboard.getState().isBuffering).toBe(true);

    // Press second Control
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
    expect(searchOpened).toBe(true);
    expect(keyboard.getState().isBuffering).toBe(false);

    keyboard.destroy();
  });

  test("cancels buffering on Escape and on target blur", () => {
    const target = new EventTarget();

    const bindings = defineKeymap({
      "g g": "doc.top",
    });

    const keyboard = createKeyboard({
      bindings,
      target,
      onAction: () => {},
    });

    // Press and release 'g' -> buffering
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
    expect(keyboard.getState().isBuffering).toBe(true);

    // Escape resets
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(keyboard.getState().isBuffering).toBe(false);

    // Press and release 'g' again -> buffering
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
    expect(keyboard.getState().isBuffering).toBe(true);

    // Blur resets
    target.dispatchEvent(new Event("blur"));
    expect(keyboard.getState().isBuffering).toBe(false);

    keyboard.destroy();
  });

  test("dynamically swaps keymap with set() and notifies subscribers", () => {
    const target = new EventTarget();
    let action = "";

    const keyboard = createKeyboard<string>({
      bindings: defineKeymap({
        "g g": "doc.first",
      }),
      target,
      onAction: (id) => {
        action = id;
      },
    });

    const states: boolean[] = [];
    const unsubscribe = keyboard.subscribe((state) => {
      states.push(state.isBuffering);
    });

    // Initial subscribe call
    expect(states).toEqual([false]);

    // Press first 'g'
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
    expect(states).toEqual([false, true]);

    // Swap bindings dynamically
    keyboard.set(
      defineKeymap({
        "g g": "doc.second",
      })
    );
    expect(keyboard.getState().isBuffering).toBe(false);

    // Now test new bindings
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    expect(action).toBe("doc.second");

    unsubscribe();
    keyboard.destroy();
  });

  test("drops IME composition and handles dead ends and abort signals", () => {
    const target = new EventTarget();
    let actionExecuted = false;
    let chordAbortController = new AbortController();

    const keyboard = createKeyboard({
      bindings: defineKeymap({
        "g g": "doc.top",
      }),
      target,
      onAction: () => {
        actionExecuted = true;
      },
      getChordSignal: () => chordAbortController.signal,
    });

    // 1. Drops IME composition events
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g", isComposing: true }));
    expect(keyboard.getState().isBuffering).toBe(false);
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Process" }));
    expect(keyboard.getState().isBuffering).toBe(false);

    // 2. AbortSignal aborts pending chord
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
    expect(keyboard.getState().isBuffering).toBe(true);

    chordAbortController.abort();
    expect(keyboard.getState().isBuffering).toBe(false);

    // 3. Invalid/dead-end sequence resets buffer
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "x" }));
    expect(keyboard.getState().isBuffering).toBe(false);
    expect(actionExecuted).toBe(false);

    keyboard.destroy();
  });

  test("ignores non-KeyboardEvents and supports manual keyboard.reset()", () => {
    const target = new EventTarget();

    const keyboard = createKeyboard({
      bindings: defineKeymap({
        "g g": "doc.top",
      }),
      target,
      onAction: () => {},
    });

    // Dispatch non-KeyboardEvent
    target.dispatchEvent(new Event("keydown"));
    target.dispatchEvent(new Event("keyup"));
    expect(keyboard.getState().isBuffering).toBe(false);

    // Buffering then manual reset
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
    expect(keyboard.getState().isBuffering).toBe(true);

    keyboard.reset("ManualReset");
    expect(keyboard.getState().isBuffering).toBe(false);

    keyboard.destroy();
  });

  test("listener unsubscription prevents future notifications", () => {
    const target = new EventTarget();
    let callCount = 0;

    const keyboard = createKeyboard({
      bindings: defineKeymap({
        "g g": "doc.top",
      }),
      target,
      onAction: () => {},
    });

    const unsubscribe = keyboard.subscribe(() => {
      callCount += 1;
    });

    expect(callCount).toBe(1);

    unsubscribe();

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));

    expect(callCount).toBe(1);

    keyboard.destroy();
  });
});
