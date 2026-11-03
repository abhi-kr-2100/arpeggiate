import { describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ShortcutsProvider } from "../src/context.js";

describe("ShortcutsProvider (Seam A)", () => {
  test("renders children and manages keyboard lifecycle", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    let actionExecuted = "";
    const target = new EventTarget();

    act(() => {
      root.render(
        <ShortcutsProvider
          bindings={{ "g g": "doc.top" }}
          target={target}
          onAction={(id) => {
            actionExecuted = id;
          }}
        >
          <div id="child">Hello Shortcuts</div>
        </ShortcutsProvider>
      );
    });

    const child = container.querySelector("#child");
    expect(child).not.toBeNull();
    if (child !== null) {
      expect(child.textContent).toBe("Hello Shortcuts");
    }

    // Keydown on target should trigger onAction through provider
    act(() => {
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
      target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    });

    expect(actionExecuted).toBe("doc.top");

    // Unmount root
    act(() => {
      root.unmount();
    });

    expect(container.innerHTML).toBe("");
    container.remove();
  });

  test("updates bindings dynamically when bindings prop changes", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    let executed = "";
    const target = new EventTarget();

    act(() => {
      root.render(
        <ShortcutsProvider
          bindings={{ "g g": "doc.v1" }}
          target={target}
          onAction={(id) => {
            executed = id;
          }}
        >
          <div>Body</div>
        </ShortcutsProvider>
      );
    });

    // Re-render with new bindings
    act(() => {
      root.render(
        <ShortcutsProvider
          bindings={{ "g g": "doc.v2" }}
          target={target}
          onAction={(id) => {
            executed = id;
          }}
        >
          <div>Body</div>
        </ShortcutsProvider>
      );
    });

    act(() => {
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
      target.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    });

    expect(executed).toBe("doc.v2");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test("uses window as default target and supports getChordSignal", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    let executed = "";
    const abortController = new AbortController();

    act(() => {
      root.render(
        <ShortcutsProvider
          bindings={{ "g g": "doc.window" }}
          getChordSignal={() => abortController.signal}
          onAction={(id) => {
            executed = id;
          }}
        >
          <div>Default Target</div>
        </ShortcutsProvider>
      );
    });

    // Window event dispatch
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "g" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    });

    expect(executed).toBe("doc.window");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
