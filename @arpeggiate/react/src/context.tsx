import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createKeyboard,
  type Keyboard,
  type KeyboardState,
} from "@arpeggiate/core";
import type { KeyboardContextValue, ShortcutsProviderProps } from "./types.js";

export const KeyboardContext = createContext<KeyboardContextValue<string> | null>(null);

export function ShortcutsProvider<TActionId extends string = string>(
  props: ShortcutsProviderProps<TActionId>
): ReactNode {
  const onActionRef = useRef(props.onAction);
  onActionRef.current = props.onAction;

  const [keyboardInstance] = useState<Keyboard<TActionId>>(() => {
    const resolvedTarget = typeof props.target !== "undefined"
      ? props.target
      : typeof window !== "undefined"
        ? window
        : new EventTarget();

    const baseConfig = {
      bindings: props.bindings,
      onAction: (id: TActionId, ev: KeyboardEvent) => onActionRef.current(id, ev),
      target: resolvedTarget,
    };

    return createKeyboard<TActionId>(
      typeof props.getChordSignal !== "undefined"
        ? { ...baseConfig, getChordSignal: props.getChordSignal }
        : baseConfig
    );
  });

  const [keyboardState, setKeyboardState] = useState<KeyboardState<TActionId>>(() =>
    keyboardInstance.getState()
  );

  useEffect(() => {
    keyboardInstance.set(props.bindings);
  }, [props.bindings, keyboardInstance]);

  useEffect(() => {
    const unsubscribe = keyboardInstance.subscribe((nextState) => {
      setKeyboardState(nextState);
    });
    return () => {
      unsubscribe();
    };
  }, [keyboardInstance]);

  useEffect(() => {
    return () => {
      keyboardInstance.destroy();
    };
  }, [keyboardInstance]);

  const contextValue: KeyboardContextValue<TActionId> = {
    keyboard: keyboardInstance,
    state: keyboardState,
  };

  return (
    <KeyboardContext.Provider value={contextValue as unknown as KeyboardContextValue<string>}>
      {props.children}
    </KeyboardContext.Provider>
  );
}
