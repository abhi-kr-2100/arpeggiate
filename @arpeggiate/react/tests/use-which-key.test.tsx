import { describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ShortcutsProvider } from "../src/context.js";
import { useWhichKey } from "../src/use-which-key.js";
import type { KeyboardState } from "@arpeggiate/core";

describe("useWhichKey Hook (Seam C)", () => {
  test("throws error when used outside ShortcutsProvider", () => {
    function InvalidComponent() {
      useWhichKey();
      return <div>Invalid</div>;
    }

    const container = document.createElement("div");
    const root = createRoot(container);

    expect(() => {
      act(() => {
        root.render(<InvalidComponent />);
      });
    }).toThrow("useWhichKey must be used within a <ShortcutsProvider>");

    container.remove();
  });

  test("reactively updates state when sequence buffering starts and completes", () => {
    let capturedState: KeyboardState<string> | null = null;

    function getCapturedState(): KeyboardState<string> {
      const current = capturedState;
      if (current === null) {
        throw new Error("State was not captured");
      }
      return current;
    }

    function WhichKeyViewer() {
      capturedState = useWhichKey<string>();
      if (!capturedState.isBuffering) {
        return <div id="hud">Idle</div>;
      }
      return (
        <div id="hud">
          <span id="prefix">{capturedState.buffer.join(" ")}</span>
          <span id="count">{capturedState.continuations.length}</span>
        </div>
      );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const target = new EventTarget();

    act(() => {
      root.render(
        <ShortcutsProvider
          bindings={{
            "g g": "doc.top",
            "g b": "doc.bottom",
          }}
          target={target}
          onAction={() => {}}
        >
          <WhichKeyViewer />
        </ShortcutsProvider>
      );
    });

    const stateInitial = getCapturedState();
    expect(stateInitial.isBuffering).toBe(false);
    const hudIdle = container.querySelector("#hud");
    expect(hudIdle?.textContent).toBe("Idle");

    // Press and release first 'g' to start buffering
    act(() => {
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
      target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
    });

    const stateBuffering = getCapturedState();
    expect(stateBuffering.isBuffering).toBe(true);
    if (stateBuffering.isBuffering) {
      expect(stateBuffering.buffer).toEqual(["g"]);
      expect(stateBuffering.continuations.length).toBe(2);
    }
    const prefixEl = container.querySelector("#prefix");
    const countEl = container.querySelector("#count");
    expect(prefixEl?.textContent).toBe("g");
    expect(countEl?.textContent).toBe("2");

    // Press second 'g' to complete sequence
    act(() => {
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    });

    const stateCompleted = getCapturedState();
    expect(stateCompleted.isBuffering).toBe(false);
    const hudAfter = container.querySelector("#hud");
    expect(hudAfter?.textContent).toBe("Idle");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
