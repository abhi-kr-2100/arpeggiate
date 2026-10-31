import { describe, expect, test } from "bun:test";
import { createKeyboard } from "../src/index.js";

describe("Keyboard Shortcuts Engine (Public Seam - Zero Mocks)", () => {
  test("instantiates KeyboardController via createKeyboard factory", () => {
    const target = new EventTarget();
    const cleanup = createKeyboard({
      bindings: {
        "g g": "doc.top",
      },
      target,
      onAction: () => {},
    });

    expect(typeof cleanup).toBe("function");
    expect(typeof cleanup.destroy).toBe("function");

    cleanup();
  });

  test("executes continuous repeat on single navigation key without buffering", () => {
    const target = new EventTarget();
    let actionCount = 0;

    const cleanup = createKeyboard({
      bindings: {
        j: "doc.scrollDown",
        "g g": "doc.top",
      },
      target,
      onAction: (actionId) => {
        if (actionId === "doc.scrollDown") {
          actionCount += 1;
        }
      },
    });

    // Native repeat sequence: initial keydown followed by repeating keydowns
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j", repeat: false }));
    expect(actionCount).toBe(1);

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j", repeat: true }));
    expect(actionCount).toBe(2);

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j", repeat: true }));
    expect(actionCount).toBe(3);

    target.dispatchEvent(new KeyboardEvent("keyup", { key: "j" }));
    expect(actionCount).toBe(3);

    cleanup();
  });

  test("executes simultaneous symmetrical multi-key stroke 'j+k'", () => {
    const target = new EventTarget();
    let executedAction = "";

    const cleanup = createKeyboard({
      bindings: {
        "j+k": "mode.visual",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    // Press j then k concurrently
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(executedAction).toBe("mode.visual");

    // Release both
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "j" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "k" }));

    cleanup();
  });

  test("executes symmetrical multi-key strokes regardless of physical key press order", () => {
    const target = new EventTarget();
    let executedAction = "";

    const cleanup = createKeyboard({
      bindings: {
        "j+k": "mode.visual",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    // Press k then j (reverse order)
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));

    target.dispatchEvent(new KeyboardEvent("keyup", { key: "k" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "j" }));

    expect(executedAction).toBe("mode.visual");
    cleanup();
  });

  test("treats modifier keys as peer tokens with zero modifier priority in multi-key strokes", () => {
    const target = new EventTarget();
    let executedAction = "";

    const cleanup = createKeyboard({
      bindings: {
        "Alt+Control+k": "action.multiMod",
        "p+Shift": "action.peerOrder",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    // Press k first, then Control, then Alt (reverse of defined order, letter before modifiers)
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Alt" }));
    expect(executedAction).toBe("action.multiMod");

    target.dispatchEvent(new KeyboardEvent("keyup", { key: "k" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Control" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Alt" }));

    executedAction = "";

    // Test peer stroke defined with key first ('p+Shift') triggered with modifier first ('Shift' then 'p')
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "p" }));
    expect(executedAction).toBe("action.peerOrder");

    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "p" }));

    cleanup();
  });

  test("executes multi-stroke sequence 'g g'", () => {
    const target = new EventTarget();
    let executedAction = "";

    const cleanup = createKeyboard({
      bindings: {
        "g g": "doc.top",
        "g b": "doc.bottom",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    // First stroke 'g'
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
    expect(executedAction).toBe("");

    // Second stroke 'g'
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
    expect(executedAction).toBe("doc.top");

    cleanup();
  });

  test("executes double modifier sequence 'Control Control'", () => {
    const target = new EventTarget();
    let executedAction = "";

    const cleanup = createKeyboard({
      bindings: {
        "Control Control": "search.palette",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    // First 'Control'
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Control" }));
    expect(executedAction).toBe("");

    // Second 'Control'
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Control" }));
    expect(executedAction).toBe("search.palette");

    cleanup();
  });

  test("executes simultaneous 'Control++' zoom in shortcut and single '+' key", () => {
    const target = new EventTarget();
    let executedAction = "";

    const cleanup = createKeyboard({
      bindings: {
        "Control++": "view.zoomIn",
        "+": "view.plusKey",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    // Test '+' key
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "+" }));
    expect(executedAction).toBe("view.plusKey");
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "+" }));

    executedAction = "";

    // Test 'Control++' shortcut
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "+" }));
    expect(executedAction).toBe("view.zoomIn");
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "+" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Control" }));

    cleanup();
  });

  test("allows user to explicitly reset buffering via keyboard.reset()", () => {
    const target = new EventTarget();
    let executedAction = "";

    const keyboard = createKeyboard({
      bindings: {
        "g g": "doc.top",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    // First 'g'
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));

    // User explicitly resets the keyboard buffer
    keyboard.reset();

    // Subsequent 'g' starts fresh and does not trigger 'g g'
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
    expect(executedAction).toBe("");

    // One more 'g' completes the new sequence
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
    expect(executedAction).toBe("doc.top");

    keyboard.destroy();
  });

  test("does not hardcode Escape to reset, allowing user to bind or control Escape", () => {
    const target = new EventTarget();
    let executedAction = "";

    const keyboard = createKeyboard({
      bindings: {
        Escape: "modal.close",
        "g g": "doc.top",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    const escapeEvent = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
    target.dispatchEvent(escapeEvent);
    expect(executedAction).toBe("modal.close");
    expect(escapeEvent.defaultPrevented).toBe(true);

    keyboard.destroy();
  });

  test("does not prevent default on Escape when Escape is unbound during sequence buffering", () => {
    const target = new EventTarget();
    let executedAction = "";

    const keyboard = createKeyboard({
      bindings: {
        "g g": "doc.top",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    // First 'g'
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));

    // Unbound Escape pressed during sequence buffering - should NOT prevent default
    const escapeEvent = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
    target.dispatchEvent(escapeEvent);
    expect(escapeEvent.defaultPrevented).toBe(false);
    expect(executedAction).toBe("");

    keyboard.destroy();
  });

  test("handles unmapped and arbitrary keys without breaking shortcut state", () => {
    const target = new EventTarget();
    let count = 0;

    const keyboard = createKeyboard({
      bindings: {
        "Control+k": "action.open",
      },
      target,
      onAction: () => {
        count += 1;
      },
    });

    // Press an arbitrary unmapped key (e.g. CapsLock or AudioVolumeUp)
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "CapsLock" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "CapsLock" }));
    expect(count).toBe(0);

    // Bound shortcut still functions properly afterwards
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(count).toBe(1);

    target.dispatchEvent(new KeyboardEvent("keyup", { key: "k" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Control" }));

    keyboard.destroy();
  });

  test("resets internal buffer and state before dispatching onAction callback", () => {
    const target = new EventTarget();
    let nestedActionExecuted = false;

    const cleanup = createKeyboard({
      bindings: {
        "g g": "first",
        h: "second",
      },
      target,
      onAction: (actionId) => {
        if (actionId === "first") {
          // Re-entrant key dispatch inside onAction:
          // Because reset() was called before onAction, dispatching 'h' immediately succeeds
          target.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
        }
        if (actionId === "second") {
          nestedActionExecuted = true;
        }
      },
    });

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));

    expect(nestedActionExecuted).toBe(true);

    cleanup();
  });

  test("drops IME composition events and ignores non-KeyboardEvents", () => {
    const target = new EventTarget();
    let actionFired = false;

    const cleanup = createKeyboard({
      bindings: {
        j: "nav.down",
      },
      target,
      onAction: () => {
        actionFired = true;
      },
    });

    // IME isComposing
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j", isComposing: true }));
    expect(actionFired).toBe(false);

    // IME Process key
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Process" }));
    expect(actionFired).toBe(false);

    // Non-KeyboardEvent
    target.dispatchEvent(new CustomEvent("keydown"));
    target.dispatchEvent(new CustomEvent("keyup"));
    expect(actionFired).toBe(false);

    cleanup();
  });

  test("calling cleanup function directly detaches event listeners", () => {
    const target = new EventTarget();
    let count = 0;

    const cleanup = createKeyboard({
      bindings: {
        j: "nav.down",
      },
      target,
      onAction: () => {
        count += 1;
      },
    });

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    expect(count).toBe(1);

    cleanup();

    // Subsequent events must have zero effect
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "j" }));
    expect(count).toBe(1);
  });

  test("cleanup.destroy method detaches event listeners", () => {
    const target = new EventTarget();
    let count = 0;

    const keyboard = createKeyboard({
      bindings: {
        j: "nav.down",
      },
      target,
      onAction: () => {
        count += 1;
      },
    });

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    expect(count).toBe(1);

    keyboard.destroy();

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    expect(count).toBe(1);
  });

  test("supports Symbol.dispose lifecycle via using statement", () => {
    const target = new EventTarget();
    let count = 0;

    const keyboard = createKeyboard({
      bindings: {
        k: "nav.up",
      },
      target,
      onAction: () => {
        count += 1;
      },
    });

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(count).toBe(1);

    keyboard[Symbol.dispose]();

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(count).toBe(1);
  });

  test("executes vendor-specific key 'AudioVolumeUpBy50'", () => {
    const target = new EventTarget();
    let executedAction = "";

    const keyboard = createKeyboard({
      bindings: {
        AudioVolumeUpBy50: "audio.volumeUp50",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "AudioVolumeUpBy50" }));
    expect(executedAction).toBe("audio.volumeUp50");

    keyboard.destroy();
  });

  test("executes 'Unidentified' key", () => {
    const target = new EventTarget();
    let executedAction = "";

    const keyboard = createKeyboard({
      bindings: {
        Unidentified: "fallback.unidentified",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Unidentified" }));
    expect(executedAction).toBe("fallback.unidentified");

    keyboard.destroy();
  });

  test("executes unicode character key 'ñ'", () => {
    const target = new EventTarget();
    let executedAction = "";

    const keyboard = createKeyboard({
      bindings: {
        ñ: "char.enye",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "ñ" }));
    expect(executedAction).toBe("char.enye");

    keyboard.destroy();
  });

  test("executes multi-key stroke with vendor-specific key 'Control+AudioVolumeUpBy50'", () => {
    const target = new EventTarget();
    let executedAction = "";

    const keyboard = createKeyboard({
      bindings: {
        "Control+AudioVolumeUpBy50": "audio.specialBoost",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "AudioVolumeUpBy50" }));
    expect(executedAction).toBe("audio.specialBoost");

    target.dispatchEvent(new KeyboardEvent("keyup", { key: "AudioVolumeUpBy50" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Control" }));

    keyboard.destroy();
  });

  test("binds 'a' and 'A' to different actions with explicit Shift", () => {
    const target = new EventTarget();
    let executedAction = "";

    const keyboard = createKeyboard({
      bindings: {
        a: "action.lowercase",
        A: "action.uppercaseDirect",
        "Shift+A": "action.uppercaseShift",
      },
      target,
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    // 1. Lowercase 'a' (no shift)
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    expect(executedAction).toBe("action.lowercase");
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }));

    executedAction = "";

    // 2. Direct 'A' (e.g. CapsLock on without Shift held)
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "A" }));
    expect(executedAction).toBe("action.uppercaseDirect");
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "A" }));

    executedAction = "";

    // 3. 'Shift+A' (Shift held down + A key pressed)
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "A" }));
    expect(executedAction).toBe("action.uppercaseShift");
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "A" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift" }));

    keyboard.destroy();
  });

  test("executes shortcuts bound to Space and multi-key strokes like Control+Space from browser spacebar keydown (' ')", () => {
    const target = new EventTarget();
    let executedAction = "";

    const keyboard = createKeyboard({
      target,
      bindings: {
        Space: "action.jump",
        "Control+Space": "action.autocomplete",
        "Space Space": "action.doubleSpace",
      },
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    // 1. Single Space
    target.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(executedAction).toBe("action.jump");
    target.dispatchEvent(new KeyboardEvent("keyup", { key: " " }));

    executedAction = "";

    // 2. Control+Space multi-key stroke
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
    target.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(executedAction).toBe("action.autocomplete");
    target.dispatchEvent(new KeyboardEvent("keyup", { key: " " }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Control" }));

    executedAction = "";

    // 3. Double space sequence ("Space Space")
    // First space down/up (wait, because Space is already bound to "action.jump", Space fires on keydown immediately.
    // If we want to test multi-stroke sequence, let's test a sequence prefix that isn't shadowed by a single key stroke, e.g. "g Space")
    keyboard.destroy();

    const sequenceKeyboard = createKeyboard({
      target,
      bindings: {
        "g Space": "action.gSpace",
      },
      onAction: (actionId) => {
        executedAction = actionId;
      },
    });

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
    expect(executedAction).toBe("");

    target.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(executedAction).toBe("action.gSpace");
    target.dispatchEvent(new KeyboardEvent("keyup", { key: " " }));

    sequenceKeyboard.destroy();
  });
});
