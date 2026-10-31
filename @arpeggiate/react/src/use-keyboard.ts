import { useContext } from "react";
import type { Keyboard } from "@arpeggiate/core";
import { KeyboardContext } from "./context.js";
import type { KeyboardContextValue } from "./types.js";

export function useKeyboard<TActionId extends string = string>(): Keyboard<TActionId> {
  const context = useContext(KeyboardContext);
  if (context === null) {
    throw new Error(
      "useKeyboard must be used within a <ShortcutsProvider>. Ensure your component tree is wrapped accordingly."
    );
  }
  return (context as unknown as KeyboardContextValue<TActionId>).keyboard;
}
