import type { ReactNode } from "react";
import type {
  Keyboard,
  KeyboardConfig,
  KeyboardState,
  Keymap,
} from "@arpeggiate/core";

export interface ShortcutsProviderProps<TActionId extends string = string> {
  readonly bindings: Keymap<TActionId>;
  readonly onAction: (actionId: TActionId, event: KeyboardEvent) => void;
  readonly target?: EventTarget;
  readonly getChordSignal?: KeyboardConfig<TActionId>["getChordSignal"];
  readonly children: ReactNode;
}

export interface KeyboardContextValue<TActionId extends string = string> {
  readonly keyboard: Keyboard<TActionId>;
  readonly state: KeyboardState<TActionId>;
}
