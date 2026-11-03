import { useContext } from "react";
import type { KeyboardState } from "@arpeggiate/core";
import { KeyboardContext } from "./context.js";
import type { KeyboardContextValue } from "./types.js";

export function useWhichKey<TActionId extends string = string>(): KeyboardState<TActionId> {
  const context = useContext(KeyboardContext);
  if (context === null) {
    throw new Error(
      "useWhichKey must be used within a <ShortcutsProvider>. Ensure your component tree is wrapped accordingly."
    );
  }
  return (context as unknown as KeyboardContextValue<TActionId>).state;
}
