import { describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ShortcutsProvider } from "../src/context.js";
import { useKeyboard } from "../src/use-keyboard.js";
import type { Keyboard } from "@arpeggiate/core";

describe("useKeyboard Hook (Seam B)", () => {
  test("throws error when used outside ShortcutsProvider", () => {
    function InvalidComponent() {
      useKeyboard();
      return <div>Invalid</div>;
    }

    const container = document.createElement("div");
    const root = createRoot(container);

    expect(() => {
      act(() => {
        root.render(<InvalidComponent />);
      });
    }).toThrow("useKeyboard must be used within a <ShortcutsProvider>");

    container.remove();
  });

  test("returns keyboard controller instance when used inside ShortcutsProvider", () => {
    let capturedKeyboard: Keyboard<string> | null = null;

    function getCapturedKeyboard(): Keyboard<string> {
      const current = capturedKeyboard;
      if (current === null) {
        throw new Error("Keyboard was not captured");
      }
      return current;
    }

    function ValidComponent() {
      capturedKeyboard = useKeyboard<string>();
      return <div>Valid</div>;
    }

    const container = document.createElement("div");
    const root = createRoot(container);
    const target = new EventTarget();

    act(() => {
      root.render(
        <ShortcutsProvider
          bindings={{ "j+k": "mode.visual" }}
          target={target}
          onAction={() => {}}
        >
          <ValidComponent />
        </ShortcutsProvider>
      );
    });

    const kb = getCapturedKeyboard();
    expect(typeof kb.set).toBe("function");
    expect(typeof kb.reset).toBe("function");
    expect(typeof kb.getState).toBe("function");
    expect(kb.getState().isBuffering).toBe(false);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
