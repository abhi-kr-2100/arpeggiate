import { describe, expect, test } from "bun:test";
import { Keyboard, createKeyboard, SequenceBuffer, StrokeTracker } from "../src/engine.js";
import { defineKeymap } from "../src/types.js";
import { KeymapBuilder } from "../src/builder.js";

describe("Keyboard Engine (Seam 4 - Zero Mocks)", () => {
  test("manages sequence buffer lifecycle in SequenceBuffer OOP class", () => {
    const buffer = new SequenceBuffer();
    expect(buffer.isBuffering).toBe(false);
    expect(buffer.strokes).toEqual([]);

    buffer.set(["g", "g"]);
    expect(buffer.isBuffering).toBe(true);
    expect(buffer.strokes).toEqual(["g", "g"]);
    expect(buffer.length).toBe(2);

    let abortFired = false;
    const controller = new AbortController();
    buffer.bindSignal(controller.signal, () => {
      abortFired = true;
    });

    controller.abort();
    expect(abortFired).toBe(true);

    buffer.reset("ManualReset");
    expect(buffer.isBuffering).toBe(false);
    expect(buffer.strokes).toEqual([]);
  });

  test("manages simultaneous key tracking in StrokeTracker OOP class", () => {
    const tracker = new StrokeTracker();
    expect(tracker.isHoldingKeys).toBe(false);

    const combo1 = tracker.keyDown("Ctrl");
    expect(combo1).toBe("Ctrl");
    expect(tracker.isHoldingKeys).toBe(true);

    const combo2 = tracker.keyDown("k");
    expect(combo2).toBe("Ctrl+k");

    const release1 = tracker.keyUp("Ctrl");
    expect(release1.isCompleted).toBe(false);

    const release2 = tracker.keyUp("k");
    expect(release2.isCompleted).toBe(true);
    expect(release2.stroke).toBe("Ctrl+k");
    expect(tracker.isHoldingKeys).toBe(false);
  });

  test("StrokeTracker enforces compile-time type safety on key arguments", () => {
    const tracker = new StrokeTracker();

    // @ts-expect-error: rejects arbitrary invalid key name at compile time
    tracker.keyDown("invalid_key");

    // @ts-expect-error: rejects arbitrary invalid key name on keyUp at compile time
    tracker.keyUp("invalid_key");

    // @ts-expect-error: rejects combo string in keyDown (expects canonical individual key)
    tracker.keyDown("Ctrl+k");

    // Parameterized tracker with narrow key union
    const narrowTracker = new StrokeTracker<"j" | "k">();
    expect(narrowTracker.keyDown("j")).toBe("j");

    // @ts-expect-error: rejects key not present in narrowed key parameter
    narrowTracker.keyDown("Ctrl");

    // @ts-expect-error: rejects key not present in narrowed key parameter on keyUp
    narrowTracker.keyUp("Ctrl");
  });

  test("instantiates Keyboard as an object-oriented class with methods", () => {
    const target = new EventTarget();
    const keyboard = new Keyboard({
      bindings: defineKeymap({
        "g g": "doc.top",
      }),
      target,
      onAction: () => {},
    });

    expect(keyboard).toBeInstanceOf(Keyboard);
    expect(typeof keyboard.getState).toBe("function");
    expect(typeof keyboard.set).toBe("function");
    expect(typeof keyboard.reset).toBe("function");
    expect(typeof keyboard.subscribe).toBe("function");
    expect(typeof keyboard.destroy).toBe("function");
    expect(typeof keyboard.handleKeyDown).toBe("function");
    expect(typeof keyboard.handleKeyUp).toBe("function");
    expect(typeof keyboard.handleBlur).toBe("function");
    expect(keyboard.state).toEqual(keyboard.getState());

    keyboard.destroy();
  });

  test("executes continuous repeat on single navigation key without buffering", () => {
    const target = new EventTarget();
    let actionCount = 0;

    const bindings = defineKeymap({
      j: "doc.scrollDown",
      "g g": "doc.top",
    });

    const keyboard = new Keyboard({
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

    const keyboard = new Keyboard({
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

    const keyboard = new Keyboard({
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

    const keyboard = new Keyboard({
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

    const keyboard = new Keyboard({
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

    const keyboard = new Keyboard<string>({
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

    const keyboard = new Keyboard({
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

    const keyboard = new Keyboard({
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

    const keyboard = new Keyboard({
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

  test("executes simultaneous 'Ctrl++' zoom in shortcut and single '+' key", () => {
    const target = new EventTarget();
    const executed: string[] = [];

    const builder = new KeymapBuilder()
      .bind("Ctrl++", "view.zoomIn")
      .bind("+", "view.plus");

    const keyboard = new Keyboard({
      bindings: builder.build(),
      target,
      onAction: (id) => {
        executed.push(id);
      },
    });

    // 1. Press Control alone - must NOT fire
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
    expect(executed).toEqual([]);

    // 2. Press + while holding Control - must fire view.zoomIn
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "+" }));
    expect(executed).toEqual(["view.zoomIn"]);

    // Release keys
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "+" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Control" }));

    // 3. Press + alone without modifiers
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "+" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "+" }));
    expect(executed).toEqual(["view.zoomIn", "view.plus"]);

    keyboard.destroy();
  });

  test("createKeyboard factory creates functional instance and validates keymaps at compile time", () => {
    const target = new EventTarget();
    let triggered = "";

    const keyboard = createKeyboard({
      bindings: {
        "j+k": "mode.visual",
        "Ctrl+s": "doc.save",
      },
      target,
      onAction: (id) => {
        triggered = id;
      },
    });

    expect(typeof keyboard.getState).toBe("function");
    expect(typeof keyboard.set).toBe("function");

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
    expect(triggered).toBe("doc.save");

    // Dynamic set enforces compile time sequence validation
    keyboard.set({
      "g g": "doc.top",
    });

    keyboard.set({
      // @ts-expect-error: typo in sequence rejected at compile time
      "Ctl+s": "doc.invalid",
    });

    // createKeyboard rejects invalid key sequence typos at compile time
    createKeyboard({
      bindings: {
        // @ts-expect-error: typo in sequence rejected at compile time
        "Ctl+s": "doc.invalid",
        // @ts-expect-error: duplicate keys in combo rejected at compile time
        "j+j": "action.duplicate",
      },
      target,
      onAction: () => {},
    });

    keyboard.destroy();
  });
});
